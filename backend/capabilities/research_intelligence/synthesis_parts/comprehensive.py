"""Single-call comprehensive extraction via EnhancedEvidenceService."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

from .limits import SynthesisLimits, get_synthesis_limits

logger = logging.getLogger(__name__)


async def run_comprehensive_extraction(
    portal_results: Dict[str, Any],
    parsed_content: Dict[str, Any],
    research_plan: Dict[str, Any],
    limits: SynthesisLimits | None = None,
) -> Dict[str, Any]:
    limits = limits or get_synthesis_limits()
    try:
        from ..enhanced_evidence_service import EnhancedEvidenceService

        evidence_service = EnhancedEvidenceService()
    except ImportError:
        logger.debug("EnhancedEvidenceService not available for comprehensive extraction")
        return {"llm_extraction": {}, "article_summaries": [], "sub_question_answers": []}

    articles: List[Dict[str, Any]] = parsed_content.get("full_text_articles", [])[
        : limits.comprehensive_max_articles
    ]
    if not articles:
        return {"llm_extraction": {}, "article_summaries": [], "sub_question_answers": []}

    combined_papers_text = []
    for article in articles:
        full_text = article.get("full_text", "")
        title = article.get("title", "")
        pmid = article.get("pmid", "")
        abstract = article.get("abstract", "")
        cap = limits.comprehensive_chars_per_paper
        fb = limits.comprehensive_abstract_fallback
        content = (
            full_text[:cap]
            if full_text and len(full_text) >= 500
            else abstract[:fb]
        )
        if not content:
            continue
        combined_papers_text.append(f"PMID: {pmid}\nTitle: {title}\nContent: {content}")

    if not combined_papers_text:
        return {"llm_extraction": {}, "article_summaries": [], "sub_question_answers": []}

    papers_text = "\n\n---\n\n".join(combined_papers_text)
    entities = research_plan.get("entities", {})
    compound = entities.get("compound", "")
    disease = entities.get("disease", "")
    sub_questions = research_plan.get("sub_questions", [])

    try:
        comprehensive_synthesis = await evidence_service._call_llm_agnostic_comprehensive(
            compound=compound,
            disease=disease,
            papers_text=papers_text,
            articles=articles,
            sub_questions=sub_questions,
        )
        if comprehensive_synthesis:
            return {
                "llm_extraction": {
                    "mechanisms": comprehensive_synthesis.get("mechanisms", []),
                    "dosage": comprehensive_synthesis.get("dosage", {}),
                    "safety": comprehensive_synthesis.get("safety", {}),
                    "outcomes": comprehensive_synthesis.get("outcomes", []),
                    "method": "llm_deep_research",
                },
                "article_summaries": comprehensive_synthesis.get("article_summaries", []),
                "sub_question_answers": comprehensive_synthesis.get("sub_question_answers", []),
            }
    except Exception as e:
        logger.debug(f"Comprehensive LLM extraction failed: {e}")

    return {"llm_extraction": {}, "article_summaries": [], "sub_question_answers": []}
