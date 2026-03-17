"""
Synthetic variant panels for testing and demo purposes.

Three panels cover distinct hereditary cancer scenarios:
  1. HBOC  — Hereditary Breast & Ovarian Cancer
  2. Lynch — Lynch Syndrome / MMR gene panel
  3. Solid — Mixed solid tumor hotspot panel

All positions are GRCh38 (hg38) and represent real genomic coordinates,
but the variant calls themselves are synthetic — do NOT use for clinical purposes.
"""

from schemas import PanelAnalysisRequest, VariantInput


# ---------------------------------------------------------------------------
# Panel 1: Hereditary Breast & Ovarian Cancer (HBOC)
# ---------------------------------------------------------------------------

HBOC_PANEL = PanelAnalysisRequest(
    panel_name="Synthetic HBOC Panel v1 (hg38)",
    variants=[
        # BRCA1 — splice-region variant (±2 bp intronic, known hotspot neighbourhood)
        VariantInput(
            chr="chr17", pos=43119628, ref="C", alt="T",
            gene_symbol="BRCA1", genome="hg38",
            sample_id="SYN-001",
        ),
        # BRCA2 — intronic, moderate splice risk
        VariantInput(
            chr="chr13", pos=32316461, ref="A", alt="G",
            gene_symbol="BRCA2", genome="hg38",
            sample_id="SYN-001",
        ),
        # PALB2 — Tier2, exonic moderate splice risk
        VariantInput(
            chr="chr16", pos=23641301, ref="G", alt="A",
            gene_symbol="PALB2", genome="hg38",
            sample_id="SYN-001",
        ),
        # ATM — Tier2, low splice risk, expected benign Evo2
        VariantInput(
            chr="chr11", pos=108143977, ref="C", alt="T",
            gene_symbol="ATM", genome="hg38",
            sample_id="SYN-001",
        ),
        # RAD51C — Tier2, deep intronic (low risk expected)
        VariantInput(
            chr="chr17", pos=56770275, ref="T", alt="A",
            gene_symbol="RAD51C", genome="hg38",
            sample_id="SYN-001",
        ),
        # CHEK2 — Tier2, low splice risk
        VariantInput(
            chr="chr22", pos=28695868, ref="G", alt="C",
            gene_symbol="CHEK2", genome="hg38",
            sample_id="SYN-001",
        ),
    ],
    run_copilot=False,
)


# ---------------------------------------------------------------------------
# Panel 2: Lynch Syndrome MMR Panel
# ---------------------------------------------------------------------------

LYNCH_PANEL = PanelAnalysisRequest(
    panel_name="Synthetic Lynch Syndrome MMR Panel v1 (hg38)",
    variants=[
        # MLH1 — Tier1, high splice risk (canonical splice site)
        VariantInput(
            chr="chr3", pos=37035033, ref="A", alt="G",
            gene_symbol="MLH1", genome="hg38",
            sample_id="SYN-002",
        ),
        # MSH2 — Tier1, moderate splice risk
        VariantInput(
            chr="chr2", pos=47642533, ref="G", alt="A",
            gene_symbol="MSH2", genome="hg38",
            sample_id="SYN-002",
        ),
        # MSH6 — Tier1, low splice risk, benign Evo2 expected
        VariantInput(
            chr="chr2", pos=48026988, ref="C", alt="T",
            gene_symbol="MSH6", genome="hg38",
            sample_id="SYN-002",
        ),
        # PMS2 — Tier1 but expected benign
        VariantInput(
            chr="chr7", pos=6013090, ref="A", alt="T",
            gene_symbol="PMS2", genome="hg38",
            sample_id="SYN-002",
        ),
        # APC — WNT pathway, Tier1
        VariantInput(
            chr="chr5", pos=112839514, ref="T", alt="C",
            gene_symbol="APC", genome="hg38",
            sample_id="SYN-002",
        ),
    ],
    run_copilot=False,
)


# ---------------------------------------------------------------------------
# Panel 3: Mixed Solid Tumor Hotspot Panel
# ---------------------------------------------------------------------------

SOLID_TUMOR_PANEL = PanelAnalysisRequest(
    panel_name="Synthetic Solid Tumor Hotspot Panel v1 (hg38)",
    variants=[
        # KRAS — Tier1 oncogene, coding exon
        VariantInput(
            chr="chr12", pos=25245350, ref="C", alt="A",
            gene_symbol="KRAS", genome="hg38",
            sample_id="SYN-003",
        ),
        # BRAF — Tier1 oncogene, known hotspot region
        VariantInput(
            chr="chr7", pos=140753336, ref="A", alt="T",
            gene_symbol="BRAF", genome="hg38",
            sample_id="SYN-003",
        ),
        # TP53 — Tier1 TSG, splice-region (DNA-binding domain boundary)
        VariantInput(
            chr="chr17", pos=7674220, ref="G", alt="T",
            gene_symbol="TP53", genome="hg38",
            sample_id="SYN-003",
        ),
        # EGFR — Tier1 oncogene, exon boundary
        VariantInput(
            chr="chr7", pos=55191822, ref="C", alt="T",
            gene_symbol="EGFR", genome="hg38",
            sample_id="SYN-003",
        ),
        # PIK3CA — Tier1 oncogene, coding
        VariantInput(
            chr="chr3", pos=179218303, ref="A", alt="G",
            gene_symbol="PIK3CA", genome="hg38",
            sample_id="SYN-003",
        ),
        # PTEN — Tier1 TSG, potential splice impact
        VariantInput(
            chr="chr10", pos=89692905, ref="G", alt="A",
            gene_symbol="PTEN", genome="hg38",
            sample_id="SYN-003",
        ),
        # VHL — Tier1 TSG, low splice risk
        VariantInput(
            chr="chr3", pos=10183671, ref="T", alt="C",
            gene_symbol="VHL", genome="hg38",
            sample_id="SYN-003",
        ),
    ],
    run_copilot=False,
)


# ---------------------------------------------------------------------------
# Convenience accessor
# ---------------------------------------------------------------------------

DEMO_PANELS: dict[str, PanelAnalysisRequest] = {
    "hboc": HBOC_PANEL,
    "lynch": LYNCH_PANEL,
    "solid_tumor": SOLID_TUMOR_PANEL,
}


def get_demo_panel(name: str) -> PanelAnalysisRequest:
    """
    Return a demo PanelAnalysisRequest by name.
    Valid names: "hboc", "lynch", "solid_tumor".
    """
    key = name.lower()
    if key not in DEMO_PANELS:
        raise ValueError(f"Unknown demo panel: {name!r}. Choose from {list(DEMO_PANELS)}")
    return DEMO_PANELS[key]
