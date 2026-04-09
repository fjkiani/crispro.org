"""Answer a single sub-question with EnhancedEvidenceService or raw LLM provider."""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from .limits import SynthesisLimits, get_synthesis_limits

logger = logging.getLogger(__name__)


async def answer_sub_question(
    llm_provider: Any,
    sub_question: str,
    articles: List[Dict[str, Any]],
    parsed_content: Dict[str, Any],
    research_plan: Dict[str, Any],
    limits: Optional[SynthesisLimits] = None,
) -> Dict[str, Any]:
    limits = limits or get_synthesis_limits()
    from ..llm_provider.llm_abstract import LLMResponse

    try:
        from ..enhanced_evidence_service import EnhancedEvidenceService

        evidence_service = EnhancedEvidenceService()
        abstracts = "\n\n".join(
            [
                f"PMID: {a.get('pmid', '')}\nTitle: {a.get('title', '')}\nAbstract: {a.get('abstract', '')}"
                for a in articles[:10]
            ]
        )
        full_texts = []
        for article in articles:
            pmid = article.get("pmid", "")
            for ft_article in parsed_content.get("full_text_articles", []):
                if ft_article.get("pmid") == pmid:
                    full_texts.append(
                        f"PMID: {pmid}\nTitle: {ft_article.get('title', '')}\nFull Text: {ft_article.get('full_text', '')[:3000]}"
                    )
                    break
        full_text_content = "\n\n".join(full_texts[:3])
        papers_text = f"{abstracts}\n\n{full_text_content}"
        entities = research_plan.get("entities", {})
        compound = entities.get("compound", "")
        disease = entities.get("disease", "")
        synthesis = await evidence_service._call_llm_agnostic(
            compound=compound,
            disease=disease,
            papers_text=f"Question: {sub_question}\n\n{papers_text}",
        )
        if synthesis:
            mechanisms = synthesis.get("mechanisms", [])
            answer = synthesis.get("evidence_summary", "")
            if not answer and mechanisms:
                answer = f"Based on {len(mechanisms)} mechanisms identified: {', '.join([m.get('mechanism', str(m)) if isinstance(m, dict) else str(m) for m in mechanisms[:3]])}"
            return {
                "answer": answer or "Evidence found but unable to synthesize answer",
                "confidence": synthesis.get("overall_confidence", 0.7),
                "sources": [a.get("pmid", "") for a in articles[:5] if a.get("pmid")],
                "mechanisms": mechanisms[:5],
            }
    except Exception as e:
        logger.debug(f"LLM sub-question answering failed: {e}, trying LLM provider fallback")

    if not llm_provider or not llm_provider.is_available():
        return {
            "answer": "LLM not available",
            "confidence": 0.0,
            "sources": [],
            "mechanisms": [],
        }

    abstracts = "\n\n".join(
        [
            f"PMID: {a.get('pmid', '')}\nTitle: {a.get('title', '')}\nAbstract: {a.get('abstract', '')}"
            for a in articles[:10]
        ]
    )
    full_texts = []
    for article in articles:
        pmid = article.get("pmid", "")
        for ft_article in parsed_content.get("full_text_articles", []):
            if ft_article.get("pmid") == pmid:
                full_texts.append(
                    f"PMID: {pmid}\nTitle: {ft_article.get('title', '')}\nFull Text: {ft_article.get('full_text', '')[:3000]}"
                )
                break
    full_text_content = "\n\n".join(full_texts[:3])
    entities = research_plan.get("entities", {})
    compound = entities.get("compound", "")
    disease = entities.get("disease", "")
    sac = limits.subq_abstract_chars
    sfc = limits.subq_fulltext_chars

    prompt = f"""Answer this specific research sub-question:

Sub-Question: {sub_question}

Context:
- Compound: {compound}
- Disease: {disease}

Relevant Articles ({len(articles)} papers):
{abstracts[:sac]}

Full-Text Articles ({len(full_texts)} papers):
{full_text_content[:sfc]}

Provide a concise answer to the sub-question, including:
1. Direct answer to the question
2. Confidence level (0.0-1.0)
3. Source PMIDs
4. Any mechanisms mentioned

Return JSON only:
{{
    "answer": "Direct answer to the sub-question",
    "confidence": 0.85,
    "sources": ["pmid1", "pmid2"],
    "mechanisms": [
        {{
            "mechanism": "mechanism_name",
            "target": "target",
            "confidence": 0.8
        }}
    ]
}}"""

    try:
        llm_response: LLMResponse = await llm_provider.chat(
            message=prompt,
            system_message="You are a biomedical research analyst. Answer the specific sub-question concisely. Return valid JSON only.",
            temperature=0.3,
            max_tokens=1000,
            response_mime_type="application/json",
        )
        response_text = llm_response.text.strip()
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()
        return json.loads(response_text)
    except Exception as e:
        logger.warning(f"Sub-question answering failed: {e}")
        return {
            "answer": "Unable to generate answer",
            "confidence": 0.0,
            "sources": [],
            "mechanisms": [],
        }
