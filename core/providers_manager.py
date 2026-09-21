"""
Rezolotion Harness — Multi-Provider Authentication & Connection Manager
Handles native sessions, API keys, and connection testing for:
- Claude Code (Official Anthropic CLI & API)
- Google AntiGravity / Gemini (Google ADC, gcloud, API Key)
- OpenAI / ChatGPT / Codex
- DeepSeek (R1 Reasoner & V3)
- OpenRouter (Unified Open Weights)
- Hermes / Ollama (Local Node)
- 9Router (Local Gateway)
"""
import os
import shutil
import json
import httpx
from typing import Dict, Any, Optional

ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")


class ProvidersManager:
    def __init__(self):
        self._load_env()

    def _load_env(self):
        if os.path.exists(ENV_PATH):
            from dotenv import load_dotenv
            load_dotenv(ENV_PATH, override=True)

    def save_env_var(self, key: str, value: str):
        self._load_env()
        lines = []
        found = False
        if os.path.exists(ENV_PATH):
            with open(ENV_PATH, "r", encoding="utf-8") as f:
                lines = f.readlines()
        
        new_lines = []
        for line in lines:
            if line.strip().startswith(f"{key}="):
                new_lines.append(f"{key}={value}\n")
                found = True
            else:
                new_lines.append(line)
        if not found:
            new_lines.append(f"{key}={value}\n")

        with open(ENV_PATH, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        os.environ[key] = value

    async def get_all_status(self) -> Dict[str, Any]:
        self._load_env()
        claude_cli_path = shutil.which("claude")
        claude_json_path = os.path.expanduser("~/.claude.json")
        has_claude_cli = claude_cli_path is not None
        has_claude_json = os.path.exists(claude_json_path)

        claude_api_key = os.environ.get("CLAUDE_API_KEY", "") or os.environ.get("ANTHROPIC_API_KEY", "")
        agy_api_key = os.environ.get("AGY_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")
        openai_api_key = os.environ.get("OPENAI_API_KEY", "") or os.environ.get("CODEX_API_KEY", "")
        deepseek_api_key = os.environ.get("DEEPSEEK_API_KEY", "")
        openrouter_api_key = os.environ.get("OPENROUTER_API_KEY", "")
        hermes_url = os.environ.get("HERMES_BASE_URL", "http://localhost:11434")
        nine_router_url = os.environ.get("NINE_ROUTER_URL", "http://localhost:20128")

        # Test Hermes reachability
        hermes_alive = False
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                res = await client.get(f"{hermes_url}/api/tags")
                hermes_alive = (res.status_code == 200)
        except Exception:
            hermes_alive = False

        # Test 9Router reachability
        nine_router_alive = False
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                res = await client.get(f"{nine_router_url}/")
                nine_router_alive = (res.status_code in (200, 404, 401))
        except Exception:
            nine_router_alive = False

        return {
            "claude": {
                "name": "Claude Code (Anthropic)",
                "type": "cli_and_api",
                "connected": (has_claude_cli and has_claude_json) or (bool(claude_api_key) and not claude_api_key.startswith("your_")),
                "auth_method": "Native CLI Session" if (has_claude_cli and has_claude_json) else ("API Key" if claude_api_key else "None"),
                "details": f"CLI: {claude_cli_path}" if has_claude_cli else "CLI not found",
                "models": ["claude-3-7-sonnet", "claude-3-5-sonnet", "claude-3-5-haiku", "opus-5"],
                "has_key": bool(claude_api_key) and not claude_api_key.startswith("your_")
            },
            "gemini": {
                "name": "Google AntiGravity (Gemini)",
                "type": "api_and_adc",
                "connected": bool(agy_api_key) and not agy_api_key.startswith("your_"),
                "auth_method": "Google AI Studio Key / ADC",
                "details": "Context Window: 2,000,000 tokens",
                "models": ["gemini-2.5-pro", "gemini-3.0-flash", "gemini-2.0-flash-thinking"],
                "has_key": bool(agy_api_key) and not agy_api_key.startswith("your_")
            },
            "openai": {
                "name": "OpenAI (ChatGPT / Codex)",
                "type": "api",
                "connected": bool(openai_api_key) and not openai_api_key.startswith("your_"),
                "auth_method": "OpenAI API Key",
                "details": "Multimodal & Advanced Reasoning",
                "models": ["gpt-4o", "o3-mini", "o1", "gpt-4o-mini"],
                "has_key": bool(openai_api_key) and not openai_api_key.startswith("your_")
            },
            "deepseek": {
                "name": "DeepSeek AI",
                "type": "api",
                "connected": bool(deepseek_api_key) and not deepseek_api_key.startswith("your_"),
                "auth_method": "DeepSeek API Key",
                "details": "High-Efficiency 671B MoE & R1 Reasoner",
                "models": ["deepseek-reasoner", "deepseek-chat"],
                "has_key": bool(deepseek_api_key) and not deepseek_api_key.startswith("your_")
            },
            "openrouter": {
                "name": "OpenRouter",
                "type": "gateway",
                "connected": bool(openrouter_api_key) and not openrouter_api_key.startswith("your_"),
                "auth_method": "OpenRouter API Key",
                "details": "100+ Open & Commercial Models",
                "models": ["anthropic/claude-3.7-sonnet", "deepseek/deepseek-r1", "meta-llama/llama-3.3-70b"],
                "has_key": bool(openrouter_api_key) and not openrouter_api_key.startswith("your_")
            },
            "hermes": {
                "name": "Hermes / Ollama",
                "type": "local",
                "connected": hermes_alive,
                "auth_method": "Local Instance",
                "details": f"Endpoint: {hermes_url}",
                "models": ["hermes-3-llama-3.1-8b", "qwen2.5-coder", "deepseek-r1:14b"],
                "has_key": True
            },
            "nine_router": {
                "name": "9Router Gateway",
                "type": "local_gateway",
                "connected": nine_router_alive,
                "auth_method": "Local CLI Secret & Machine ID",
                "details": f"Port: {nine_router_url}",
                "models": ["claude-native", "gemini-native", "auto-router"],
                "has_key": True
            }
        }

    async def test_provider(self, provider_id: str, key: Optional[str] = None) -> Dict[str, Any]:
        self._load_env()
        try:
            if provider_id == "claude":
                api_key = key or os.environ.get("CLAUDE_API_KEY", "")
                if api_key:
                    async with httpx.AsyncClient(timeout=5.0) as client:
                        res = await client.get(
                            "https://api.anthropic.com/v1/models",
                            headers={"x-api-key": api_key, "anthropic-version": "2023-06-01"}
                        )
                        if res.status_code in (200, 400):
                            return {"success": True, "message": "Anthropic API connection verified successfully."}
                # Check CLI
                if shutil.which("claude"):
                    return {"success": True, "message": "Claude CLI session detected and ready for headless execution."}
                return {"success": False, "message": "Claude CLI or API key not found."}

            elif provider_id == "gemini":
                api_key = key or os.environ.get("AGY_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")
                if not api_key:
                    return {"success": False, "message": "Missing Google Gemini API key."}
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}")
                    if res.status_code == 200:
                        return {"success": True, "message": "Google Gemini API key verified successfully."}
                    return {"success": False, "message": f"Google Gemini API error: {res.status_code}"}

            elif provider_id == "openai":
                api_key = key or os.environ.get("OPENAI_API_KEY", "") or os.environ.get("CODEX_API_KEY", "")
                if not api_key:
                    return {"success": False, "message": "Missing OpenAI API key."}
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.get("https://api.openai.com/v1/models", headers={"Authorization": f"Bearer {api_key}"})
                    if res.status_code == 200:
                        return {"success": True, "message": "OpenAI API connection verified successfully."}
                    return {"success": False, "message": f"OpenAI error: {res.status_code}"}

            elif provider_id == "deepseek":
                api_key = key or os.environ.get("DEEPSEEK_API_KEY", "")
                if not api_key:
                    return {"success": False, "message": "Missing DeepSeek API key."}
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.get("https://api.deepseek.com/models", headers={"Authorization": f"Bearer {api_key}"})
                    if res.status_code == 200:
                        return {"success": True, "message": "DeepSeek API verified successfully."}
                    return {"success": False, "message": f"DeepSeek error: {res.status_code}"}

            elif provider_id == "openrouter":
                api_key = key or os.environ.get("OPENROUTER_API_KEY", "")
                if not api_key:
                    return {"success": False, "message": "Missing OpenRouter API key."}
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.get("https://openrouter.ai/api/v1/auth/key", headers={"Authorization": f"Bearer {api_key}"})
                    if res.status_code == 200:
                        return {"success": True, "message": "OpenRouter API key verified successfully."}
                    return {"success": False, "message": f"OpenRouter error: {res.status_code}"}

            elif provider_id == "hermes":
                hermes_url = os.environ.get("HERMES_BASE_URL", "http://localhost:11434")
                async with httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.get(f"{hermes_url}/api/tags")
                    if res.status_code == 200:
                        models = [m.get("name") for m in res.json().get("models", [])]
                        return {"success": True, "message": f"Ollama/Hermes connected. Available models: {', '.join(models[:3])}"}
                    return {"success": False, "message": f"Ollama returned {res.status_code}"}

            elif provider_id == "nine_router":
                nine_router_url = os.environ.get("NINE_ROUTER_URL", "http://localhost:20128")
                async with httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.get(f"{nine_router_url}/")
                    return {"success": True, "message": f"9Router gateway detected on {nine_router_url}."}

            return {"success": False, "message": f"Unknown provider: {provider_id}"}
        except Exception as e:
            return {"success": False, "message": f"Connection error: {str(e)}"}


providers_manager = ProvidersManager()
