"""
Research intelligence — retrieval and enrichment pipeline (orchestrator phases).

End-to-end flow for POST /api/v1/research-intelligence/research:

1. **Question formulator** (outside this package) builds `research_plan`: primary question,
   entities, sub_questions, portal_queries.pubmed[].

2. **portal_query** — PubMed via pubmearch (up to RI_PUBMED_MAX_RESULTS, default 1000 retrieved
   for analysis); optional PDS/GDC if portals exist. If pubmearch is missing, `pubmed` is an
   error stub and later stages rely on LLM + abstracts only when articles exist.

3. **content_parse** — Top RI_PARSE_TOP_N abstracts from PubMed results; Diffbot on first
   RI_DIFFBOT_MAX_PAPERS hits; PMC full-text via pubmed_parser as fallback.

4. **synthesis_engine** (separate package) — Merges portal + parsed text into mechanisms, etc.

5. **sub_question_runner** (optional) — Extra PubMed searches per sub-question (50 hits each)
   if comprehensive synthesis did not return sub_question_answers.

6. **MOAT** — Stub or full integrator.

7. **clinical_trials / drug_interactions / citation_network** — Post-synthesis enrichments.

Tune depth via env vars (see pipeline.limits).
"""

from .limits import SearchLimits, get_search_limits

__all__ = ["SearchLimits", "get_search_limits"]
