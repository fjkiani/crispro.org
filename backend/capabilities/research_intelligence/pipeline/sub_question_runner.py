"""Fallback per-sub-question PubMed + LLM when batch synthesis omitted answers."""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from .limits import SearchLimits, get_search_limits

if TYPE_CHECKING:
    from ..synthesis_engine import ResearchSynthesisEngine

logger = logging.getLogger(__name__)


def build_sub_question_query(sub_question: str, research_plan: Dict[str, Any]) -> str:
    entities = research_plan.get("entities", {})
    compound = entities.get("compound", "")
    disease = entities.get("disease", "")
    sub_q_lower = sub_question.lower()

    if "mechanism" in sub_q_lower or "how does" in sub_q_lower:
        query = f"{compound} AND {disease} AND (mechanism OR pathway OR target)"
    elif "outcome" in sub_q_lower or "efficacy" in sub_q_lower or "response" in sub_q_lower:
        query = f"{compound} AND {disease} AND (outcome OR efficacy OR response OR survival)"
    elif "dosage" in sub_q_lower or "dose" in sub_q_lower:
        query = f"{compound} AND {disease} AND (dosage OR dose OR dosing)"
    elif "safety" in sub_q_lower or "toxicity" in sub_q_lower or "adverse" in sub_q_lower:
        query = f"{compound} AND {disease} AND (safety OR toxicity OR adverse OR side effect)"
    elif "evidence" in sub_q_lower or "exists" in sub_q_lower or "study" in sub_q_lower:
        query = f"{compound} AND {disease} AND (evidence OR clinical OR trial OR study)"
    else:
        stop_words = {
            "what",
            "how",
            "does",
            "do",
            "is",
            "are",
            "for",
            "with",
            "in",
            "the",
            "a",
            "an",
            "this",
            "that",
        }
        words = [w for w in sub_question.split() if w.lower() not in stop_words and len(w) > 2]
        if words:
            key_terms = " OR ".join(words[:3])
            query = f"{compound} AND {disease} AND ({key_terms})"
        else:
            query = f"{compound} AND {disease}"
    return query


async def answer_sub_questions(
    research_plan: Dict[str, Any],
    portal_results: Dict[str, Any],
    parsed_content: Dict[str, Any],
    synthesis_engine: "ResearchSynthesisEngine",
    pubmed: Any,
    limits: Optional[SearchLimits] = None,
) -> List[Dict[str, Any]]:
    limits = limits or get_search_limits()
    sub_questions = research_plan.get("sub_questions", [])
    if not sub_questions:
        return []

    answers: List[Dict[str, Any]] = []
    for sub_q in sub_questions[: limits.subquestion_max]:
        query = build_sub_question_query(sub_q, research_plan)
        try:
            if pubmed:
                sub_results = await pubmed.search_with_analysis(
                    query=query,
                    max_results=limits.subquestion_pubmed_max,
                    analyze_keywords=False,
                )
                answer = await synthesis_engine.answer_sub_question(
                    sub_question=sub_q,
                    articles=sub_results.get("articles", [])[: limits.subquestion_articles_for_llm],
                    parsed_content=parsed_content,
                    research_plan=research_plan,
                )
                answers.append(
                    {
                        "sub_question": sub_q,
                        "answer": answer.get("answer", ""),
                        "confidence": answer.get("confidence", 0.5),
                        "sources": answer.get("sources", []),
                        "mechanisms": answer.get("mechanisms", []),
                    }
                )
            else:
                answers.append(
                    {
                        "sub_question": sub_q,
                        "answer": "Unable to answer - PubMed portal not available",
                        "confidence": 0.0,
                        "sources": [],
                        "mechanisms": [],
                    }
                )
        except Exception as e:
            logger.warning(f"Failed to answer sub-question '{sub_q}': {e}")
            answers.append(
                {
                    "sub_question": sub_q,
                    "answer": "Unable to answer",
                    "confidence": 0.0,
                    "sources": [],
                    "mechanisms": [],
                }
            )
    return answers
