"""
Synchronous Gemini text generation via google-genai (wrapped with asyncio.to_thread in llm_abstract).

API contract: when response_mime_type is application/json, Google rejects non-JSON completions.
Thinking is disabled for JSON mode (avoids thought_signature / non-text parts breaking parsers).

Env:
  GEMINI_RESPONSE_MIME_TYPE — fallback when response_mime_type arg is None (default application/json)
  RI_GEMINI_THINKING — ignored when mime is application/json
  GEMINI_THINKING_BUDGET — used only for non-JSON mime when thinking is on
"""

from __future__ import annotations

import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


def gemini_generate_text_sync(
    *,
    api_key: str,
    model: str,
    user: str,
    system_instruction: Optional[str],
    temperature: float,
    max_output_tokens: int,
    response_mime_type: Optional[str] = None,
) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=user)],
        ),
    ]

    mime = response_mime_type
    if mime is None:
        mime = os.environ.get("GEMINI_RESPONSE_MIME_TYPE", "application/json").strip() or None

    cfg_kw: dict = {
        "temperature": temperature,
        "max_output_tokens": max_output_tokens,
    }
    if system_instruction:
        cfg_kw["system_instruction"] = system_instruction
    if mime:
        cfg_kw["response_mime_type"] = mime

    json_mode = mime == "application/json"
    thinking_on = (
        not json_mode
        and os.environ.get("RI_GEMINI_THINKING", "1").lower() not in ("0", "false", "no")
    )
    if thinking_on:
        try:
            tb = int(os.environ.get("GEMINI_THINKING_BUDGET", "-1"))
            cfg_kw["thinking_config"] = types.ThinkingConfig(thinking_budget=tb)
        except ValueError:
            pass

    config = types.GenerateContentConfig(**cfg_kw)

    try:
        resp = client.models.generate_content(
            model=model,
            contents=contents,
            config=config,
        )
        return (getattr(resp, "text", None) or "").strip()
    except Exception as e:
        if thinking_on and "thinking" in str(e).lower():
            logger.info("Gemini: retrying without thinking_config (%s)", type(e).__name__)
            cfg_kw.pop("thinking_config", None)
            config = types.GenerateContentConfig(**cfg_kw)
            resp = client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
            return (getattr(resp, "text", None) or "").strip()
        raise
