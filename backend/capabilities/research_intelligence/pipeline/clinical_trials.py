"""Optional clinical trial ranking via oncology ClinicalTrialSearchService."""

from __future__ import annotations

import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


async def get_clinical_trial_recommendations(
    synthesized_findings: Dict[str, Any],
    moat_analysis: Dict[str, Any],
    context: Dict[str, Any],
    moat_integrator: Any,
) -> List[Dict[str, Any]]:
    try:
        from api.services.clinical_trial_search_service import ClinicalTrialSearchService

        trial_service = ClinicalTrialSearchService()
    except Exception as e:
        logger.debug(f"ClinicalTrialSearchService not available: {e}")
        return []

    mechanisms = synthesized_findings.get("mechanisms", [])
    if not mechanisms:
        return []

    mechanism_names = [
        m.get("mechanism", "") if isinstance(m, dict) else str(m) for m in mechanisms[:3]
    ]
    query = f"{' '.join(mechanism_names)} AND {context.get('disease', 'cancer')}"

    try:
        disease_category = context.get("disease", "").replace("_", " ")
        trial_results = await trial_service.search_trials(
            query=query,
            disease_category=disease_category,
            top_k=20,
            min_score=0.5,
        )
        if not trial_results.get("success"):
            return []

        trials = trial_results.get("data", {}).get("found_trials", [])
        if not trials:
            return []

        sae_mechanism_vector = moat_analysis.get("sae_features", {}).get("mechanism_vector")
        if not sae_mechanism_vector:
            pathway_scores = moat_analysis.get("pathway_scores", {})
            sae_mechanism_vector = [
                pathway_scores.get("dna_repair", 0.0),
                pathway_scores.get("mapk", 0.0),
                pathway_scores.get("pi3k", 0.0),
                pathway_scores.get("vegf", 0.0),
                pathway_scores.get("her2", 0.0),
                0.0,
                0.0,
            ]

        ranked_trials = await moat_integrator.rank_trials_by_mechanism_fit(
            mechanisms=mechanisms,
            trials=trials,
            sae_mechanism_vector=sae_mechanism_vector,
        )

        recommendations = []
        for trial in ranked_trials[:10]:
            recommendations.append(
                {
                    "nct_id": trial.get("nct_id", ""),
                    "title": trial.get("title", ""),
                    "mechanism_fit_score": trial.get("mechanism_fit_score", 0.0),
                    "mechanism_alignment": trial.get("mechanism_alignment_level", "UNKNOWN"),
                    "combined_score": trial.get("combined_score", 0.0),
                    "rationale": f"Mechanism fit: {trial.get('mechanism_fit_score', 0.0):.0%}",
                }
            )
        return recommendations
    except Exception as e:
        logger.warning(f"Clinical trial recommendations failed: {e}")
        return []
