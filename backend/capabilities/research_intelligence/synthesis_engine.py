"""
Research Synthesis Engine — thin facade over synthesis_parts.

Flow: comprehensive extraction (full-text batch) → generic LLM (abstracts + snippets) → merge → evidence tier.
"""

import logging
import os
from typing import Any, Dict, List, Optional

from .llm_provider.llm_abstract import get_llm_provider, LLMProvider

from .synthesis_parts.comprehensive import run_comprehensive_extraction
from .synthesis_parts.evidence_tier import classify_evidence_tier
from .synthesis_parts.generic_synthesis import run_generic_llm_synthesis
from .synthesis_parts.limits import get_synthesis_limits
from .synthesis_parts.map_reduce_deep import run_deep_map_reduce
from .synthesis_parts.merge_results import merge_synthesis_results
from .synthesis_parts.sub_question import answer_sub_question as answer_sub_question_impl

logger = logging.getLogger(__name__)

LLM_AVAILABLE = True
try:
    _prov = get_llm_provider()
    LLM_AVAILABLE = _prov.is_available()
except Exception:
    LLM_AVAILABLE = False
if not LLM_AVAILABLE:
    logger.warning("LLM services are not available. Please check API keys and configurations.")


class ResearchSynthesisEngine:
    """Uses LLM to synthesize findings from portal + parsed content."""

    def __init__(self):
        self.llm_provider = None
        self._limits = get_synthesis_limits()
        if LLM_AVAILABLE:
            try:
                provider_str = os.getenv("DEFAULT_LLM_PROVIDER", LLMProvider.GROQ.value)
                try:
                    provider_enum = LLMProvider(provider_str.lower())
                except ValueError:
                    provider_enum = LLMProvider.GROQ
                self.llm_provider = get_llm_provider(provider=provider_enum)
                if not self.llm_provider.is_available():
                    logger.error(f"Selected LLM provider {provider_str} is not available.")
                    self.llm_provider = None
            except Exception as e:
                logger.warning(f"LLM provider not available: {e}")
                self.llm_provider = None

    async def synthesize_findings(
        self,
        portal_results: Dict[str, Any],
        parsed_content: Dict[str, Any],
        research_plan: Dict[str, Any],
        *,
        deep: bool = False,
    ) -> Dict[str, Any]:
        if deep:
            deep_pack = await run_deep_map_reduce(
                self.llm_provider, portal_results, research_plan
            )
            comprehensive_result = {
                "llm_extraction": deep_pack.get("llm_extraction", {}),
                "article_summaries": deep_pack.get("article_summaries", []),
                "sub_question_answers": deep_pack.get("sub_question_answers", []),
            }
            if deep_pack.get("deep_research"):
                comprehensive_result["_deep_research_meta"] = deep_pack["deep_research"]
        else:
            comprehensive_result = await run_comprehensive_extraction(
                portal_results, parsed_content, research_plan, self._limits
            )

        generic_synthesis = await run_generic_llm_synthesis(
            self.llm_provider,
            portal_results,
            parsed_content,
            research_plan,
            self._limits,
        )
        merged = merge_synthesis_results(
            comprehensive_result.get("llm_extraction", {}),
            generic_synthesis,
            comprehensive_result.get("article_summaries", []),
        )
        if comprehensive_result.get("sub_question_answers"):
            merged["sub_question_answers"] = comprehensive_result["sub_question_answers"]
        if comprehensive_result.get("_deep_research_meta"):
            merged["deep_research"] = comprehensive_result["_deep_research_meta"]

        evidence_classification = classify_evidence_tier(
            mechanisms=merged.get("mechanisms", []),
            pathway_scores={},
            context={},
        )
        merged["evidence_tier"] = evidence_classification["evidence_tier"]
        merged["badges"] = evidence_classification["badges"]
        return merged

    async def answer_sub_question(
        self,
        sub_question: str,
        articles: List[Dict[str, Any]],
        parsed_content: Dict[str, Any],
        research_plan: Dict[str, Any],
    ) -> Dict[str, Any]:
        return await answer_sub_question_impl(
            self.llm_provider,
            sub_question,
            articles,
            parsed_content,
            research_plan,
            self._limits,
        )


__all__ = ["ResearchSynthesisEngine"]
