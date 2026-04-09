"""
MOAT integration — placeholder until oncology-backend MOAT is vendored in full.

Provides the async surface expected by ResearchIntelligenceOrchestrator so the
API router can load and return structured responses without crashing.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class MOATIntegrator:
    """Minimal MOAT stub: safe defaults, no external MOAT service."""

    async def integrate_with_moat(
        self,
        synthesized_findings: Dict[str, Any],
        context: Dict[str, Any],
    ) -> Dict[str, Any]:
        mechanisms = synthesized_findings.get("mechanisms") or []
        return {
            "pathways": [],
            "mechanisms": mechanisms,
            "pathway_scores": {
                "dna_repair": 0.0,
                "mapk": 0.0,
                "pi3k": 0.0,
                "vegf": 0.0,
                "her2": 0.0,
            },
            "treatment_line_analysis": {},
            "biomarker_analysis": {},
            "overall_confidence": 0.0,
            "sae_features": {"mechanism_vector": None},
            "note": "MOAT stub — replace with full oncology MOAT when ported",
        }

    async def rank_trials_by_mechanism_fit(
        self,
        *,
        mechanisms: List[Any],
        trials: List[Dict[str, Any]],
        sae_mechanism_vector: Optional[List[float]] = None,
    ) -> List[Dict[str, Any]]:
        if not trials:
            return []
        out: List[Dict[str, Any]] = []
        for t in trials:
            row = dict(t)
            row.setdefault("mechanism_fit_score", 0.5)
            row.setdefault("mechanism_alignment_level", "UNKNOWN")
            row.setdefault("combined_score", row.get("mechanism_fit_score", 0.5))
            out.append(row)
        return out
