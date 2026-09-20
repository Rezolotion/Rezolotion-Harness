"""
Rezolotion Harness — FastAPI Application
WebSocket-based chat server with real-time streaming.
"""
import asyncio
import json
import os

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from adapters import get_adapter, ADAPTERS
from core.context import SharedContext
from core.debate import DebateManager
from core.router import HarnessRouter, HarnessID
from core.config import settings

app = FastAPI(title="Rezolotion Harness", version="0.1.0")

# Shared state
context = SharedContext(db_path=settings.db_path)
router = HarnessRouter()
debate_manager = DebateManager(context)

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "ui", "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the chat UI."""
    html_path = os.path.join(os.path.dirname(__file__), "ui", "index.html")
    with open(html_path) as f:
        return f.read()


@app.get("/api/health")
async def health():
    """Health check for all adapters."""
    status = {}
    for harness_id, adapter in ADAPTERS.items():
        status[harness_id] = {
            "configured": adapter.is_configured(),
            "model": adapter.current_model,
            "display_name": adapter.display_name,
        }
    return {"status": "ok", "harnesses": status}


@app.get("/api/history")
async def history(limit: int = 100):
    """Fetch chat history."""
    messages = await context.get_all_raw(limit=limit)
    return {"messages": messages}


@app.delete("/api/history")
async def clear_history():
    """Clear all chat history."""
    await context.clear()
    return {"status": "cleared"}


@app.websocket("/ws/chat")
async def chat_websocket(websocket: WebSocket):
    """
    Main chat WebSocket endpoint.
    Client sends: {"message": "@claude hello"}
    Server streams back response events.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            user_message = payload.get("message", "").strip()

            if not user_message:
                continue

            # Save user message to shared context
            await context.add(role="user", content=user_message)

            # Route the message
            routed = router.route(user_message)

            await websocket.send_json({
                "event": "routing",
                "targets": [t.value for t in routed.targets],
                "is_debate": routed.is_debate,
                "content": routed.content,
            })

            if routed.is_debate and len(routed.targets) > 1:
                # ── Debate Mode ──────────────────────────────────────────────
                participants = [
                    get_adapter(t.value)
                    for t in routed.targets
                    if get_adapter(t.value) and get_adapter(t.value).is_configured()  # type: ignore[union-attr]
                ]
                async for event in debate_manager.run(
                    topic=routed.content,
                    participants=participants,  # type: ignore[arg-type]
                    rounds=2,
                ):
                    await websocket.send_json(event)

            else:
                # ── Normal / Broadcast Mode ──────────────────────────────────
                history_msgs = await context.get_messages(
                    limit=settings.max_history_messages
                )

                tasks = []
                for target in routed.targets:
                    adapter = get_adapter(target.value)
                    if adapter and adapter.is_configured():
                        tasks.append(
                            adapter.send(message=routed.content, history=history_msgs)
                        )
                    else:
                        await websocket.send_json({
                            "event": "error",
                            "harness": target.value,
                            "message": f"{target.value} is not configured.",
                        })

                responses = await asyncio.gather(*tasks, return_exceptions=True)

                for target, resp in zip(routed.targets, responses):
                    if isinstance(resp, Exception):
                        await websocket.send_json({
                            "event": "error",
                            "harness": target.value,
                            "message": str(resp),
                        })
                        continue

                    if resp.ok:
                        await context.add(
                            role="assistant",
                            harness=resp.harness_id,
                            model=resp.model,
                            content=resp.content,
                        )
                        await websocket.send_json({
                            "event": "response",
                            "harness": resp.harness_id,
                            "model": resp.model,
                            "content": resp.content,
                            "tokens": {
                                "input": resp.input_tokens,
                                "output": resp.output_tokens,
                            },
                        })
                    else:
                        await websocket.send_json({
                            "event": "error",
                            "harness": resp.harness_id,
                            "message": resp.error,
                        })

            await websocket.send_json({"event": "done"})

    except WebSocketDisconnect:
        pass
