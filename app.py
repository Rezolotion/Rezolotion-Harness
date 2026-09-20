"""
Rezolotion Harness — FastAPI Application
Unified AI Harness with 9Router OAuth Provider Management and Multi-Agent Chat.
"""
import asyncio
import json
import os
import urllib.parse
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from core.context import SharedContext
from core.debate import DebateManager
from core.router import HarnessRouter
from core.config import settings
from core.oauth_bridge import router_bridge

app = FastAPI(title="Rezolotion Harness", version="0.2.0")

context = SharedContext(db_path=settings.db_path)
router = HarnessRouter()

ui_dir = os.path.join(os.path.dirname(__file__), "ui")
static_dir = os.path.join(ui_dir, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", response_class=HTMLResponse)
async def root():
    html_path = os.path.join(ui_dir, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        return f.read()


# ── Provider Metadata ────────────────────────────────────────────────────────

PROVIDERS_METADATA = {
    "claude": {
        "id": "claude",
        "name": "Claude Code",
        "category": "oauth",
        "color": "#e57c5c",
        "icon": "claude",
        "description": "Anthropic Claude Code CLI OAuth session with Claude Pro/Max subscription.",
        "riskNotice": "⚠️ Risk Notice: This provider uses a subscription/OAuth session not officially licensed for proxy/router use. Account may be restricted or banned. Use at your own risk.",
        "defaultModel": "cc/claude-sonnet-5",
    },
    "antigravity": {
        "id": "antigravity",
        "name": "AntiGravity",
        "category": "oauth",
        "color": "#4db6ac",
        "icon": "antigravity",
        "description": "Google AntiGravity with Gemini Pro and advanced agentic capabilities.",
        "riskNotice": "Official Google OAuth session for AntiGravity IDE and models.",
        "defaultModel": "ag/gemini-3.8-flash-high",
    },
    "codex": {
        "id": "codex",
        "name": "OpenAI Codex",
        "category": "oauth",
        "color": "#5e5ce6",
        "icon": "codex",
        "description": "OpenAI Codex developer models with reasoning and code completion.",
        "riskNotice": "",
        "defaultModel": "codex/gpt-4o",
    },
    "kiro": {
        "id": "kiro",
        "name": "Kiro AI",
        "category": "oauth",
        "color": "#ff9f0a",
        "icon": "kiro",
        "description": "AWS Builder ID with Claude Sonnet and agentic capabilities.",
        "riskNotice": "",
        "defaultModel": "kr/claude-sonnet-4.5",
    },
    "ollama": {
        "id": "ollama",
        "name": "Ollama / Local",
        "category": "local",
        "color": "#30d158",
        "icon": "ollama",
        "description": "Locally hosted open-source models with high speed and zero token cost.",
        "riskNotice": "",
        "defaultModel": "ollama/qwen3.5",
    }
}


# ── Provider REST Endpoints ──────────────────────────────────────────────────

@app.get("/api/providers")
async def get_providers():
    """List all supported providers with their active connection count and status."""
    raw = await router_bridge.get_providers()
    connections = raw.get("connections", [])

    results = []
    for pid, meta in PROVIDERS_METADATA.items():
        prov_conns = [c for c in connections if c.get("provider") == pid]
        results.append({
            **meta,
            "connectionsCount": len(prov_conns),
            "isActive": any(c.get("isActive", False) for c in prov_conns),
            "connections": prov_conns,
        })
    return {"providers": results}


@app.get("/api/providers/{provider_id}")
async def get_provider_detail(provider_id: str):
    """Get detailed information for a specific provider including connections and models."""
    if provider_id not in PROVIDERS_METADATA:
        raise HTTPException(status_code=404, detail="Provider not found")

    meta = PROVIDERS_METADATA[provider_id]
    raw = await router_bridge.get_providers()
    connections = [c for c in raw.get("connections", []) if c.get("provider") == provider_id]

    all_models = await router_bridge.get_models()
    prefix = "cc/" if provider_id == "claude" else ("ag/" if provider_id == "antigravity" else f"{provider_id}/")
    matching_models = [m for m in all_models if m.get("id", "").startswith(prefix)]

    return {
        **meta,
        "connections": connections,
        "connectionsCount": len(connections),
        "models": matching_models,
    }


@app.get("/api/oauth/{provider_id}/authorize")
async def oauth_authorize(provider_id: str, redirect_uri: str = "http://localhost:20128/callback"):
    """Generate the OAuth Authorization URL and PKCE credentials."""
    try:
        data = await router_bridge.get_oauth_authorize_url(provider_id, redirect_uri=redirect_uri)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class OAuthExchangeRequest(BaseModel):
    code: str
    codeVerifier: str
    state: str
    redirectUri: str = "http://localhost:20128/callback"


@app.post("/api/oauth/{provider_id}/exchange")
async def oauth_exchange(provider_id: str, req: OAuthExchangeRequest):
    """Exchange OAuth code for tokens and save connection in 9Router."""
    try:
        data = await router_bridge.exchange_oauth_code(
            provider=provider_id,
            code=req.code,
            code_verifier=req.codeVerifier,
            state=req.state,
            redirect_uri=req.redirectUri,
        )
        return {"success": True, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/connections/{connection_id}")
async def delete_conn(connection_id: str):
    """Disconnect an active connection."""
    success = await router_bridge.delete_connection(connection_id)
    return {"success": success}


@app.get("/api/history")
async def get_history(limit: int = 100):
    messages = await context.get_all_raw(limit=limit)
    return {"messages": messages}


@app.delete("/api/history")
async def clear_chat_history():
    await context.clear()
    return {"status": "cleared"}


# ── Model Resolver ───────────────────────────────────────────────────────────

async def resolve_model_for_harness(harness_id: str) -> str:
    """Find the best available model for the given harness."""
    models = await router_bridge.get_models()
    model_ids = [m.get("id", "") for m in models]

    if harness_id == "claude":
        # Check Claude Code models first, then AntiGravity/Kiro Claude models
        candidates = [
            "cc/claude-sonnet-5", "cc/claude-opus-5", "cc/claude-fable-5",
            "ag/claude-sonnet-4-6", "ag/claude-opus-4-6-thinking",
            "kr/claude-sonnet-4.5", "kr/claude-sonnet-4",
        ]
        for c in candidates:
            if c in model_ids:
                return c
        return "ag/claude-sonnet-4-6"

    elif harness_id == "agy":
        candidates = [
            "ag/gemini-3.8-flash-high", "ag/gemini-3.7-flash-high",
            "ag/gemini-3.8-flash", "ag/gemini-2.5-pro",
        ]
        for c in candidates:
            if c in model_ids:
                return c
        return "ag/gemini-3.8-flash-high"

    elif harness_id == "codex":
        candidates = ["codex/gpt-4o", "codex/o3", "codex/o1"]
        for c in candidates:
            if c in model_ids:
                return c
        return "gpt-4o"

    return "ag/gemini-3.8-flash-high"


# ── WebSocket Chat Handler ───────────────────────────────────────────────────

@app.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            user_message = payload.get("message", "").strip()

            if not user_message:
                continue

            await context.add(role="user", content=user_message)
            routed = router.route(user_message)

            await websocket.send_json({
                "event": "routing",
                "targets": [t.value for t in routed.targets],
                "is_debate": routed.is_debate,
                "content": routed.content,
            })

            history_msgs = await context.get_messages(limit=50)

            if routed.is_debate and len(routed.targets) > 1:
                # ── Multi-Harness Debate Mode ─────────────────────────────────
                await context.add(role="user", content=f"[DEBATE] {routed.content}")

                for round_num in range(1, 3):
                    await websocket.send_json({
                        "event": "debate_round_start",
                        "round": round_num,
                        "total": 2,
                    })

                    tasks = []
                    participants = []
                    for target in routed.targets:
                        hid = target.value
                        model_name = await resolve_model_for_harness(hid)
                        participants.append((hid, model_name))
                        messages = [
                            {"role": "system", "content": f"You are {hid.upper()} in an AI team debate. Debate constructively."},
                            *history_msgs,
                            {"role": "user", "content": routed.content},
                        ]
                        tasks.append(router_bridge.chat_completion(model=model_name, messages=messages))

                    responses = await asyncio.gather(*tasks, return_exceptions=True)

                    for (hid, model_name), resp in zip(participants, responses):
                        if isinstance(resp, Exception):
                            await websocket.send_json({
                                "event": "error", "harness": hid, "message": str(resp),
                            })
                            continue

                        choices = resp.get("choices", [])
                        content = choices[0].get("message", {}).get("content", "") if choices else ""
                        usage = resp.get("usage", {})

                        await context.add(
                            role="assistant", harness=hid, model=model_name, content=content,
                        )
                        await websocket.send_json({
                            "event": "debate_response",
                            "round": round_num,
                            "harness": hid,
                            "model": model_name,
                            "content": content,
                        })

                    history_msgs = await context.get_messages(limit=50)

                await websocket.send_json({"event": "debate_complete", "rounds": 2})

            else:
                # ── Standard Single / Broadcast Request ───────────────────────
                tasks = []
                targets_meta = []
                for target in routed.targets:
                    hid = target.value
                    model_name = await resolve_model_for_harness(hid)
                    targets_meta.append((hid, model_name))

                    system_prompt = (
                        f"You are {hid.upper()}, a specialized AI agent in Rezolotion Harness. "
                        f"Teammate messages are tagged with [TAG]. Collaborate accurately."
                    )
                    messages = [
                        {"role": "system", "content": system_prompt},
                        *history_msgs,
                        {"role": "user", "content": routed.content},
                    ]
                    tasks.append(router_bridge.chat_completion(model=model_name, messages=messages))

                responses = await asyncio.gather(*tasks, return_exceptions=True)

                for (hid, model_name), resp in zip(targets_meta, responses):
                    if isinstance(resp, Exception):
                        await websocket.send_json({
                            "event": "error", "harness": hid, "message": str(resp),
                        })
                        continue

                    choices = resp.get("choices", [])
                    content = choices[0].get("message", {}).get("content", "") if choices else ""
                    usage = resp.get("usage", {})

                    await context.add(
                        role="assistant", harness=hid, model=model_name, content=content,
                    )
                    await websocket.send_json({
                        "event": "response",
                        "harness": hid,
                        "model": model_name,
                        "content": content,
                        "tokens": {
                            "input": usage.get("prompt_tokens", 0),
                            "output": usage.get("completion_tokens", 0),
                        },
                    })

            await websocket.send_json({"event": "done"})

    except WebSocketDisconnect:
        pass
