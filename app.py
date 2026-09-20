"""
Rezolotion Harness — FastAPI Application
Session-based auth: API keys are sent from browser via WebSocket,
never stored on disk. Each WS connection has its own adapter instances.
"""
import asyncio
import json
import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

import anthropic
from openai import AsyncOpenAI

from adapters.base import AdapterResponse
from core.context import SharedContext
from core.debate import DebateManager
from core.router import HarnessRouter
from core.config import settings

app = FastAPI(title="Rezolotion Harness", version="0.1.0")

# Shared state
context = SharedContext(db_path=settings.db_path)

# Mount static files
ui_dir = os.path.join(os.path.dirname(__file__), "ui")
static_dir = os.path.join(ui_dir, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", response_class=HTMLResponse)
async def root():
    html_path = os.path.join(ui_dir, "index.html")
    with open(html_path) as f:
        return f.read()


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@app.get("/api/history")
async def history(limit: int = 100):
    messages = await context.get_all_raw(limit=limit)
    return {"messages": messages}


@app.delete("/api/history")
async def clear_history():
    await context.clear()
    return {"status": "cleared"}


# ── Per-session adapter factories ────────────────────────────

def make_claude_adapter(api_key: str, model: str = "claude-3-7-sonnet-20250219"):
    """Create an Anthropic client from session key."""
    client = anthropic.AsyncAnthropic(api_key=api_key)

    async def send(message: str, history: list[dict]) -> AdapterResponse:
        messages = history + [{"role": "user", "content": message}]
        try:
            resp = await client.messages.create(
                model=model,
                max_tokens=8192,
                system=(
                    "You are Claude Code, an expert AI coding assistant. "
                    "You are part of a multi-harness team. "
                    "Messages labelled [AGY], [CODEX], etc. are from your teammates. "
                    "Be concise, accurate, and collaborative."
                ),
                messages=messages,
            )
            return AdapterResponse(
                harness_id="claude", model=model,
                content=resp.content[0].text if resp.content else "",
                input_tokens=resp.usage.input_tokens,
                output_tokens=resp.usage.output_tokens,
            )
        except Exception as e:
            return AdapterResponse(harness_id="claude", model=model, content="", error=str(e))

    return send


def make_agy_adapter(api_key: str, model: str = "gemini-2.5-pro"):
    """Create an OpenAI-compatible Gemini client from session key."""
    client = AsyncOpenAI(
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        api_key=api_key,
    )

    async def send(message: str, history: list[dict]) -> AdapterResponse:
        messages = [
            {"role": "system", "content": (
                "You are AntiGravity, Google's advanced AI coding assistant. "
                "You are part of a multi-harness team. "
                "Messages labelled [CLAUDE], [CODEX], etc. are from your teammates. "
                "Be concise, accurate, and collaborative."
            )},
            *history,
            {"role": "user", "content": message},
        ]
        try:
            resp = await client.chat.completions.create(
                model=model, messages=messages, max_tokens=8192,
            )
            usage = resp.usage
            return AdapterResponse(
                harness_id="agy", model=model,
                content=resp.choices[0].message.content or "",
                input_tokens=usage.prompt_tokens if usage else 0,
                output_tokens=usage.completion_tokens if usage else 0,
            )
        except Exception as e:
            return AdapterResponse(harness_id="agy", model=model, content="", error=str(e))

    return send


# ── WebSocket Chat ───────────────────────────────────────────

@app.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    await websocket.accept()

    # Per-connection state
    adapters: dict[str, any] = {}
    router = HarnessRouter()
    debate_manager = DebateManager(context)

    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            msg_type = payload.get("type", "message")

            # ── AUTH: receive API keys from browser ──────────────
            if msg_type == "auth":
                keys = payload.get("keys", {})
                claude_key = keys.get("claudeKey", "")
                agy_key = keys.get("agyKey", "")

                if claude_key:
                    adapters["claude"] = make_claude_adapter(claude_key)
                if agy_key:
                    adapters["agy"] = make_agy_adapter(agy_key)

                await websocket.send_json({
                    "event": "auth_ok",
                    "harnesses": list(adapters.keys()),
                })
                continue

            # ── CHAT MESSAGE ─────────────────────────────────────
            user_message = payload.get("message", "").strip()
            if not user_message:
                continue

            await context.add(role="user", content=user_message)
            routed = router.route(user_message)

            await websocket.send_json({
                "event": "routing",
                "targets": [t.value for t in routed.targets],
                "is_debate": routed.is_debate,
            })

            history_msgs = await context.get_messages(limit=settings.max_history_messages)

            if routed.is_debate and len(routed.targets) > 1:
                # ── Debate Mode ──────────────────────────────────
                participants = [
                    (t.value, adapters[t.value])
                    for t in routed.targets if t.value in adapters
                ]
                await context.add(role="user", content=f"[DEBATE] {routed.content}")

                for round_num in range(1, 3):
                    await websocket.send_json({
                        "event": "debate_round_start", "round": round_num, "total": 2,
                    })
                    tasks = [fn(routed.content, history_msgs) for _, fn in participants]
                    responses = await asyncio.gather(*tasks, return_exceptions=True)

                    for (hid, _), resp in zip(participants, responses):
                        if isinstance(resp, Exception):
                            await websocket.send_json({
                                "event": "error", "harness": hid, "message": str(resp),
                            })
                            continue
                        if resp.ok:
                            await context.add(
                                role="assistant", harness=hid, model=resp.model, content=resp.content,
                            )
                            await websocket.send_json({
                                "event": "debate_response", "round": round_num,
                                "harness": hid, "model": resp.model, "content": resp.content,
                            })
                        else:
                            await websocket.send_json({
                                "event": "error", "harness": hid, "message": resp.error,
                            })

                    history_msgs = await context.get_messages(limit=settings.max_history_messages)

                await websocket.send_json({"event": "debate_complete", "rounds": 2})

            else:
                # ── Normal / Broadcast ───────────────────────────
                tasks = []
                valid_targets = []
                for target in routed.targets:
                    hid = target.value
                    if hid in adapters:
                        tasks.append(adapters[hid](routed.content, history_msgs))
                        valid_targets.append(hid)
                    else:
                        await websocket.send_json({
                            "event": "error", "harness": hid,
                            "message": f"{hid} is not connected. Please add its API key.",
                        })

                if tasks:
                    responses = await asyncio.gather(*tasks, return_exceptions=True)
                    for hid, resp in zip(valid_targets, responses):
                        if isinstance(resp, Exception):
                            await websocket.send_json({
                                "event": "error", "harness": hid, "message": str(resp),
                            })
                            continue
                        if resp.ok:
                            await context.add(
                                role="assistant", harness=resp.harness_id,
                                model=resp.model, content=resp.content,
                            )
                            await websocket.send_json({
                                "event": "response", "harness": resp.harness_id,
                                "model": resp.model, "content": resp.content,
                                "tokens": {"input": resp.input_tokens, "output": resp.output_tokens},
                            })
                        else:
                            await websocket.send_json({
                                "event": "error", "harness": resp.harness_id,
                                "message": resp.error,
                            })

            await websocket.send_json({"event": "done"})

    except WebSocketDisconnect:
        pass
