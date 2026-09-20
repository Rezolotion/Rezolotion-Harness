"""
Rezolotion Harness — Adapter Registry
Central place to register all harness adapters.
"""
from adapters.base import BaseAdapter
from adapters.claude_code import ClaudeCodeAdapter
from adapters.antigravity import AntiGravityAdapter
from adapters.codex import CodexAdapter
from adapters.hermes import HermesAdapter

# Registry: harness_id → adapter instance
ADAPTERS: dict[str, BaseAdapter] = {
    "claude": ClaudeCodeAdapter(),
    "agy": AntiGravityAdapter(),
    "codex": CodexAdapter(),
    "hermes": HermesAdapter(),
}


def get_adapter(harness_id: str) -> BaseAdapter | None:
    return ADAPTERS.get(harness_id)


def get_active_adapters() -> list[BaseAdapter]:
    """Return adapters that are fully configured."""
    return [a for a in ADAPTERS.values() if a.is_configured()]


__all__ = ["ADAPTERS", "get_adapter", "get_active_adapters"]
