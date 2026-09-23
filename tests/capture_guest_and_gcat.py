#!/usr/bin/env python3
"""
Captures screenshots of:
1. AuthGate with "Continue as Guest"
2. Studio Canvas in Guest Simulation Mode (0 connected providers banner)
3. Providers Modal with G-CAT AI Gateway Card
4. Providers Modal with Custom OpenAI Gateway Card
"""

import os
import sys
import json
import asyncio
import base64
import subprocess
import urllib.request
import websockets

ARTIFACTS_DIR = "/home/rezolotion/.gemini/antigravity/brain/06ad3188-2f30-4533-8482-aa1c9e68be26"
BASE_URL = "http://localhost:8000/studio"
CHROME_BIN = "/usr/bin/google-chrome"
DEBUG_PORT = 9225

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
            # 1. Clear session to show AuthGate
            await cdp_call(ws, "Page.navigate", {"url": BASE_URL}, 10)
            await asyncio.sleep(2.0)
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": "localStorage.clear(); window.location.reload();"
            }, 11)
            await asyncio.sleep(2.0)

            # Screenshot 1: AuthGate with Guest Option
            shot1 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 12)
            if "data" in shot1:
                with open(os.path.join(ARTIFACTS_DIR, "studio_auth_gate_guest.png"), "wb") as f:
                    f.write(base64.b64decode(shot1["data"]))
                print("✓ Saved studio_auth_gate_guest.png")

            # 2. Enter Guest Mode
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    localStorage.setItem('rezolotion_session_token', 'guest-preview-token');
                    localStorage.setItem('rezolotion_user', 'Guest Tester');
                    localStorage.setItem('rezolotion_guest_mode', 'true');
                    window.location.reload();
                })();
                """
            }, 20)
            await asyncio.sleep(2.5)

            # Screenshot 2: Studio Canvas in Guest Mode
            shot2 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 21)
            if "data" in shot2:
                with open(os.path.join(ARTIFACTS_DIR, "studio_guest_mode_canvas.png"), "wb") as f:
                    f.write(base64.b64decode(shot2["data"]))
                print("✓ Saved studio_guest_mode_canvas.png")

            # 3. Open Providers Hub and select G-CAT
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    // Click Providers button in sidebar
                    const btns = Array.from(document.querySelectorAll('button'));
                    const provBtn = btns.find(b => b.textContent.includes('Providers'));
                    if (provBtn) provBtn.click();
                })();
                """
            }, 30)
            await asyncio.sleep(1.0)

            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const gcatBtn = btns.find(b => b.textContent.includes('G-CAT'));
                    if (gcatBtn) gcatBtn.click();
                })();
                """
            }, 31)
            await asyncio.sleep(1.0)

            # Screenshot 3: Providers Modal G-CAT
            shot3 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 32)
            if "data" in shot3:
                with open(os.path.join(ARTIFACTS_DIR, "studio_providers_gcat.png"), "wb") as f:
                    f.write(base64.b64decode(shot3["data"]))
                print("✓ Saved studio_providers_gcat.png")

            # 4. Select Custom Gateway
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                (() => {
                    const btns = Array.from(document.querySelectorAll('button'));
                    const custBtn = btns.find(b => b.textContent.includes('Custom OpenAI'));
                    if (custBtn) custBtn.click();
                })();
                """
            }, 40)
            await asyncio.sleep(1.0)

            # Screenshot 4: Providers Modal Custom
            shot4 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 41)
            if "data" in shot4:
                with open(os.path.join(ARTIFACTS_DIR, "studio_providers_custom.png"), "wb") as f:
                    f.write(base64.b64decode(shot4["data"]))
                print("✓ Saved studio_providers_custom.png")

    finally:
        chrome_proc.terminate()
        try:
            chrome_proc.wait(timeout=2)
        except Exception:
            chrome_proc.kill()

if __name__ == "__main__":
    asyncio.run(capture())
