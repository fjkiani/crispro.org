"""Generic JSON synthesis + keyword fallback."""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from .limits import SynthesisLimits, get_synthesis_limits

logger = logging.getLogger(__name__)


def simple_synthesis(
    portal_results: Dict[str, Any],
    parsed_content: Dict[str, Any],
) -> Dict[str, Any]:
    keywords = portal_results.get("top_keywords", [])
    return {
        "mechanisms": [
            {
                "mechanism": kw.lower().replace(" ", "_"),
                "target": kw,
                "evidence": "Keyword frequency analysis",
                "confidence": 0.5,
                "sources": [],
            }
            for kw in keywords[:10]
        ],
        "evidence_summary": f"Found {len(portal_results.get('pubmed', {}).get('articles', []))} papers",
        "knowledge_gaps": [],
        "overall_confidence": 0.5,
    }


async def run_generic_llm_synthesis(
    llm_provider: Any,
    portal_results: Dict[str, Any],
    parsed_content: Dict[str, Any],
    research_plan: Dict[str, Any],
    limits: Optional[SynthesisLimits] = None,
) -> Dict[str, Any]:
    from ..llm_provider.llm_abstract import LLMResponse

    limits = limits or get_synthesis_limits()
    if not llm_provider or not llm_provider.is_available():
        logger.warning("LLM provider not available, using simple synthesis fallback")
        return simple_synthesis(portal_results, parsed_content)

    articles = portal_results.get("pubmed", {}).get("articles", [])
    n_abs = limits.generic_abstract_papers
    abstracts = "\n\n".join(
        [
            f"Title: {a.get('title', '')}\nAbstract: {a.get('abstract', '')}"
            for a in articles[:n_abs]
        ]
    )
    ftc = limits.generic_fulltext_chars
    full_texts = "\n\n".join(
        [
            f"Title: {ft.get('title', '')}\nFull Text: {ft.get('full_text', '')[:ftc]}"
            for ft in parsed_content.get("full_text_articles", [])
        ]
    )
    keywords = portal_results.get("top_keywords", [])
    pa = limits.generic_prompt_abstracts
    pf = limits.generic_prompt_fulltext

    prompt = f"""Synthesize research findings from these sources:

Research Question: {research_plan.get('primary_question', '')}

Abstracts ({len(articles)} papers):
{abstracts[:pa]}

Full-Text Articles ({len(parsed_content.get('full_text_articles', []))} papers):
{full_texts[:pf]}

Top Keywords (Research Hotspots):
{', '.join(keywords[:20])}

Extract and synthesize:
1. Mechanisms of action (how it works, what targets)
2. Evidence strength (RCTs, in vitro, etc.)
3. Confidence scores (0.0-1.0)
4. Knowledge gaps

Return JSON only:
{{
    "mechanisms": [
        {{
            "mechanism": "mechanism_name",
            "target": "target_protein_or_pathway",
            "evidence": "evidence_description",
            "confidence": 0.85,
            "sources": ["pmid1", "pmid2"]
        }}
    ],
    "evidence_summary": "Overall evidence summary",
    "knowledge_gaps": ["gap1", "gap2"],
    "overall_confidence": 0.78
}}"""

    try:
        llm_response: LLMResponse = await llm_provider.chat(
            message=prompt,
            system_message="You are a biomedical research analyst. Return valid JSON only.",
            temperature=0.3,
            max_tokens=2000,
            response_mime_type="application/json",
        )
        response_text = llm_response.text.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        synthesized = json.loads(response_text)
        synthesized["method"] = "generic_llm_synthesis"
        return synthesized
    except Exception as e:
        logger.warning(f"LLM synthesis failed: {e}, using fallback")
        result = simple_synthesis(portal_results, parsed_content)
        result["method"] = "fallback"
        return result
