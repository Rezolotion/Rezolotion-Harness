"""
Rezolotion Harness — Hermes Adapter (Placeholder — Coming Soon)
Hermes runs locally via Ollama.
"""
from adapters.base import BaseAdapter, AdapterResponse
from core.config import settings


class HermesAdapter(BaseAdapter):
    harness_id = "hermes"
    display_name = "Hermes"

    def __init__(self) -> None:
        self.current_model = settings.hermes_model

    def is_configured(self) -> bool:
        return False  # Will check Ollama reachability in Phase 2

    async def health_check(self) -> bool:
        return False

    async def send(self, message: str, history: list[dict]) -> AdapterResponse:
        return AdapterResponse(
            harness_id=self.harness_id,
            model=self.current_model,
            content="",
            error="Hermes adapter is not yet implemented. Coming in Phase 2!",
        )
