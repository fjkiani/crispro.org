"""Merge comprehensive + generic synthesis outputs."""

from __future__ import annotations

from typing import Any, Dict, List


def merge_synthesis_results(
    llm_extraction: Dict[str, Any],
    generic_synthesis: Dict[str, Any],
    article_summaries: List[Dict[str, Any]],
) -> Dict[str, Any]:
    merged = generic_synthesis.copy()

    if llm_extraction and llm_extraction.get("method") == "llm_deep_research":
        merged["method"] = "llm_deep_research"
        if llm_extraction.get("mechanisms"):
            llm_mechs = []
            for llm_mech in llm_extraction.get("mechanisms", []):
                if isinstance(llm_mech, dict):
                    llm_mechs.append(llm_mech)
                elif isinstance(llm_mech, str):
                    llm_mechs.append(
                        {"mechanism": llm_mech, "confidence": 0.7, "source": "llm"}
                    )
            existing_mechs = {
                m.get("mechanism", "") if isinstance(m, dict) else str(m): m
                for m in merged.get("mechanisms", [])
            }
            for llm_mech in llm_mechs:
                mech_name = (
                    llm_mech.get("mechanism", "")
                    if isinstance(llm_mech, dict)
                    else str(llm_mech)
                )
                if mech_name and mech_name not in existing_mechs:
                    existing_mechs[mech_name] = llm_mech
            merged["mechanisms"] = list(existing_mechs.values())
        if llm_extraction.get("dosage"):
            merged["dosage"] = llm_extraction["dosage"]
        if llm_extraction.get("safety"):
            merged["safety"] = llm_extraction["safety"]
        if llm_extraction.get("outcomes"):
            merged["outcomes"] = llm_extraction["outcomes"]
        if llm_extraction.get("evidence_summary"):
            merged["evidence_summary"] = llm_extraction["evidence_summary"]
        if llm_extraction.get("knowledge_gaps"):
            merged["knowledge_gaps"] = llm_extraction["knowledge_gaps"]
        oc = llm_extraction.get("overall_confidence")
        if oc is not None:
            try:
                merged["overall_confidence"] = float(oc)
            except (TypeError, ValueError):
                pass
    else:
        merged["method"] = generic_synthesis.get("method", "generic_llm_synthesis")

    merged["article_summaries"] = article_summaries
    return merged
