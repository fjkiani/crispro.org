"""
Central limits for how wide/deep PubMed and parsing go.

Override with environment variables (integers unless noted).
"""

from __future__ import annotations

import os
from dataclasses import dataclass


def _i(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return max(1, int(raw))
    except ValueError:
        return default


@dataclass(frozen=True)
class SearchLimits:
    """Single place for 'how deep we search' — used by portal + parse + sub-questions."""

    pubmed_max_results: int  # main query: requested from pubmearch
    parse_top_n: int  # how many PubMed rows we consider for full-text extraction
    diffbot_max_papers: int  # how many of top papers we try Diffbot/PMC on
    citation_network_max_articles: int  # slice for co-occurrence / trends
    subquestion_max: int  # max sub-questions to answer in fallback path
    subquestion_pubmed_max: int  # hits per sub-question search
    subquestion_articles_for_llm: int  # top articles passed to LLM per sub-q
    pds_max_cohort_results: int
    gdc_pharmacogenes_max: int  # genes to query (fixed list length capped)


def get_search_limits() -> SearchLimits:
    return SearchLimits(
        pubmed_max_results=_i("RI_PUBMED_MAX_RESULTS", 1000),
        parse_top_n=_i("RI_PARSE_TOP_N", 10),
        diffbot_max_papers=_i("RI_DIFFBOT_MAX_PAPERS", 5),
        citation_network_max_articles=_i("RI_CITATION_NETWORK_MAX_ARTICLES", 50),
        subquestion_max=_i("RI_SUBQUESTION_MAX", 5),
        subquestion_pubmed_max=_i("RI_SUBQUESTION_PUBMED_MAX", 50),
        subquestion_articles_for_llm=_i("RI_SUBQUESTION_ARTICLES_FOR_LLM", 10),
        pds_max_cohort_results=_i("RI_PDS_MAX_RESULTS", 10),
        gdc_pharmacogenes_max=_i("RI_GDC_GENES_MAX", 3),
    )
