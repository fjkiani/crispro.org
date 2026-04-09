#!/usr/bin/env python3
"""
Zeta-Core stress test: PubMed (async chunked efetch) → BM25 top-20 → parallel map → reduce.

Default query: Trastuzumab deruxtecan / HER2-low metastatic breast cancer (DESTINY-Breast04 trap).

Usage (from repo root):
  PYTHONPATH=. ./backend/venv/bin/python scripts/test_deep_reduce.py
  PYTHONPATH=. ./backend/venv/bin/python scripts/test_deep_reduce.py --question "Your question here"

Requires: GROQ_API_KEY; OPENAI_API_KEY recommended for 429 failover (root .env or oncology-backend-minimal/.env).
NCBI_USER_API_KEY recommended (10 req/s).
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

try:
    from dotenv import load_dotenv

    load_dotenv(ROOT / ".env")
    load_dotenv(ROOT / ".env.local")
    load_dotenv(ROOT / "oncology-backend-minimal" / ".env", override=True)
except ImportError:
    pass

DEFAULT_QUESTION = (
    "Efficacy of Trastuzumab deruxtecan in HER2-low metastatic breast cancer"
)

# PubMed: T-DXd / Enhertu / DS-8201 + breast + HER2-low / IHC context (DESTINY-Breast04).
DEFAULT_PUBMED_QUERY = (
    '("trastuzumab deruxtecan"[tiab] OR "T-DXd"[tiab] OR "DS-8201"[tiab] OR enhertu[tiab]) AND '
    '("breast neoplasms"[MeSH] OR "breast cancer"[tiab] OR "metastatic breast"[tiab]) AND '
    '("HER2-low"[tiab] OR "HER2 low"[tiab] OR HER2[tiab] OR IHC[tiab] OR ISH[tiab] OR DESTINY[tiab]) AND '
    "english[lang]"
)


def _jsonable_extraction(ext: dict) -> dict:
    """Trim mechanisms for console JSON (keep counts + summary fields)."""
    out = {k: v for k, v in ext.items() if k != "mechanisms"}
    mech = ext.get("mechanisms") or []
    out["mechanisms_count"] = len(mech)
    out["mechanisms_preview"] = mech[:5]
    return out


async def main() -> int:
    ap = argparse.ArgumentParser(description="Deep reduce Zeta-Core stress test")
    ap.add_argument(
        "--question",
        default=DEFAULT_QUESTION,
        help="Primary research question (BM25 + reduce focus)",
    )
    ap.add_argument("--max-results", type=int, default=40, help="PubMed retmax before BM25 cap")
    ap.add_argument(
        "--pubmed-query",
        default=None,
        help="Override Entrez query (default: T-DXd HER2-low breast bundle)",
    )
    args = ap.parse_args()

    from backend.capabilities.research_intelligence.llm_provider.llm_abstract import GroqLLMProvider
    from backend.capabilities.research_intelligence.pipeline.abstract_rerank import rerank_articles_bm25
    from backend.capabilities.research_intelligence.synthesis_parts.map_reduce_deep import (
        run_deep_map_reduce,
    )
    from backend.capabilities.zeta_core.pubmed_client import EFETCH_CHUNK, search_pubmed_async

    primary = args.question.strip()
    query = (args.pubmed_query or DEFAULT_PUBMED_QUERY).strip()

    groq = bool(os.environ.get("GROQ_API_KEY", "").strip())
    groq2 = bool(
        os.environ.get("GROQ_API_KEY_2", "").strip()
        or os.environ.get("GROQ_API_KEY_FALLBACK", "").strip()
    )
    oai = bool(os.environ.get("OPENAI_API_KEY", "").strip())
    gem = bool(
        os.environ.get("GEMINI_API_KEY", "").strip()
        or os.environ.get("GOOGLE_API_KEY", "").strip()
    )
    print("── Keys ──", flush=True)
    print(f"  GROQ_API_KEY: {'set' if groq else 'NOT SET'}", flush=True)
    print(f"  GROQ fallback key: {'set' if groq2 else 'NOT SET'}", flush=True)
    print(f"  GEMINI_API_KEY / GOOGLE_API_KEY: {'set' if gem else 'NOT SET'}", flush=True)
    print(f"  OPENAI_API_KEY: {'set' if oai else 'NOT SET'}", flush=True)
    print(f"  NCBI_USER_API_KEY: {'set' if os.environ.get('NCBI_USER_API_KEY') else 'NOT SET'}", flush=True)
    print(f"  EFetch chunk size (async): {EFETCH_CHUNK}", flush=True)
    print(flush=True)

    llm = GroqLLMProvider()
    if not llm.is_available():
        print("ERROR: No LLM keys configured.", file=sys.stderr)
        return 1

    print("── Step 1: PubMed (async esearch + batched efetch + iterparse) ──", flush=True)
    print("Query:", query[:220] + ("…" if len(query) > 220 else ""), flush=True)
    articles, total = await search_pubmed_async(query, max_results=args.max_results)
    print(f"  → Retrieved {len(articles)} full abstract records (Entrez total_found≈{total}).", flush=True)
    if len(articles) < args.max_results:
        print(f"  (PubMed returned fewer than retmax={args.max_results}; BM25 will use what exists.)", flush=True)

    print(flush=True)
    print("── Step 2: BM25 vs primary question ──", flush=True)
    top_k = int(os.environ.get("RI_DEEP_TOP_ARTICLES", "20"))
    ranked = rerank_articles_bm25(primary, articles, top_k=top_k)
    print(f"  → Slashed to top {len(ranked)} by BM25 (top_k={top_k}).", flush=True)
    if ranked:
        print("  Top 3 PMIDs after BM25:", [a.get("pmid") for a in ranked[:3]], flush=True)

    portal_results = {"pubmed": {"articles": articles, "total_found": total, "query_used": query}}
    research_plan = {
        "primary_question": primary,
        "entities": {"disease": "HER2-low metastatic breast cancer", "compound": "trastuzumab deruxtecan"},
        "portal_queries": {"pubmed": [query]},
    }

    os.environ.setdefault("RI_DEEP_MAX_ARTICLES", "48")
    os.environ.setdefault("RI_DEEP_TOP_ARTICLES", "20")
    os.environ.setdefault("RI_DEEP_MAP_BATCH", "20")
    os.environ.setdefault("RI_LLM_CONCURRENCY", "4")

    print(flush=True)
    print("── Step 3: Deep map → reduce (Zeta-Core directive) ──", flush=True)
    pack = await run_deep_map_reduce(llm, portal_results, research_plan)
    ext = pack.get("llm_extraction") or {}
    summary = ext.get("evidence_summary") or ""
    meta = pack.get("deep_research") or {}

    print("=" * 72)
    print("ZETA-CORE CLINICAL DIRECTIVE (evidence_summary)")
    print("=" * 72)
    print(summary or "(empty)")
    print(flush=True)
    print("── deep_research meta ──", flush=True)
    print(json.dumps(meta, indent=2), flush=True)
    print(flush=True)
    print("── llm_extraction (JSON, mechanisms trimmed) ──", flush=True)
    print(json.dumps(_jsonable_extraction(ext), indent=2, default=str), flush=True)

    # Pass/fail hints for stress test (DESTINY HR + IHC wording)
    low = (summary or "").lower()
    has_hr = "hr " in low or "hazard ratio" in low or "0.50" in summary or "0.64" in summary
    has_ihc = "ihc" in low or "ish" in low or "her2-low" in low or "her2 low" in low
    print(flush=True)
    print("── Stress heuristics (console only) ──", flush=True)
    print(f"  Numeric HR / 0.50 / 0.64 in summary: {has_hr}", flush=True)
    print(f"  IHC / ISH / HER2-low signal in summary: {has_ihc}", flush=True)

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
