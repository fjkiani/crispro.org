"""
Shared Pydantic schemas for the VUS Triage Co-Pilot pipeline.
All models are shared between panel_annotator.py, rag_engine.py, copilot.py, and panel_app.py.
"""

from __future__ import annotations

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Input schemas
# ---------------------------------------------------------------------------

class VariantInput(BaseModel):
    """A single variant to annotate. Mirrors a row in a VCF or JSON panel file."""
    chr: str                       # e.g. "chr17"
    pos: int                       # 1-based genomic position (GRCh38)
    ref: str                       # Reference allele (single nucleotide)
    alt: str                       # Alternate allele (single nucleotide)
    gene_symbol: str               # HGNC symbol, e.g. "BRCA1"
    genome: str = "hg38"           # Genome assembly
    sample_id: Optional[str] = None
    clinvar_id: Optional[str] = None        # ClinVar variation ID (for efetch context)
    clinvar_context: Optional[str] = None  # Pre-fetched ClinVar clinical summary

    @field_validator("ref", "alt")
    @classmethod
    def must_be_nucleotide(cls, v: str) -> str:
        v = v.upper()
        if v not in {"A", "T", "G", "C"}:
            raise ValueError(f"Allele must be a single nucleotide (A/T/G/C), got: {v!r}")
        return v

    @field_validator("chr")
    @classmethod
    def normalize_chr(cls, v: str) -> str:
        if not v.startswith("chr"):
            v = "chr" + v
        return v


class PanelAnalysisRequest(BaseModel):
    """Request body for POST /analyze_panel."""
    variants: List[VariantInput]
    panel_name: Optional[str] = None
    run_copilot: bool = False

    @field_validator("variants")
    @classmethod
    def limit_panel_size(cls, v: List[VariantInput]) -> List[VariantInput]:
        if len(v) == 0:
            raise ValueError("Panel must contain at least 1 variant.")
        if len(v) > 50:
            raise ValueError("Panel size is limited to 50 variants for the demo tier.")
        return v


# ---------------------------------------------------------------------------
# Intermediate / annotation schemas
# ---------------------------------------------------------------------------

class Evo2RawResult(BaseModel):
    """Direct output from the Evo2 model + splice-risk logic in main.py."""
    position: int
    reference: str
    alternative: str
    delta_score: float
    prediction: str                          # "Likely pathogenic" | "Likely benign"
    classification_confidence: float         # 0.0–1.0
    splice_risk: str                         # "High Risk" | "Moderate Risk" | "Low/Unknown Risk" | "No exon boundaries..."
    splice_position: Optional[int] = None
    splice_boundary: Optional[str] = None   # "start" | "end"


class CancerGeneAnnotation(BaseModel):
    """Cancer gene context for a single variant's gene symbol."""
    is_cancer_gene: bool
    cancer_gene_tier: Optional[str] = None  # "Tier1" | "Tier2"
    pathways: List[str] = []
    gene_role: Optional[str] = None         # "TSG" | "oncogene" | "dual-role"
    cancer_types: List[str] = []
    oncokb_level: Optional[str] = None


class CompositeScore(BaseModel):
    """Transparent, weighted composite triage score."""
    raw_score: float                         # 0.0–1.0
    priority: str                            # "High" | "Medium" | "Low"
    score_components: Dict[str, float]       # Keyed by component name, each 0.0–1.0


# ---------------------------------------------------------------------------
# Core annotated variant record
# ---------------------------------------------------------------------------

class AnnotatedVariant(BaseModel):
    """Fully annotated variant record — the central data structure of the pipeline."""
    input: VariantInput
    evo2: Optional[Evo2RawResult] = None
    cancer_annotation: Optional[CancerGeneAnnotation] = None
    composite: Optional[CompositeScore] = None
    rag_context: List[str] = []              # Top-k retrieved snippet texts
    clinvar_context: Optional[str] = None   # Fetched ClinVar clinical summary (passed to Claude)
    error: Optional[str] = None             # Set if Evo2 call failed for this variant


# ---------------------------------------------------------------------------
# Panel response schemas
# ---------------------------------------------------------------------------

class PanelAnalysisResponse(BaseModel):
    """Response body for POST /analyze_panel."""
    panel_name: Optional[str] = None
    genome: str
    annotated_variants: List[AnnotatedVariant]
    high_priority_count: int
    medium_priority_count: int
    low_priority_count: int
    processing_time_seconds: float
    copilot_report: Optional[CopilotResponse] = None


# ---------------------------------------------------------------------------
# Co-pilot schemas
# ---------------------------------------------------------------------------

class CopilotRequest(BaseModel):
    """Request body for POST /copilot/report and POST /copilot/chat."""
    annotated_variants: List[AnnotatedVariant]
    panel_name: Optional[str] = None
    mode: Literal["triage_report", "tumor_board", "followup_qa"]
    followup_question: Optional[str] = None
    conversation_history: List[Dict[str, str]] = []
    # Each item: {"role": "user"|"assistant", "content": "..."}

    @field_validator("followup_question")
    @classmethod
    def question_required_for_qa(cls, v: Optional[str], info) -> Optional[str]:
        # info.data may not have 'mode' yet if validation order differs;
        # do a lightweight check here only when mode is known
        return v


class CopilotResponse(BaseModel):
    """Response body for co-pilot endpoints."""
    mode: str
    report_markdown: Optional[str] = None   # For triage_report and tumor_board
    answer: Optional[str] = None            # For followup_qa
    citations: List[str] = []               # RAG snippet IDs used
    model_used: str = "claude-sonnet-4-6"
    disclaimer: str = (
        "FOR RESEARCH AND EDUCATIONAL USE ONLY. "
        "This output does not constitute clinical diagnostic advice. "
        "All variant interpretations must be reviewed by a qualified "
        "molecular pathologist or clinical geneticist before any clinical application."
    )
    input_tokens: int = 0
    output_tokens: int = 0


# Resolve forward reference (PanelAnalysisResponse references CopilotResponse)
PanelAnalysisResponse.model_rebuild()
