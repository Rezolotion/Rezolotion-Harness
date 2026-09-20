"""
Rezolotion Harness — Codex Adapter (Placeholder — Coming Soon)
"""
from adapters.base import BaseAdapter, AdapterResponse


class CodexAdapter(BaseAdapter):
    harness_id = "codex"
    display_name = "Codex"
    current_model = "coming-soon"

    def is_configured(self) -> bool:
        return False

    async def health_check(self) -> bool:
        return False

    async def send(self, message: str, history: list[dict]) -> AdapterResponse:
        return AdapterResponse(
            harness_id=self.harness_id,
            model=self.current_model,
            content="",
            error="Codex adapter is not yet implemented. Coming in Phase 2!",
        )
