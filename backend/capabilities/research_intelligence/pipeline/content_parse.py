"""Diffbot + pubmed_parser full-text phase for top PubMed hits."""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from .limits import SearchLimits, get_search_limits

logger = logging.getLogger(__name__)


async def deep_parse_top_papers(
    portal_results: Dict[str, Any],
    *,
    pubmed_parser: Any,
    limits: Optional[SearchLimits] = None,
) -> Dict[str, Any]:
    limits = limits or get_search_limits()
    articles = portal_results.get("pubmed", {}).get("articles", [])
    if not articles:
        return {
            "full_text_articles": [],
            "parsed_count": 0,
            "diffbot_count": 0,
            "pubmed_parser_count": 0,
            "pharmacogenomics_cases": [],
            "parse_limits": {
                "parse_top_n": limits.parse_top_n,
                "diffbot_max_papers": limits.diffbot_max_papers,
            },
        }

    top_papers = articles[: limits.parse_top_n]
    diffbot_service = None
    try:
        from ..enhanced_evidence_service import EnhancedEvidenceService

        diffbot_service = EnhancedEvidenceService()
    except ImportError:
        logger.debug("Diffbot service not available, using pubmed_parser only")

    parsed_articles = []
    for article in top_papers[: limits.diffbot_max_papers]:
        pmid = article.get("pmid", "")
        pmc = article.get("pmc", "")
        title = article.get("title", "")

        if pmc:
            url = f"https://www.ncbi.nlm.nih.gov/pmc/articles/{pmc}/"
        elif pmid:
            url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        else:
            continue

        if diffbot_service:
            try:
                full_text = await diffbot_service._extract_full_text_with_diffbot(url)
                if full_text and len(full_text) > 500:
                    parsed_articles.append(
                        {
                            "pmid": pmid,
                            "pmc": pmc,
                            "title": title,
                            "full_text": full_text,
                            "source": "diffbot",
                            "has_full_text": True,
                        }
                    )
                    continue
            except Exception as e:
                logger.debug(f"Diffbot failed for {url}: {e}")

        if pmc and pubmed_parser:
            try:
                pmc_id = pmc.replace("PMC", "").strip()
                full_text = await pubmed_parser.parse_full_text_from_pmc(pmc_id)
                body = (
                    full_text.get("full_text", "")
                    if isinstance(full_text, dict)
                    else (full_text or "")
                )
                if body:
                    parsed_articles.append(
                        {
                            "pmid": pmid,
                            "pmc": pmc,
                            "title": title,
                            "full_text": body,
                            "source": "pubmed_parser",
                            "has_full_text": True,
                        }
                    )
            except Exception as e:
                logger.debug(f"pubmed_parser failed for PMC{pmc}: {e}")

    pharmacogenomics_cases: list = []

    return {
        "full_text_articles": parsed_articles,
        "parsed_count": len(parsed_articles),
        "diffbot_count": sum(1 for a in parsed_articles if a.get("source") == "diffbot"),
        "pubmed_parser_count": sum(1 for a in parsed_articles if a.get("source") == "pubmed_parser"),
        "pharmacogenomics_cases": pharmacogenomics_cases,
        "parse_limits": {
            "parse_top_n": limits.parse_top_n,
            "diffbot_max_papers": limits.diffbot_max_papers,
        },
    }
