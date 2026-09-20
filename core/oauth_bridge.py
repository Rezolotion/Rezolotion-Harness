"""
Rezolotion Harness — 9Router Bridge & OAuth Manager
Connects to local 9Router instance to handle OAuth flows (Claude Code, AntiGravity, etc.)
and route inference requests seamlessly.
"""
import hashlib
import os
import urllib.parse
from typing import Any, Dict, List, Optional
import httpx

APP_NAME = "9router"
DEFAULT_9ROUTER_URL = "http://localhost:20128"


def get_data_dir() -> str:
    if os.environ.get("DATA_DIR"):
        return os.environ["DATA_DIR"]
    return os.path.expanduser(f"~/.{APP_NAME}")


def get_cli_token() -> str:
    """Generate the x-9r-cli-token required to authenticate with local 9Router."""
    data_dir = get_data_dir()
    machine_id_file = os.path.join(data_dir, "machine-id")
    secret_file = os.path.join(data_dir, "auth", "cli-secret")

    raw_machine_id = ""
    if os.path.exists(machine_id_file):
        with open(machine_id_file, "r") as f:
            raw_machine_id = f.read().strip()

    secret = ""
    if os.path.exists(secret_file):
        with open(secret_file, "r") as f:
            secret = f.read().strip()

    if not raw_machine_id or not secret:
        return ""

    salt = "9r-cli-auth"
    token = hashlib.sha256((raw_machine_id + salt + secret).encode("utf-8")).hexdigest()[:16]
    return token


class NineRouterBridge:
    """Interface to communicate with the local 9Router server."""

    def __init__(self, base_url: str = DEFAULT_9ROUTER_URL):
        self.base_url = base_url.rstrip("/")

    def _headers(self) -> Dict[str, str]:
        token = get_cli_token()
        headers = {"Content-Type": "application/json"}
        if token:
            headers["x-9r-cli-token"] = token
        return headers

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                r = await client.get(f"{self.base_url}/api/health", headers=self._headers())
                return r.status_code in (200, 401, 404)
        except Exception:
            return False

    async def get_providers(self) -> Dict[str, Any]:
        """Fetch all connections from 9Router."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{self.base_url}/api/providers", headers=self._headers())
                if r.status_code == 200:
                    return r.json()
        except Exception as e:
            print("Error getting providers:", e)
        return {"connections": []}

    async def get_oauth_authorize_url(self, provider: str, redirect_uri: str = "http://localhost:20128/callback") -> Dict[str, Any]:
        """
        Request the OAuth Authorization URL and PKCE credentials from 9Router.
        provider can be 'claude', 'antigravity', 'codex', etc.
        """
        encoded_uri = urllib.parse.quote(redirect_uri, safe="")
        url = f"{self.base_url}/api/oauth/{provider}/authorize?redirect_uri={encoded_uri}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(url, headers=self._headers())
            if r.status_code == 200:
                return r.json()
            raise ValueError(f"9Router returned {r.status_code}: {r.text}")

    async def exchange_oauth_code(
        self,
        provider: str,
        code: str,
        code_verifier: str,
        state: str,
        redirect_uri: str = "http://localhost:20128/callback",
    ) -> Dict[str, Any]:
        """Exchange the authorization code for tokens."""
        url = f"{self.base_url}/api/oauth/{provider}/exchange"
        payload = {
            "code": code,
            "codeVerifier": code_verifier,
            "state": state,
            "redirectUri": redirect_uri,
        }
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(url, json=payload, headers=self._headers())
            if r.status_code in (200, 201):
                return r.json()
            raise ValueError(f"Token exchange failed ({r.status_code}): {r.text}")

    async def delete_connection(self, connection_id: str) -> bool:
        """Delete an active connection in 9Router."""
        url = f"{self.base_url}/api/connections/{connection_id}"
        async with httpx.AsyncClient(timeout=5.0) as client:
            r = await client.delete(url, headers=self._headers())
            return r.status_code in (200, 204)

    async def get_models(self) -> List[Dict[str, Any]]:
        """Fetch models available through 9Router's /v1/models endpoint."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                r = await client.get(f"{self.base_url}/v1/models")
                if r.status_code == 200:
                    data = r.json()
                    return data.get("data", [])
        except Exception as e:
            print("Error fetching models:", e)
        return []

    async def chat_completion(self, model: str, messages: List[Dict[str, Any]], max_tokens: int = 8192) -> Dict[str, Any]:
        """Send chat completion request to 9Router's OpenAI-compatible endpoint."""
        url = f"{self.base_url}/v1/chat/completions"
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(url, json=payload)
            if r.status_code == 200:
                return r.json()
            raise ValueError(f"Chat completion failed ({r.status_code}): {r.text}")


# Global bridge singleton
router_bridge = NineRouterBridge()
