"""
Research Intelligence Orchestrator — wires question formulator, pipeline phases, synthesis, MOAT.
"""

import logging
import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from .question_formulator import ResearchQuestionFormulator
from .synthesis_engine import ResearchSynthesisEngine
from .moat_integrator import MOATIntegrator
from .pipeline.limits import get_search_limits
from .pipeline.portal_query import query_portals
from .pipeline.content_parse import deep_parse_top_papers
from .pipeline.citation_network import analyze_citation_network
from .pipeline.drug_interactions import check_drug_interactions
from .pipeline.clinical_trials import get_clinical_trial_recommendations
from .pipeline.sub_question_runner import answer_sub_questions
from .pipeline.zeta_pubmed_fallback import hydrate_pubmed_with_zeta

logger = logging.getLogger(__name__)

env_file = None
try:
    from dotenv import load_dotenv

    env_file = Path(__file__).resolve().parent.parent.parent.parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
    else:
        load_dotenv()
    _onc = env_file.parent / "oncology-backend-minimal" / ".env"
    if _onc.exists():
        load_dotenv(_onc, override=True)
except ImportError:
    pass

if env_file and env_file.exists():
    logger.info("✅ Loaded .env from %s", env_file)
    logger.debug("NCBI_USER_EMAIL: %s", "SET" if os.getenv("NCBI_USER_EMAIL") else "NOT SET")

# Lazy portal/parser imports — same as before
from .portals.pubmed_enhanced import EnhancedPubMedPortal
from .parsers.pubmed_deep_parser import DeepPubMedParser


class ResearchIntelligenceOrchestrator:
    """Orchestrates multi-portal research with deep parsing and LLM synthesis."""

    def __init__(self) -> None:
        self._limits = get_search_limits()
        try:
            self.pubmed = EnhancedPubMedPortal()
        except Exception as e:
            logger.warning("EnhancedPubMedPortal not available: %s", e)
            self.pubmed = None

        try:
            from .portals.project_data_sphere import ProjectDataSpherePortal

            self.project_data_sphere = ProjectDataSpherePortal()
        except Exception as e:
            logger.warning("ProjectDataSpherePortal not available: %s", e)
            self.project_data_sphere = None

        try:
            from .portals.gdc_portal import GDCPortal

            self.gdc = GDCPortal()
        except Exception as e:
            logger.warning("GDCPortal not available: %s", e)
            self.gdc = None

        try:
            self.pubmed_parser = DeepPubMedParser()
        except Exception as e:
            logger.warning("DeepPubMedParser not available: %s", e)
            self.pubmed_parser = None

        try:
            from .parsers.pharmacogenomics_parser import PharmacogenomicsParser

            self.pharmacogenomics_parser = PharmacogenomicsParser()
        except Exception as e:
            logger.warning("PharmacogenomicsParser not available: %s", e)
            self.pharmacogenomics_parser = None

        self.question_formulator = ResearchQuestionFormulator()
        self.synthesis_engine = ResearchSynthesisEngine()
        self.moat_integrator = MOATIntegrator()

    def is_available(self) -> bool:
        llm = self.synthesis_engine.llm_provider
        llm_ok = bool(llm and llm.is_available())
        return llm_ok or self.pubmed is not None or self.pubmed_parser is not None

    async def research_question(
        self,
        question: str,
        context: Dict[str, Any],
        *,
        deep: bool = False,
    ) -> Dict[str, Any]:
        run_id = str(uuid.uuid4())
        methods_used: List[str] = []

        research_plan = await self.question_formulator.formulate_research_plan(question, context)
        methods_used.append("question_formulation")

        portal_results = await query_portals(
            research_plan,
            pubmed=self.pubmed,
            project_data_sphere=self.project_data_sphere,
            gdc=self.gdc,
            limits=self._limits,
        )
        if portal_results.get("pubmed") and not portal_results["pubmed"].get("error"):
            methods_used.append("pubmed_search")

        zeta_fb = False
        if deep or os.environ.get("RI_USE_ZETA_PUBMED_FALLBACK", "").lower() in (
            "1",
            "true",
            "yes",
        ):
            zmax = int(os.environ.get("RI_ZETA_FALLBACK_MAX", "48"))
            portal_results, zeta_fb = await hydrate_pubmed_with_zeta(
                portal_results, research_plan, max_results=zmax
            )
            if zeta_fb:
                methods_used.append("zeta_pubmed_fallback")
                if portal_results.get("pubmed", {}).get("articles"):
                    methods_used.append("pubmed_search")
        if portal_results.get("project_data_sphere"):
            methods_used.append("project_data_sphere")
        if portal_results.get("gdc"):
            methods_used.append("gdc_query")

        parsed_content = await deep_parse_top_papers(
            portal_results,
            pubmed_parser=self.pubmed_parser,
            limits=self._limits,
        )
        if parsed_content.get("diffbot_count", 0) > 0:
            methods_used.append("diffbot_extraction")
        if parsed_content.get("pubmed_parser_count", 0) > 0:
            methods_used.append("pubmed_parser")
        if parsed_content.get("pharmacogenomics_cases"):
            methods_used.append("pharmacogenomics_extraction")

        synthesized_findings = await self.synthesis_engine.synthesize_findings(
            portal_results, parsed_content, research_plan, deep=deep
        )
        if synthesized_findings.get("method") == "llm_deep_research":
            methods_used.append("llm_deep_research")
        else:
            methods_used.append("generic_llm_synthesis")
        if deep or synthesized_findings.get("deep_research"):
            methods_used.append("map_reduce_deep")

        sub_question_answers = synthesized_findings.get("sub_question_answers", [])
        if not sub_question_answers and not deep:
            sub_question_answers = await answer_sub_questions(
                research_plan,
                portal_results,
                parsed_content,
                self.synthesis_engine,
                self.pubmed,
                self._limits,
            )
        if sub_question_answers:
            methods_used.append("sub_question_answering")

        moat_analysis = await self.moat_integrator.integrate_with_moat(
            synthesized_findings, context
        )

        trial_recommendations = await get_clinical_trial_recommendations(
            synthesized_findings, moat_analysis, context, self.moat_integrator
        )
        if trial_recommendations:
            moat_analysis["trial_recommendations"] = trial_recommendations
            methods_used.append("trial_recommendations")

        drug_interactions = check_drug_interactions(
            synthesized_findings, context, research_plan
        )
        if drug_interactions.get("interactions") or drug_interactions.get("warnings"):
            moat_analysis["drug_interactions"] = drug_interactions
            methods_used.append("drug_interaction_check")

        citation_network = analyze_citation_network(
            portal_results, parsed_content, self._limits
        )
        if citation_network:
            moat_analysis["citation_network"] = citation_network
            methods_used.append("citation_network_analysis")

        if moat_analysis.get("cross_resistance"):
            methods_used.append("cross_resistance_analysis")
        if moat_analysis.get("toxicity_mitigation"):
            methods_used.append("toxicity_mitigation")
        if moat_analysis.get("sae_features"):
            methods_used.append("sae_feature_extraction")
        if moat_analysis.get("toxicity_risk"):
            methods_used.append("toxicity_risk_assessment")
        if moat_analysis.get("dosing_guidance"):
            methods_used.append("dosing_guidance")
        if moat_analysis.get("mechanism_vector"):
            methods_used.append("spe_framework")

        provenance = {
            "run_id": run_id,
            "profile": context.get("profile", "baseline"),
            "methods": list(set(methods_used)),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "inputs_snapshot": {
                "question": question,
                "context_keys": list(context.keys()),
                "disease": context.get("disease"),
                "treatment_line": context.get("treatment_line"),
            },
            "output_summary": {
                "articles_parsed": parsed_content.get("parsed_count", 0),
                "mechanisms_found": len(synthesized_findings.get("mechanisms", [])),
                "sub_questions_answered": len(sub_question_answers),
                "moat_signals_extracted": len(
                    [
                        k
                        for k in moat_analysis.keys()
                        if k
                        not in [
                            "pathways",
                            "mechanisms",
                            "pathway_scores",
                            "treatment_line_analysis",
                            "biomarker_analysis",
                            "overall_confidence",
                        ]
                    ]
                ),
            },
            "search_depth": {
                "pubmed_max_results": self._limits.pubmed_max_results,
                "parse_top_n": self._limits.parse_top_n,
                "diffbot_max_papers": self._limits.diffbot_max_papers,
            },
            "mode": "deep" if deep else "baseline",
            "deep_used_user_gemini_key": bool(deep),
            "zeta_pubmed_fallback": zeta_fb,
            "pubmed_articles_count": len(
                (portal_results.get("pubmed") or {}).get("articles") or []
            ),
            "deep_research": synthesized_findings.get("deep_research"),
        }

        return {
            "research_plan": research_plan,
            "portal_results": portal_results,
            "parsed_content": parsed_content,
            "synthesized_findings": synthesized_findings,
            "article_summaries": synthesized_findings.get("article_summaries", []),
            "sub_question_answers": sub_question_answers,
            "moat_analysis": moat_analysis,
            "provenance": provenance,
        }
