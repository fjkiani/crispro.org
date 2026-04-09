"""Heuristic drug–pathway interaction check from synthesis + context."""

from __future__ import annotations

from typing import Any, Dict, List, Optional


def check_drug_interactions(
    synthesized_findings: Dict[str, Any],
    context: Dict[str, Any],
    research_plan: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    interactions: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if research_plan:
        entities = research_plan.get("entities", {})
        compound = entities.get("compound", "")
    else:
        compound = context.get("compound", "")

    prior_therapies = context.get("prior_therapies", [])
    if not compound or not prior_therapies:
        return {"interactions": [], "warnings": []}

    mechanisms = synthesized_findings.get("mechanisms", [])
    mechanism_pathways = set()
    for mech in mechanisms:
        mech_name = mech.get("mechanism", "").lower() if isinstance(mech, dict) else str(mech).lower()
        if "cyp" in mech_name or "cytochrome" in mech_name:
            mechanism_pathways.add("CYP")
        if "p-gp" in mech_name or "pgp" in mech_name or "efflux" in mech_name:
            mechanism_pathways.add("P-gp")
        if "ugt" in mech_name:
            mechanism_pathways.add("UGT")

    known_interactions = {
        "tamoxifen": {"CYP2D6": "MODERATE", "pathway": "Estrogen receptor"},
        "letrozole": {"CYP2A6": "LOW", "pathway": "Aromatase"},
        "carboplatin": {"DNA repair": "HIGH", "pathway": "DDR"},
        "paclitaxel": {"P-gp": "MODERATE", "pathway": "Efflux"},
    }

    for prior_drug in prior_therapies:
        prior_lower = prior_drug.lower()
        for known_drug, interaction_info in known_interactions.items():
            if known_drug.lower() in prior_lower:
                for pathway in mechanism_pathways:
                    if pathway in interaction_info.get("pathway", "").upper():
                        interactions.append(
                            {
                                "drug1": compound,
                                "drug2": prior_drug,
                                "interaction_type": "pathway_overlap",
                                "severity": interaction_info.get("CYP2D6")
                                or interaction_info.get("DNA repair")
                                or "MODERATE",
                                "mechanism": f"{pathway} pathway overlap",
                                "recommendation": f"Monitor for {interaction_info.get('pathway', 'interaction')} when combining {compound} with {prior_drug}",
                            }
                        )

    germline_genes = context.get("germline_genes", [])
    for gene in germline_genes:
        if "CYP" in gene or "DPYD" in gene or "UGT" in gene:
            warnings.append(
                {
                    "type": "pharmacogenomics",
                    "gene": gene,
                    "message": f"{gene} variant may affect metabolism of {compound}",
                    "recommendation": "Consider pharmacogenomics testing",
                }
            )

    return {"interactions": interactions, "warnings": warnings}
