# Rezolotion Harness — System Architecture Specification

## 1. Overview & Core Philosophy
Rezolotion Harness is a local-first desktop-grade orchestrator that unites multiple coding agents (Claude Code CLI, AntiGravity, Codex) through a single normalized protocol, real-time bidirectional WebSocket transport, and a high-performance React frontend.

---

## 2. Backend Architecture (FastAPI + Asynchronous Python)

```
                            ┌─────────────────────────────────────────┐
                            │          Frontend Client (React)        │
                            └────────────────────┬────────────────────┘
                                                 │ Bidirectional WebSocket
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │          WebSocket API (/ws/{id})       │
                            └────────────────────┬────────────────────┘
                                                 │
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │             Session Manager             │
                            │      (Lifecycle, SQLite Persistence)    │
                            └────────────────────┬────────────────────┘
                                                 │
                                                 ▼
                            ┌─────────────────────────────────────────┐
                            │             Provider Layer              │
                            │          (Normalized Adapters)          │
                            └──────┬─────────────┬─────────────┬──────┘
                                   │             │             │
                                   ▼             ▼             ▼
                           Claude Code CLI   AntiGravity     Codex
                           (stream-json)      (Engine)      (OpenAI)
```

### 2.1 Headless CLI Execution (Zero Regex / Zero Terminal Scraping)
Anthropic Claude Code is executed in native headless mode via:
```bash
claude -p \
       --output-format stream-json \
       --input-format stream-json \
       --verbose \
       --session-id <session_uuid>
```
Output is consumed strictly as structured JSON lines (`assistant`, `tool_use`, `tool_result`, `result`, cost/token accounting). No ANSI stripping or text parsing is permitted.

### 2.2 Normalized Event Protocol
All providers must emit events conforming to the canonical 8-event union:
```python
Event = (
    TextDeltaEvent         # Partial token / markdown chunk
    | ThinkingDeltaEvent   # Extended thinking / reasoning trace
    | ToolCallEvent        # Tool invocation intent (name, id, args)
    | ToolResultEvent      # Tool execution response (stdout/stderr/status)
    | PermissionRequest    # Confirmation prompt requiring client decision
    | UsageUpdateEvent     # Token count, context usage, accumulated cost
    | ErrorEvent           # Fatal or recoverable error message
    | DoneEvent            # Turn or task completion signal
)
```
The frontend consumes exclusively these 8 event types.

### 2.3 Real MCP Integration
- **Direct Configuration:** Read and write native `~/.claude.json` and `.mcp.json`.
- **CLI Commands:** Wrap `claude mcp add`, `claude mcp list`, and `claude mcp remove`.
- **Server Discovery:** Fetch real extensions from the official MCP registry without mock catalog data.

---

## 3. Frontend Architecture (Vite + React + TypeScript + Radix)

### 3.1 Stack Breakdown
- **Runtime & Bundler:** Vite + React 18 + TypeScript (strict mode, zero `any`).
- **Design System & Primitives:** Tailwind CSS + shadcn/ui primitives (built on Radix UI).
- **Icons:** `lucide-react` for actions; `simple-icons` for brand marks.
- **State Management:** Zustand for UI and session stores; TanStack Query for server state.
- **Animation:** `framer-motion` restricted strictly to message entry and sheet transitions (150ms ease-out).

### 3.2 Sandboxed Artifacts
All user-facing code previews (HTML, React, SVG, web apps) must render inside an isolated iframe:
```html
<iframe
  sandbox="allow-scripts"
  csp="default-src 'self' 'unsafe-inline' data: blob:;"
  srcdoc={artifactHtml}
/>
```
Never execute generated code in the parent application context.

---

## 4. Build Order (Step-by-Step Delivery)

1. **Step 1:** `tokens.css` + Tailwind configuration + Theme Provider (Dark/Light) + `/kitchen-sink` route rendering every primitive.
2. **Step 2:** Backend event schema + `claude_code` headless provider + WebSocket echo & verification test.
3. **Step 3:** Chat surface (MessageList, MessageBubble, StreamingText, ToolCallDrawer).
4. **Step 4:** Composer (ModelPill, SlashCommandMenu via shadcn Command, ThinkingLevelSelect).
5. **Step 5:** Context Inspector (header bar segmented meter: system / messages / tools / free).
6. **Step 6:** Customize & MCP (Real `~/.claude.json`, `.mcp.json`, official registry).
7. **Step 7:** Artifacts Panel & Sandboxed IFrame Preview.
