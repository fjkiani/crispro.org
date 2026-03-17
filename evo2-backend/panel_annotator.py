"""
Panel annotator — orchestrates the per-variant annotation pipeline.

For each VariantInput:
  1. Fetches genome sequence and exon data (reuses main.py module-level functions)
  2. Runs Evo2 scoring + splice-risk classification
  3. Annotates cancer gene context (cancer_genes.py)
  4. Retrieves RAG snippets (rag_engine.py)
  5. Computes composite priority score

The Evo2 model instance is passed in by the caller (panel_app.py) so this
module stays stateless and is independently testable with a mock model.
"""

import time
import urllib.request
import xml.etree.ElementTree as ET
from typing import Optional

from schemas import (
    AnnotatedVariant,
    CancerGeneAnnotation,
    CompositeScore,
    Evo2RawResult,
    PanelAnalysisRequest,
    PanelAnalysisResponse,
    VariantInput,
)
from cancer_genes import get_cancer_annotation
import rag_engine


# ---------------------------------------------------------------------------
# Scoring weights (must sum to 1.0)
# ---------------------------------------------------------------------------

WEIGHTS = {
    "evo2_pathogenicity": 0.35,
    "splice_severity":    0.30,
    "cancer_gene_tier":   0.20,
    "evo2_confidence":    0.15,
}

# Priority thresholds
THRESHOLD_HIGH   = 0.70
THRESHOLD_MEDIUM = 0.40


# ---------------------------------------------------------------------------
# Component value mappings
# ---------------------------------------------------------------------------

SPLICE_SEVERITY_MAP = {
    "High Risk":            1.0,
    "Moderate Risk":        0.6,
    "Low/Unknown Risk":     0.1,
    # "No exon boundaries found in this region" → treated as 0.0
}

TIER_VALUE_MAP = {
    "Tier1": 1.0,
    "Tier2": 0.6,
}


def fetch_clinvar_context(clinvar_id: str) -> str:
    """
    Fetch a compact clinical context summary for a ClinVar variant via NCBI efetch.

    Calls the NCBI efetch XML API, extracts clinical significance, review status,
    and associated conditions, and returns a ~100-word plain-text summary suitable
    for injection into Claude's prompt.  Returns "" gracefully on any error.
    """
    try:
        url = (
            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
            f"?db=clinvar&id={clinvar_id}&rettype=clinvarset&retmode=xml"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "VUSTriageCopilot/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            xml_bytes = resp.read()

        root = ET.fromstring(xml_bytes)

        # Clinical significance / germline classification description
        sig = ""
        for tag in ("Description",):
            for elem in root.iter(tag):
                text = (elem.text or "").strip()
                if text and text not in ("not provided", "not specified"):
                    sig = text
                    break
            if sig:
                break

        # Review status (star level)
        review = ""
        for elem in root.iter("ReviewStatus"):
            text = (elem.text or "").strip()
            if text:
                review = text
                break

        # Associated conditions / trait names
        conditions: list[str] = []
        for elem in root.iter("TraitName"):
            text = (elem.text or "").strip()
            if text and text.lower() not in ("not specified", "not provided") and text not in conditions:
                conditions.append(text)

        # Number of submitters (approximate from GermlineClassification or aggregate)
        submitters = ""
        for elem in root.iter("SubmitterCount"):
            submitters = (elem.text or "").strip()
            break

        parts: list[str] = []
        if sig:
            parts.append(f"ClinVar germline classification: {sig}")
        if review:
            parts.append(f"review status: {review}")
        if submitters:
            parts.append(f"submitters: {submitters}")
        if conditions:
            parts.append(f"associated conditions: {', '.join(conditions[:3])}")

        return "; ".join(parts) if parts else ""

    except Exception:
        return ""


def _splice_severity_value(splice_risk: str) -> float:
    return SPLICE_SEVERITY_MAP.get(splice_risk, 0.0)


def _cancer_tier_value(annotation: CancerGeneAnnotation) -> float:
    if not annotation.is_cancer_gene or annotation.cancer_gene_tier is None:
        return 0.0
    return TIER_VALUE_MAP.get(annotation.cancer_gene_tier, 0.0)


def compute_composite_score(
    evo2: Evo2RawResult,
    cancer_annotation: CancerGeneAnnotation,
) -> CompositeScore:
    """
    Compute the weighted composite triage score from Evo2 and annotation signals.

    Returns a CompositeScore with raw_score, priority, and per-component breakdown.
    """
    comp = {
        "evo2_pathogenicity": 1.0 if evo2.prediction == "Likely pathogenic" else 0.0,
        "splice_severity":    _splice_severity_value(evo2.splice_risk),
        "cancer_gene_tier":   _cancer_tier_value(cancer_annotation),
        "evo2_confidence":    evo2.classification_confidence,
    }

    raw_score = sum(WEIGHTS[k] * v for k, v in comp.items())
    raw_score = round(raw_score, 4)

    if raw_score >= THRESHOLD_HIGH:
        priority = "High"
    elif raw_score >= THRESHOLD_MEDIUM:
        priority = "Medium"
    else:
        priority = "Low"

    return CompositeScore(
        raw_score=raw_score,
        priority=priority,
        score_components=comp,
    )


# ---------------------------------------------------------------------------
# Per-variant annotation (called by panel_app.py inside the Modal class)
# ---------------------------------------------------------------------------

def annotate_variant(
    variant: VariantInput,
    model,  # Evo2 model instance (or mock in tests)
) -> AnnotatedVariant:
    """
    Run the full annotation pipeline for a single VariantInput.
    Catches and records errors per-variant so the rest of the panel proceeds.
    """
    # These imports are deferred so the module can be imported at the top level
    # in non-Modal environments without pulling in heavy dependencies.
    from main import get_genome_sequence, get_exon_data, analyze_variant

    WINDOW_SIZE = 8192

    try:
        # 1. Fetch reference sequence window
        window_seq, seq_start = get_genome_sequence(
            position=variant.pos,
            genome=variant.genome,
            chromosome=variant.chr,
            window_size=WINDOW_SIZE,
        )

        relative_pos = variant.pos - 1 - seq_start
        if relative_pos < 0 or relative_pos >= len(window_seq):
            raise ValueError(
                f"Variant position {variant.pos} is outside the fetched window "
                f"(seq_start={seq_start}, window_len={len(window_seq)})"
            )

        reference = window_seq[relative_pos]

        # 2. Run Evo2 scoring
        raw = analyze_variant(
            relative_pos_in_window=relative_pos,
            reference=reference,
            alternative=variant.alt,
            window_seq=window_seq,
            model=model,
        )
        # raw is a plain dict from main.py; wrap in typed model
        raw["position"] = variant.pos

        # 3. Compute splice risk
        exon_data = get_exon_data(
            position=variant.pos,
            genome=variant.genome,
            chromosome=variant.chr,
            window_size=WINDOW_SIZE,
        )

        if exon_data:
            closest_offset = None
            closest_boundary = None

            for ex_start, ex_end in exon_data:
                for boundary, dist in (("start", variant.pos - ex_start), ("end", variant.pos - ex_end)):
                    if closest_offset is None or abs(dist) < abs(closest_offset):
                        closest_offset = dist
                        closest_boundary = (ex_start, ex_end, boundary)

            ex_start, ex_end, boundary = closest_boundary
            if (closest_offset <= 0 and boundary == "start") or (closest_offset >= 0 and boundary == "end"):
                boundary_position = "intronic"
            else:
                boundary_position = "exonic"

            abs_offset = abs(closest_offset)

            if abs_offset <= 2 and boundary_position == "intronic":
                splice_risk = "High Risk"
            elif (3 <= abs_offset <= 8 and boundary_position == "intronic") or \
                 (1 <= abs_offset <= 3 and boundary_position == "exonic"):
                splice_risk = "Moderate Risk"
            else:
                splice_risk = "Low/Unknown Risk"

            splice_position = ex_start if boundary == "start" else ex_end
            splice_boundary = boundary
        else:
            splice_risk = "No exon boundaries found in this region"
            splice_position = None
            splice_boundary = None

        evo2_result = Evo2RawResult(
            position=variant.pos,
            reference=reference,
            alternative=variant.alt,
            delta_score=raw["delta_score"],
            prediction=raw["prediction"],
            classification_confidence=raw["classification_confidence"],
            splice_risk=splice_risk,
            splice_position=splice_position,
            splice_boundary=splice_boundary,
        )

        # 4. Cancer gene annotation
        cancer_annotation = get_cancer_annotation(variant.gene_symbol)

        # 4b. ClinVar clinical context (non-blocking — returns "" on error)
        clinvar_ctx = ""
        if variant.clinvar_id:
            clinvar_ctx = fetch_clinvar_context(variant.clinvar_id)

        # 5. Composite score
        composite = compute_composite_score(evo2_result, cancer_annotation)

        # 6. RAG retrieval
        query = (
            f"{variant.gene_symbol} splice variant {splice_risk} "
            f"{' '.join(cancer_annotation.pathways)} VUS triage oncology"
        )
        rag_snippets = rag_engine.retrieve(query, top_k=3, gene_filter=variant.gene_symbol)

        return AnnotatedVariant(
            input=variant,
            evo2=evo2_result,
            cancer_annotation=cancer_annotation,
            composite=composite,
            rag_context=rag_snippets,
            clinvar_context=clinvar_ctx or None,
        )

    except Exception as exc:
        return AnnotatedVariant(
            input=variant,
            error=f"{type(exc).__name__}: {exc}",
        )


# ---------------------------------------------------------------------------
# Panel-level orchestration
# ---------------------------------------------------------------------------

def annotate_panel(
    request: PanelAnalysisRequest,
    model,
) -> PanelAnalysisResponse:
    """
    Annotate all variants in a panel request and return a structured response.
    Per-variant errors are recorded in AnnotatedVariant.error; they do not abort
    the whole panel unless > 50% of variants fail.
    """
    start_time = time.time()

    annotated: list[AnnotatedVariant] = []
    for variant in request.variants:
        av = annotate_variant(variant, model)
        annotated.append(av)

    # Check error rate
    errors = [av for av in annotated if av.error is not None]
    if len(errors) > len(annotated) // 2:
        raise RuntimeError(
            f"More than 50% of variants failed annotation "
            f"({len(errors)}/{len(annotated)}). Aborting panel."
        )

    # Sort by composite score descending (errors go to end)
    def sort_key(av: AnnotatedVariant) -> float:
        if av.composite is None:
            return -1.0
        return av.composite.raw_score

    annotated.sort(key=sort_key, reverse=True)

    high   = sum(1 for av in annotated if av.composite and av.composite.priority == "High")
    medium = sum(1 for av in annotated if av.composite and av.composite.priority == "Medium")
    low    = sum(1 for av in annotated if av.composite and av.composite.priority == "Low")

    return PanelAnalysisResponse(
        panel_name=request.panel_name,
        genome=request.variants[0].genome if request.variants else "hg38",
        annotated_variants=annotated,
        high_priority_count=high,
        medium_priority_count=medium,
        low_priority_count=low,
        processing_time_seconds=round(time.time() - start_time, 2),
    )
