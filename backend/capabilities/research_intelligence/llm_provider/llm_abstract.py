"""
Groq-first LLM bridge with rate-aware routing (see llm_rate_controller.py).

Fallback order after Groq keys: Gemini (GEMINI_API_KEY / GOOGLE_API_KEY) → OpenAI (if set).
"""

from __future__ import annotations

import asyncio
import logging
import os
from dataclasses import dataclass
from enum import Enum
from typing import Optional

from groq import Groq

try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None  # type: ignore[misc, assignment]

from .gemini_bridge import gemini_generate_text_sync
from .llm_request_context import get_user_gemini_api_key
from .llm_rate_controller import get_llm_rate_controller, is_rate_limit_error

logger = logging.getLogger(__name__)


@dataclass
class LLMResponse:
    text: str


class LLMProvider(str, Enum):
    """Legacy enum values from oncology stack; routing prefers Groq then fallbacks."""

    GROQ = "groq"
    COHERE = "cohere"
    OPENAI = "openai"


def _gemini_api_key() -> str:
    user = get_user_gemini_api_key()
    if user:
        return user
    return (
        os.environ.get("GEMINI_API_KEY", "").strip()
        or os.environ.get("GOOGLE_API_KEY", "").strip()
    )


class GroqLLMProvider:
    def __init__(self) -> None:
        self._model = os.environ.get(
            "RESEARCH_INTEL_GROQ_MODEL",
            os.environ.get("ZETA_CORE_GROQ_MODEL", "llama-3.3-70b-versatile"),
        )
        self._fallback_groq_model = os.environ.get(
            "RESEARCH_INTEL_GROQ_FALLBACK_MODEL",
            self._model,
        )
        self._openai_model = os.environ.get("RESEARCH_INTEL_OPENAI_MODEL", "gpt-4o-mini")
        self._gemini_model = os.environ.get(
            "RESEARCH_INTEL_GEMINI_MODEL",
            "gemini-3.1-pro-preview",
        )
        self._temp_default = float(
            os.environ.get(
                "RESEARCH_INTEL_GROQ_TEMPERATURE",
                os.environ.get("ZETA_CORE_GROQ_TEMPERATURE", "0.2"),
            )
        )
        self._sem = asyncio.Semaphore(max(1, int(os.environ.get("RI_LLM_CONCURRENCY", "6"))))
        self._rate = get_llm_rate_controller()

    def is_available(self) -> bool:
        g = bool(os.environ.get("GROQ_API_KEY", "").strip())
        g2 = bool(
            os.environ.get("GROQ_API_KEY_FALLBACK", "").strip()
            or os.environ.get("GROQ_API_KEY_2", "").strip()
        )
        o = bool(os.environ.get("OPENAI_API_KEY", "").strip())
        gm = bool(_gemini_api_key())
        return g or g2 or o or gm

    async def chat(
        self,
        *,
        message: Optional[str] = None,
        prompt: Optional[str] = None,
        system_message: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: int = 1024,
        response_mime_type: Optional[str] = None,
    ) -> LLMResponse:
        user = message if message is not None else prompt
        if user is None:
            raise ValueError("chat() requires message= or prompt=")

        async with self._sem:
            return await self._chat_routed(
                user=user,
                system_message=system_message,
                temperature=temperature,
                max_tokens=max_tokens,
                response_mime_type=response_mime_type,
            )

    async def _chat_routed(
        self,
        *,
        user: str,
        system_message: Optional[str],
        temperature: Optional[float],
        max_tokens: int,
        response_mime_type: Optional[str] = None,
    ) -> LLMResponse:
        temp = float(temperature if temperature is not None else self._temp_default)
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": user})

        groq_key = os.environ.get("GROQ_API_KEY", "").strip()
        groq_fb = (
            os.environ.get("GROQ_API_KEY_FALLBACK", "").strip()
            or os.environ.get("GROQ_API_KEY_2", "").strip()
        )
        openai_key = os.environ.get("OPENAI_API_KEY", "").strip()
        gemini_key = _gemini_api_key()
        rate = self._rate

        async def _groq_http(key: str, model: str) -> str:
            async def _inner() -> str:
                def _sync() -> str:
                    client = Groq(api_key=key)
                    r = client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=temp,
                        max_tokens=max_tokens,
                    )
                    return (r.choices[0].message.content or "").strip()

                return await asyncio.to_thread(_sync)

            return await rate.run_groq(key, _inner)

        groq_pairs: list[tuple[str, str]] = []
        if groq_key:
            groq_pairs.append((groq_key, self._model))
        if groq_fb and groq_fb != groq_key:
            groq_pairs.append((groq_fb, self._fallback_groq_model))

        for key, model in groq_pairs:
            if not rate.groq_key_ready(key):
                continue
            try:
                text = await _groq_http(key, model)
                return LLMResponse(text=text)
            except RuntimeError as e:
                if "cooldown" in str(e).lower():
                    continue
                raise
            except Exception as e:
                if not is_rate_limit_error(e):
                    raise
                continue

        if gemini_key:
            async def _gemini_inner() -> str:
                def _sync() -> str:
                    return gemini_generate_text_sync(
                        api_key=gemini_key,
                        model=self._gemini_model,
                        user=user,
                        system_instruction=system_message,
                        temperature=temp,
                        max_output_tokens=max_tokens,
                        response_mime_type=response_mime_type,
                    )

                return await asyncio.to_thread(_sync)

            try:
                text = await rate.run_gemini(_gemini_inner)
                return LLMResponse(text=text)
            except Exception as e:
                logger.warning("Gemini route failed; will try OpenAI if configured: %s", e)

        if openai_key and AsyncOpenAI is not None:
            async def _openai_inner() -> str:
                client = AsyncOpenAI(api_key=openai_key)
                kwargs: dict = {
                    "model": self._openai_model,
                    "messages": messages,
                    "temperature": temp,
                    "max_tokens": max_tokens,
                }
                if response_mime_type == "application/json":
                    kwargs["response_format"] = {"type": "json_object"}
                r = await client.chat.completions.create(**kwargs)
                return (r.choices[0].message.content or "").strip()

            text = await rate.run_openai(_openai_inner)
            return LLMResponse(text=text)

        raise RuntimeError(
            "No usable LLM route: Groq keys exhausted or missing; Gemini and/or OpenAI failed or not configured."
        )


def get_llm_provider(provider: Optional[LLMProvider] = None) -> GroqLLMProvider:
    _ = provider
    return GroqLLMProvider()
