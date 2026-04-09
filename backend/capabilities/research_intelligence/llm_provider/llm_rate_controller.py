"""
Central LLM rate architecture for Groq, OpenAI, and Gemini (google-genai).

- Limits parallel Groq calls and enforces minimum spacing between request starts (TPM/RPM smoothing).
- Parses 429 bodies for "try again in …" and stores per-key cooldowns (monotonic clock).
- Routers skip cooled Groq keys and fall through to OpenAI / Gemini.

Env:
  RI_GROQ_MAX_CONCURRENT   — max in-flight Groq HTTP calls (default 2)
  RI_GROQ_MIN_INTERVAL_SEC — min seconds between Groq request starts, global (default 0.35)
  RI_OPENAI_MAX_CONCURRENT — max in-flight OpenAI calls (default 4)
  RI_GEMINI_MAX_CONCURRENT — max in-flight Gemini generate_content calls (default 2)
  RI_RATE_COOLDOWN_CAP_SEC — max parsed cooldown seconds (default 7200)
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
import os
import re
import threading
import time
from typing import Awaitable, Callable, Dict, Optional, TypeVar

from groq import APIStatusError, RateLimitError

logger = logging.getLogger(__name__)

T = TypeVar("T")

_singleton_lock = threading.Lock()
_instance: Optional["LLMRateController"] = None


def _env_float(name: str, default: float) -> float:
    try:
        return float(os.environ.get(name, str(default)))
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    try:
        return max(1, int(os.environ.get(name, str(default))))
    except ValueError:
        return default


def _key_fingerprint(api_key: str) -> str:
    return hashlib.sha256(api_key.encode()).hexdigest()[:16]


def is_rate_limit_error(exc: BaseException) -> bool:
    if isinstance(exc, RateLimitError):
        return True
    if isinstance(exc, APIStatusError) and getattr(exc, "status_code", None) == 429:
        return True
    sc = getattr(exc, "status_code", None)
    if sc == 429:
        return True
    msg = str(exc).lower()
    return "429" in msg or "rate limit" in msg or "rate_limit" in msg


def _extract_error_message(exc: BaseException) -> str:
    body = getattr(exc, "body", None)
    if isinstance(body, dict):
        err = body.get("error")
        if isinstance(err, dict):
            return str(err.get("message") or err)
        if isinstance(err, str):
            return err
        try:
            return json.dumps(body)
        except Exception:
            return str(body)
    return str(exc)


def parse_groq_retry_seconds(exc: BaseException) -> Optional[float]:
    msg = _extract_error_message(exc)
    lower = msg.lower()

    if "tokens per day" in lower or "tpd" in lower:
        m = re.search(
            r"try again in\s+(\d+)h\s*(\d+)m\s*([\d.]+)\s*s",
            msg,
            re.I,
        )
        if m:
            h, mi, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
            return h * 3600 + mi * 60 + s
        m2 = re.search(r"try again in\s+(\d+)m\s*([\d.]+)\s*s", msg, re.I)
        if m2:
            return int(m2.group(1)) * 60 + float(m2.group(2))
        return 3600.0

    m = re.search(r"try again in\s+(\d+)h\s*(\d+)m\s*([\d.]+)\s*s", msg, re.I)
    if m:
        return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))

    m = re.search(r"try again in\s+(\d+)m\s*([\d.]+)\s*s", msg, re.I)
    if m:
        return int(m.group(1)) * 60 + float(m.group(2))

    m = re.search(r"try again in\s*([\d.]+)\s*s", msg, re.I)
    if m:
        return float(m.group(1))

    if "tokens per minute" in lower or "tpm" in lower:
        return 25.0

    return None


class LLMRateController:
    """Process-wide Groq pacing, per-key cooldowns, OpenAI concurrency."""

    def __init__(self) -> None:
        self._groq_max = _env_int("RI_GROQ_MAX_CONCURRENT", 2)
        self._groq_interval = max(0.0, _env_float("RI_GROQ_MIN_INTERVAL_SEC", 0.35))
        self._openai_max = _env_int("RI_OPENAI_MAX_CONCURRENT", 4)
        self._gemini_max = _env_int("RI_GEMINI_MAX_CONCURRENT", 2)
        self._cooldown_cap = max(5.0, _env_float("RI_RATE_COOLDOWN_CAP_SEC", 7200.0))

        self._groq_sem = asyncio.Semaphore(self._groq_max)
        self._openai_sem = asyncio.Semaphore(self._openai_max)
        self._gemini_sem = asyncio.Semaphore(self._gemini_max)
        self._groq_pace_lock = asyncio.Lock()
        self._groq_last_start = 0.0
        self._groq_cooldown_until: Dict[str, float] = {}
        self._state_lock = threading.Lock()

        logger.info(
            "LLMRateController: groq_max=%s min_interval=%.2fs openai_max=%s gemini_max=%s",
            self._groq_max,
            self._groq_interval,
            self._openai_max,
            self._gemini_max,
        )

    def groq_key_ready(self, api_key: str) -> bool:
        if not api_key:
            return False
        fp = _key_fingerprint(api_key)
        with self._state_lock:
            until = self._groq_cooldown_until.get(fp)
        if until is None:
            return True
        return time.monotonic() >= until

    def _set_groq_cooldown(self, api_key: str, exc: BaseException) -> None:
        fp = _key_fingerprint(api_key)
        parsed = parse_groq_retry_seconds(exc)
        if parsed is None:
            if "tokens per day" in _extract_error_message(exc).lower():
                parsed = 3600.0
            else:
                parsed = 30.0
        sec = max(5.0, min(parsed, self._cooldown_cap))
        until = time.monotonic() + sec
        with self._state_lock:
            self._groq_cooldown_until[fp] = until
        logger.warning(
            "Groq key …%s cooldown %.0fs (rate limit)",
            fp[-6:],
            sec,
        )

    async def _pace_groq_start(self) -> None:
        if self._groq_interval <= 0:
            return
        async with self._groq_pace_lock:
            now = time.monotonic()
            wait = self._groq_interval - (now - self._groq_last_start)
            if wait > 0:
                await asyncio.sleep(wait)
            self._groq_last_start = time.monotonic()

    async def run_groq(
        self,
        api_key: str,
        call: Callable[[], Awaitable[T]],
    ) -> T:
        if not self.groq_key_ready(api_key):
            raise RuntimeError("Groq API key is in cooldown; caller should try another route")
        async with self._groq_sem:
            await self._pace_groq_start()
            try:
                return await call()
            except Exception as e:
                if is_rate_limit_error(e):
                    self._set_groq_cooldown(api_key, e)
                raise

    async def run_openai(self, call: Callable[[], Awaitable[T]]) -> T:
        async with self._openai_sem:
            return await call()

    async def run_gemini(self, call: Callable[[], Awaitable[T]]) -> T:
        async with self._gemini_sem:
            return await call()


def get_llm_rate_controller() -> LLMRateController:
    global _instance
    with _singleton_lock:
        if _instance is None:
            _instance = LLMRateController()
        return _instance
