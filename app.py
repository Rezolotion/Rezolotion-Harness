"""
Rezolotion Harness — FastAPI Application
Unified AI Harness with Native Zero-Risk CLI Execution + 9Router Integration.
"""
import asyncio
import json
import os
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from core.context import SharedContext
from core.debate import DebateManager
from core.router import HarnessRouter
from core.config import settings
from core.oauth_bridge import router_bridge
from core.studio_store import studio_store
from adapters.native_claude import NativeClaudeCodeAdapter

app = FastAPI(title="Rezolotion Harness", version="0.3.0")

context = SharedContext(db_path=settings.db_path)
router = HarnessRouter()
native_claude = NativeClaudeCodeAdapter()

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
        "name": "Anthropic Claude (Native CLI)",
        "category": "native",
        "color": "#e57c5c",
        "icon": "claude",
        "description": "Official installed Claude Code CLI binary. 100% authentic session, zero ban risk.",
        "riskNotice": "Zero Ban Risk: Running via official local Claude Code binary (~/.local/bin/claude).",
        "defaultModel": "claude-3-7-sonnet",
        "isNative": True,
    },
    "deepseek": {
        "id": "deepseek",
        "name": "DeepSeek AI",
        "category": "cloud",
        "color": "#4d6bfe",
        "icon": "deepseek",
        "description": "DeepSeek R1 Reasoner & V3 MoE 671B open weights with deep math and reasoning.",
        "riskNotice": "Direct API bridge with uncensored deep thinking capabilities.",
        "defaultModel": "deepseek-reasoner-r1",
        "isNative": False,
    },
    "chatgpt": {
        "id": "chatgpt",
        "name": "OpenAI ChatGPT",
        "category": "cloud",
        "color": "#10a37f",
        "icon": "chatgpt",
        "description": "OpenAI GPT-4o and o3-mini models with omni vision, audio and reasoning.",
        "riskNotice": "Official OpenAI session with ultra-high context support.",
        "defaultModel": "chatgpt-4o",
        "isNative": False,
    },
    "antigravity": {
        "id": "antigravity",
        "name": "Google AntiGravity",
        "category": "oauth",
        "color": "#4285f4",
        "icon": "antigravity",
        "description": "Google AntiGravity with Gemini Pro 2M context and agentic skills.",
        "riskNotice": "Official Google Session for AntiGravity IDE and models.",
        "defaultModel": "gemini-2.5-pro",
        "isNative": True,
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
        "isNative": False,
    },
    "ollama": {
        "id": "ollama",
        "name": "Ollama / Local",
        "category": "local",
        "color": "#30d158",
        "icon": "ollama",
        "description": "Locally hosted open-source models (Llama 3.3, Qwen 2.5) with zero token cost.",
        "riskNotice": "",
        "defaultModel": "ollama/qwen3.5",
        "isNative": True,
    }
}


@app.get("/api/providers")
async def get_providers():
    raw = await router_bridge.get_providers()
    connections = raw.get("connections", [])

    results = []
    for pid, meta in PROVIDERS_METADATA.items():
        prov_conns = [c for c in connections if c.get("provider") == pid]
        is_active = any(c.get("isActive", False) for c in prov_conns)

        # Native Claude CLI is always active if installed locally
        if pid == "claude" and native_claude.is_configured():
            is_active = True
            prov_conns = prov_conns or [{
                "id": "native-claude-cli",
                "name": "Official Local Claude CLI",
                "authType": "native-session",
                "priority": 1,
                "isActive": True,
            }]

        results.append({
            **meta,
            "connectionsCount": len(prov_conns),
            "isActive": is_active,
            "connections": prov_conns,
        })
    return {"providers": results}


@app.get("/api/providers/{provider_id}")
async def get_provider_detail(provider_id: str):
    if provider_id not in PROVIDERS_METADATA:
        raise HTTPException(status_code=404, detail="Provider not found")

    meta = PROVIDERS_METADATA[provider_id]
    raw = await router_bridge.get_providers()
    connections = [c for c in raw.get("connections", []) if c.get("provider") == provider_id]

    if provider_id == "claude" and native_claude.is_configured():
        connections = [{
            "id": "native-claude-cli",
            "name": "Official Local Claude CLI (~/.local/bin/claude)",
            "authType": "native-binary",
            "priority": 1,
            "isActive": True,
        }] + connections

    all_models = await router_bridge.get_models()
    prefix = "cc/" if provider_id == "claude" else ("ag/" if provider_id == "antigravity" else f"{provider_id}/")
    matching_models = [m for m in all_models if m.get("id", "").startswith(prefix)]

    if provider_id == "claude" and not matching_models:
        matching_models = [
            {"id": "claude-3-7-sonnet", "name": "Claude 3.7 Sonnet (Official CLI)"},
            {"id": "claude-3-5-sonnet", "name": "Claude 3.5 Sonnet (Official CLI)"},
            {"id": "claude-3-5-haiku", "name": "Claude 3.5 Haiku (Official CLI)"},
        ]

    return {
        **meta,
        "connections": connections,
        "connectionsCount": len(connections),
        "models": matching_models,
    }


@app.get("/api/oauth/{provider_id}/authorize")
async def oauth_authorize(provider_id: str, redirect_uri: str = "http://localhost:20128/callback"):
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
    if connection_id == "native-claude-cli":
        return {"success": True}
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


# ── Studio: Skills, MCP Connectors & Artifacts Endpoints ─────────────────────

class ToggleMCPRequest(BaseModel):
    config: Optional[Dict[str, Any]] = None


class CustomMCPRequest(BaseModel):
    id: Optional[str] = None
    name: str
    author: Optional[str] = "Custom"
    description: Optional[str] = "User-defined MCP Server"
    icon: Optional[str] = "connector"
    category: Optional[str] = "custom"
    command: str
    envKeys: Optional[List[str]] = []
    config: Optional[Dict[str, Any]] = {}


class CreateArtifactRequest(BaseModel):
    title: str
    type: str = "docs"
    badge: Optional[str] = None
    summary: Optional[str] = ""
    content: str
    author: Optional[str] = "User"


@app.get("/api/skills")
async def get_skills():
    skills = await studio_store.get_skills()
    return {"skills": skills}


@app.post("/api/skills/{skill_id}/toggle")
async def toggle_skill(skill_id: str):
    new_state = await studio_store.toggle_skill(skill_id)
    return {"id": skill_id, "isInstalled": new_state}


@app.get("/api/mcp")
async def get_mcp_connectors():
    connectors = await studio_store.get_mcp_servers()
    return {"connectors": connectors}


@app.post("/api/mcp/{mcp_id}/toggle")
async def toggle_mcp(mcp_id: str, req: Optional[ToggleMCPRequest] = None):
    cfg = req.config if req else None
    new_state = await studio_store.toggle_mcp(mcp_id, cfg)
    return {"id": mcp_id, "isConnected": new_state}


@app.post("/api/mcp/custom")
async def add_custom_mcp(req: CustomMCPRequest):
    data = await studio_store.add_custom_mcp(req.model_dump())
    return {"success": True, "connector": data}


@app.get("/api/artifacts")
async def get_artifacts():
    arts = await studio_store.get_artifacts()
    return {"artifacts": arts}


@app.get("/api/artifacts/{artifact_id}")
async def get_artifact_detail(artifact_id: str):
    art = await studio_store.get_artifact(artifact_id)
    if not art:
        raise HTTPException(status_code=404, detail="Artifact not found")
    return {"artifact": art}


@app.post("/api/artifacts")
async def create_artifact(req: CreateArtifactRequest):
    art = await studio_store.create_artifact(req.model_dump())
    return {"success": True, "artifact": art}


# ── Execution Engine Dispatcher ──────────────────────────────────────────────

async def execute_harness(
    harness_id: str,
    prompt: str,
    history: list[dict],
    requested_model: str = "",
) -> tuple[str, str, int, int]:
    """
    Executes the harness safely.
    - For Claude: Runs the official native CLI binary directly (Zero Ban Risk).
    - For AntiGravity: Runs via local Google AntiGravity session.
    """
    if harness_id == "claude" and native_claude.is_configured():
        resp = await native_claude.send(prompt, history)
        if resp.ok:
            model_label = requested_model or "Claude 3.7 Sonnet (Native)"
            return model_label, resp.content, resp.input_tokens, resp.output_tokens
        # Fallback to router if native failed
        print("Native claude error:", resp.error)

    # Determine model
    if requested_model:
        req_lower = requested_model.lower()
        if "deepseek" in req_lower or "r1" in req_lower:
            model_name = "deepseek/deepseek-r1"
        elif "v3" in req_lower:
            model_name = "deepseek/deepseek-chat"
        elif "chatgpt" in req_lower or "gpt-4" in req_lower or "o3" in req_lower or "o1" in req_lower:
            model_name = "openai/gpt-4o"
        elif "opus" in req_lower:
            model_name = "cc/claude-opus-4-1"
        elif "sonnet" in req_lower:
            model_name = "cc/claude-sonnet-5"
        elif "gemini" in req_lower or "agy" in req_lower:
            model_name = "ag/gemini-3.8-flash-high"
        elif "codex" in req_lower:
            model_name = "codex/gpt-4o"
        else:
            model_name = requested_model
    else:
        if harness_id == "deepseek":
            model_name = "deepseek/deepseek-r1"
        elif harness_id == "chatgpt":
            model_name = "openai/gpt-4o"
        elif harness_id == "agy":
            model_name = "ag/gemini-3.8-flash-high"
        else:
            model_name = "cc/claude-sonnet-5"

    messages = [
        {"role": "system", "content": f"You are {harness_id.upper()} in Rezolotion Harness. Answer concisely."},
        *history,
        {"role": "user", "content": prompt},
    ]
    resp = await router_bridge.chat_completion(model=model_name, messages=messages)
    choices = resp.get("choices", [])
    content = choices[0].get("message", {}).get("content", "") if choices else ""
    usage = resp.get("usage", {})
    return model_name, content, usage.get("prompt_tokens", 0), usage.get("completion_tokens", 0)


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

            selected_model = payload.get("model", "")

            await context.add(role="user", content=user_message)
            routed = router.route(user_message)

            await websocket.send_json({
                "event": "routing",
                "targets": [t.value for t in routed.targets],
                "is_debate": routed.is_debate,
                "content": routed.content,
            })

            history_msgs = await context.get_messages(limit=40)

            if routed.is_debate and len(routed.targets) > 1:
                # ── Debate Mode ──────────────────────────────────────────────
                await context.add(role="user", content=f"[DEBATE] {routed.content}")

                for round_num in range(1, 3):
                    await websocket.send_json({
                        "event": "debate_round_start",
                        "round": round_num,
                        "total": 2,
                    })

                    tasks = [
                        execute_harness(t.value, routed.content, history_msgs, selected_model)
                        for t in routed.targets
                    ]
                    responses = await asyncio.gather(*tasks, return_exceptions=True)

                    for target, resp in zip(routed.targets, responses):
                        hid = target.value
                        if isinstance(resp, Exception):
                            await websocket.send_json({
                                "event": "error", "harness": hid, "message": str(resp),
                            })
                            continue

                        model_name, content, in_toks, out_toks = resp
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

                    history_msgs = await context.get_messages(limit=40)

                await websocket.send_json({"event": "debate_complete", "rounds": 2})

            else:
                # ── Standard Single / Broadcast Execution ─────────────────────
                tasks = [
                    execute_harness(t.value, routed.content, history_msgs, selected_model)
                    for t in routed.targets
                ]
                responses = await asyncio.gather(*tasks, return_exceptions=True)

                for target, resp in zip(routed.targets, responses):
                    hid = target.value
                    if isinstance(resp, Exception):
                        await websocket.send_json({
                            "event": "error", "harness": hid, "message": str(resp),
                        })
                        continue

                    model_name, content, in_toks, out_toks = resp
                    await context.add(
                        role="assistant", harness=hid, model=model_name, content=content,
                    )
                    await websocket.send_json({
                        "event": "response",
                        "harness": hid,
                        "model": model_name,
                        "content": content,
                        "tokens": {"input": in_toks, "output": out_toks},
                    })

            await websocket.send_json({"event": "done"})

    except WebSocketDisconnect:
        pass
