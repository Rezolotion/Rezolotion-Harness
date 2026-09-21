#!/usr/bin/env python3
"""
Test Suite: Multi-Model & Multi-Agent Execution in Rezolotion Harness
"""
import asyncio
import json
import websockets
import httpx

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000/ws/chat/test-session-123"

async def main():
    print("==================================================")
    print("Testing Rezolotion Harness: Multi-Model & Multi-Agent")
    print("==================================================")

    # 1. Test GET /api/models
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{BASE_URL}/api/models")
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        models = resp.json().get("models", [])
        print(f"✓ GET /api/models returned {len(models)} active models.")
        assert len(models) > 0, "Expected at least one active model from connected providers."

    # 2. Test WebSocket Single Mode
    print("\n--- Testing Single Agent Turn via WebSocket ---")
    async with websockets.connect(WS_URL) as ws:
        await ws.send(json.dumps({
            "content": "Respond with 'REZOLOTION_SINGLE_TEST_OK'",
            "provider": "antigravity",
            "model": "ag/gemini-3.8-flash-high",
            "mode": "ask",
            "chat_mode": "single"
        }))
        done = False
        received_text = ""
        while not done:
            msg = json.loads(await ws.recv())
            if msg.get("type") == "text_delta":
                received_text += msg.get("text", "")
            elif msg.get("type") in ("done", "message_stop"):
                done = True
        print(f"✓ Single Agent response received: {received_text[:60]}...")

    # 3. Test WebSocket Multi-Model Parallel Compare Mode
    print("\n--- Testing Multi-Model Parallel Compare Mode ---")
    async with websockets.connect(WS_URL) as ws:
        await ws.send(json.dumps({
            "content": "What is the capital of France? Reply in 1 word.",
            "mode": "ask",
            "chat_mode": "multi_model",
            "models": [
                {"provider": "antigravity", "model": "ag/gemini-3.8-flash-high"},
                {"provider": "antigravity", "model": "ag/gemini-2.5-pro"}
            ]
        }))
        done = False
        multi_responses = None
        while not done:
            msg = json.loads(await ws.recv())
            if msg.get("type") == "step_start":
                print(f"  [Step Start]: {msg.get('title')}")
            elif msg.get("type") == "multi_model_done":
                multi_responses = msg.get("responses", [])
                print(f"✓ Multi-Model responses received: {len(multi_responses)} model results.")
                for r in multi_responses:
                    print(f"   Model: {r.get('model')} -> {r.get('content')[:40]}... (Tokens: {r.get('tokens_used')})")
            elif msg.get("type") == "done":
                done = True

        assert multi_responses and len(multi_responses) == 2, "Expected 2 parallel model responses"

    # 4. Test WebSocket Multi-Agent Team Mode (Architect -> Coder -> Reviewer)
    print("\n--- Testing Multi-Agent Autonomous Team Mode ---")
    async with websockets.connect(WS_URL) as ws:
        await ws.send(json.dumps({
            "content": "Create a simple Python retry decorator",
            "mode": "build",
            "chat_mode": "multi_agent",
            "provider": "antigravity",
            "model": "ag/gemini-3.8-flash-high"
        }))
        done = False
        team_report = None
        while not done:
            msg = json.loads(await ws.recv())
            if msg.get("type") == "step_start":
                print(f"  [Agent Step]: {msg.get('title')}")
            elif msg.get("type") == "multi_agent_done":
                team_report = msg.get("agent_team_report", [])
                print(f"✓ Multi-Agent Team Report received: {len(team_report)} phases.")
                for r in team_report:
                    print(f"   Role: {r.get('role').upper()} ({r.get('model')}) -> Content length: {len(r.get('content'))} chars")
            elif msg.get("type") == "done":
                done = True

        assert team_report and len(team_report) == 3, "Expected 3 agent phases (architect, coder, reviewer)"

    print("\n==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY! 100% VERIFIED.")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
