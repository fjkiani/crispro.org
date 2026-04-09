"""LLM context windows and article caps for synthesis (independent of portal retrieval)."""

from __future__ import annotations

import os
from dataclasses import dataclass


def _i(name: str, default: int) -> int:
    raw = os.environ.get(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return max(1, int(raw))
    except ValueError:
        return default


@dataclass(frozen=True)
class SynthesisLimits:
    comprehensive_max_articles: int
    comprehensive_chars_per_paper: int
    comprehensive_abstract_fallback: int
    extract_top_articles: int
    extract_chars_per_paper: int
    generic_abstract_papers: int
    generic_abstract_chars: int
    generic_fulltext_chars: int
    generic_prompt_abstracts: int
    generic_prompt_fulltext: int
    article_summary_batch_size: int
    subq_abstract_chars: int
    subq_fulltext_chars: int


def get_synthesis_limits() -> SynthesisLimits:
    return SynthesisLimits(
        comprehensive_max_articles=_i("RI_SYNTH_COMPREHENSIVE_MAX_ARTICLES", 10),
        comprehensive_chars_per_paper=_i("RI_SYNTH_COMPREHENSIVE_CHARS", 2000),
        comprehensive_abstract_fallback=_i("RI_SYNTH_COMPREHENSIVE_ABSTRACT_CHARS", 1000),
        extract_top_articles=_i("RI_SYNTH_EXTRACT_TOP", 5),
        extract_chars_per_paper=_i("RI_SYNTH_EXTRACT_CHARS", 2000),
        generic_abstract_papers=_i("RI_SYNTH_GENERIC_ABSTRACT_PAPERS", 20),
        generic_abstract_chars=_i("RI_SYNTH_GENERIC_ABSTRACT_CHARS", 10000),
        generic_fulltext_chars=_i("RI_SYNTH_GENERIC_FULLTEXT_CHARS", 5000),
        generic_prompt_abstracts=_i("RI_SYNTH_PROMPT_ABSTRACTS", 10000),
        generic_prompt_fulltext=_i("RI_SYNTH_PROMPT_FULLTEXT", 10000),
        article_summary_batch_size=_i("RI_SYNTH_SUMMARY_BATCH", 3),
        subq_abstract_chars=_i("RI_SYNTH_SUBQ_ABSTRACT", 8000),
        subq_fulltext_chars=_i("RI_SYNTH_SUBQ_FULLTEXT", 5000),
    )
