"""
Modal app exposing the VUS Triage Co-Pilot endpoints.

Three endpoints:
  POST /analyze_panel     — GPU (H100): per-variant Evo2 + annotation + scoring
  POST /copilot/report    — CPU: generate triage report or tumor board note
  POST /copilot/chat      — CPU: multi-turn Q&A about the panel

Deploy with:
    modal deploy panel_app.py

Environment secrets:
    ANTHROPIC_API_KEY  — set via `modal secret create anthropic-key ANTHROPIC_API_KEY=sk-...`
"""

import modal

# ---------------------------------------------------------------------------
# GPU image (reuses the H100 + Evo2 stack from main.py)
# ---------------------------------------------------------------------------

panel_gpu_image = (
    modal.Image.from_registry("nvcr.io/nvidia/pytorch:25.04-py3")
    .apt_install(["git", "python3-pip", "python3-tomli"])
    .run_commands("pip install evo2")
    .pip_install("fastapi[standard]")
    .pip_install_from_requirements("requirements.txt")
    .pip_install("sentence-transformers", "numpy", "pydantic>=2.0")
    .add_local_file("./schemas.py", "/app/schemas.py")
    .add_local_file("./cancer_genes.py", "/app/cancer_genes.py")
    .add_local_file("./rag_engine.py", "/app/rag_engine.py")
    .add_local_file("./panel_annotator.py", "/app/panel_annotator.py")
    .add_local_file("./main.py", "/app/main.py")
)

# ---------------------------------------------------------------------------
# CPU image (copilot endpoints — no GPU needed)
# ---------------------------------------------------------------------------

panel_cpu_image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install(
        "fastapi[standard]",
        "pydantic>=2.0",
        "anthropic>=0.25.0",
        "sentence-transformers",
        "numpy",
    )
    .add_local_file("./schemas.py", "/app/schemas.py")
    .add_local_file("./cancer_genes.py", "/app/cancer_genes.py")
    .add_local_file("./rag_engine.py", "/app/rag_engine.py")
    .add_local_file("./copilot.py", "/app/copilot.py")
)

# ---------------------------------------------------------------------------
# Modal app + shared resources
# ---------------------------------------------------------------------------

app = modal.App("vus-triage-copilot")

volume = modal.Volume.from_name("hf_cache", create_if_missing=True)
mount_path = "/root/.cache/huggingface"

anthropic_secret = modal.Secret.from_name("anthropic-key")


# ---------------------------------------------------------------------------
# GPU class — panel annotation endpoint
# ---------------------------------------------------------------------------

@app.cls(
    gpu="H100",
    image=panel_gpu_image,
    volumes={mount_path: volume},
    max_containers=2,
    retries=1,
    scaledown_window=120,
)
class PanelAnnotationService:
    """Runs Evo2 inference for a full panel and returns annotated variants."""

    @modal.enter()
    def load_model(self):
        import sys
        sys.path.insert(0, "/app")

        from evo2 import Evo2
        print("Loading Evo2 model for panel service...")
        self.model = Evo2("evo2_7b")
        print("Evo2 model loaded.")

    @modal.fastapi_endpoint(method="POST")
    def analyze_panel(self, request_body: dict):
        import sys
        sys.path.insert(0, "/app")

        from schemas import PanelAnalysisRequest
        from panel_annotator import annotate_panel

        request = PanelAnalysisRequest(**request_body)
        response = annotate_panel(request, model=self.model)
        return response.model_dump()


# ---------------------------------------------------------------------------
# CPU ASGI app — copilot endpoints (/copilot/report and /copilot/chat)
# Both routes live under a single Modal URL via FastAPI routing.
# ---------------------------------------------------------------------------

@app.function(
    image=panel_cpu_image,
    secrets=[anthropic_secret],
    max_containers=5,
    scaledown_window=60,
)
@modal.asgi_app()
def copilot_asgi():
    import sys
    sys.path.insert(0, "/app")

    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from schemas import CopilotRequest
    from copilot import generate_report, chat

    fastapi_app = FastAPI(title="VUS Triage Co-Pilot")

    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @fastapi_app.post("/copilot/report")
    def _generate_report(request: CopilotRequest):
        if request.mode not in ("triage_report", "tumor_board"):
            return {"error": f"Use /copilot/chat for mode='{request.mode}'"}
        return generate_report(request).model_dump()

    @fastapi_app.post("/copilot/chat")
    def _chat(request: CopilotRequest):
        if request.mode != "followup_qa":
            return {"error": f"Use /copilot/report for mode='{request.mode}'"}
        return chat(request).model_dump()

    return fastapi_app


# ---------------------------------------------------------------------------
# Local entrypoint for smoke testing
# ---------------------------------------------------------------------------

@app.local_entrypoint()
def main():
    """Quick smoke test using the synthetic HBOC panel."""
    import json
    from synthetic_panels import HBOC_PANEL

    print("Submitting HBOC synthetic panel for annotation...")
    svc = PanelAnnotationService()
    result = svc.analyze_panel.remote(HBOC_PANEL.model_dump())
    print(json.dumps(result, indent=2, default=str))
