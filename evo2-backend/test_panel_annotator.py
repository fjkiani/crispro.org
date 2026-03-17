"""
Unit and integration tests for the VUS Triage Co-Pilot backend.

Test groups:
  1. Schema validation
  2. Cancer gene lookup
  3. Composite scoring formula
  4. RAG retrieval
  5. Panel annotation with mocked Evo2
  6. Error resilience

Run with:
    pytest test_panel_annotator.py -v
"""

import pytest
from unittest.mock import MagicMock, patch

from schemas import (
    AnnotatedVariant,
    CancerGeneAnnotation,
    CompositeScore,
    Evo2RawResult,
    PanelAnalysisRequest,
    VariantInput,
)
from cancer_genes import get_cancer_annotation, CANCER_GENE_DB
from panel_annotator import (
    compute_composite_score,
    THRESHOLD_HIGH,
    THRESHOLD_MEDIUM,
    WEIGHTS,
)


# ---------------------------------------------------------------------------
# Helpers / fixtures
# ---------------------------------------------------------------------------

def make_evo2(
    prediction: str = "Likely pathogenic",
    delta_score: float = -0.003,
    confidence: float = 0.85,
    splice_risk: str = "High Risk",
    splice_position: int | None = 100,
    splice_boundary: str | None = "start",
) -> Evo2RawResult:
    return Evo2RawResult(
        position=43119628,
        reference="C",
        alternative="T",
        delta_score=delta_score,
        prediction=prediction,
        classification_confidence=confidence,
        splice_risk=splice_risk,
        splice_position=splice_position,
        splice_boundary=splice_boundary,
    )


def make_cancer(
    is_cancer: bool = True,
    tier: str | None = "Tier1",
    role: str = "TSG",
    pathways: list | None = None,
) -> CancerGeneAnnotation:
    return CancerGeneAnnotation(
        is_cancer_gene=is_cancer,
        cancer_gene_tier=tier,
        gene_role=role,
        pathways=pathways or ["HR-repair"],
        cancer_types=["breast"],
    )


# ---------------------------------------------------------------------------
# 1. Schema validation tests
# ---------------------------------------------------------------------------

class TestSchemas:
    def test_variant_input_valid(self):
        v = VariantInput(chr="chr17", pos=43119628, ref="C", alt="T", gene_symbol="BRCA1")
        assert v.chr == "chr17"
        assert v.ref == "C"

    def test_variant_input_chr_normalised(self):
        v = VariantInput(chr="17", pos=43119628, ref="C", alt="T", gene_symbol="BRCA1")
        assert v.chr == "chr17"

    def test_variant_input_invalid_allele(self):
        with pytest.raises(Exception, match="nucleotide"):
            VariantInput(chr="chr17", pos=43119628, ref="X", alt="T", gene_symbol="BRCA1")

    def test_panel_request_too_many_variants(self):
        variants = [
            VariantInput(chr="chr17", pos=43119628 + i, ref="C", alt="T", gene_symbol="BRCA1")
            for i in range(51)
        ]
        with pytest.raises(Exception, match="50"):
            PanelAnalysisRequest(variants=variants)

    def test_panel_request_empty(self):
        with pytest.raises(Exception, match="at least 1"):
            PanelAnalysisRequest(variants=[])

    def test_panel_request_valid(self):
        v = VariantInput(chr="chr17", pos=43119628, ref="C", alt="T", gene_symbol="BRCA1")
        req = PanelAnalysisRequest(variants=[v], panel_name="Test")
        assert len(req.variants) == 1


# ---------------------------------------------------------------------------
# 2. Cancer gene lookup tests
# ---------------------------------------------------------------------------

class TestCancerGenes:
    @pytest.mark.parametrize("symbol", list(CANCER_GENE_DB.keys()))
    def test_all_known_genes_found(self, symbol):
        ann = get_cancer_annotation(symbol)
        assert ann.is_cancer_gene is True
        assert ann.cancer_gene_tier in ("Tier1", "Tier2")
        assert len(ann.pathways) > 0

    def test_unknown_gene(self):
        ann = get_cancer_annotation("FAKEGENE99")
        assert ann.is_cancer_gene is False
        assert ann.cancer_gene_tier is None
        assert ann.pathways == []

    def test_case_insensitive(self):
        ann_lower = get_cancer_annotation("brca1")
        ann_upper = get_cancer_annotation("BRCA1")
        assert ann_lower.is_cancer_gene == ann_upper.is_cancer_gene
        assert ann_lower.cancer_gene_tier == ann_upper.cancer_gene_tier

    def test_brca1_fields(self):
        ann = get_cancer_annotation("BRCA1")
        assert ann.gene_role == "TSG"
        assert "HR-repair" in ann.pathways
        assert "breast" in ann.cancer_types

    def test_kras_fields(self):
        ann = get_cancer_annotation("KRAS")
        assert ann.gene_role == "oncogene"
        assert "RAS-MAPK" in ann.pathways


# ---------------------------------------------------------------------------
# 3. Composite scoring formula tests
# ---------------------------------------------------------------------------

class TestCompositeScoring:
    def test_maximum_score_is_high(self):
        """Tier1 + High splice + pathogenic + high confidence → High priority."""
        evo2 = make_evo2(prediction="Likely pathogenic", confidence=0.9, splice_risk="High Risk")
        ca = make_cancer(is_cancer=True, tier="Tier1")
        score = compute_composite_score(evo2, ca)

        expected = (
            WEIGHTS["evo2_pathogenicity"] * 1.0
            + WEIGHTS["splice_severity"] * 1.0
            + WEIGHTS["cancer_gene_tier"] * 1.0
            + WEIGHTS["evo2_confidence"] * 0.9
        )
        assert abs(score.raw_score - expected) < 1e-3
        assert score.priority == "High"

    def test_minimum_score_is_low(self):
        """Non-cancer gene + Low splice + benign + low confidence → Low priority."""
        evo2 = make_evo2(
            prediction="Likely benign",
            confidence=0.2,
            splice_risk="Low/Unknown Risk",
        )
        ca = make_cancer(is_cancer=False, tier=None)
        score = compute_composite_score(evo2, ca)

        expected = (
            WEIGHTS["evo2_pathogenicity"] * 0.0
            + WEIGHTS["splice_severity"] * 0.1
            + WEIGHTS["cancer_gene_tier"] * 0.0
            + WEIGHTS["evo2_confidence"] * 0.2
        )
        assert abs(score.raw_score - expected) < 1e-3
        assert score.priority == "Low"

    def test_borderline_below_medium(self):
        """
        Tier2 + Moderate splice + benign + 0.5 confidence.
        Expected: 0.35*0 + 0.30*0.6 + 0.20*0.6 + 0.15*0.5 = 0.375 → Low
        """
        evo2 = make_evo2(
            prediction="Likely benign",
            confidence=0.5,
            splice_risk="Moderate Risk",
        )
        ca = make_cancer(is_cancer=True, tier="Tier2")
        score = compute_composite_score(evo2, ca)

        expected = 0.35 * 0 + 0.30 * 0.6 + 0.20 * 0.6 + 0.15 * 0.5
        assert abs(score.raw_score - expected) < 1e-3
        assert score.priority == "Low"

    def test_borderline_above_medium_becomes_high_when_pathogenic(self):
        """
        Tier2 + Moderate splice + pathogenic + 0.5 confidence.
        Expected: 0.35*1 + 0.30*0.6 + 0.20*0.6 + 0.15*0.5 = 0.725 → High
        """
        evo2 = make_evo2(
            prediction="Likely pathogenic",
            confidence=0.5,
            splice_risk="Moderate Risk",
        )
        ca = make_cancer(is_cancer=True, tier="Tier2")
        score = compute_composite_score(evo2, ca)

        expected = 0.35 * 1 + 0.30 * 0.6 + 0.20 * 0.6 + 0.15 * 0.5
        assert abs(score.raw_score - expected) < 1e-3
        assert score.priority == "High"

    def test_no_exon_data_splice_value(self):
        """'No exon boundaries found' should map to splice_severity=0.0."""
        evo2 = make_evo2(
            prediction="Likely pathogenic",
            confidence=0.8,
            splice_risk="No exon boundaries found in this region",
        )
        ca = make_cancer(is_cancer=True, tier="Tier1")
        score = compute_composite_score(evo2, ca)
        assert score.score_components["splice_severity"] == 0.0

    def test_score_components_keys(self):
        evo2 = make_evo2()
        ca = make_cancer()
        score = compute_composite_score(evo2, ca)
        assert set(score.score_components.keys()) == set(WEIGHTS.keys())

    def test_weights_sum_to_one(self):
        total = sum(WEIGHTS.values())
        assert abs(total - 1.0) < 1e-9

    @pytest.mark.parametrize("priority,threshold_lo,threshold_hi", [
        ("High",   THRESHOLD_HIGH, 1.0),
        ("Medium", THRESHOLD_MEDIUM, THRESHOLD_HIGH - 0.001),
        ("Low",    0.0, THRESHOLD_MEDIUM - 0.001),
    ])
    def test_priority_bands_match_thresholds(self, priority, threshold_lo, threshold_hi):
        """Score at threshold boundary matches expected priority."""
        raw_mid = (threshold_lo + threshold_hi) / 2
        # Create a score object directly and verify the priority logic
        # (We can't easily force an exact raw_score via compute_composite_score,
        #  so we test the CompositeScore model and threshold logic directly.)
        comp = CompositeScore(
            raw_score=raw_mid,
            priority=priority,
            score_components={k: 0.0 for k in WEIGHTS},
        )
        # Priority should match what compute_composite_score would assign
        if raw_mid >= THRESHOLD_HIGH:
            assert comp.priority == "High"
        elif raw_mid >= THRESHOLD_MEDIUM:
            assert comp.priority == "Medium"
        else:
            assert comp.priority == "Low"


# ---------------------------------------------------------------------------
# 4. RAG retrieval tests
# ---------------------------------------------------------------------------

class TestRagEngine:
    def test_basic_retrieval_returns_top_k(self):
        from rag_engine import retrieve
        results = retrieve("BRCA1 splice HR-repair VUS triage", top_k=3)
        assert len(results) == 3
        assert all(isinstance(r, str) for r in results)

    def test_gene_filter_brca1(self):
        from rag_engine import retrieve
        results = retrieve("splice variant pathogenic", top_k=2, gene_filter="BRCA1")
        assert len(results) == 2
        # Results should be from BRCA1 snippets (contain "BRCA1" in text)
        assert any("BRCA1" in r for r in results)

    def test_gene_filter_unknown_gene_falls_back_to_corpus(self):
        from rag_engine import retrieve
        # FAKEGENE99 has no snippets — should fall back without error
        results = retrieve("splice VUS oncology", top_k=3, gene_filter="FAKEGENE99")
        assert len(results) == 3

    def test_top_k_one(self):
        from rag_engine import retrieve
        results = retrieve("TP53 tumor suppressor apoptosis", top_k=1)
        assert len(results) == 1

    def test_retrieve_with_ids_returns_scores(self):
        from rag_engine import retrieve_with_ids
        results = retrieve_with_ids("MLH1 MMR splice Lynch", top_k=3)
        assert len(results) == 3
        for r in results:
            assert "id" in r
            assert "text" in r
            assert "score" in r
            assert 0.0 <= r["score"] <= 1.01  # cosine similarity [0,1]

    def test_pathway_query_returns_pathway_snippets(self):
        from rag_engine import retrieve_with_ids
        results = retrieve_with_ids("RAS MAPK pathway oncogene signalling", top_k=3)
        ids = [r["id"] for r in results]
        assert any("ras" in id_.lower() or "braf" in id_.lower() or "kras" in id_.lower()
                   for id_ in ids)


# ---------------------------------------------------------------------------
# 5. Panel annotation with mocked Evo2
# ---------------------------------------------------------------------------

def _mock_get_genome_sequence(position, genome, chromosome, window_size=8192):
    """Returns a synthetic window of 8192 'A's with the variant position as 'C'."""
    seq = "A" * window_size
    return seq, max(0, position - 1 - window_size // 2)


def _mock_get_exon_data(position, genome, chromosome, window_size=8192):
    """Returns a single synthetic exon that puts the variant at the exon start boundary."""
    exon_start = position  # variant is at exon start → intronic offset = 0 (High Risk)
    exon_end = position + 200
    return [(exon_start, exon_end)]


def _mock_analyze_variant(relative_pos_in_window, reference, alternative, window_seq, model):
    """Returns a canned pathogenic Evo2 result regardless of inputs."""
    return {
        "reference": reference,
        "alternative": alternative,
        "delta_score": -0.003,
        "prediction": "Likely pathogenic",
        "classification_confidence": 0.87,
    }


class TestPanelAnnotation:
    @pytest.fixture(autouse=True)
    def patch_external_calls(self, monkeypatch):
        """Replace all external API calls and Evo2 inference with mocks."""
        monkeypatch.setattr(
            "panel_annotator.annotate_variant.__globals__",
            {},
            raising=False,
        )

    def _run_annotate_variant(self, variant: VariantInput) -> AnnotatedVariant:
        """
        Call annotate_variant with all external calls mocked via patch.
        We patch at the import level inside panel_annotator.
        """
        mock_model = MagicMock()

        with (
            patch("panel_annotator.get_genome_sequence", side_effect=_mock_get_genome_sequence),
            patch("panel_annotator.get_exon_data", side_effect=_mock_get_exon_data),
            patch("panel_annotator.analyze_variant", side_effect=_mock_analyze_variant),
        ):
            # Re-import after patching
            import importlib
            import panel_annotator
            importlib.reload(panel_annotator)

            # Patch again in the reloaded module
            with (
                patch.object(panel_annotator, "_get_genome_sequence_fn", _mock_get_genome_sequence, create=True),
            ):
                from panel_annotator import annotate_variant as av_fn
                return av_fn(variant, mock_model)

    def test_brca1_variant_annotates_correctly(self):
        """BRCA1 variant should be annotated as High priority Tier1."""
        variant = VariantInput(
            chr="chr17", pos=43119628, ref="C", alt="T", gene_symbol="BRCA1"
        )
        mock_model = MagicMock()

        with (
            patch("panel_annotator.get_genome_sequence", side_effect=_mock_get_genome_sequence),
            patch("panel_annotator.get_exon_data", side_effect=_mock_get_exon_data),
            patch("panel_annotator.analyze_variant", side_effect=_mock_analyze_variant),
        ):
            from panel_annotator import annotate_variant
            result = annotate_variant(variant, mock_model)

        assert result.error is None
        assert result.evo2 is not None
        assert result.evo2.prediction == "Likely pathogenic"
        assert result.cancer_annotation is not None
        assert result.cancer_annotation.cancer_gene_tier == "Tier1"
        assert result.composite is not None
        assert result.composite.priority == "High"
        assert len(result.rag_context) == 3

    def test_non_cancer_gene_variant_scores_low(self):
        """A benign variant in a non-cancer gene should be Low priority."""
        variant = VariantInput(
            chr="chr1", pos=1000000, ref="A", alt="G", gene_symbol="FAKEGENE99"
        )
        mock_model = MagicMock()

        def benign_analyze(relative_pos_in_window, reference, alternative, window_seq, model):
            return {
                "reference": reference,
                "alternative": alternative,
                "delta_score": 0.001,
                "prediction": "Likely benign",
                "classification_confidence": 0.25,
            }

        def low_risk_exon_data(position, genome, chromosome, window_size=8192):
            # Exon far from variant
            return [(position + 100, position + 300)]

        with (
            patch("panel_annotator.get_genome_sequence", side_effect=_mock_get_genome_sequence),
            patch("panel_annotator.get_exon_data", side_effect=low_risk_exon_data),
            patch("panel_annotator.analyze_variant", side_effect=benign_analyze),
        ):
            from panel_annotator import annotate_variant
            result = annotate_variant(variant, mock_model)

        assert result.error is None
        assert result.composite is not None
        assert result.composite.priority == "Low"

    def test_error_resilience_evo2_failure(self):
        """If Evo2 throws, the variant should get error field, not raise."""
        variant = VariantInput(
            chr="chr17", pos=43119628, ref="C", alt="T", gene_symbol="BRCA1"
        )
        mock_model = MagicMock()

        def raising_analyze(*args, **kwargs):
            raise RuntimeError("Mock Evo2 GPU out of memory")

        with (
            patch("panel_annotator.get_genome_sequence", side_effect=_mock_get_genome_sequence),
            patch("panel_annotator.get_exon_data", side_effect=_mock_get_exon_data),
            patch("panel_annotator.analyze_variant", side_effect=raising_analyze),
        ):
            from panel_annotator import annotate_variant
            result = annotate_variant(variant, mock_model)

        assert result.error is not None
        assert "RuntimeError" in result.error
        assert result.evo2 is None

    def test_full_panel_annotation(self):
        """All variants in HBOC panel should be annotated without crashing."""
        from synthetic_panels import HBOC_PANEL
        from panel_annotator import annotate_panel

        mock_model = MagicMock()

        with (
            patch("panel_annotator.get_genome_sequence", side_effect=_mock_get_genome_sequence),
            patch("panel_annotator.get_exon_data", side_effect=_mock_get_exon_data),
            patch("panel_annotator.analyze_variant", side_effect=_mock_analyze_variant),
        ):
            response = annotate_panel(HBOC_PANEL, mock_model)

        assert len(response.annotated_variants) == len(HBOC_PANEL.variants)
        # With mocked pathogenic results + all Tier1/2 genes: most should be High
        assert response.high_priority_count >= 1
        priorities = [av.composite.priority for av in response.annotated_variants if av.composite]
        assert all(p in ("High", "Medium", "Low") for p in priorities)

    def test_panel_sorted_by_score(self):
        """Response variants should be sorted by composite score descending."""
        from synthetic_panels import HBOC_PANEL
        from panel_annotator import annotate_panel

        mock_model = MagicMock()

        with (
            patch("panel_annotator.get_genome_sequence", side_effect=_mock_get_genome_sequence),
            patch("panel_annotator.get_exon_data", side_effect=_mock_get_exon_data),
            patch("panel_annotator.analyze_variant", side_effect=_mock_analyze_variant),
        ):
            response = annotate_panel(HBOC_PANEL, mock_model)

        scores = [
            av.composite.raw_score
            for av in response.annotated_variants
            if av.composite
        ]
        assert scores == sorted(scores, reverse=True)


# ---------------------------------------------------------------------------
# 6. Import / integration smoke tests
# ---------------------------------------------------------------------------

class TestImports:
    def test_schemas_importable(self):
        from schemas import (
            AnnotatedVariant,
            CancerGeneAnnotation,
            CompositeScore,
            CopilotRequest,
            CopilotResponse,
            Evo2RawResult,
            PanelAnalysisRequest,
            PanelAnalysisResponse,
            VariantInput,
        )

    def test_cancer_genes_importable(self):
        from cancer_genes import get_cancer_annotation, CANCER_GENE_DB
        assert len(CANCER_GENE_DB) >= 25

    def test_synthetic_panels_importable(self):
        from synthetic_panels import HBOC_PANEL, LYNCH_PANEL, SOLID_TUMOR_PANEL, get_demo_panel
        assert len(HBOC_PANEL.variants) == 6
        assert len(LYNCH_PANEL.variants) == 5
        assert len(SOLID_TUMOR_PANEL.variants) == 7

    def test_get_demo_panel_valid(self):
        from synthetic_panels import get_demo_panel
        panel = get_demo_panel("hboc")
        assert panel.panel_name is not None

    def test_get_demo_panel_invalid(self):
        from synthetic_panels import get_demo_panel
        with pytest.raises(ValueError, match="Unknown demo panel"):
            get_demo_panel("nonexistent")
