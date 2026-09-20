# 🧠 Rezolotion Harness

> A **Meta-Harness Orchestrator** — one chat interface to rule them all.

Route your messages to multiple AI harnesses (Claude Code, AntiGravity, Codex, Hermes, and more) from a single unified chat UI. Watch them debate each other. Let them share context. Build your own AI team.

---

## ✨ Features

- **Unified Chat Interface** — One place to talk to all your AI harnesses
- **@mention Routing** — `@claude`, `@agy`, `@codex`, `@hermes`
- **🎭 Debate Mode** — `@debate @claude @agy` — let them argue with each other
- **Shared Context** — Every harness sees what others said
- **Token-Aware** — Track token usage per harness and model
- **Plugin Architecture** — Add new harness adapters with a single file
- **Roadmap: Native Apps** — Windows `.exe`, Linux Flatpak, macOS `.app`

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/Rezolotion-Harness.git
cd Rezolotion-Harness

# Install
pip install -e ".[dev]"

# Configure (copy and edit)
cp .env.example .env

# Run
python -m rezolotion_harness
```

Open `http://localhost:8000` in your browser.

---

## 💬 How to Use

| Command | What happens |
|---|---|
| `@claude your task` | Routes to Claude Code |
| `@agy your task` | Routes to AntiGravity |
| `@codex your task` | Routes to Codex *(coming soon)* |
| `@hermes your task` | Routes to Hermes *(coming soon)* |
| `@all your message` | Broadcasts to every active harness |
| `@debate @claude @agy topic` | Starts a multi-round debate between harnesses |
| *(no tag)* | Routes to the last used harness |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           Unified Chat UI               │
│         (Web / Terminal / Native)       │
└──────────────────┬──────────────────────┘
                   │ @mention parsing
                   ▼
┌─────────────────────────────────────────┐
│           Harness Router                │
│    Reads @tags → dispatches messages    │
└──────┬──────────┬──────────┬────────────┘
       │          │          │
  ┌────▼───┐ ┌────▼───┐ ┌───▼────┐
  │ Claude │ │  AGY   │ │ Codex  │  ...
  │ Code   │ │Adapter │ │Adapter │
  └────┬───┘ └────┬───┘ └───┬────┘
       │          │          │
┌──────▼──────────▼──────────▼──────────┐
│            Shared Brain                │
│   Full chat history  +  MCP Memory    │
└────────────────────────────────────────┘
```

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and fill in your keys:

```env
# Harness API Keys (only fill what you use)
CLAUDE_API_KEY=your_key_here
ANTIGRAVITY_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here

# Optional: Use a proxy/gateway (e.g. LiteLLM, 9Router)
GATEWAY_BASE_URL=http://localhost:4000/v1
GATEWAY_API_KEY=your_gateway_key

# Server
HOST=localhost
PORT=8000
```

---

## 🗺️ Roadmap

- [x] Phase 1 — Core architecture & adapter system
- [x] Phase 1 — Web UI (chat interface)
- [x] Phase 1 — Claude Code adapter
- [x] Phase 1 — AntiGravity adapter
- [x] Phase 1 — Debate mode
- [x] Phase 1 — Shared context & history
- [ ] Phase 2 — Codex adapter
- [ ] Phase 2 — Hermes adapter
- [ ] Phase 2 — Token usage dashboard
- [ ] Phase 3 — Windows `.exe` (via PyInstaller)
- [ ] Phase 3 — Linux Flatpak
- [ ] Phase 3 — macOS `.app`

---

## 🤝 Contributing

PRs welcome. Add a new harness adapter in `adapters/` — just extend `BaseAdapter`.

---

## 📄 License

MIT — Use freely, no warranty.
