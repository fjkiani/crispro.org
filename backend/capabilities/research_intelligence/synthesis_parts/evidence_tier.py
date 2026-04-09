"""Evidence tier + badges heuristics."""

from __future__ import annotations

from typing import Any, Dict, List


def classify_evidence_tier(
    mechanisms: List[Dict[str, Any]],
    pathway_scores: Dict[str, float],
    context: Dict[str, Any],
) -> Dict[str, Any]:
    badges: List[str] = []
    evidence_tier = "Insufficient"
    max_pathway_score = max(pathway_scores.values()) if pathway_scores else 0.0
    if max_pathway_score > 0.7:
        badges.append("Pathway-Aligned")
        evidence_tier = "Consider"

    high_confidence_mechs = [m for m in mechanisms if m.get("confidence", 0) > 0.8]
    if high_confidence_mechs:
        badges.append("ClinVar-Strong")
        if evidence_tier == "Consider":
            evidence_tier = "Supported"

    if len(mechanisms) >= 3:
        badges.append("RCT")

    if len(high_confidence_mechs) >= 2:
        if evidence_tier == "Insufficient":
            evidence_tier = "Consider"

    conf = (
        max_pathway_score
        if pathway_scores
        else (
            max([m.get("confidence", 0) for m in mechanisms])
            if mechanisms
            else 0.0
        )
    )
    return {
        "evidence_tier": evidence_tier,
        "badges": badges,
        "confidence": conf,
    }
