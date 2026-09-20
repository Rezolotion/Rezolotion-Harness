"""
Rezolotion Harness — Native CLI Subprocess Adapter
Executes official CLI binaries directly on the user machine (100% native).
No token interception, zero ban risk, fully authorized local session.
"""
import asyncio
import os
import shutil
from typing import AsyncGenerator, Optional
from adapters.base import BaseAdapter, AdapterResponse


class NativeClaudeCodeAdapter(BaseAdapter):
    """
    Wraps the official installed `claude` CLI binary via subprocess.
    Uses your existing, authenticated Claude Pro session directly from ~/.claude
    """
    harness_id = "claude"
    display_name = "Claude Code (Native)"
    current_model = "official-cli"

    def __init__(self):
        self.cli_path = shutil.which("claude") or os.path.expanduser("~/.local/bin/claude")

    def is_configured(self) -> bool:
        return os.path.exists(self.cli_path)

    async def health_check(self) -> bool:
        if not self.is_configured():
            return False
        try:
            proc = await asyncio.create_subprocess_exec(
                self.cli_path, "--version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await proc.communicate()
            return proc.returncode == 0
        except Exception:
            return False

    async def send(self, message: str, history: list[dict]) -> AdapterResponse:
        """
        Execute `claude -p "<prompt>"` in non-interactive print mode.
        This uses the official Claude Code runtime, official TLS handshake,
        and official credentials with zero ban risk.
        """
        if not self.is_configured():
            return AdapterResponse(
                harness_id=self.harness_id,
                model=self.current_model,
                content="",
                error=f"Claude CLI not found at {self.cli_path}",
            )

        try:
            # Execute official claude CLI with non-interactive print flag
            proc = await asyncio.create_subprocess_exec(
                self.cli_path,
                "-p",
                message,
                "--output-format",
                "text",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )

            stdout, stderr = await proc.communicate()
            output_text = stdout.decode("utf-8", errors="replace").strip()
            error_text = stderr.decode("utf-8", errors="replace").strip()

            if proc.returncode != 0 and not output_text:
                return AdapterResponse(
                    harness_id=self.harness_id,
                    model=self.current_model,
                    content="",
                    error=error_text or f"CLI exited with code {proc.returncode}",
                )

            return AdapterResponse(
                harness_id=self.harness_id,
                model=self.current_model,
                content=output_text,
                input_tokens=len(message.split()) * 2,
                output_tokens=len(output_text.split()) * 2,
            )
        except Exception as e:
            return AdapterResponse(
                harness_id=self.harness_id,
                model=self.current_model,
                content="",
                error=str(e),
            )
