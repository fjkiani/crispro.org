"""
Per-request override for Gemini API key (Deep Research).

Set by the research-intelligence router for the duration of one request only.
"""

from __future__ import annotations

from contextvars import ContextVar
from typing import Optional

_user_gemini_api_key: ContextVar[Optional[str]] = ContextVar("user_gemini_api_key", default=None)


def get_user_gemini_api_key() -> Optional[str]:
    v = _user_gemini_api_key.get()
    if v and str(v).strip():
        return str(v).strip()
    return None


def push_user_gemini_api_key(key: Optional[str]) -> object:
    """Returns a token for reset_user_gemini_api_key."""
    return _user_gemini_api_key.set(key.strip() if key else None)


def reset_user_gemini_api_key(token: object) -> None:
    _user_gemini_api_key.reset(token)
