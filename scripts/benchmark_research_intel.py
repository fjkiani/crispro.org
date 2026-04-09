#!/usr/bin/env python3
"""
Local benchmark: POST /api/v1/research-intelligence/research baseline vs deep.

Requires: PYTHONPATH=repo root, GROQ_API_KEY, NCBI_USER_EMAIL (recommended).

Usage:
  cd CrisPRO.org && PYTHONPATH=. ./backend/venv/bin/python scripts/benchmark_research_intel.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

os.environ.setdefault("RI_USE_ZETA_PUBMED_FALLBACK", "1")
os.environ.setdefault("RI_ZETA_FALLBACK_MAX", "40")
os.environ.setdefault("RI_DEEP_MAX_ARTICLES", "40")
os.environ.setdefault("RI_DEEP_MAP_BATCH", "8")

QUESTIONS = [
    "Olaparib PARP inhibitor BRCA-mutated ovarian cancer maintenance",
    "Trastuzumab HER2-positive breast cancer cardiotoxicity monitoring",
    "Pembrolizumab MSI-high colorectal cancer first-line evidence",
]


def metrics(resp_json: dict, elapsed_ms: float, mode: str) -> dict:
    sf = resp_json.get("synthesized_findings") or {}
    prov = resp_json.get("provenance") or {}
    pub = (resp_json.get("portal_results") or {}).get("pubmed") or {}
    arts = pub.get("articles") or []
    summary = (sf.get("evidence_summary") or "")[:200]
    return {
        "mode": mode,
        "http_ok": True,
        "elapsed_ms": round(elapsed_ms, 1),
        "pubmed_articles": len(arts),
        "total_found_hint": pub.get("total_found"),
        "mechanisms_n": len(sf.get("mechanisms") or []),
        "evidence_tier": sf.get("evidence_tier"),
        "method": sf.get("method"),
        "summary_prefix": summary.replace("\n", " "),
        "zeta_fallback": prov.get("zeta_pubmed_fallback"),
        "deep_research": sf.get("deep_research") or prov.get("deep_research"),
        "methods": prov.get("methods"),
    }


def main() -> int:
    from fastapi.testclient import TestClient
    from backend.main import app

    rows = []
    with TestClient(app) as client:
        for q in QUESTIONS:
            for deep in (False, True):
                body: dict = {"question": q, "context": {}, "deep": deep}
                if deep:
                    gk = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
                    if gk:
                        body["gemini_api_key"] = gk.strip()
                t0 = time.perf_counter()
                r = client.post("/api/v1/research-intelligence/research", json=body, timeout=300.0)
                elapsed = (time.perf_counter() - t0) * 1000
                mode = "deep" if deep else "baseline"
                if r.status_code != 200:
                    rows.append(
                        {
                            "question": q[:50] + "…",
                            "mode": mode,
                            "http_ok": False,
                            "status": r.status_code,
                            "elapsed_ms": round(elapsed, 1),
                            "body": r.text[:500],
                        }
                    )
                    continue
                m = metrics(r.json(), elapsed, mode)
                m["question"] = q[:60] + ("…" if len(q) > 60 else "")
                rows.append(m)

    out_dir = ROOT / "benchmark_output"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "research_intel_compare.json"
    out_path.write_text(json.dumps(rows, indent=2), encoding="utf-8")

    print(f"Wrote {out_path}\n")
    print(f"{'mode':<10} {'ms':>8} {'arts':>5} {'mech':>5} {'tier':<12} {'zeta_fb':>8} {'deep_meta'}")
    for row in rows:
        if not row.get("http_ok"):
            print(row)
            continue
        dr = row.get("deep_research") or {}
        dm = dr.get("anchored_rows", dr.get("note", ""))
        print(
            f"{row['mode']:<10} {row['elapsed_ms']:>8.0f} {row['pubmed_articles']:>5} "
            f"{row['mechanisms_n']:>5} {str(row.get('evidence_tier')):<12} "
            f"{str(row.get('zeta_fallback')):>8} {dm}"
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
