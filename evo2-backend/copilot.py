"""
Claude co-pilot layer for the VUS Triage Co-Pilot.

Wraps the Anthropic SDK with three prompt templates:
  1. triage_report  — ranked variant list with rationales
  2. tumor_board    — tumor-board-style discussion note
  3. followup_qa    — interactive follow-up question answering

Usage:
    from copilot import generate_report, chat
    response = generate_report(annotated_variants, mode="triage_report", panel_name="...")
"""

import json
import os
from datetime import date
from typing import Optional

import anthropic

from schemas import AnnotatedVariant, CopilotRequest, CopilotResponse


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MODEL = "claude-sonnet-4-6"

DISCLAIMER_FOOTER = """
---
*FOR RESEARCH AND EDUCATIONAL USE ONLY. This output does not constitute clinical "
diagnostic advice or a clinical report. All variant interpretations must be reviewed "
by a qualified molecular pathologist or clinical geneticist before any clinical application.*
"""

SYSTEM_PROMPT = """\
You are a Splicing-Aware VUS Triage Co-Pilot embedded in an oncology research tool.

You assist molecular biologists and bioinformaticians in triaging variants of uncertain \
significance (VUS) detected in cancer gene panels. Your analysis draws on three signals:

1. Evo2 deep-learning delta-likelihood scores (negative = loss-of-function direction)
2. Splice boundary proximity risk (High / Moderate / Low) derived from exon-intron geometry
3. Curated cancer gene tier and pathway context

CRITICAL DISCLAIMER: All your outputs are FOR RESEARCH AND EDUCATIONAL USE ONLY.
Nothing you produce constitutes clinical diagnostic advice, a clinical report, or a medical \
recommendation. All interpretations must be reviewed and validated by a board-certified clinical \
geneticist or molecular pathologist before any clinical application. You must include the \
disclaimer at the end of every response.

Tone and style:
- Precise, scientific, and transparent about uncertainty.
- Cite the specific Evo2 delta score (to 4 decimal places) and splice risk category when \
  reasoning about a variant.
- Do not fabricate ClinVar accession numbers, PubMed IDs, or clinical trial references.
- If the RAG context provides relevant information, summarise it; do not copy it verbatim.
- Use standard oncology terminology (TSG, oncogene, HRD, LOH, VUS, ACMG, etc.).
"""


# ---------------------------------------------------------------------------
# Prompt templates
# ---------------------------------------------------------------------------

def _build_variant_block(av: AnnotatedVariant, brief: bool = False) -> str:
    """Render a single AnnotatedVariant as a compact JSON-like text block."""
    if av.error:
        return (
            f"  VARIANT: {av.input.gene_symbol} {av.input.chr}:{av.input.pos} "
            f"{av.input.ref}>{av.input.alt} — ERROR: {av.error}"
        )

    evo2 = av.evo2
    ca = av.cancer_annotation
    comp = av.composite

    parts = [
        f"  GENE: {av.input.gene_symbol}  |  LOCUS: {av.input.chr}:{av.input.pos} {av.input.ref}>{av.input.alt}",
        f"  PRIORITY: {comp.priority if comp else 'N/A'}  (score={comp.raw_score:.3f})" if comp else "",
        f"  Evo2: delta={evo2.delta_score:+.4f}, prediction={evo2.prediction}, confidence={evo2.classification_confidence:.2f}" if evo2 else "",
        f"  Splice: risk={evo2.splice_risk}, boundary_pos={evo2.splice_position}, side={evo2.splice_boundary}" if evo2 else "",
        f"  CancerGene: is_cancer={ca.is_cancer_gene}, tier={ca.cancer_gene_tier}, role={ca.gene_role}, pathways={ca.pathways}, cancer_types={ca.cancer_types}" if ca else "",
    ]

    if av.clinvar_context:
        parts.append(f"  ClinVar context: {av.clinvar_context}")

    if comp and comp.score_components:
        sc = comp.score_components
        parts.append(
            f"  Score breakdown: evo2_pathogenicity={sc.get('evo2_pathogenicity', 0):.2f}, "
            f"splice_severity={sc.get('splice_severity', 0):.2f}, "
            f"cancer_gene_tier={sc.get('cancer_gene_tier', 0):.2f}, "
            f"evo2_confidence={sc.get('evo2_confidence', 0):.2f}"
        )

    if not brief and av.rag_context:
        parts.append(f"  RAG context ({len(av.rag_context)} snippets):")
        for i, snippet in enumerate(av.rag_context, 1):
            # Truncate to first 400 chars to keep token budget manageable
            snippet_preview = snippet[:400].replace("\n", " ")
            parts.append(f"    [{i}] {snippet_preview}...")

    return "\n".join(p for p in parts if p)


def _build_panel_summary_block(
    variants: list[AnnotatedVariant],
    panel_name: Optional[str],
) -> str:
    high   = [av for av in variants if av.composite and av.composite.priority == "High"]
    medium = [av for av in variants if av.composite and av.composite.priority == "Medium"]
    low    = [av for av in variants if av.composite and av.composite.priority == "Low"]
    errors = [av for av in variants if av.error]

    lines = [
        f"Panel: {panel_name or 'Unnamed panel'}",
        f"Total variants: {len(variants)}  |  High: {len(high)}  |  Medium: {len(medium)}  |  Low: {len(low)}  |  Errors: {len(errors)}",
    ]
    return "\n".join(lines)


def _triage_report_prompt(
    variants: list[AnnotatedVariant],
    panel_name: Optional[str],
) -> str:
    sorted_variants = sorted(
        variants,
        key=lambda av: av.composite.raw_score if av.composite else -1,
        reverse=True,
    )

    variant_blocks = "\n\n".join(
        f"--- Variant {i+1} ---\n{_build_variant_block(av)}"
        for i, av in enumerate(sorted_variants)
    )

    return f"""\
Generate a ranked variant triage report for the following cancer gene panel.

PANEL OVERVIEW:
{_build_panel_summary_block(variants, panel_name)}

ANNOTATED VARIANTS (pre-sorted by composite priority score, highest first):
{variant_blocks}

INSTRUCTIONS:
For each variant, produce a section with this exact structure:

## [PRIORITY] GENE chrN:POS REF>ALT

**Triage Rationale (2–3 sentences):**
Synthesise the Evo2 prediction, splice boundary proximity, and cancer gene context.
Cite the specific delta score (e.g., Δ=-0.0031), splice risk category, bp from boundary,
and confidence value. Reference RAG context snippets where relevant to explain the gene's
known splice mutation landscape or pathway role.

**Key Evidence:**
- Evo2: [prediction], delta=[value], confidence=[value]
- Splice: [risk category], [bp from nearest boundary], [intronic/exonic], boundary=[side]
- Gene: Tier [N], role=[role], pathways=[list]
- Literature context: [1-sentence summary from the RAG snippets above]

**Recommended Next Steps (1–2 actions):**
Suggest concrete research follow-up steps such as: RNA splicing assay, orthogonal SpliceAI
in-silico check, ACMG/AMP classification, co-segregation study, or functional assay.

---

After all variants, add a short PANEL SUMMARY paragraph (4–6 sentences) covering:
the most actionable findings, dominant pathways affected, and overall HRD/MSI/RTK signature
(if applicable) of this panel.

{DISCLAIMER_FOOTER}
"""


def _tumor_board_prompt(
    variants: list[AnnotatedVariant],
    panel_name: Optional[str],
) -> str:
    high_med = [
        av for av in variants
        if av.composite and av.composite.priority in ("High", "Medium")
    ]
    low = [
        av for av in variants
        if av.composite and av.composite.priority == "Low"
    ]
    high_count = sum(1 for av in variants if av.composite and av.composite.priority == "High")
    medium_count = sum(1 for av in variants if av.composite and av.composite.priority == "Medium")

    hm_blocks = "\n\n".join(
        f"--- {av.input.gene_symbol} {av.input.chr}:{av.input.pos} ---\n{_build_variant_block(av)}"
        for av in high_med
    )

    low_lines = "\n".join(
        f"  • {av.input.gene_symbol} {av.input.chr}:{av.input.pos} {av.input.ref}>{av.input.alt}"
        f" — priority=Low, score={av.composite.raw_score:.3f}"
        for av in low if av.composite
    )

    today = date.today().isoformat()

    return f"""\
Generate a concise molecular tumor board discussion note.

PANEL: {panel_name or 'Unnamed panel'}
Date: {today}
High priority: {high_count}  |  Medium priority: {medium_count}

HIGH AND MEDIUM PRIORITY VARIANTS:
{hm_blocks}

LOW PRIORITY VARIANTS (for reference):
{low_lines or "  None"}

Format the note EXACTLY as follows:

## Molecular Tumor Board Note
**Date:** {today}
**Panel:** {panel_name or 'Unnamed panel'}

### Executive Summary
2–3 sentences covering the most actionable findings and dominant pathway(s) involved.

### Variants Requiring Discussion
For each High/Medium variant:

**GENE chrN:POS REF>ALT** — Priority: High/Medium (score: X.XXX)
- Clinical relevance: [gene tier, associated cancer types from RAG context]
- Functional evidence: [Evo2 delta + splice risk summary, 1–2 sentences]
- Discussion points: [specific questions for the tumor board, e.g., RNA assay, PARP sensitivity]

### Recommended Actions
A bulleted list of 3–5 concrete next steps for the panel as a whole (e.g., IHC, RNA extraction,
PARP inhibitor sensitivity testing, co-segregation study in family).

### Variants Deferred (Low Priority)
Brief mention of Low-priority variants and why they were deferred.

{DISCLAIMER_FOOTER}
"""


def _followup_qa_prompt(
    variants: list[AnnotatedVariant],
    panel_name: Optional[str],
    question: str,
    conversation_history: list[dict],
) -> tuple[str, list[dict]]:
    """
    Returns (system_with_context, messages_list) for the Claude messages API.
    """
    panel_summary = _build_panel_summary_block(variants, panel_name)

    all_variants_sorted = sorted(
        variants,
        key=lambda av: av.composite.raw_score if av.composite else -1,
        reverse=True,
    )

    abbreviated = "\n\n".join(
        _build_variant_block(av, brief=True)
        for av in all_variants_sorted
    )

    system_with_context = f"""\
{SYSTEM_PROMPT}

CURRENT PANEL CONTEXT:
{panel_summary}

ALL VARIANTS (sorted by priority score, highest first):
{abbreviated}
"""

    messages = list(conversation_history)
    messages.append({"role": "user", "content": question})
    return system_with_context, messages


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_report(request: CopilotRequest) -> CopilotResponse:
    """
    Generate a triage report or tumor board note via Claude.
    Handles modes: "triage_report" and "tumor_board".
    """
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    if request.mode == "triage_report":
        user_prompt = _triage_report_prompt(
            request.annotated_variants, request.panel_name
        )
    elif request.mode == "tumor_board":
        user_prompt = _tumor_board_prompt(
            request.annotated_variants, request.panel_name
        )
    else:
        raise ValueError(f"generate_report() called with mode={request.mode!r}. Use chat() for followup_qa.")

    message = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    report_text = message.content[0].text if message.content else ""

    return CopilotResponse(
        mode=request.mode,
        report_markdown=report_text,
        model_used=MODEL,
        input_tokens=message.usage.input_tokens,
        output_tokens=message.usage.output_tokens,
    )


def chat(request: CopilotRequest) -> CopilotResponse:
    """
    Answer a follow-up question about the panel via Claude.
    Handles multi-turn conversation via request.conversation_history.
    """
    if request.mode != "followup_qa":
        raise ValueError(f"chat() requires mode='followup_qa', got {request.mode!r}.")
    if not request.followup_question:
        raise ValueError("followup_question is required for mode='followup_qa'.")

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    system_with_context, messages = _followup_qa_prompt(
        variants=request.annotated_variants,
        panel_name=request.panel_name,
        question=request.followup_question,
        conversation_history=request.conversation_history,
    )

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=system_with_context,
        messages=messages,
    )

    answer_text = message.content[0].text if message.content else ""
    if DISCLAIMER_FOOTER.strip() not in answer_text:
        answer_text += f"\n\n{DISCLAIMER_FOOTER}"

    return CopilotResponse(
        mode="followup_qa",
        answer=answer_text,
        model_used=MODEL,
        input_tokens=message.usage.input_tokens,
        output_tokens=message.usage.output_tokens,
    )
