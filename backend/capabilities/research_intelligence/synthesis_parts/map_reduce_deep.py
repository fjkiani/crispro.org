"""
Map–reduce deep synthesis: BM25 top-K abstracts, parallel PMID-grounded map, one reduce pass.

Env:
  RI_DEEP_MAX_ARTICLES (default 48) — cap papers after retrieval (before BM25)
  RI_DEEP_TOP_ARTICLES (default 20) — BM25 keeps this many for the map phase
  RI_DEEP_MAP_BATCH (default 8) — papers per map LLM call
  RI_DEEP_MAP_MAX_CONCURRENT (default 2) — cap parallel map LLM calls (pairs with RI_GROQ_MAX_CONCURRENT)
  RI_LLM_CONCURRENCY — global cap on concurrent chat() calls (default 6)
  RI_GROQ_MAX_CONCURRENT / RI_GROQ_MIN_INTERVAL_SEC — see llm_rate_controller.py
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional

from ..pipeline.abstract_rerank import rerank_articles_bm25

logger = logging.getLogger(__name__)

# Reduce phase: Zeta-Core clinical directive schema (no literature-review hedging).
_REDUCE_SYSTEM_MESSAGE = """You are a deterministic clinical reasoning engine. You synthesize PMID-grounded extractions into a single brutal, structured clinical directive—not a literature review.

BANNED PHRASES (never output these, in any form): "Research suggests", "may indicate", "further studies are needed", "consult a physician".

BANNED QUALITATIVE EVIDENCE SUMMARIES: Do not write "improves progression-free survival", "improves PFS", "improves OS", "significantly better", "superior outcomes", or similar unless the SAME string field immediately includes the supporting numbers from the inputs (median months, HR, 95% CI, p-value, or exact dose).

QUANTITATIVE DISCIPLINE (NON-NEGOTIABLE):
- If the inputs contain ANY hazard ratio (HR), odds ratio, p-value, confidence interval, median PFS/OS, specific dose (mg/m2, mg, AUC), cycle count, or schedule (Q3W, etc.), you MUST copy those numbers and labels into your JSON strings. Verbatim priority: keep HR/OR/p/CI/medians as printed in the source text.
- When a numeric fact is tied to a specific PMID in the evidence blob, append an exact citation immediately after it, e.g. "(PMID 38901234)".
- When the inputs lack any numeric outcome, state that gap plainly in molecular_stratification or knowledge_gaps—do not invent statistics.

MANDATORY DENSITY (when inputs supply ≥1 number): At least one of {HR, p-value, median survival, 95% CI} must appear in "molecular_stratification" AND at least one explicit numeric must appear in "zeta_core_verdict". "standard_of_care" must include specific doses/schedules/cycles when the inputs mention them.

EXAMPLE OF EXPECTED ZETA-CORE OUTPUT DENSITY (your JSON string values must match this level of numeric/dosing specificity whenever the inputs support it—not filler prose):

[STANDARD OF CARE]: Intravenous carboplatin (AUC 5-6) and paclitaxel (175 mg/m2) Q3W x 6 cycles following maximal cytoreductive surgery.
[MOLECULAR STRATIFICATION]: HRD-positive/BRCA-mut: Olaparib + Bevacizumab maintenance (Median PFS 37.2 vs 17.7 months, HR 0.33, 95% CI 0.25-0.45). MBD4-LOF: Cytidine analogs (Gemcitabine) or ATRi (Ceralasertib).
[ZETA-CORE VERDICT]: Survival in HGSOC is dictated by molecular stratification following frontline platinum doublets. HRD-positive patients must receive PARPi maintenance to secure the HR 0.33 progression-free survival benefit, while biomarker-negative or rare variant cohorts require alternative interception strategies.

Return ONLY valid JSON (no markdown fences) with exactly these keys:
- "standard_of_care": string (content density like the [STANDARD OF CARE] example line)
- "molecular_stratification": string (content density like the [MOLECULAR STRATIFICATION] example line)
- "zeta_core_verdict": string (exactly two sentences; content density like the [ZETA-CORE VERDICT] example—must repeat at least one HR/p/median/CI/dose from inputs when any exists)
- "knowledge_gaps": array of up to 6 short strings (gaps in evidence, not hedging)
- "overall_confidence": number 0.0–1.0 (breadth/quality of cited quantitative anchors in the inputs, not patient-specific certainty)"""


def _env_int(name: str, default: int) -> int:
    try:
        return max(1, int(os.environ.get(name, str(default))))
    except ValueError:
        return default


def _strip_llm_json_guillotine(text: str) -> str:
    """Strip markdown / accidental wrappers so JSONDecoder can run."""
    t = (text or "").strip()
    t = re.sub(r"^\ufeff", "", t)
    for _ in range(5):
        before = t
        t = re.sub(r"^```(?:json|JSON)?\s*", "", t, flags=re.MULTILINE).strip()
        t = re.sub(r"\s*```\s*$", "", t, flags=re.MULTILINE).strip()
        t = t.replace("```json", "").replace("```JSON", "").replace("```", "").strip()
        if t == before:
            break
    return t


def _balanced_json_slice(s: str, start: int) -> Optional[str]:
    """Return substring from first '{' through matching '}' (string-aware)."""
    if start >= len(s) or s[start] != "{":
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(s)):
        c = s[i]
        if esc:
            esc = False
            continue
        if c == "\\" and in_str:
            esc = True
            continue
        if c == '"':
            in_str = not in_str
            continue
        if in_str:
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return s[start : i + 1]
    return None


def _extract_json_object(text: str) -> Optional[dict]:
    t = _strip_llm_json_guillotine(text)
    decoder = json.JSONDecoder()

    try:
        obj = json.loads(t)
        if isinstance(obj, dict):
            return obj
    except json.JSONDecodeError:
        pass

    for i, ch in enumerate(t):
        if ch != "{":
            continue
        try:
            obj, _ = decoder.raw_decode(t[i:])
            if isinstance(obj, dict):
                return obj
        except json.JSONDecodeError:
            slice_s = _balanced_json_slice(t, i)
            if slice_s:
                try:
                    obj = json.loads(slice_s)
                    if isinstance(obj, dict):
                        return obj
                except json.JSONDecodeError:
                    try:
                        obj, _ = decoder.raw_decode(slice_s)
                        if isinstance(obj, dict):
                            return obj
                    except json.JSONDecodeError:
                        continue
    return None


def _claims_to_mechanisms(extractions: List[dict]) -> List[Dict[str, Any]]:
    mechanisms: List[Dict[str, Any]] = []
    for row in extractions:
        pmid = str(row.get("pmid", "")).strip()
        for ac in row.get("anchored_claims") or []:
            if not isinstance(ac, dict):
                continue
            claim = (ac.get("claim") or "").strip()
            quote = (ac.get("quote") or "").strip()
            if not claim:
                continue
            mechanisms.append(
                {
                    "mechanism": claim[:500],
                    "target": row.get("study_design_hint") or "unknown",
                    "evidence": quote[:500],
                    "confidence": 0.75,
                    "sources": [pmid] if pmid else [],
                }
            )
    return mechanisms


def _build_reduce_evidence_blob(
    ranked: List[Dict[str, Any]],
    all_extractions: List[dict],
    *,
    max_abstract_chars: int = 720,
) -> str:
    """PMID → extractions lookup; attach BM25-ranked title/abstract snippets for the reduce pass."""
    by_pmid: Dict[str, List[dict]] = {}
    for row in all_extractions:
        pid = str(row.get("pmid", "")).strip()
        if pid:
            by_pmid.setdefault(pid, []).append(row)

    blocks: List[str] = []
    for a in ranked:
        pmid = str(a.get("pmid", "")).strip()
        title = (a.get("title") or "")[:280]
        abstract = (a.get("abstract") or "")[:max_abstract_chars]
        rows = by_pmid.get(pmid, [])
        claims_blob = json.dumps(rows, indent=0)[:2200] if rows else "[]"
        blocks.append(
            f"PMID {pmid}\nTITLE: {title}\nABSTRACT_SNIPPET: {abstract}\nMAP_EXTRACTIONS: {claims_blob}"
        )
    return "\n\n---\n\n".join(blocks)


def _assemble_zeta_core_directive(p2: dict) -> tuple[str, List[str], float]:
    soc = (p2.get("standard_of_care") or "").strip()
    mol = (p2.get("molecular_stratification") or "").strip()
    ver = (p2.get("zeta_core_verdict") or "").strip()
    evidence_summary = (
        f"[STANDARD OF CARE]: {soc}\n\n"
        f"[MOLECULAR STRATIFICATION]: {mol}\n\n"
        f"[ZETA-CORE VERDICT]: {ver}"
    )
    kg = p2.get("knowledge_gaps")
    knowledge_gaps: List[str] = []
    if isinstance(kg, list):
        knowledge_gaps = [str(x) for x in kg[:8]]
    overall_confidence = 0.65
    try:
        overall_confidence = float(p2.get("overall_confidence", 0.65))
    except (TypeError, ValueError):
        pass
    return evidence_summary, knowledge_gaps, overall_confidence


async def _run_map_chunk(
    llm_provider: Any,
    primary: str,
    chunk: List[Dict[str, Any]],
) -> List[dict]:
    lines = []
    for a in chunk:
        pmid = a.get("pmid", "")
        title = (a.get("title") or "")[:220]
        abstract = (a.get("abstract") or "")[:1400]
        lines.append(f"PMID:{pmid}|TITLE:{title}|ABSTRACT:{abstract}")

    blob = "\n".join(lines)
    prompt = f"""Research focus: {primary[:400]}

For EACH paper below, output one JSON object in the "extractions" array with:
- "pmid": string (must match input)
- "study_design_hint": short string (e.g. RCT, cohort, preclinical, review, unknown)
- "anchored_claims": array of {{"claim": string, "quote": string}} where "quote" MUST be copied verbatim from that paper's ABSTRACT (max 220 chars). If nothing reliable, use [].

Papers:
{blob}

Return ONLY valid JSON: {{"extractions": [ ... ]}}"""

    try:
        map_max = _env_int("RI_DEEP_MAP_MAX_OUTPUT_TOKENS", 12000)
        resp = await llm_provider.chat(
            message=prompt,
            system_message="Return JSON only. Never invent PMIDs or quotes.",
            temperature=0.1,
            max_tokens=map_max,
            response_mime_type="application/json",
        )
        parsed = _extract_json_object(resp.text)
        if not parsed:
            logger.warning(
                "Deep map: unparseable JSON (len=%s) prefix=%r",
                len(resp.text or ""),
                (resp.text or "")[:500],
            )
            return []
        ext = parsed.get("extractions")
        if isinstance(ext, list):
            return [e for e in ext if isinstance(e, dict)]
    except Exception as e:
        logger.warning("Deep map batch failed: %s", e)
    return []


async def run_deep_map_reduce(
    llm_provider: Any,
    portal_results: Dict[str, Any],
    research_plan: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Returns a dict compatible with merge_synthesis_results `llm_extraction` when non-empty:
    method, mechanisms, dosage/safety/outcomes optional, plus deep_research metadata.
    """
    if not llm_provider or not llm_provider.is_available():
        return {}

    articles: List[Dict[str, Any]] = (portal_results.get("pubmed") or {}).get("articles") or []
    max_art = _env_int("RI_DEEP_MAX_ARTICLES", 48)
    top_k = _env_int("RI_DEEP_TOP_ARTICLES", 20)
    batch_sz = _env_int("RI_DEEP_MAP_BATCH", 8)
    articles = articles[:max_art]
    if not articles:
        return {}

    primary = research_plan.get("primary_question", "")
    ranked = rerank_articles_bm25(primary, articles, top_k=top_k)

    chunks = [ranked[i : i + batch_sz] for i in range(0, len(ranked), batch_sz)]
    map_cap = _env_int("RI_DEEP_MAP_MAX_CONCURRENT", 2)
    map_sem = asyncio.Semaphore(max(1, map_cap))

    async def _bounded_map(ch: List[Dict[str, Any]]) -> List[dict]:
        async with map_sem:
            return await _run_map_chunk(llm_provider, primary, ch)

    map_tasks = [_bounded_map(ch) for ch in chunks if ch]
    map_outs = await asyncio.gather(*map_tasks, return_exceptions=True)

    all_extractions: List[dict] = []
    for out in map_outs:
        if isinstance(out, Exception):
            logger.warning("Deep map task error: %s", out)
            continue
        all_extractions.extend(out)

    if not all_extractions:
        return {
            "llm_extraction": {},
            "deep_research": {
                "map_batches": len(chunks),
                "articles_considered": len(ranked),
                "articles_before_rerank": len(articles),
                "bm25_top_k": top_k,
                "anchored_rows": 0,
                "note": "map produced no parseable extractions",
            },
        }

    mechanisms = _claims_to_mechanisms(all_extractions)
    evidence_blob = _build_reduce_evidence_blob(ranked, all_extractions)
    reduce_prompt = f"""Primary clinical question (synthesize toward actionable therapy, not a review article):
{primary[:800]}

Below are the Top {len(ranked)} BM25-ranked abstracts (snippets) plus PMID-grounded map extractions. Use ONLY this material.

{evidence_blob[:14000]}

Produce the Zeta-Core JSON object described in your system instructions. If any PMID snippet or extraction contains HR, p-value, median survival, CI, mg/m2, or AUC, those numbers MUST appear in your output strings—no qualitative-only restatement."""

    evidence_summary = ""
    knowledge_gaps: List[str] = []
    overall_confidence = 0.65
    try:
        reduce_max = _env_int("RI_DEEP_REDUCE_MAX_OUTPUT_TOKENS", 8192)
        r2 = await llm_provider.chat(
            message=reduce_prompt,
            system_message=_REDUCE_SYSTEM_MESSAGE,
            temperature=0.15,
            max_tokens=reduce_max,
            response_mime_type="application/json",
        )
        p2 = _extract_json_object(r2.text)
        if p2 and (p2.get("standard_of_care") is not None or p2.get("zeta_core_verdict")):
            evidence_summary, knowledge_gaps, overall_confidence = _assemble_zeta_core_directive(p2)
        elif p2 and (p2.get("evidence_summary") or "").strip():
            # Backward compatibility if model returns legacy shape
            evidence_summary = (p2.get("evidence_summary") or "").strip()
            kg = p2.get("knowledge_gaps")
            if isinstance(kg, list):
                knowledge_gaps = [str(x) for x in kg[:8]]
            try:
                overall_confidence = float(p2.get("overall_confidence", 0.65))
            except (TypeError, ValueError):
                pass
    except Exception as e:
        logger.warning("Deep reduce failed: %s", e)
        evidence_summary = f"Deep map extracted {len(mechanisms)} grounded claim rows across {len(ranked)} abstracts."

    return {
        "llm_extraction": {
            "mechanisms": mechanisms[:120],
            "dosage": {},
            "safety": {},
            "outcomes": [],
            "method": "llm_deep_research",
            "evidence_summary": evidence_summary,
            "knowledge_gaps": knowledge_gaps,
            "overall_confidence": overall_confidence,
        },
        "article_summaries": [],
        "sub_question_answers": [],
        "deep_research": {
            "articles_before_rerank": len(articles),
            "articles_considered": len(ranked),
            "bm25_top_k": top_k,
            "map_batches": len(chunks),
            "anchored_rows": len(mechanisms),
            "extraction_records": len(all_extractions),
        },
    }
