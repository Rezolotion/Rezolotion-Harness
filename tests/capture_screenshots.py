#!/usr/bin/env python3
"""
Captures high-resolution screenshots of Rezolotion Studio via Chrome DevTools Protocol (CDP).
Screenshots captured:
  1. Studio Auth Gate (before login)
  2. Studio Authenticated Workspace (Projects, Threads, File Explorer, Composer)
  3. Project Creation Wizard (Environment Selector: Local, SSH, Docker, Scratchpad)
"""

import os
import sys
import json
import time
import asyncio
import subprocess
import urllib.request
import websockets

ARTIFACTS_DIR = "/home/rezolotion/.gemini/antigravity/brain/06ad3188-2f30-4533-8482-aa1c9e68be26"
BASE_URL = "http://localhost:8000/studio"
CHROME_BIN = "/usr/bin/google-chrome"
DEBUG_PORT = 9222

async def cdp_call(ws, method: str, params: dict = None, req_id: int = 1):
    msg = {"id": req_id, "method": method, "params": params or {}}
    await ws.send(json.dumps(msg))
    while True:
        resp = json.loads(await ws.recv())
        if resp.get("id") == req_id:
            return resp.get("result", {})

async def capture():
    # Start Chrome with remote debugging
    chrome_proc = subprocess.Popen([
        CHROME_BIN,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        f"--remote-debugging-port={DEBUG_PORT}",
        "--window-size=1440,900",
        "about:blank"
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    time.sleep(1.5)

    try:
        # Get debug target
        targets_raw = urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json").read().decode("utf-8")
        targets = json.loads(targets_raw)
        page_targets = [t for t in targets if t.get("type") == "page"]
        ws_url = page_targets[0]["webSocketDebuggerUrl"]

        async with websockets.connect(ws_url) as ws:
            # 1. Navigate to /studio (Unauthenticated Auth Gate)
            await cdp_call(ws, "Page.navigate", {"url": BASE_URL}, 10)
            await asyncio.sleep(2.0)
            
            # Screenshot 1: Auth Gate
            shot1 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 11)
            import base64
            with open(os.path.join(ARTIFACTS_DIR, "studio_auth_gate.png"), "wb") as f:
                f.write(base64.b64decode(shot1["data"]))
            print("Saved studio_auth_gate.png")

            # 2. Inject session token and reload to Authenticated Workspace
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": "localStorage.setItem('rezolotion_session_token', 'rez-dev-session-active'); localStorage.setItem('rezolotion_user', 'developer'); location.reload();"
            }, 12)
            await asyncio.sleep(2.5)

            # Screenshot 2: Authenticated Studio Workspace
            shot2 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 13)
            with open(os.path.join(ARTIFACTS_DIR, "studio_authenticated.png"), "wb") as f:
                f.write(base64.b64decode(shot2["data"]))
            print("Saved studio_authenticated.png")

            # 3. Open Project Creation Wizard by clicking "+ New Workspace Project" button
            await cdp_call(ws, "Runtime.evaluate", {
                "expression": """
                const btns = Array.from(document.querySelectorAll('button'));
                const newProjBtn = btns.find(b => b.textContent && b.textContent.includes('New Workspace Project'));
                if (newProjBtn) newProjBtn.click();
                """
            }, 14)
            await asyncio.sleep(1.0)

            # Screenshot 3: Project Creation Wizard Modal
            shot3 = await cdp_call(ws, "Page.captureScreenshot", {"format": "png"}, 15)
            with open(os.path.join(ARTIFACTS_DIR, "studio_wizard_modal.png"), "wb") as f:
                f.write(base64.b64decode(shot3["data"]))
            print("Saved studio_wizard_modal.png")

    finally:
        chrome_proc.terminate()
        chrome_proc.wait()

if __name__ == "__main__":
    asyncio.run(capture())
