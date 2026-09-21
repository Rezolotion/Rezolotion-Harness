#!/usr/bin/env python3
"""
Captures screenshots of:
1. Studio with the new No-Scroll Model Picker Popover (Search, Provider tabs, Quick picks)
2. Studio in Multi-Model Compare mode
3. Studio in Multi-Agent Team mode
"""

import os
import sys
import json
import time
import asyncio
import base64
import subprocess
import urllib.request
import websockets

ARTIFACTS_DIR = "/home/rezolotion/.gemini/antigravity/brain/06ad3188-2f30-4533-8482-aa1c9e68be26"
BASE_URL = "http://localhost:8000/studio"
CHROME_BIN = "/usr/bin/google-chrome"
DEBUG_PORT = 9223

async def cdp_call(ws, method: str, params: dict = None, req_id: int = 1):
    msg = {"id": req_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(msg))
    while True:
        resp = json.loads(await ws.recv())
        if resp.get("id") == req_id:
            return resp.get("result", {})

async def capture():
    chrome_proc = subprocess.Popen([
        CHROME_BIN,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--remote-debugging-port={DEBUG_PORT}",
        "--window-size=1440,900",
        "about:blank"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    await asyncio.sleep(1.5)

    try:
        targets_raw = urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json").read().decode("utf-8")
        targets = json.loads(targets_raw)
        page_targets = [t for t in targets if t.get("type") == "page"]
        ws_url = page_targets[0]["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            # 1. Navigate to studio and login
            await cdp_call(ws, "Page.navigate", {"url": BASE_URL}, 10)
            await asyncio.sleep(2.0)

            # Auto-login
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    localStorage.setItem('rezolotion_session_token', 'test-token-active');
                    localStorage.setItem('rezolotion_user', JSON.stringify({username: 'developer'}));
                    window.location.reload();
                })()
                """
            }, 12)
            await asyncio.sleep(2.5)

            # 2. Click the model button to open the new No-Scroll Model Picker Popover
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    // Find model button (button with chevron-down in composer bottom bar)
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const modelBtn = buttons.find(b => b.textContent && (b.textContent.includes('Flash') || b.textContent.includes('Sonnet') || b.textContent.includes('Gemini')));
                    if (modelBtn) modelBtn.click();
                })()
                """
            }, 20)
            await asyncio.sleep(1.0)

            # Screenshot 1: No-Scroll Model Picker Popover
            shot1 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 21)
            p1 = os.path.join(ARTIFACTS_DIR, "studio_no_scroll_model_picker.png")
            with open(p1, "wb") as f:
                f.write(base64.b64decode(shot1["data"]))
            print(f"✓ Saved {p1}")

            # Close popover by clicking outside
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": "document.body.click();"
            }, 22)
            await asyncio.sleep(0.5)

            # 3. Switch to Multi-Model Mode and dispatch a prompt
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const multiBtn = buttons.find(b => b.textContent && b.textContent.includes('Multi-Model'));
                    if (multiBtn) multiBtn.click();
                })()
                """
            }, 30)
            await asyncio.sleep(0.5)

            # Screenshot 2: Multi-Model Compare Mode UI
            shot2 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 31)
            p2 = os.path.join(ARTIFACTS_DIR, "studio_multi_model_mode.png")
            with open(p2, "wb") as f:
                f.write(base64.b64decode(shot2["data"]))
            print(f"✓ Saved {p2}")

            # Send a prompt in Multi-Model mode
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    const textarea = document.querySelector('textarea');
                    if (textarea) {
                        textarea.value = "Compare Python asyncio vs threading in 2 sentences";
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                    setTimeout(() => {
                        const sendBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Compare Models'));
                        if (sendBtn) sendBtn.click();
                    }, 200);
                })()
                """
            }, 32)
            await asyncio.sleep(5.0)

            # Screenshot 3: Multi-Model Live Comparison
            shot3 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 33)
            p3 = os.path.join(ARTIFACTS_DIR, "studio_multi_model_live.png")
            with open(p3, "wb") as f:
                f.write(base64.b64decode(shot3["data"]))
            print(f"✓ Saved {p3}")

            # 4. Switch to Multi-Agent Mode
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    const buttons = Array.from(document.querySelectorAll('button'));
                    const agentBtn = buttons.find(b => b.textContent && b.textContent.includes('Multi-Agent'));
                    if (agentBtn) agentBtn.click();
                })()
                """
            }, 40)
            await asyncio.sleep(0.8)

            # Screenshot 4: Multi-Agent Mode
            shot4 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 41)
            p4 = os.path.join(ARTIFACTS_DIR, "studio_multi_agent_mode.png")
            with open(p4, "wb") as f:
                f.write(base64.b64decode(shot4["data"]))
            print(f"✓ Saved {p4}")

    finally:
        chrome_proc.terminate()
        chrome_proc.wait()

if __name__ == "__main__":
    asyncio.run(capture())
