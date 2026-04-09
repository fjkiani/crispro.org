"""
HTTP API for the ported research_intelligence orchestrator.
"""

from typing import Any, Dict, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from .llm_provider.llm_request_context import push_user_gemini_api_key, reset_user_gemini_api_key
from .orchestrator import ResearchIntelligenceOrchestrator

router = APIRouter(prefix="/api/v1/research-intelligence", tags=["research-intelligence"])

_orch: Optional[ResearchIntelligenceOrchestrator] = None


def _get_orch() -> ResearchIntelligenceOrchestrator:
    global _orch
    if _orch is None:
        _orch = ResearchIntelligenceOrchestrator()
    return _orch


class ResearchRequest(BaseModel):
    question: str
    context: Dict[str, Any] = Field(default_factory=dict)
    deep: bool = Field(
        False,
        description=(
            "Deep Research: Zeta PubMed hydration when needed + BM25/map–reduce synthesis. "
            "Requires gemini_api_key (your key; used only for this request, not stored)."
        ),
    )
    gemini_api_key: Optional[str] = Field(
        None,
        description="Google AI (Gemini) API key — required when deep=true; scoped to this request only.",
    )


@router.get("/health")
async def health() -> Dict[str, Any]:
    o = _get_orch()
    return {"ok": True, "available": o.is_available()}


@router.post("/research")
async def research(body: ResearchRequest) -> Dict[str, Any]:
    if body.deep:
        key = (body.gemini_api_key or "").strip()
        if not key:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Deep Research requires gemini_api_key: your Google AI API key. "
                    "It is used only for this HTTP request and is not logged or stored."
                ),
            )
    token = None
    try:
        if body.deep and body.gemini_api_key:
            token = push_user_gemini_api_key(body.gemini_api_key.strip())
        o = _get_orch()
        return await o.research_question(body.question, body.context, deep=body.deep)
    finally:
        if token is not None:
            reset_user_gemini_api_key(token)
