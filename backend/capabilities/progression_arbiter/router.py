"""
Progression Arbiter Router — /api/v1/progression-arbiter/*.

Endpoints:
  GET  /api/v1/progression-arbiter/demo          → Classic CDK4/6i pseudo-progression case
  POST /api/v1/progression-arbiter/score          → Score an imaging event
  POST /api/v1/progression-arbiter/parse-report   → NLP parse radiology report text
"""

import logging
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Body

from .arbiter import ProgressionArbiter
from .radiology_parser import parse_radiology_report
from .models import (
    ArbiterScoreRequest,
    ArbiterScoreResponse,
    RadiologyParseRequest,
    RadiologyParseResponse,
)

logger = logging.getLogger("crispro.progression_arbiter")

# ── Model path (absolute, no CWD dependency) ────────────────────────────────

MODEL_PATH = Path(__file__).parent / "models" / "progression_arbiter_model_v1.json"

_arbiter: Optional[ProgressionArbiter] = None


def load_model() -> None:
    """Load the frozen model. Called once at app startup via lifespan."""
    global _arbiter
    if not MODEL_PATH.exists():
        raise RuntimeError(f"Arbiter model not found: {MODEL_PATH}")
    _arbiter = ProgressionArbiter(str(MODEL_PATH))
    logger.info(f"Loaded {_arbiter.model_name} (n={_arbiter.n_training})")


def _get_arbiter() -> ProgressionArbiter:
    if _arbiter is None:
        raise RuntimeError("Arbiter model not loaded. Check lifespan startup.")
    return _arbiter


router = APIRouter(prefix="/api/v1/progression-arbiter", tags=["Progression Arbiter"])


# ── Demo endpoint ────────────────────────────────────────────────────────────

@router.get("/demo", response_model=ArbiterScoreResponse)
def demo_endpoint():
    """
    Classic CDK4/6i + new sclerotic bone + healing case.
    Expected: p=0.00493, LOW risk, healing_flag driving.
    """
    arbiter = _get_arbiter()
    result = arbiter.score(
        imaging_change_type="NEW_SCLEROTIC_BONE",
        therapy_class="CDK46",
        symptomatic=False,
        new_pain_at_site=False,
        healing_flag=True,
        weeks_on_therapy=12,
        alp_delta_pct=-5.0,
        ca153_delta_pct=0.0,
    )
    result["explanation"] = arbiter.explain(result)
    return result


# ── Score endpoint ───────────────────────────────────────────────────────────

@router.post("/score", response_model=ArbiterScoreResponse)
def score_event(payload: ArbiterScoreRequest = Body(...)):
    """Score a single bone imaging event."""
    arbiter = _get_arbiter()
    result = arbiter.score(
        imaging_change_type=payload.imaging_change_type.value,
        therapy_class=payload.therapy_class.value,
        symptomatic=payload.symptomatic,
        new_pain_at_site=payload.new_pain_at_site,
        healing_flag=payload.healing_flag,
        weeks_on_therapy=payload.weeks_on_therapy,
        alp_delta_pct=payload.alp_delta_pct,
        ca153_delta_pct=payload.ca153_delta_pct,
    )
    result["explanation"] = arbiter.explain(result)
    return result


# ── Radiology report parser ─────────────────────────────────────────────────

@router.post("/parse-report", response_model=RadiologyParseResponse)
def parse_report(payload: RadiologyParseRequest = Body(...)):
    """Parse free-text radiology report to extract imaging change type and healing flag."""
    return parse_radiology_report(payload.text)
