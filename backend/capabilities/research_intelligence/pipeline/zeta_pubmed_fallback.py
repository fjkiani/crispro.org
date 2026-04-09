"""
When pubmearch is unavailable, hydrate `portal_results['pubmed']` using Zeta-Core E-utilities.

Does not modify zeta_core; imports `search_pubmed_async` / `build_simple_query` read-only.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Tuple

logger = logging.getLogger(__name__)


def _normalize_zeta_article(a: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(a)
    y = a.get("year") or ""
    out.setdefault("publication_date", y)
    return out


async def hydrate_pubmed_with_zeta(
    portal_results: Dict[str, Any],
    research_plan: Dict[str, Any],
    *,
    max_results: int = 48,
) -> Tuple[Dict[str, Any], bool]:
    """
    If PubMed articles are missing or errored, fetch via Zeta PubMed client.
    Returns (updated_portal_results, used_fallback).
    """
    pub = portal_results.get("pubmed") or {}
    arts: List[Dict[str, Any]] = pub.get("articles") or []
    err = pub.get("error")
    if arts and not err:
        return portal_results, False

    try:
        from backend.capabilities.zeta_core.pubmed_client import (
            build_simple_query,
            search_pubmed_async,
        )
    except Exception as e:
        logger.warning("Zeta PubMed fallback import failed: %s", e)
        return portal_results, False

    pq = research_plan.get("portal_queries", {}).get("pubmed", [])
    entities = research_plan.get("entities", {})
    primary = research_plan.get("primary_question", "")

    if pq and isinstance(pq[0], str) and pq[0].strip():
        query = pq[0].strip()
    else:
        query = build_simple_query(
            primary,
            [],
            entities.get("compound") or "",
            entities.get("disease") or "",
        )

    try:
        articles, total_found = await search_pubmed_async(query, max_results=max_results)
    except Exception as e:
        logger.warning("Zeta PubMed search failed: %s", e)
        return portal_results, False

    norm = [_normalize_zeta_article(a) for a in articles]
    new_pub = {
        "articles": norm,
        "total_found": total_found,
        "query_used": query,
        "source": "zeta_pubmed_fallback",
    }
    out = {**portal_results, "pubmed": new_pub}
    logger.info(
        "Zeta PubMed fallback: %s articles (total_found=%s) query=%r",
        len(norm),
        total_found,
        query[:120],
    )
    return out, True
