"""PubMed / PDS / GDC portal phase."""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from .limits import SearchLimits, get_search_limits

logger = logging.getLogger(__name__)


async def query_portals(
    research_plan: Dict[str, Any],
    *,
    pubmed: Any,
    project_data_sphere: Any,
    gdc: Any,
    limits: Optional[SearchLimits] = None,
) -> Dict[str, Any]:
    limits = limits or get_search_limits()
    portal_results: Dict[str, Any] = {
        "keyword_analysis": {},
        "top_keywords": [],
        "search_limits": {
            "pubmed_max_results": limits.pubmed_max_results,
            "pds_max_results": limits.pds_max_cohort_results,
        },
    }

    if not pubmed:
        portal_results["pubmed"] = {"articles": [], "error": "PubMed portal not available"}
    else:
        pubmed_queries = research_plan.get("portal_queries", {}).get("pubmed", [])
        if not pubmed_queries:
            primary_question = research_plan.get("primary_question", "")
            entities = research_plan.get("entities", {})
            compound = entities.get("compound", "")
            disease = entities.get("disease", "")
            if compound and disease:
                query = f"{compound} AND {disease}"
            else:
                query = primary_question
            pubmed_queries = [query]

        try:
            query = pubmed_queries[0] if pubmed_queries else ""
            if not query:
                logger.warning("No PubMed query available, using fallback")
                portal_results["pubmed"] = {"articles": [], "error": "No query available"}
            else:
                pubmed_results = await pubmed.search_with_analysis(
                    query=query,
                    max_results=limits.pubmed_max_results,
                    analyze_keywords=True,
                    include_trends=True,
                )
                top_keywords = pubmed.get_top_keywords(pubmed_results, top_n=20)
                portal_results["pubmed"] = pubmed_results
                portal_results["keyword_analysis"] = pubmed_results.get("keyword_analysis", {})
                portal_results["top_keywords"] = top_keywords
        except Exception as e:
            logger.error(f"PubMed query failed: {e}", exc_info=True)
            portal_results["pubmed"] = {"articles": [], "error": str(e)}

    if project_data_sphere:
        try:
            entities = research_plan.get("entities", {})
            disease = entities.get("disease", "")
            if disease:
                pds_results = await project_data_sphere.search_cohorts(
                    disease=disease,
                    max_results=limits.pds_max_cohort_results,
                )
                portal_results["project_data_sphere"] = pds_results
        except Exception as e:
            logger.warning(f"Project Data Sphere query failed: {e}")
            portal_results["project_data_sphere"] = {"cohorts": [], "error": str(e)}

    if gdc:
        try:
            pharmacogenes = ["DPYD", "UGT1A1", "TPMT"][: limits.gdc_pharmacogenes_max]
            gdc_results = {}
            for gene in pharmacogenes:
                gdc_results[gene] = await gdc.query_pharmacogene_variants(gene=gene)
            portal_results["gdc"] = gdc_results
        except Exception as e:
            logger.warning(f"GDC query failed: {e}")
            portal_results["gdc"] = {"variants": [], "error": str(e)}

    return portal_results
