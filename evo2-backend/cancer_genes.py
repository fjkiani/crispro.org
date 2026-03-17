"""
Curated cancer gene database for the VUS Triage Co-Pilot.

Covers ~25 high-confidence cancer genes drawn from OncoKB Tier1/2 and
COSMIC CGC (Cancer Gene Census). Each entry stores the fields needed for
triage annotation and RAG query construction.

Usage:
    from cancer_genes import get_cancer_annotation
    annotation = get_cancer_annotation("BRCA1")
"""

from schemas import CancerGeneAnnotation

# ---------------------------------------------------------------------------
# Curated gene database
# Keys are uppercase HGNC symbols.
# ---------------------------------------------------------------------------

CANCER_GENE_DB: dict[str, dict] = {
    # ── Homologous Recombination / DNA Damage Response ────────────────────
    "BRCA1": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["HR-repair", "cell-cycle-checkpoint", "ubiquitin-signaling"],
        "cancer_types": ["breast", "ovarian", "pancreatic", "prostate"],
        "oncokb_level": "Level1",
    },
    "BRCA2": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["HR-repair", "Fanconi-anemia"],
        "cancer_types": ["breast", "ovarian", "pancreatic", "prostate"],
        "oncokb_level": "Level1",
    },
    "PALB2": {
        "tier": "Tier2",
        "role": "TSG",
        "pathways": ["HR-repair", "Fanconi-anemia"],
        "cancer_types": ["breast", "pancreatic", "ovarian"],
        "oncokb_level": "Level2",
    },
    "ATM": {
        "tier": "Tier2",
        "role": "TSG",
        "pathways": ["HR-repair", "DSB-response", "cell-cycle-checkpoint"],
        "cancer_types": ["breast", "pancreatic", "prostate", "CLL"],
        "oncokb_level": "Level2",
    },
    "CHEK2": {
        "tier": "Tier2",
        "role": "TSG",
        "pathways": ["DSB-response", "cell-cycle-checkpoint"],
        "cancer_types": ["breast", "colorectal", "prostate"],
        "oncokb_level": "Level2",
    },
    "RAD51C": {
        "tier": "Tier2",
        "role": "TSG",
        "pathways": ["HR-repair", "Fanconi-anemia"],
        "cancer_types": ["breast", "ovarian"],
        "oncokb_level": "Level3",
    },
    "RAD51D": {
        "tier": "Tier2",
        "role": "TSG",
        "pathways": ["HR-repair", "Fanconi-anemia"],
        "cancer_types": ["ovarian"],
        "oncokb_level": "Level3",
    },
    # ── Cell Cycle / Apoptosis ────────────────────────────────────────────
    "TP53": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["apoptosis", "cell-cycle-checkpoint", "transcription"],
        "cancer_types": ["pan-cancer", "Li-Fraumeni"],
        "oncokb_level": "Level1",
    },
    "RB1": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["cell-cycle", "E2F-signaling"],
        "cancer_types": ["retinoblastoma", "osteosarcoma", "SCLC"],
        "oncokb_level": "Level1",
    },
    "CDK4": {
        "tier": "Tier1",
        "role": "oncogene",
        "pathways": ["cell-cycle", "CDK4/6-RB"],
        "cancer_types": ["melanoma", "liposarcoma", "glioma"],
        "oncokb_level": "Level1",
    },
    "CCND1": {
        "tier": "Tier2",
        "role": "oncogene",
        "pathways": ["cell-cycle", "CDK4/6-RB"],
        "cancer_types": ["breast", "mantle-cell-lymphoma", "head-and-neck"],
        "oncokb_level": "Level2",
    },
    # ── RAS / MAPK Pathway ────────────────────────────────────────────────
    "KRAS": {
        "tier": "Tier1",
        "role": "oncogene",
        "pathways": ["RAS-MAPK", "PI3K-AKT"],
        "cancer_types": ["PDAC", "NSCLC", "colorectal", "endometrial"],
        "oncokb_level": "Level1",
    },
    "BRAF": {
        "tier": "Tier1",
        "role": "oncogene",
        "pathways": ["RAS-MAPK"],
        "cancer_types": ["melanoma", "colorectal", "thyroid", "NSCLC"],
        "oncokb_level": "Level1",
    },
    "NF1": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["RAS-MAPK"],
        "cancer_types": ["neurofibromatosis", "MPNST", "NSCLC", "glioma"],
        "oncokb_level": "Level1",
    },
    # ── RTK / PI3K Pathway ────────────────────────────────────────────────
    "EGFR": {
        "tier": "Tier1",
        "role": "oncogene",
        "pathways": ["RTK-RAS", "RAS-MAPK", "PI3K-AKT"],
        "cancer_types": ["NSCLC", "glioblastoma", "head-and-neck"],
        "oncokb_level": "Level1",
    },
    "ERBB2": {
        "tier": "Tier1",
        "role": "oncogene",
        "pathways": ["RTK-RAS", "PI3K-AKT"],
        "cancer_types": ["breast", "gastric", "NSCLC", "colorectal"],
        "oncokb_level": "Level1",
    },
    "ALK": {
        "tier": "Tier1",
        "role": "oncogene",
        "pathways": ["RTK-RAS", "RAS-MAPK"],
        "cancer_types": ["NSCLC", "ALCL", "neuroblastoma"],
        "oncokb_level": "Level1",
    },
    "MET": {
        "tier": "Tier1",
        "role": "oncogene",
        "pathways": ["RTK-RAS", "RAS-MAPK"],
        "cancer_types": ["NSCLC", "gastric", "renal", "hepatocellular"],
        "oncokb_level": "Level1",
    },
    "PIK3CA": {
        "tier": "Tier1",
        "role": "oncogene",
        "pathways": ["PI3K-AKT", "mTOR"],
        "cancer_types": ["breast", "colorectal", "endometrial", "cervical"],
        "oncokb_level": "Level1",
    },
    "PTEN": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["PI3K-AKT", "mTOR"],
        "cancer_types": ["Cowden", "endometrial", "glioblastoma", "prostate"],
        "oncokb_level": "Level1",
    },
    # ── Mismatch Repair (Lynch Syndrome) ──────────────────────────────────
    "MLH1": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["MMR"],
        "cancer_types": ["colorectal", "endometrial", "gastric"],
        "oncokb_level": "Level1",
    },
    "MSH2": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["MMR"],
        "cancer_types": ["colorectal", "endometrial", "ovarian"],
        "oncokb_level": "Level1",
    },
    "MSH6": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["MMR"],
        "cancer_types": ["colorectal", "endometrial"],
        "oncokb_level": "Level1",
    },
    "PMS2": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["MMR"],
        "cancer_types": ["colorectal", "endometrial"],
        "oncokb_level": "Level1",
    },
    # ── Other Hereditary / Familial ───────────────────────────────────────
    "APC": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["WNT-beta-catenin"],
        "cancer_types": ["colorectal", "FAP", "desmoid"],
        "oncokb_level": "Level1",
    },
    "CDH1": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["cell-adhesion", "WNT-beta-catenin"],
        "cancer_types": ["hereditary-diffuse-gastric", "lobular-breast"],
        "oncokb_level": "Level1",
    },
    "STK11": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["AMPK-mTOR", "cell-polarity"],
        "cancer_types": ["Peutz-Jeghers", "NSCLC", "cervical"],
        "oncokb_level": "Level1",
    },
    "VHL": {
        "tier": "Tier1",
        "role": "TSG",
        "pathways": ["HIF-hypoxia", "ubiquitin-signaling"],
        "cancer_types": ["clear-cell-RCC", "hemangioblastoma", "pheochromocytoma"],
        "oncokb_level": "Level1",
    },
    "MEN1": {
        "tier": "Tier2",
        "role": "TSG",
        "pathways": ["histone-methylation", "cell-cycle"],
        "cancer_types": ["MEN1-syndrome", "pancreatic-NET", "parathyroid"],
        "oncokb_level": "Level2",
    },
}


def get_cancer_annotation(gene_symbol: str) -> CancerGeneAnnotation:
    """
    Look up cancer gene context for a given HGNC symbol.
    Returns a CancerGeneAnnotation (is_cancer_gene=False with empty fields
    if the gene is not in the database).
    """
    entry = CANCER_GENE_DB.get(gene_symbol.upper())
    if entry is None:
        return CancerGeneAnnotation(is_cancer_gene=False)

    return CancerGeneAnnotation(
        is_cancer_gene=True,
        cancer_gene_tier=entry.get("tier"),
        pathways=entry.get("pathways", []),
        gene_role=entry.get("role"),
        cancer_types=entry.get("cancer_types", []),
        oncokb_level=entry.get("oncokb_level"),
    )
