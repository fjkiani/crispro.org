"""
PubMed client for Zeta-Core — esearch → efetch (optional PMC subset).

Async path: httpx.AsyncClient, EFetch in batches of 10, asyncio.gather with a semaphore,
iterative XML parsing per chunk. NCBI_USER_API_KEY raises the E-utilities cap to 10 req/s.

Sync helpers `search_pubmed` / `esearch` / `efetch_abstracts` remain for non-async callers;
inside a running event loop use `await search_pubmed_async(...)`.
"""

from __future__ import annotations

import asyncio
import io
import os
import re
import time
import xml.etree.ElementTree as ET
from typing import Optional

import httpx

EUTILS_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

NCBI_EMAIL = os.environ.get("NCBI_USER_EMAIL", "research-agent@crispro.org")
NCBI_API_KEY = os.environ.get("NCBI_USER_API_KEY", "")

EFETCH_CHUNK = max(1, int(os.environ.get("PUBMED_EFETCH_CHUNK", "10")))
EFETCH_CONCURRENCY = max(1, int(os.environ.get("PUBMED_EFETCH_CONCURRENCY", "8")))

STOP_WORDS = {
    "what", "is", "the", "evidence", "for", "in", "of", "and", "or", "with", "a", "an", "does",
    "do", "how", "why", "when", "between", "clinical", "studies", "study", "on", "which", "are",
    "its", "can", "will", "would", "should", "has", "have", "that", "this", "these", "those",
    "from", "by", "at", "as", "be", "been", "being", "was", "were", "to", "it", "if", "than",
    "show", "shows", "shown", "showing", "affect", "cause", "causes", "using", "used", "use",
    "increased", "decreased", "effects", "effect", "role", "impact", "associated", "patients",
    "cancer", "tumor", "tumors", "cell", "cells", "inhibit", "inhibition", "activity",
}


def _base_params() -> dict:
    p = {"tool": "ZetaCoreResearchAgent", "email": NCBI_EMAIL}
    if NCBI_API_KEY:
        p["api_key"] = NCBI_API_KEY
    return p


def _local_tag(tag: str) -> str:
    if tag and "}" in tag:
        return tag.split("}", 1)[1]
    return tag or ""


def _clean(text: Optional[str]) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text).strip()


def _parse_pubmed_article_element(art: ET.Element) -> Optional[dict]:
    try:
        pmid = art.findtext(".//MedlineCitation/PMID", default="") or ""
        pmid = pmid.strip()
        if not pmid:
            return None

        title = _clean(art.findtext(".//ArticleTitle", default=""))

        abstract_parts = art.findall(".//Abstract/AbstractText")
        abstract_pieces = []
        for p in abstract_parts:
            text = _clean("".join(p.itertext()))
            if text:
                label = p.get("Label", "")
                prefix = _clean(label + ": ") if label else ""
                abstract_pieces.append(prefix + text)
        abstract = " ".join(abstract_pieces)

        journal = _clean(
            art.findtext(".//Journal/Title", default="")
            or art.findtext(".//MedlineTA", default="")
            or ""
        )

        year_elem = art.find(".//PubDate/Year")
        year = year_elem.text.strip() if year_elem is not None and year_elem.text else ""
        if not year:
            medline_date = art.findtext(".//PubDate/MedlineDate", default="") or ""
            year_match = re.search(r"\d{4}", medline_date)
            year = year_match.group() if year_match else ""

        pub_types = [
            _clean("".join(pt.itertext()))
            for pt in art.findall(".//PublicationType")
        ]

        mesh_terms = [
            _clean(m.findtext("DescriptorName", default="") or "")
            for m in art.findall(".//MeshHeading")
            if m.findtext("DescriptorName", default="")
        ]

        pmcid = "NA"
        doi = ""
        for aid in art.findall(".//ArticleIdList/ArticleId"):
            id_type = aid.get("IdType", "")
            val = "".join(aid.itertext()).strip()
            if id_type == "pmc":
                pmcid = val
            elif id_type == "doi":
                doi = val

        authors = []
        for author in art.findall(".//Author")[:5]:
            last = author.findtext("LastName", default="") or ""
            first = author.findtext("ForeName", default="") or ""
            if last:
                authors.append(f"{last} {first}".strip())

        return {
            "pmid": pmid,
            "title": title,
            "abstract": abstract,
            "journal": journal,
            "year": year,
            "publication_types": pub_types,
            "mesh_headings": mesh_terms[:10],
            "pmcid": pmcid,
            "doi": doi,
            "authors": authors,
        }
    except Exception:
        return None


def parse_pubmed_efetch_xml_iterative(xml_bytes: bytes) -> dict:
    """
    Stream-parse one EFetch XML payload; clear each PubmedArticle subtree to cap memory.
    """
    articles: dict = {}
    buf = io.BytesIO(xml_bytes)
    for _event, elem in ET.iterparse(buf, events=("end",)):
        if _local_tag(elem.tag) != "PubmedArticle":
            continue
        rec = _parse_pubmed_article_element(elem)
        if rec:
            articles[rec["pmid"]] = rec
        elem.clear()
    return articles


async def esearch_async(
    client: httpx.AsyncClient,
    query: str,
    max_results: int = 20,
    pmc_only: bool = False,
) -> tuple[list[str], int]:
    if pmc_only:
        query = f"({query}) AND pubmed pmc[sb]"

    params = _base_params()
    params.update(
        {
            "db": "pubmed",
            "term": query,
            "retmode": "json",
            "retmax": str(max_results),
            "sort": "relevance",
        }
    )

    last_error: Optional[Exception] = None
    for attempt in range(3):
        try:
            if attempt > 0:
                await asyncio.sleep(0.25 * (2**attempt))
            r = await client.get(f"{EUTILS_BASE}/esearch.fcgi", params=params)
            r.raise_for_status()
            result = r.json().get("esearchresult", {})
            pmids = result.get("idlist", [])
            total = int(result.get("count", 0))
            if pmids or total == 0:
                return pmids, total
        except Exception as e:
            last_error = e
    raise RuntimeError(f"ESearch failed after 3 attempts: {last_error}")


async def _efetch_one_batch_async(
    client: httpx.AsyncClient,
    pmids: list[str],
) -> dict:
    if not pmids:
        return {}
    params = _base_params()
    params.update(
        {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "xml",
        }
    )
    r = await client.get(f"{EUTILS_BASE}/efetch.fcgi", params=params, timeout=60.0)
    r.raise_for_status()
    return parse_pubmed_efetch_xml_iterative(r.content)


async def efetch_abstracts_async(
    client: httpx.AsyncClient,
    pmids: list[str],
    *,
    chunk_size: int = EFETCH_CHUNK,
    max_concurrent: int = EFETCH_CONCURRENCY,
) -> dict:
    if not pmids:
        return {}
    batches = [pmids[i : i + chunk_size] for i in range(0, len(pmids), chunk_size)]
    sem = asyncio.Semaphore(max_concurrent)

    async def _one(batch: list[str]) -> dict:
        async with sem:
            return await _efetch_one_batch_async(client, batch)

    parts = await asyncio.gather(*[_one(b) for b in batches])
    merged: dict = {}
    for d in parts:
        merged.update(d)
    return merged


async def search_pubmed_async(
    query: str,
    max_results: int = 15,
    pmc_only: Optional[bool] = None,
) -> tuple[list, int]:
    if pmc_only is None:
        pmc_only = os.environ.get("ZETA_PUBMED_PMC_ONLY", "").lower() in ("1", "true", "yes")

    timeout = httpx.Timeout(60.0, connect=15.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        pmids, total_found = await esearch_async(client, query, max_results=max_results, pmc_only=pmc_only)
        if not pmids:
            return [], total_found
        articles_map = await efetch_abstracts_async(client, pmids)
        ordered = [articles_map[p] for p in pmids if p in articles_map]
        return ordered, total_found


def esearch(query: str, max_results: int = 20, pmc_only: bool = False) -> tuple[list[str], int]:
    if pmc_only:
        query = f"({query}) AND pubmed pmc[sb]"

    params = _base_params()
    params.update(
        {
            "db": "pubmed",
            "term": query,
            "retmode": "json",
            "retmax": str(max_results),
            "sort": "relevance",
        }
    )

    last_error: Optional[Exception] = None
    with httpx.Client(timeout=30.0) as client:
        for attempt in range(3):
            try:
                if attempt > 0:
                    time.sleep(0.25 * (2**attempt))
                r = client.get(f"{EUTILS_BASE}/esearch.fcgi", params=params)
                r.raise_for_status()
                result = r.json().get("esearchresult", {})
                pmids = result.get("idlist", [])
                total = int(result.get("count", 0))
                if pmids or total == 0:
                    return pmids, total
            except Exception as e:
                last_error = e
    raise RuntimeError(f"ESearch failed after 3 attempts: {last_error}")


def efetch_abstracts(pmids: list) -> dict:
    if not pmids:
        return {}
    out: dict = {}
    with httpx.Client(timeout=60.0) as client:
        for i in range(0, len(pmids), EFETCH_CHUNK):
            batch = pmids[i : i + EFETCH_CHUNK]
            params = _base_params()
            params.update({"db": "pubmed", "id": ",".join(batch), "retmode": "xml"})
            r = client.get(f"{EUTILS_BASE}/efetch.fcgi", params=params)
            r.raise_for_status()
            out.update(parse_pubmed_efetch_xml_iterative(r.content))
    return out


def search_pubmed(
    query: str,
    max_results: int = 15,
    pmc_only: Optional[bool] = None,
) -> tuple[list, int]:
    """
    Full pipeline (sync). Do not call from inside a running asyncio loop — use
    ``await search_pubmed_async(...)`` instead.
    """
    try:
        asyncio.get_running_loop()
    except RuntimeError:
        return asyncio.run(search_pubmed_async(query, max_results=max_results, pmc_only=pmc_only))
    raise RuntimeError(
        "search_pubmed() cannot run inside an active event loop; await search_pubmed_async() instead."
    )


def build_simple_query(question: str, genes: list, compound: str, disease: str) -> str:
    parts = []
    if genes:
        parts.append(
            f"({' OR '.join(g + '[tiab]' for g in genes)})"
            if len(genes) > 1
            else genes[0] + "[tiab]"
        )
    if compound:
        parts.append(compound.strip() + "[tiab]")
    if disease:
        parts.append('"' + " ".join(disease.strip().split()[:3]) + '"[tiab]')
    words = [
        w for w in re.sub(r"[^a-z0-9\s]", " ", question.lower()).split()
        if len(w) > 3 and w not in STOP_WORDS
    ]
    extra = [w + "[tiab]" for w in words[:2 if parts else 5]]
    unique = list(dict.fromkeys(parts + extra))
    return " AND ".join(unique[:4]) + " AND english[lang]"


def build_keyword_query(question: str) -> str:
    words = [
        w for w in re.sub(r"[^a-z0-9\s-]", " ", question.lower()).split()
        if len(w) > 3 and w not in STOP_WORDS
    ]
    return " AND ".join(w + "[tiab]" for w in words[:3]) + " AND english[lang]"
