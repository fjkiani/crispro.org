"""Citation / trend heuristics from PubMed article list (no external citation API)."""

from __future__ import annotations

from typing import Any, Dict, Optional

from .limits import SearchLimits, get_search_limits


def analyze_citation_network(
    portal_results: Dict[str, Any],
    parsed_content: Dict[str, Any],
    limits: Optional[SearchLimits] = None,
) -> Dict[str, Any]:
    limits = limits or get_search_limits()
    articles = portal_results.get("pubmed", {}).get("articles", [])
    if not articles:
        return {}

    key_papers = []
    publication_years: Dict[int, int] = {}
    journals: Dict[str, int] = {}

    for article in articles[: limits.citation_network_max_articles]:
        pmid = article.get("pmid", "")
        title = article.get("title", "")
        year = article.get("publication_date", "")
        journal = article.get("journal", "")

        if year:
            try:
                year_int = int(year.split("-")[0] if "-" in year else year[:4])
                publication_years[year_int] = publication_years.get(year_int, 0) + 1
            except (ValueError, IndexError):
                pass

        if journal:
            journals[journal] = journals.get(journal, 0) + 1

        citation_count = article.get("citation_count", 0)
        try:
            y = int(year.split("-")[0] if year and "-" in year else (year[:4] if year else 0))
        except (ValueError, TypeError):
            y = 0
        if citation_count > 50 or y >= 2020:
            key_papers.append(
                {
                    "pmid": pmid,
                    "title": title[:100],
                    "citation_count": citation_count,
                    "year": year,
                    "journal": journal,
                    "influence_score": min(citation_count / 100.0, 1.0) if citation_count > 0 else 0.5,
                }
            )

    key_papers.sort(key=lambda x: x.get("influence_score", 0), reverse=True)
    top_journals = sorted(journals.items(), key=lambda x: x[1], reverse=True)[:10]

    knowledge_gaps: list = []
    if publication_years:
        recent_years = [y for y in publication_years.keys() if y >= 2020]
        if recent_years:
            avg_recent = sum(publication_years[y] for y in recent_years) / len(recent_years)
            for year in range(2020, 2025):
                if publication_years.get(year, 0) < avg_recent * 0.5:
                    knowledge_gaps.append(f"Low publication activity in {year}")

    return {
        "key_papers": key_papers[:10],
        "trends": {
            "publication_years": dict(sorted(publication_years.items())),
            "top_journals": [{"journal": j, "count": c} for j, c in top_journals],
        },
        "knowledge_gaps": knowledge_gaps,
    }
