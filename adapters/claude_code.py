"""
Rezolotion Harness — Claude Code Adapter
Communicates with Claude via the Anthropic SDK.
Supports routing through a gateway (LiteLLM, 9Router, etc.) if configured.
"""
import anthropic

from adapters.base import BaseAdapter, AdapterResponse
from core.config import settings


class ClaudeCodeAdapter(BaseAdapter):
    harness_id = "claude"
    display_name = "Claude Code"

    def __init__(self) -> None:
        base_url = settings.gateway_base_url if settings.gateway_enabled else None
        api_key = (
            settings.gateway_api_key
            if settings.gateway_enabled
            else settings.claude_api_key
        )
        self.client = anthropic.AsyncAnthropic(
            api_key=api_key or "placeholder",
            base_url=base_url,
        )
        self.current_model = settings.claude_model

    def is_configured(self) -> bool:
        return bool(settings.claude_api_key or settings.gateway_enabled)

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
                error="Claude API key not configured. Set CLAUDE_API_KEY in .env",
            )

        # Build message list — history already formatted by SharedContext
        messages = history + [{"role": "user", "content": message}]

        try:
            response = await self.client.messages.create(
                model=self.current_model,
                max_tokens=8192,
                system=(
                    "You are Claude Code, an expert AI coding assistant. "
                    "You are part of a multi-harness team. "
                    "Messages labelled [AGY], [CODEX], etc. are from your teammates. "
                    "Be concise, accurate, and collaborative."
                ),
                messages=messages,  # type: ignore[arg-type]
            )
            content = response.content[0].text if response.content else ""
            return AdapterResponse(
                harness_id=self.harness_id,
                model=self.current_model,
                content=content,
                input_tokens=response.usage.input_tokens,
                output_tokens=response.usage.output_tokens,
            )
        except anthropic.APIError as e:
            return AdapterResponse(
                harness_id=self.harness_id,
                model=self.current_model,
                content="",
                error=str(e),
            )
