"""
Rezolotion Harness — Base Adapter
All harness adapters must inherit from this class.
Adding a new harness = create a file in adapters/ and extend BaseAdapter.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class AdapterResponse:
    harness_id: str
    model: str
    content: str
    input_tokens: int = 0
    output_tokens: int = 0
    error: str | None = None

    @property
    def ok(self) -> bool:
        return self.error is None


class BaseAdapter(ABC):
    """
    Abstract base class for all harness adapters.

    To add a new harness (e.g. Codex):
        1. Create  adapters/codex.py
        2. class CodexAdapter(BaseAdapter): ...
        3. Register it in adapters/__init__.py
    """

    harness_id: str  # must match HarnessID enum value
    display_name: str  # human-readable label for the UI
    current_model: str = ""

    @abstractmethod
    async def send(
        self,
        message: str,
        history: list[dict],
    ) -> AdapterResponse:
        """
        Send a message to the harness and return the response.

        Args:
            message:  The user's current message (already stripped of @tags).
            history:  Full shared conversation history as
                      [{"role": "user"|"assistant", "content": "..."}]

        Returns:
            AdapterResponse with content and token counts.
        """
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        """Return True if the harness is reachable and configured."""
        ...

    def is_configured(self) -> bool:
        """Return True if the required API key / config is present."""
        return True
