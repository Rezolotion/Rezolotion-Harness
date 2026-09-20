"""
Rezolotion Harness — AntiGravity (Google Gemini) Adapter
Uses the OpenAI-compatible endpoint of Google Gemini
so it works with the gateway too.
"""
from openai import AsyncOpenAI

from adapters.base import BaseAdapter, AdapterResponse
from core.config import settings


class AntiGravityAdapter(BaseAdapter):
    harness_id = "agy"
    display_name = "AntiGravity"

    # Gemini's OpenAI-compatible endpoint
    GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/"

    def __init__(self) -> None:
        if settings.gateway_enabled:
            base_url = settings.gateway_base_url
            api_key = settings.gateway_api_key
        else:
            base_url = self.GEMINI_BASE_URL
            api_key = settings.agy_api_key

        self.client = AsyncOpenAI(
            base_url=base_url,
            api_key=api_key or "placeholder",
        )
        self.current_model = settings.agy_model

    def is_configured(self) -> bool:
        return bool(settings.agy_api_key or settings.gateway_enabled)

    async def health_check(self) -> bool:
        try:
            await self.client.models.list()
            return True
        except Exception:
            return False

    async def send(
        self,
        message: str,
        history: list[dict],
    ) -> AdapterResponse:
        if not self.is_configured():
            return AdapterResponse(
                harness_id=self.harness_id,
                model=self.current_model,
                content="",
                error="AGY API key not configured. Set AGY_API_KEY in .env",
            )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are AntiGravity, Google's advanced AI coding assistant. "
                    "You are part of a multi-harness team. "
                    "Messages labelled [CLAUDE], [CODEX], etc. are from your teammates. "
                    "Be concise, accurate, and collaborative."
                ),
            },
            *history,
            {"role": "user", "content": message},
        ]

        try:
            response = await self.client.chat.completions.create(
                model=self.current_model,
                messages=messages,  # type: ignore[arg-type]
                max_tokens=8192,
            )
            content = response.choices[0].message.content or ""
            usage = response.usage
            return AdapterResponse(
                harness_id=self.harness_id,
                model=self.current_model,
                content=content,
                input_tokens=usage.prompt_tokens if usage else 0,
                output_tokens=usage.completion_tokens if usage else 0,
            )
        except Exception as e:
            return AdapterResponse(
                harness_id=self.harness_id,
                model=self.current_model,
                content="",
                error=str(e),
            )
