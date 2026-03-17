"""
Lightweight RAG engine for the VUS Triage Co-Pilot.

Architecture:
  - 38 curated plain-text snippets about cancer genes and oncology pathways
  - Embedded at module load time with sentence-transformers all-MiniLM-L6-v2
  - Retrieval via cosine similarity over a (N, 384) numpy array (~60 KB)
  - No Chroma, FAISS, or any external vector database required

Usage:
    from rag_engine import retrieve
    snippets = retrieve("BRCA1 splice High Risk HR-repair", top_k=3, gene_filter="BRCA1")
"""

from __future__ import annotations

from typing import Optional
import numpy as np

# ---------------------------------------------------------------------------
# Corpus — 38 curated gene / pathway snippets
# ---------------------------------------------------------------------------

CORPUS: list[dict] = [
    # ── BRCA1 ──────────────────────────────────────────────────────────────
    {
        "id": "brca1-function-001",
        "gene": "BRCA1",
        "pathway": "HR-repair",
        "tags": ["TSG", "function", "nuclear"],
        "text": (
            "BRCA1 (Breast Cancer gene 1) encodes a 1,863-amino-acid nuclear phosphoprotein "
            "that acts as a central scaffold for homologous recombination (HR) DNA repair. "
            "It forms the BRCA1-BARD1 heterodimer via its N-terminal RING domain and coordinates "
            "DNA end-resection through interactions with PALB2–BRCA2 and the MRN complex. "
            "Loss-of-function variants impair HR, causing genomic instability and hypersensitivity "
            "to PARP inhibitors and platinum agents. BRCA1 is a Tier1 tumor suppressor with "
            "Level 1 clinical actionability in breast, ovarian, pancreatic, and prostate cancers."
        ),
    },
    {
        "id": "brca1-splicing-001",
        "gene": "BRCA1",
        "pathway": "HR-repair",
        "tags": ["splicing", "exon-skipping", "VUS"],
        "text": (
            "Splicing variants in BRCA1 are a major source of pathogenic loss-of-function. "
            "Canonical splice-site variants (±1–2 bp from exon-intron boundaries) account for "
            "~10% of all BRCA1 pathogenic variants. Key documented examples: c.594-1G>T (IVS9) "
            "causes exon 10 skipping and frameshift; c.4987-1G>A (IVS16) abolishes the acceptor "
            "for exon 17. Exon 11 (the large central exon) is frequently subject to alternative "
            "splicing in cis variants at its 3′ boundary. ENIGMA classification guidelines require "
            "RNA splicing assay evidence for variants in the ±8 bp splice region before ACMG PS3 "
            "can be applied."
        ),
    },
    # ── BRCA2 ──────────────────────────────────────────────────────────────
    {
        "id": "brca2-function-001",
        "gene": "BRCA2",
        "pathway": "HR-repair",
        "tags": ["TSG", "function", "RAD51"],
        "text": (
            "BRCA2 encodes a 3,418-amino-acid protein that loads RAD51 recombinase onto "
            "single-stranded DNA overhangs during HR repair. Its eight BRC repeats bind RAD51 "
            "monomers, and the OB-fold/tower domain stabilises the RAD51 filament. "
            "Biallelic BRCA2 loss causes Fanconi anemia complementation group D1 (FANCD1). "
            "Monoallelic pathogenic variants confer elevated lifetime risk for breast (~45%), "
            "ovarian (~20%), pancreatic (~6%), and prostate cancers. BRCA2 is a Tier1 TSG with "
            "Level 1 PARP-inhibitor sensitivity."
        ),
    },
    {
        "id": "brca2-splicing-001",
        "gene": "BRCA2",
        "pathway": "HR-repair",
        "tags": ["splicing", "exon-skipping"],
        "text": (
            "Splice-region variants in BRCA2 can cause exon skipping or partial intron retention. "
            "The most studied examples involve exons 7, 11, and 15–16 boundaries. "
            "c.8487+3A>G (IVS18+3) weakens the donor splice signal causing exon 18 partial "
            "retention. The standard donor consensus (GT…AG rule) means intronic +3 to +6 "
            "variants carry moderate splicing risk and require RT-PCR or minigene assays for "
            "classification. BRCA2 exon 11 harbours eight BRC repeats; frameshifting exon-skips "
            "here disrupt RAD51 loading."
        ),
    },
    # ── PALB2 ─────────────────────────────────────────────────────────────
    {
        "id": "palb2-function-001",
        "gene": "PALB2",
        "pathway": "HR-repair",
        "tags": ["TSG", "Fanconi-anemia", "BRCA2-interaction"],
        "text": (
            "PALB2 (Partner and Localiser of BRCA2) bridges BRCA1 and BRCA2 at sites of DNA damage. "
            "Its N-terminal coiled-coil domain binds BRCA1; its C-terminal WD40 domain contacts "
            "BRCA2 and promotes HR. Biallelic PALB2 loss causes Fanconi anemia (FANCN). "
            "Monoallelic pathogenic variants confer a breast cancer lifetime risk of ~35% (similar "
            "to BRCA2 low-penetrance carriers) and elevated pancreatic cancer risk. PALB2 is a "
            "Tier2 gene with Level 2 evidence for PARP-inhibitor sensitivity."
        ),
    },
    # ── ATM ───────────────────────────────────────────────────────────────
    {
        "id": "atm-function-001",
        "gene": "ATM",
        "pathway": "DSB-response",
        "tags": ["TSG", "kinase", "cell-cycle-checkpoint"],
        "text": (
            "ATM (Ataxia-Telangiectasia Mutated) is a serine/threonine kinase activated by "
            "DNA double-strand breaks (DSBs). It phosphorylates ≥900 substrates including H2AX, "
            "CHEK2, BRCA1, and p53 to arrest the cell cycle and initiate HR repair. "
            "Biallelic loss causes ataxia-telangiectasia (A-T). Monoallelic carriers have "
            "moderately elevated breast (~20%), pancreatic, and prostate cancer risks. "
            "ATM is a Tier2 TSG. Olaparib has Level 2 evidence in ATM-deficient prostate cancer."
        ),
    },
    # ── CHEK2 ─────────────────────────────────────────────────────────────
    {
        "id": "chek2-function-001",
        "gene": "CHEK2",
        "pathway": "DSB-response",
        "tags": ["TSG", "kinase", "cell-cycle-checkpoint"],
        "text": (
            "CHEK2 encodes Checkpoint kinase 2 (CHK2), which is phosphorylated by ATM in response "
            "to DSBs. CHK2 phosphorylates CDC25A/C to block S/G2-phase entry and activates TP53. "
            "Recurrent founder variants (c.1100delC, IVS2+1G>A) are associated with moderate "
            "breast (~20–25%) and colorectal cancer risk. CHEK2 c.444+1G>A is a canonical splice "
            "donor variant causing exon 3 skipping; it is classified Pathogenic per ClinVar. "
            "A Tier2 TSG with Level 2 clinical evidence."
        ),
    },
    # ── TP53 ──────────────────────────────────────────────────────────────
    {
        "id": "tp53-function-001",
        "gene": "TP53",
        "pathway": "apoptosis",
        "tags": ["TSG", "transcription-factor", "pan-cancer"],
        "text": (
            "TP53 is the most frequently mutated gene in human cancer (~50% of all tumours). "
            "The p53 protein (393 aa) functions as a tetrameric transcription factor activating "
            "genes for cell-cycle arrest (CDKN1A/p21), apoptosis (BAX, PUMA), and DNA repair. "
            "Its DNA-binding domain (DBD, exons 4–8) is the hotspot for most cancer-associated "
            "missense variants (R175H, R248W/Q, R273H/C, G245S, R249S). "
            "Germline pathogenic variants cause Li-Fraumeni syndrome. TP53 is a Tier1 TSG with "
            "pan-cancer clinical significance."
        ),
    },
    {
        "id": "tp53-splicing-001",
        "gene": "TP53",
        "pathway": "apoptosis",
        "tags": ["splicing", "VUS", "exon-boundary"],
        "text": (
            "TP53 splice-site variants occur across all 11 exons but cluster around the "
            "DBD-encoding exons 4–8 where ~40% of cancer-associated variants reside. "
            "The IARC TP53 Database (R20) documents splicing-affecting variants at nearly "
            "every exon boundary. c.375+1G>A (IVS3+1) causes exon 4 skipping and loss of "
            "the p53 DBD N-terminus. The TP53 SpliceView resource catalogs predicted splice "
            "effects for all synonymous and intronic variants near boundaries. ACMG PS3 "
            "applies when a validated splicing assay confirms aberrant transcript."
        ),
    },
    # ── KRAS ──────────────────────────────────────────────────────────────
    {
        "id": "kras-function-001",
        "gene": "KRAS",
        "pathway": "RAS-MAPK",
        "tags": ["oncogene", "GTPase", "hotspot"],
        "text": (
            "KRAS encodes a small GTPase that cycles between GTP-bound (active) and GDP-bound "
            "(inactive) states, transducing growth factor signals to RAF–MEK–ERK and PI3K–AKT. "
            "Hotspot mutations at codons 12, 13, and 61 impair GTPase activity, locking KRAS "
            "in the active state. KRAS G12C is the most targetable, with sotorasib (Level 1, "
            "NSCLC) and adagrasib (Level 1, NSCLC/CRC) approved. KRAS G12D/V are prevalent in "
            "PDAC (~90%), CRC (~40%), and endometrial cancer. A Tier1 oncogene."
        ),
    },
    # ── BRAF ──────────────────────────────────────────────────────────────
    {
        "id": "braf-function-001",
        "gene": "BRAF",
        "pathway": "RAS-MAPK",
        "tags": ["oncogene", "kinase", "hotspot"],
        "text": (
            "BRAF is a serine/threonine kinase in the RAS–MAPK cascade. The V600E substitution "
            "(>90% of BRAF-mutant melanoma) mimics phosphorylation, constitutively activating "
            "MEK–ERK. Dabrafenib + trametinib (Level 1) is standard for BRAF V600E/K melanoma, "
            "NSCLC, and thyroid cancer. BRAF class II/III fusions (e.g., BRAF::SND1) are "
            "kinase-active but RAS-independent, requiring different therapeutic strategies. "
            "BRAF is a Tier1 oncogene with the highest Level 1 evidence across four tumour types."
        ),
    },
    # ── EGFR ──────────────────────────────────────────────────────────────
    {
        "id": "egfr-function-001",
        "gene": "EGFR",
        "pathway": "RTK-RAS",
        "tags": ["oncogene", "receptor-tyrosine-kinase", "NSCLC"],
        "text": (
            "EGFR (HER1) is a receptor tyrosine kinase that drives RAS–MAPK and PI3K–AKT "
            "signalling upon EGF binding. Activating mutations in the kinase domain (exon 19 "
            "deletions, L858R in exon 21) are the defining oncogenic events in EGFR-mutant NSCLC "
            "(~15% of Western, ~50% of Asian NSCLC). Osimertinib (3rd-gen EGFR TKI) is Level 1 "
            "first-line therapy. Exon 20 insertions confer resistance to 1st/2nd-gen TKIs. "
            "EGFR amplification occurs in glioblastoma and head-and-neck SCC. A Tier1 oncogene."
        ),
    },
    # ── ALK ───────────────────────────────────────────────────────────────
    {
        "id": "alk-function-001",
        "gene": "ALK",
        "pathway": "RTK-RAS",
        "tags": ["oncogene", "fusion", "NSCLC"],
        "text": (
            "ALK (Anaplastic Lymphoma Kinase) is normally expressed in the developing nervous "
            "system. In ~5% of NSCLC, the EML4–ALK fusion (most commonly from inv(2)(p21p23)) "
            "produces a constitutively active kinase. Alectinib (Level 1) is standard first-line "
            "therapy for ALK-rearranged NSCLC with excellent CNS penetration. ALK fusions also "
            "occur in ALCL (NPM1–ALK), inflammatory myofibroblastic tumour, and neuroblastoma. "
            "Point mutations (F1174L, R1275Q) drive neuroblastoma. A Tier1 oncogene."
        ),
    },
    # ── PIK3CA ────────────────────────────────────────────────────────────
    {
        "id": "pik3ca-function-001",
        "gene": "PIK3CA",
        "pathway": "PI3K-AKT",
        "tags": ["oncogene", "lipid-kinase", "hotspot"],
        "text": (
            "PIK3CA encodes the p110α catalytic subunit of PI3Kα, generating PIP3 to activate "
            "AKT–mTOR. Hotspot mutations cluster in the helical (E542K, E545K) and kinase "
            "(H1047R/L) domains, constitutively activating the pathway. PIK3CA mutations are "
            "among the most common across solid tumours (~30% HR+ breast, ~20% colorectal, "
            "~35% cervical). Alpelisib + fulvestrant (Level 1) targets PIK3CA-mutant HR+ "
            "HER2-negative breast cancer. A Tier1 oncogene."
        ),
    },
    # ── PTEN ──────────────────────────────────────────────────────────────
    {
        "id": "pten-function-001",
        "gene": "PTEN",
        "pathway": "PI3K-AKT",
        "tags": ["TSG", "phosphatase", "Cowden"],
        "text": (
            "PTEN is a lipid and protein phosphatase that dephosphorylates PIP3 to PIP2, "
            "directly opposing PI3K and suppressing AKT–mTOR signalling. Germline pathogenic "
            "variants cause Cowden syndrome (macrocephaly, hamartomas, elevated breast/thyroid "
            "cancer risk). Somatic loss is common in endometrial (50%), glioblastoma (35%), and "
            "prostate cancers. PTEN haploinsufficiency is sufficient for tumour promotion. "
            "mTOR inhibitors (everolimus) have Level 2 activity in PTEN-null tumours. Tier1 TSG."
        ),
    },
    {
        "id": "pten-splicing-001",
        "gene": "PTEN",
        "pathway": "PI3K-AKT",
        "tags": ["splicing", "exon-skipping", "VUS"],
        "text": (
            "PTEN splice-site variants are an under-recognised source of Cowden syndrome. "
            "The gene spans 9 exons; variants at exon 3, 5, and 7 boundaries have been reported "
            "to cause exon skipping and truncation of the phosphatase domain (exons 1–6). "
            "c.634+1G>T causes in-frame skipping of exon 6 (49 aa), abolishing catalytic activity. "
            "Canonical splice variants (±1–2 bp) that affect the phosphatase C2 domain junction "
            "are generally classified Pathogenic. RNA evidence is required for ACMG PS3 in the "
            "splice region (±3–8 bp)."
        ),
    },
    # ── MLH1 ──────────────────────────────────────────────────────────────
    {
        "id": "mlh1-function-001",
        "gene": "MLH1",
        "pathway": "MMR",
        "tags": ["TSG", "mismatch-repair", "Lynch"],
        "text": (
            "MLH1 encodes MutL homolog 1, an essential component of the post-replicative mismatch "
            "repair (MMR) complex. MLH1 forms heterodimers with PMS2 (MutLα) to nick the "
            "daughter strand at MMR-identified mismatches. Biallelic MMR loss causes microsatellite "
            "instability (MSI-H) and constitutive MMR deficiency (CMMRD) syndrome. Monoallelic "
            "germline variants cause Lynch syndrome with up to 80% lifetime CRC risk and 60% "
            "endometrial cancer risk. MLH1 promoter hypermethylation causes sporadic MSI-H CRC. "
            "MMR-deficient tumours respond to pembrolizumab (Level 1, pan-tumour). Tier1 TSG."
        ),
    },
    {
        "id": "mlh1-splicing-001",
        "gene": "MLH1",
        "pathway": "MMR",
        "tags": ["splicing", "exon-skipping", "Lynch"],
        "text": (
            "MLH1 splice-site and deep intronic variants account for ~15% of Lynch syndrome "
            "pathogenic variants. The InSiGHT database documents canonical splice variants at "
            "all 19 exon boundaries. c.1039-1G>A causes exon 12 skipping and a premature stop. "
            "c.677+3A>T (IVS8+3) reduces donor splice efficiency by ~80% and causes partial "
            "intron 8 retention. Exonic variants near the 5' splice site (positions +4 to +6) "
            "in MLH1 have well-documented splicing effects. RNA analysis is strongly recommended "
            "for variants within ±8 bp of all boundaries before ACMG classification."
        ),
    },
    # ── MSH2 ──────────────────────────────────────────────────────────────
    {
        "id": "msh2-function-001",
        "gene": "MSH2",
        "pathway": "MMR",
        "tags": ["TSG", "mismatch-repair", "Lynch"],
        "text": (
            "MSH2 encodes MutS homolog 2, which forms MutSα (with MSH6) and MutSβ (with MSH3) "
            "heterodimers that recognise base-base mismatches and small insertion-deletion loops. "
            "Germline pathogenic variants in MSH2 are the second most common cause of Lynch "
            "syndrome after MLH1. A recurrent large deletion (del exons 1–6) is caused by an "
            "Alu-mediated rearrangement. MSH2 loss is confirmed by IHC showing absent MSH2 and "
            "MSH6 staining. Tier1 TSG with Level 1 evidence for checkpoint inhibitor sensitivity."
        ),
    },
    # ── MSH6 ──────────────────────────────────────────────────────────────
    {
        "id": "msh6-function-001",
        "gene": "MSH6",
        "pathway": "MMR",
        "tags": ["TSG", "mismatch-repair", "Lynch"],
        "text": (
            "MSH6 encodes MutS homolog 6, which forms the MutSα heterodimer with MSH2 to "
            "recognise single base-base mismatches. MSH6 germline variants cause Lynch syndrome "
            "with a later age of onset (~50 years) and lower penetrance than MLH1/MSH2, particularly "
            "for CRC. Endometrial cancer risk is ~44% by age 70. MSH6 has a repetitive C8 run "
            "in exon 4 prone to somatic frameshift in MSH6-proficient tumours. IHC loss of MSH6 "
            "alone (MSH2 retained) suggests primary MSH6 deficiency. Tier1 TSG."
        ),
    },
    # ── PMS2 ──────────────────────────────────────────────────────────────
    {
        "id": "pms2-function-001",
        "gene": "PMS2",
        "pathway": "MMR",
        "tags": ["TSG", "mismatch-repair", "Lynch"],
        "text": (
            "PMS2 (Postmeiotic Segregation Increased 2) forms MutLα with MLH1 and is required "
            "for nicking the unmethylated strand during MMR. Germline PMS2 pathogenic variants "
            "cause Lynch syndrome with lower penetrance than MLH1/MSH2. Biallelic PMS2 variants "
            "cause CMMRD. Classification is complicated by multiple PMS2 pseudogenes (PMS2CL) "
            "that share >98% sequence identity with exons 11–15; long-read sequencing or "
            "gene-specific assays are required for accurate variant calling in this region. Tier1 TSG."
        ),
    },
    # ── VHL ───────────────────────────────────────────────────────────────
    {
        "id": "vhl-function-001",
        "gene": "VHL",
        "pathway": "HIF-hypoxia",
        "tags": ["TSG", "E3-ligase", "ccRCC"],
        "text": (
            "VHL encodes the substrate-recognition subunit of the CRL2-VHL E3 ubiquitin ligase, "
            "which targets HIF-1α/2α for proteasomal degradation under normoxia. VHL loss "
            "stabilises HIF, driving angiogenesis (VEGF), erythropoiesis (EPO), and glycolysis. "
            "Germline VHL variants cause VHL disease with clear-cell RCC, CNS/retinal "
            "hemangioblastomas, and pheochromocytoma. Somatic loss is near-universal in sporadic "
            "ccRCC. VEGFR inhibitors (sunitinib, cabozantinib) and belzutifan (HIF-2α inhibitor, "
            "Level 1) are approved for VHL-mutant ccRCC. Tier1 TSG."
        ),
    },
    # ── APC ───────────────────────────────────────────────────────────────
    {
        "id": "apc-function-001",
        "gene": "APC",
        "pathway": "WNT-beta-catenin",
        "tags": ["TSG", "polyposis", "colorectal"],
        "text": (
            "APC is the gatekeeper tumour suppressor of colorectal cancer, encoding a large "
            "scaffold protein that forms the β-catenin destruction complex with AXIN1/2 and "
            "GSK3β. Loss of APC stabilises β-catenin, activating WNT target genes (MYC, CCND1). "
            "Germline pathogenic APC variants cause Familial Adenomatous Polyposis (FAP) and "
            "attenuated FAP (AFAP). Most sporadic CRCs carry biallelic somatic APC mutations. "
            "Somatic variants cluster in the 'mutation cluster region' (codons 1286–1513). Tier1 TSG."
        ),
    },
    # ── NF1 ───────────────────────────────────────────────────────────────
    {
        "id": "nf1-function-001",
        "gene": "NF1",
        "pathway": "RAS-MAPK",
        "tags": ["TSG", "RAS-GAP", "neurofibromatosis"],
        "text": (
            "NF1 encodes neurofibromin, a Ras GTPase-activating protein (RasGAP) that accelerates "
            "RAS-GTP hydrolysis, keeping RAS signalling in check. NF1 loss leads to sustained "
            "RAS-MAPK activity. Germline pathogenic variants cause Neurofibromatosis type 1 "
            "(NF1): café-au-lait macules, neurofibromas, Lisch nodules, and elevated MPNST, optic "
            "glioma, and leukaemia risk. Somatic NF1 loss is an acquired resistance mechanism "
            "in EGFR-mutant NSCLC and MEK-inhibitor treated melanoma. Selumetinib (Level 1) is "
            "approved for NF1-related plexiform neurofibromas. Tier1 TSG."
        ),
    },
    # ── RB1 ───────────────────────────────────────────────────────────────
    {
        "id": "rb1-function-001",
        "gene": "RB1",
        "pathway": "cell-cycle",
        "tags": ["TSG", "E2F-regulation", "retinoblastoma"],
        "text": (
            "RB1 encodes the retinoblastoma protein pRb, a transcriptional repressor that "
            "restrains E2F-dependent S-phase gene expression. In G1, CDK4/6–Cyclin D phosphorylates "
            "pRb, releasing E2F and allowing cell-cycle progression. Germline RB1 pathogenic "
            "variants cause hereditary retinoblastoma (bilateral, early onset). Somatic RB1 loss "
            "occurs in osteosarcoma (~70%), SCLC (~90%), bladder (~30%), and ER+ breast cancers. "
            "RB1 loss is a predictor of CDK4/6-inhibitor resistance and poor prognosis. Tier1 TSG."
        ),
    },
    # ── CDH1 ──────────────────────────────────────────────────────────────
    {
        "id": "cdh1-function-001",
        "gene": "CDH1",
        "pathway": "cell-adhesion",
        "tags": ["TSG", "E-cadherin", "HDGC"],
        "text": (
            "CDH1 encodes E-cadherin, the transmembrane glycoprotein that mediates "
            "calcium-dependent epithelial cell adhesion via its extracellular domain and "
            "anchors to the cytoskeleton via β-catenin. CDH1 loss induces epithelial-mesenchymal "
            "transition (EMT). Germline pathogenic variants cause Hereditary Diffuse Gastric "
            "Cancer (HDGC, lifetime risk ~70%) and lobular breast cancer (~40%). "
            "Prophylactic total gastrectomy is recommended for CDH1 carriers. Somatic silencing "
            "via promoter methylation is common in lobular breast and gastric cancers. Tier1 TSG."
        ),
    },
    # ── STK11 ─────────────────────────────────────────────────────────────
    {
        "id": "stk11-function-001",
        "gene": "STK11",
        "pathway": "AMPK-mTOR",
        "tags": ["TSG", "kinase", "Peutz-Jeghers"],
        "text": (
            "STK11 (LKB1) is a serine/threonine kinase that activates AMPK to inhibit mTOR "
            "under low-energy conditions and regulates cell polarity. Germline pathogenic "
            "variants cause Peutz-Jeghers syndrome with hamartomatous polyps and elevated "
            "GI, pancreatic, and gynecologic cancer risk. Somatic STK11 loss occurs in ~15% "
            "of NSCLC (often with KRAS co-mutation) and is associated with immune-cold tumours "
            "unresponsive to PD-1 blockade. STK11 exons 1–7 are targets for splicing-disrupting "
            "variants; exon 6 encodes the catalytic kinase domain. Tier1 TSG."
        ),
    },
    # ── MEN1 ──────────────────────────────────────────────────────────────
    {
        "id": "men1-function-001",
        "gene": "MEN1",
        "pathway": "histone-methylation",
        "tags": ["TSG", "menin", "MEN1-syndrome"],
        "text": (
            "MEN1 encodes menin, a nuclear scaffold protein that is a subunit of the "
            "MLL3/MLL4 histone H3K4 methyltransferase complexes. Menin regulates gene "
            "expression including cyclin-dependent kinase inhibitors (CDKN1B/p27, CDKN2C/p18). "
            "Germline pathogenic variants cause Multiple Endocrine Neoplasia type 1 (MEN1) "
            "with parathyroid adenomas, pituitary adenomas, and pancreatic NETs. Menin inhibitors "
            "(ziftomenib, revumenib) are in clinical trials for MLL-rearranged AML. Tier2 TSG."
        ),
    },
    # ── CDK4 ──────────────────────────────────────────────────────────────
    {
        "id": "cdk4-function-001",
        "gene": "CDK4",
        "pathway": "cell-cycle",
        "tags": ["oncogene", "kinase", "CDK4/6-RB"],
        "text": (
            "CDK4 (Cyclin-dependent kinase 4) pairs with Cyclin D1/2/3 to phosphorylate RB1 "
            "and drive G1-to-S transition. CDK4 R24C/H abolishes binding to the p16INK4a "
            "inhibitor, causing susceptibility to familial melanoma (FAMMM). CDK4 amplification "
            "occurs in liposarcoma (~90% of well-differentiated/dedifferentiated subtypes) and "
            "glioma. Palbociclib, ribociclib, abemaciclib (CDK4/6 inhibitors) are Level 1 for "
            "HR+ HER2-negative advanced breast cancer. CDK4 R24C/H is a Tier1 oncogenic variant. Tier1."
        ),
    },
    # ── Pathway summaries ─────────────────────────────────────────────────
    {
        "id": "pathway-hr-repair-001",
        "gene": None,
        "pathway": "HR-repair",
        "tags": ["pathway", "summary", "DDR"],
        "text": (
            "Homologous recombination (HR) is the high-fidelity DSB repair pathway active in "
            "S/G2 phases. Key players: MRN complex (MRE11-RAD50-NBS1) for end sensing and ATM "
            "activation; BRCA1–PALB2–BRCA2 for RAD51 loading; RAD51 paralogues (RAD51C, RAD51D, "
            "BRCA2, PALB2) for filament stabilisation. HR deficiency (HRD) is characterised by "
            "genomic scar signatures (SBS3, ID6) and elevated HRD score. HRD tumours are "
            "sensitive to PARP inhibitors (olaparib, niraparib, rucaparib) and platinum. "
            "Combined BRCA1/2 + RAD51 paralog panel testing captures the majority of HRD aetiology."
        ),
    },
    {
        "id": "pathway-ras-mapk-001",
        "gene": None,
        "pathway": "RAS-MAPK",
        "tags": ["pathway", "summary", "signalling"],
        "text": (
            "The RAS–MAPK cascade (RAS→RAF→MEK→ERK) is the central proliferative signalling "
            "axis mutated in ~30% of human cancers. RAS (KRAS, NRAS, HRAS) activates RAF "
            "(BRAF, CRAF), which phosphorylates MEK1/2, which phosphorylates ERK1/2. ERK drives "
            "transcription of pro-proliferative genes (ELK1, ETS, MYC). Key therapeutic targets: "
            "KRAS G12C (sotorasib, adagrasib), BRAF V600 (dabrafenib + trametinib), MEK "
            "(trametinib, binimetinib), ERK (ulixertinib). Co-mutation with PI3K and loss of "
            "NF1/PTEN confers innate resistance to MAPK inhibitors."
        ),
    },
    {
        "id": "pathway-mmr-001",
        "gene": None,
        "pathway": "MMR",
        "tags": ["pathway", "summary", "Lynch", "MSI"],
        "text": (
            "Mismatch repair (MMR) corrects base-base mismatches and small indels after "
            "replication using four core proteins: MLH1, MSH2, MSH6, PMS2. Deficiency causes "
            "microsatellite instability (MSI-H) and elevated tumour mutational burden (TMB). "
            "MMR-deficient tumours accumulate frameshifted neoantigens and respond to PD-1 "
            "checkpoint inhibitors (pembrolizumab, Level 1, pan-tumour). Lynch syndrome genes "
            "are routinely tested via IHC (4-plex: MLH1, MSH2, MSH6, PMS2) and confirmed with "
            "germline sequencing. MLH1 promoter methylation should be excluded before reporting "
            "somatic MMR loss as Lynch-suspicious."
        ),
    },
    {
        "id": "pathway-pi3k-akt-001",
        "gene": None,
        "pathway": "PI3K-AKT",
        "tags": ["pathway", "summary", "signalling"],
        "text": (
            "The PI3K–AKT–mTOR pathway is activated by growth factor RTKs (EGFR, HER2, MET) "
            "via RAS or direct PI3K recruitment. PI3Kα (PIK3CA) generates PIP3, recruiting "
            "AKT to the membrane via its PH domain. AKT phosphorylates >100 substrates including "
            "TSC2 (mTOR activation), FOXO (survival), GSK3β (glycogen synthesis). PTEN is the "
            "major negative regulator. Therapeutic agents: alpelisib (PI3Kα), capivasertib "
            "(AKT), everolimus/temsirolimus (mTORC1). Resistance via RAS mutation or PTEN loss "
            "frequently limits single-agent PI3K/AKT inhibitor activity."
        ),
    },
    {
        "id": "pathway-apoptosis-001",
        "gene": None,
        "pathway": "apoptosis",
        "tags": ["pathway", "summary", "p53"],
        "text": (
            "Apoptosis is triggered via intrinsic (BCL2 family, mitochondria) and extrinsic "
            "(death receptor) pathways. TP53 is the master regulator: upon DNA damage, p53 "
            "activates pro-apoptotic genes (PUMA, BAX, NOXA) and represses anti-apoptotic BCL2. "
            "TP53 mutation causes resistance to genotoxic chemotherapy. BCL2 overexpression "
            "(follicular lymphoma t(14;18)) is targeted by venetoclax (Level 1). MDM2 amplification "
            "degrades p53 and is targeted by MDM2 inhibitors (navtemadlin, in trials). p53 "
            "restoration strategies and PRIMA-1 analogues (APR-246) aim to reactivate TP53 "
            "missense mutants with residual folding capacity."
        ),
    },
    {
        "id": "pathway-wnt-001",
        "gene": None,
        "pathway": "WNT-beta-catenin",
        "tags": ["pathway", "summary", "APC", "colorectal"],
        "text": (
            "The canonical WNT–β-catenin pathway controls stemness and proliferation. In the "
            "absence of WNT, the destruction complex (APC–AXIN–GSK3β–CK1) phosphorylates β-catenin "
            "for proteasomal degradation. WNT ligand binding inhibits the complex, allowing "
            "β-catenin to translocate and activate TCF/LEF targets (MYC, CCND1, LGR5). APC loss "
            "is the initiating event in ~80% of CRC. CTNNB1 (β-catenin) gain-of-function mutations "
            "occur in desmoid fibromatosis, hepatoblastoma, and endometrial cancer. Porcupine "
            "inhibitors (WNT974) are in early trials targeting WNT-dependent tumours."
        ),
    },
    {
        "id": "pathway-cell-cycle-001",
        "gene": None,
        "pathway": "cell-cycle",
        "tags": ["pathway", "summary", "CDK", "RB1"],
        "text": (
            "The mammalian cell cycle is driven by CDK–Cyclin complexes: CDK4/6–CycD (G1 entry), "
            "CDK2–CycE (G1/S), CDK2–CycA (S phase), CDK1–CycB (M phase). RB1 phosphorylation "
            "by CDK4/6 releases E2F transcription factors that drive S-phase gene expression. "
            "p16INK4a (CDKN2A) inhibits CDK4/6; p21CIP1/WAF1 (CDKN1A) inhibits CDK2/4 in "
            "response to p53 activation. CDK4/6 inhibitors (palbociclib, ribociclib, abemaciclib) "
            "are Level 1 for HR+ breast cancer. CDK4/6 inhibitor resistance often involves "
            "RB1 loss, CDK2 upregulation, or Cyclin E amplification."
        ),
    },
    {
        "id": "pathway-hif-hypoxia-001",
        "gene": None,
        "pathway": "HIF-hypoxia",
        "tags": ["pathway", "summary", "VHL", "VEGF"],
        "text": (
            "Under normoxia, HIF-1α/2α are hydroxylated by PHDs, recognised by VHL–CRL2, "
            "ubiquitinated, and degraded. Under hypoxia (or VHL loss), HIF accumulates and "
            "drives transcription of VEGFA, EPO, GLUT1, and carbonic anhydrase IX, promoting "
            "angiogenesis and metabolic reprogramming. VHL-mutant clear-cell RCC has constitutive "
            "HIF-2α activity targetable by belzutifan (HIF-2α inhibitor, Level 1). Anti-VEGF/R "
            "agents (bevacizumab, sunitinib, cabozantinib) exploit VHL-driven VEGF dependence. "
            "HIF pathway activation also occurs via EPAS1 (HIF-2α) mutations in ccRCC."
        ),
    },
    # ── ACMG / VUS classification guidance ────────────────────────────────
    {
        "id": "acmg-splicing-criteria-001",
        "gene": None,
        "pathway": None,
        "tags": ["ACMG", "classification", "splicing", "PS3", "BP4"],
        "text": (
            "ACMG/AMP 2015 criteria for splice variants: PVS1 (null variant) applies when a "
            "canonical splice-site variant (±1–2 bp) is predicted to cause loss-of-function. "
            "PP3 applies when in-silico predictors (SpliceAI delta score ≥0.2, MaxEntScan) "
            "support splice impact. PS3 requires a validated functional splicing assay (RT-PCR, "
            "minigene, or RNA-seq). BP4 applies when multiple predictors suggest no impact. "
            "For intronic variants ±3–8 bp: PP3 alone is insufficient; PS3 (RNA evidence) upgrades "
            "to Likely Pathogenic when combined with PS1/PM1. InSiGHT, ENIGMA, and gene-specific "
            "expert panels have developed adapted rules superseding standard ACMG criteria."
        ),
    },
    {
        "id": "acmg-vus-general-001",
        "gene": None,
        "pathway": None,
        "tags": ["ACMG", "VUS", "classification", "general"],
        "text": (
            "Variants of Uncertain Significance (VUS) arise when evidence for or against "
            "pathogenicity is insufficient or conflicting. Key triage priorities: (1) segregation "
            "analysis in affected relatives (PS4/co-segregation); (2) orthogonal functional "
            "evidence (PS3/BS3); (3) case-control allele frequency data (PM2/BS1/BA1); "
            "(4) in-silico predictions as supporting evidence only (PP3/BP4). Computational tools "
            "(Evo2 delta-likelihood, SpliceAI, CADD, REVEL) provide PP3/BP4-level evidence. "
            "A molecular tumour board integrates multidisciplinary expertise to adjudicate VUS "
            "in the context of the patient's personal and family history."
        ),
    },
]


# ---------------------------------------------------------------------------
# Lazy-loaded embedding state
# ---------------------------------------------------------------------------

_model = None
_corpus_embeddings: np.ndarray | None = None  # shape (N, 384)


def _load() -> None:
    """Initialise sentence-transformers model and embed the corpus once."""
    global _model, _corpus_embeddings
    if _model is None:
        from sentence_transformers import SentenceTransformer

        _model = SentenceTransformer("all-MiniLM-L6-v2")
        texts = [doc["text"] for doc in CORPUS]
        _corpus_embeddings = _model.encode(texts, normalize_embeddings=True)


# ---------------------------------------------------------------------------
# Public retrieval API
# ---------------------------------------------------------------------------

def retrieve(
    query: str,
    top_k: int = 3,
    gene_filter: Optional[str] = None,
) -> list[str]:
    """
    Return the top-k most relevant snippet texts for a query.

    Parameters
    ----------
    query : str
        Free-text query constructed from gene symbol, splice risk, and pathway tags.
    top_k : int
        Number of snippets to return.
    gene_filter : str, optional
        If provided, first attempt retrieval from snippets tagged with this gene.
        Falls back to full corpus if fewer than top_k gene-specific results exist.

    Returns
    -------
    list[str]
        Ordered list of retrieved snippet texts (most relevant first).
    """
    _load()
    assert _model is not None and _corpus_embeddings is not None

    query_emb = _model.encode([query], normalize_embeddings=True)  # (1, 384)
    scores = (_corpus_embeddings @ query_emb.T).squeeze()          # (N,)

    if gene_filter:
        gene_upper = gene_filter.upper()
        gene_indices = [
            i for i, doc in enumerate(CORPUS)
            if doc.get("gene") and doc["gene"].upper() == gene_upper
        ]
        if len(gene_indices) >= top_k:
            gene_scores = scores[gene_indices]
            top_local = np.argsort(gene_scores)[::-1][:top_k]
            return [CORPUS[gene_indices[i]]["text"] for i in top_local]

    top_indices = np.argsort(scores)[::-1][:top_k]
    return [CORPUS[int(i)]["text"] for i in top_indices]


def retrieve_with_ids(
    query: str,
    top_k: int = 3,
    gene_filter: Optional[str] = None,
) -> list[dict]:
    """
    Same as retrieve() but returns dicts with 'id', 'text', and 'score' keys.
    Useful for debugging and citation tracking.
    """
    _load()
    assert _model is not None and _corpus_embeddings is not None

    query_emb = _model.encode([query], normalize_embeddings=True)
    scores = (_corpus_embeddings @ query_emb.T).squeeze()

    if gene_filter:
        gene_upper = gene_filter.upper()
        gene_indices = [
            i for i, doc in enumerate(CORPUS)
            if doc.get("gene") and doc["gene"].upper() == gene_upper
        ]
        if len(gene_indices) >= top_k:
            gene_scores = scores[gene_indices]
            top_local = np.argsort(gene_scores)[::-1][:top_k]
            return [
                {
                    "id": CORPUS[gene_indices[i]]["id"],
                    "text": CORPUS[gene_indices[i]]["text"],
                    "score": float(gene_scores[top_local[j]]),
                }
                for j, i in enumerate(top_local)
            ]

    top_indices = np.argsort(scores)[::-1][:top_k]
    return [
        {
            "id": CORPUS[int(i)]["id"],
            "text": CORPUS[int(i)]["text"],
            "score": float(scores[int(i)]),
        }
        for i in top_indices
    ]
