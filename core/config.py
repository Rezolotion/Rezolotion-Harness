"""
Rezolotion Harness — Configuration
Loads settings from environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Claude Code ──────────────────────────────────────────────────────────
    claude_api_key: str = Field(default="", alias="CLAUDE_API_KEY")
    claude_model: str = Field(default="claude-3-7-sonnet-20250219", alias="CLAUDE_MODEL")

    # ── AntiGravity ──────────────────────────────────────────────────────────
    agy_api_key: str = Field(default="", alias="AGY_API_KEY")
    agy_model: str = Field(default="gemini-2.5-pro", alias="AGY_MODEL")

    # ── Codex (future) ───────────────────────────────────────────────────────
    codex_api_key: str = Field(default="", alias="CODEX_API_KEY")
    codex_model: str = Field(default="gpt-4o", alias="CODEX_MODEL")

    # ── Hermes (future) ──────────────────────────────────────────────────────
    hermes_base_url: str = Field(default="http://localhost:11434", alias="HERMES_BASE_URL")
    hermes_model: str = Field(default="hermes3", alias="HERMES_MODEL")

    # ── Gateway (optional) ───────────────────────────────────────────────────
    gateway_enabled: bool = Field(default=False, alias="GATEWAY_ENABLED")
    gateway_base_url: str = Field(default="http://localhost:4000/v1", alias="GATEWAY_BASE_URL")
    gateway_api_key: str = Field(default="", alias="GATEWAY_API_KEY")

    # ── Server ───────────────────────────────────────────────────────────────
    host: str = Field(default="localhost", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    debug: bool = Field(default=False, alias="DEBUG")

    # ── Memory ───────────────────────────────────────────────────────────────
    db_path: str = Field(default="./data/history.db", alias="DB_PATH")
    max_history_messages: int = Field(default=100, alias="MAX_HISTORY_MESSAGES")


settings = Settings()
