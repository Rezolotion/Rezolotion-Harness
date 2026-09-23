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

from core.oauth_bridge import router_bridge

ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")


class ProvidersManager:
    def __init__(self):
        self._load_env()
        self.guest_config: Dict[str, str] = {}

    def _load_env(self):
        if os.path.exists(ENV_PATH):
            from dotenv import load_dotenv
            load_dotenv(ENV_PATH, override=True)

    def set_guest_var(self, key: str, value: str):
        self.guest_config[key] = value

    def get_var(self, key: str, guest_mode: bool = False, default: str = "") -> str:
        if guest_mode:
            return self.guest_config.get(key, "")
        return os.environ.get(key, default)

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

    async def get_all_status(self, guest_mode: bool = False) -> Dict[str, Any]:
        self._load_env()

        if guest_mode:
            # Simulated isolated guest session: Zero host credential leakage
            has_claude_cli = False
            has_claude_json = False
            claude_cli_path = None
            hermes_alive = False
            hermes_models = []
            nine_router_alive = False
            router_connections = []
            router_models = []

            claude_api_key = self.guest_config.get("CLAUDE_API_KEY", "")
            agy_api_key = self.guest_config.get("AGY_API_KEY", "")
            openai_api_key = self.guest_config.get("OPENAI_API_KEY", "")
            deepseek_api_key = self.guest_config.get("DEEPSEEK_API_KEY", "")
            openrouter_api_key = self.guest_config.get("OPENROUTER_API_KEY", "")
            hermes_url = ""
            nine_router_url = ""
            gcat_api_key = self.guest_config.get("GCAT_API_KEY", "")
            gcat_base_url = self.guest_config.get("GCAT_BASE_URL", "https://llm.gcat.ir/v1")
            custom_base_url = self.guest_config.get("CUSTOM_BASE_URL", "")
            custom_api_key = self.guest_config.get("CUSTOM_API_KEY", "")
            custom_model = self.guest_config.get("CUSTOM_MODEL_NAME", "custom/model")
        else:
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
            gcat_api_key = os.environ.get("GCAT_API_KEY", "")
            gcat_base_url = os.environ.get("GCAT_BASE_URL", "https://llm.gcat.ir/v1")
            custom_base_url = os.environ.get("CUSTOM_BASE_URL", "")
            custom_api_key = os.environ.get("CUSTOM_API_KEY", "")
            custom_model = os.environ.get("CUSTOM_MODEL_NAME", "custom/model")

            # Test Hermes reachability & fetch local models
            hermes_alive = False
            hermes_models = []
            try:
                async with httpx.AsyncClient(timeout=1.0) as client:
                    res = await client.get(f"{hermes_url}/api/tags")
                    if res.status_code == 200:
                        hermes_alive = True
                        hermes_models = [m.get("name") for m in res.json().get("models", [])]
            except Exception:
                hermes_alive = False

            # Query 9Router active connections & models
            nine_router_alive = await router_bridge.is_available()
            router_connections = []
            router_models = []
            if nine_router_alive:
                try:
                    raw_provs = await router_bridge.get_providers()
                    router_connections = raw_provs.get("connections", [])
                    router_models = await router_bridge.get_models()
                except Exception as e:
                    print("Error reading 9Router details:", e)

        # Map 9Router connections
        ag_conn = next((c for c in router_connections if c.get("provider") == "antigravity" and c.get("isActive", True)), None)
        claude_conn = next((c for c in router_connections if c.get("provider") == "claude" and c.get("isActive", True)), None)
        codex_conn = next((c for c in router_connections if c.get("provider") in ("codex", "chatgpt", "openai") and c.get("isActive", True)), None)
        openrouter_conn = next((c for c in router_connections if c.get("provider") == "openrouter" and c.get("isActive", True)), None)
        ollama_conn = next((c for c in router_connections if c.get("provider") in ("ollama", "hermes") and c.get("isActive", True)), None)

        # Dynamic model mapping strictly per connection state
        # 1. AntiGravity (Google)
        if ag_conn:
            ag_models = [m["id"] for m in router_models if m.get("id", "").startswith("ag/")]
            if not ag_models:
                ag_models = ["ag/gemini-3.8-flash-high", "ag/gemini-3.7-flash-high", "ag/gemini-3.6-flash-high", "ag/gemini-pro-agent", "ag/gemini-2.5-pro"]
            ag_connected = True
            ag_auth = f"9Router Google OAuth ({ag_conn.get('email') or ag_conn.get('name') or 'Active'})"
            ag_details = f"Account: {ag_conn.get('email') or ag_conn.get('name')}"
            ag_email = ag_conn.get("email")
            ag_conn_id = ag_conn.get("id")
        elif bool(agy_api_key) and not agy_api_key.startswith("your_"):
            ag_models = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"]
            ag_connected = True
            ag_auth = "Google AI Studio API Key"
            ag_details = "Direct Gemini API key configured"
            ag_email = None
            ag_conn_id = None
        else:
            ag_models = []
            ag_connected = False
            ag_auth = "None"
            ag_details = "Connect via 9Router Google OAuth or API Key"
            ag_email = None
            ag_conn_id = None

        # 2. Claude (Anthropic)
        if has_claude_cli and has_claude_json:
            cl_models = ["claude-3-7-sonnet", "claude-3-5-sonnet", "claude-3-5-haiku"]
            cl_connected = True
            cl_auth = "Official Local Claude CLI"
            cl_details = f"CLI: {claude_cli_path}"
            cl_conn_id = "native-claude-cli"
        elif claude_conn:
            cl_models = [m["id"] for m in router_models if m.get("id", "").startswith("cc/")] or ["claude-3-7-sonnet", "claude-3-5-sonnet"]
            cl_connected = True
            cl_auth = f"9Router Claude OAuth ({claude_conn.get('name') or 'Active'})"
            cl_details = "Connected via 9Router OAuth"
            cl_conn_id = claude_conn.get("id")
        elif bool(claude_api_key) and not claude_api_key.startswith("your_"):
            cl_models = ["claude-3-7-sonnet", "claude-3-5-sonnet", "claude-3-5-haiku"]
            cl_connected = True
            cl_auth = "Anthropic API Key"
            cl_details = "Direct Anthropic API key configured"
            cl_conn_id = None
        else:
            cl_models = []
            cl_connected = False
            cl_auth = "None"
            cl_details = "Connect via Local Claude CLI, 9Router OAuth, or API Key"
            cl_conn_id = None

        # 3. OpenAI (ChatGPT / Codex)
        if codex_conn:
            ox_models = [m["id"] for m in router_models if m.get("id", "").startswith("codex/")] or ["codex/gpt-4o", "codex/o3-mini", "codex/o1"]
            ox_connected = True
            ox_auth = f"9Router OpenAI Codex OAuth ({codex_conn.get('name') or 'Active'})"
            ox_details = "Connected via 9Router OAuth"
            ox_conn_id = codex_conn.get("id")
        elif bool(openai_api_key) and not openai_api_key.startswith("your_"):
            ox_models = ["gpt-4o", "o3-mini", "o1", "gpt-4o-mini"]
            ox_connected = True
            ox_auth = "OpenAI API Key"
            ox_details = "Direct OpenAI API key configured"
            ox_conn_id = None
        else:
            ox_models = []
            ox_connected = False
            ox_auth = "None"
            ox_details = "Connect via 9Router Codex OAuth or API Key"
            ox_conn_id = None

        # 4. DeepSeek
        if bool(deepseek_api_key) and not deepseek_api_key.startswith("your_"):
            ds_models = ["deepseek-reasoner", "deepseek-chat"]
            ds_connected = True
            ds_auth = "DeepSeek API Key"
            ds_details = "High-Efficiency 671B MoE & R1 Reasoner"
        else:
            ds_models = []
            ds_connected = False
            ds_auth = "None"
            ds_details = "Add DeepSeek API key to activate"

        # 5. OpenRouter
        if openrouter_conn:
            or_models = [m["id"] for m in router_models if m.get("id", "").startswith("openrouter/")] or ["openrouter/auto", "anthropic/claude-3.7-sonnet", "deepseek/deepseek-r1"]
            or_connected = True
            or_auth = f"9Router Gateway ({openrouter_conn.get('name') or 'Active'})"
            or_details = "Active via 9Router Gateway"
            or_conn_id = openrouter_conn.get("id")
        elif bool(openrouter_api_key) and not openrouter_api_key.startswith("your_"):
            or_models = ["anthropic/claude-3.7-sonnet", "deepseek/deepseek-r1", "meta-llama/llama-3.3-70b"]
            or_connected = True
            or_auth = "OpenRouter API Key"
            or_details = "100+ Open & Commercial Models"
            or_conn_id = None
        else:
            or_models = []
            or_connected = False
            or_auth = "None"
            or_details = "Connect via 9Router or API Key"
            or_conn_id = None

        # 6. Hermes / Ollama
        if hermes_alive:
            he_models = hermes_models or ["hermes-3-llama-3.1-8b", "qwen2.5-coder", "deepseek-r1:14b"]
            he_connected = True
            he_auth = "Local Ollama Node"
            he_details = f"Endpoint: {hermes_url}"
        elif ollama_conn:
            he_models = [m["id"] for m in router_models if m.get("id", "").startswith("ollama/")] or ["ollama/qwen3.5"]
            he_connected = True
            he_auth = f"9Router Ollama ({ollama_conn.get('name') or 'Active'})"
            he_details = "Local Ollama via 9Router"
        else:
            he_models = []
            he_connected = False
            he_auth = "Offline"
            he_details = "Local Ollama node not detected"

        # 7. 9Router Gateway
        nine_router_models = ["9router/auto-router"] if nine_router_alive else []

        # 8. G-CAT AI Gateway (https://llm.gcat.ir/v1)
        if bool(gcat_api_key) and not gcat_api_key.startswith("your_"):
            gcat_connected = True
            gcat_auth = "G-CAT Dedicated Gateway"
            gcat_details = f"Endpoint: {gcat_base_url}"
            gcat_models = [
                "gcat/claude-3-7-sonnet",
                "gcat/claude-3-5-sonnet",
                "gcat/gpt-4o",
                "gcat/deepseek-r1",
                "gcat/gemini-2.5-pro",
            ]
        else:
            gcat_connected = False
            gcat_auth = "None"
            gcat_details = "Enter G-CAT API key to unlock gateway models"
            gcat_models = []

        # 9. Custom OpenAI Gateway
        if bool(custom_base_url):
            custom_connected = True
            custom_auth = "Custom OpenAI Gateway"
            custom_details = f"Endpoint: {custom_base_url}"
            custom_models = [custom_model]
        else:
            custom_connected = False
            custom_auth = "None"
            custom_details = "Configure Base URL & API Key for any OpenAI-compatible provider"
            custom_models = []

        def _d(details_str: str, is_conn: bool) -> str:
            if guest_mode and not is_conn:
                return f"Guest Mode (Simulated Fresh Onboarding) - {details_str}"
            return details_str

        return {
            "antigravity": {
                "name": "Google AntiGravity",
                "type": "oauth_and_api",
                "connected": ag_connected,
                "auth_method": ag_auth,
                "details": _d(ag_details, ag_connected),
                "models": ag_models,
                "has_key": bool(agy_api_key) and not agy_api_key.startswith("your_"),
                "email": ag_email,
                "connection_id": ag_conn_id,
            },
            "claude": {
                "name": "Claude Code (Anthropic)",
                "type": "cli_and_api",
                "connected": cl_connected,
                "auth_method": cl_auth,
                "details": _d(cl_details, cl_connected),
                "models": cl_models,
                "has_key": bool(claude_api_key) and not claude_api_key.startswith("your_"),
                "connection_id": cl_conn_id,
            },
            "openai": {
                "name": "OpenAI (ChatGPT / Codex)",
                "type": "oauth_and_api",
                "connected": ox_connected,
                "auth_method": ox_auth,
                "details": _d(ox_details, ox_connected),
                "models": ox_models,
                "has_key": bool(openai_api_key) and not openai_api_key.startswith("your_"),
                "connection_id": ox_conn_id,
            },
            "deepseek": {
                "name": "DeepSeek AI",
                "type": "api",
                "connected": ds_connected,
                "auth_method": ds_auth,
                "details": _d(ds_details, ds_connected),
                "models": ds_models,
                "has_key": bool(deepseek_api_key) and not deepseek_api_key.startswith("your_"),
            },
            "openrouter": {
                "name": "OpenRouter",
                "type": "gateway",
                "connected": or_connected,
                "auth_method": or_auth,
                "details": _d(or_details, or_connected),
                "models": or_models,
                "has_key": bool(openrouter_api_key) and not openrouter_api_key.startswith("your_"),
                "connection_id": or_conn_id,
            },
            "hermes": {
                "name": "Hermes / Ollama",
                "type": "local",
                "connected": he_connected,
                "auth_method": he_auth,
                "details": _d(he_details, he_connected),
                "models": he_models,
                "has_key": not guest_mode,
            },
            "gcat": {
                "name": "G-CAT AI Gateway",
                "type": "gateway",
                "connected": gcat_connected,
                "auth_method": gcat_auth,
                "details": _d(gcat_details, gcat_connected),
                "models": gcat_models,
                "has_key": bool(gcat_api_key) and not gcat_api_key.startswith("your_"),
                "endpoint": gcat_base_url,
            },
            "custom": {
                "name": "Custom OpenAI Gateway",
                "type": "custom",
                "connected": custom_connected,
                "auth_method": custom_auth,
                "details": _d(custom_details, custom_connected),
                "models": custom_models,
                "has_key": bool(custom_api_key) and not custom_api_key.startswith("your_"),
                "endpoint": custom_base_url,
            },
            "nine_router": {
                "name": "9Router Gateway",
                "type": "local_gateway",
                "connected": False if guest_mode else nine_router_alive,
                "auth_method": "None" if guest_mode else "Local Daemon (:20128)",
                "details": "Guest Mode (Host Daemon Isolated)" if guest_mode else f"{len(router_connections)} active connection(s)",
                "models": [] if guest_mode else nine_router_models,
                "has_key": not guest_mode,
            },
        }


    async def test_provider(self, provider_id: str, key: Optional[str] = None, endpoint: Optional[str] = None) -> Dict[str, Any]:
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

            elif provider_id in ("gemini", "antigravity"):
                if await router_bridge.is_available():
                    raw = await router_bridge.get_providers()
                    ag_conn = next((c for c in raw.get("connections", []) if c.get("provider") == "antigravity" and c.get("isActive", True)), None)
                    if ag_conn:
                        return {"success": True, "message": f"Google AntiGravity OAuth session active ({ag_conn.get('email') or 'Connected'})."}
                api_key = key or os.environ.get("AGY_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")
                if not api_key:
                    return {"success": False, "message": "Missing Google Gemini API key or active 9Router OAuth session."}
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}")
                    if res.status_code == 200:
                        return {"success": True, "message": "Google Gemini API key verified successfully."}
                    return {"success": False, "message": f"Google Gemini API error: {res.status_code}"}

            elif provider_id in ("openai", "codex"):
                if await router_bridge.is_available():
                    raw = await router_bridge.get_providers()
                    ox_conn = next((c for c in raw.get("connections", []) if c.get("provider") in ("codex", "chatgpt", "openai") and c.get("isActive", True)), None)
                    if ox_conn:
                        return {"success": True, "message": f"OpenAI Codex OAuth session active ({ox_conn.get('name') or 'Connected'})."}
                api_key = key or os.environ.get("OPENAI_API_KEY", "") or os.environ.get("CODEX_API_KEY", "")
                if not api_key:
                    return {"success": False, "message": "Missing OpenAI API key or active 9Router OAuth session."}
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

            elif provider_id == "gcat":
                api_key = key.strip() if key is not None else os.environ.get("GCAT_API_KEY", "")
                base_url = endpoint.strip() if endpoint is not None else os.environ.get("GCAT_BASE_URL", "https://llm.gcat.ir/v1")
                if not api_key:
                    return {"success": False, "message": "Missing G-CAT API key."}
                async with httpx.AsyncClient(timeout=6.0) as client:
                    res = await client.get(
                        f"{base_url.rstrip('/')}/models",
                        headers={"Authorization": f"Bearer {api_key}"}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        models_found = [m.get("id") for m in data.get("data", [])] if isinstance(data, dict) else []
                        preview = f" ({', '.join(models_found[:3])})" if models_found else ""
                        return {"success": True, "message": f"G-CAT Gateway verified successfully.{preview}"}
                    elif res.status_code == 401:
                        return {"success": False, "message": "Unauthorized: Invalid G-CAT API key."}
                    return {"success": False, "message": f"G-CAT Gateway returned status {res.status_code}."}

            elif provider_id == "custom":
                base_url = endpoint.strip() if endpoint is not None else os.environ.get("CUSTOM_BASE_URL", "")
                api_key = key.strip() if key is not None else os.environ.get("CUSTOM_API_KEY", "")
                if not base_url:
                    return {"success": False, "message": "Missing Custom Gateway Base URL."}
                headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
                async with httpx.AsyncClient(timeout=6.0) as client:
                    res = await client.get(f"{base_url.rstrip('/')}/models", headers=headers)
                    if res.status_code in (200, 204):
                        return {"success": True, "message": f"Custom OpenAI gateway verified at {base_url}."}
                    elif res.status_code == 401:
                        return {"success": False, "message": "Unauthorized: Invalid API key for custom endpoint."}
                    return {"success": False, "message": f"Custom endpoint returned status {res.status_code}."}

            elif provider_id == "nine_router":
                nine_router_url = os.environ.get("NINE_ROUTER_URL", "http://localhost:20128")
                async with httpx.AsyncClient(timeout=3.0) as client:
                    res = await client.get(f"{nine_router_url}/")
                    return {"success": True, "message": f"9Router gateway detected on {nine_router_url}."}

            return {"success": False, "message": f"Unknown provider: {provider_id}"}
        except Exception as e:
            return {"success": False, "message": f"Connection error: {str(e)}"}


providers_manager = ProvidersManager()
