"""
Local BM25 rerank of PubMed-style articles against the research question (no LLM).
"""

from __future__ import annotations

import re
from typing import Any, Dict, List

from rank_bm25 import BM25Okapi


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9]+", (text or "").lower())


def rerank_articles_bm25(
    query: str,
    articles: List[Dict[str, Any]],
    *,
    top_k: int = 20,
) -> List[Dict[str, Any]]:
    if not articles:
        return []
    k = min(top_k, len(articles))
    corpus = [
        _tokenize((a.get("title") or "") + " " + (a.get("abstract") or "")) for a in articles
    ]
    q_tokens = _tokenize(query)
    if not any(corpus):
        return list(articles)[:k]
    bm25 = BM25Okapi(corpus)
    scores = bm25.get_scores(q_tokens)
    order = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    return [articles[i] for i in order[:k]]
