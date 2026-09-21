# Rezolotion Harness

<div align="center">

**The High-Performance Autonomous Agent Studio & Multi-Harness Orchestrator**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61dafb?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![9Router](https://img.shields.io/badge/9Router-Gateway-6366f1?style=flat)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

*Execute tasks seamlessly across Claude Code, Google AntiGravity, OpenAI Codex, DeepSeek, and OpenRouter with Zero-Risk Native Sessions and Real-Time Event Streaming.*

[Features](#-key-features) • [Architecture](#-system-architecture) • [Getting Started](#-getting-started) • [Provider Hub](#-provider-matrix) • [Design System](#-design-system-contract)

</div>

---

## 🌟 Overview

**Rezolotion Harness** is a professional agentic studio engineered to bridge disparate autonomous AI models into a unified, high-fidelity developer workspace. Combining the zero-ban-risk safety of official local CLI binaries with the breadth of 9Router's OAuth gateway and direct API endpoints, Rezolotion delivers full project isolation, real-time WebSocket step telemetry, and dynamic model orchestration.

---

## 🚀 Key Features

### 1. Dynamic Model Isolation & Zero Phantom Models
- **Connected-Only Visibility**: The model picker exposes only models whose providers are actively authenticated. Disconnected providers never leak into the dropdown.
- **Empty-State Guard**: If no provider is authenticated, the chat composer displays an interactive prompt guiding the developer directly to the Providers Hub.

### 2. Multi-Provider Authentication Hub (9Router Native OAuth)
- **Zero-Risk Google OAuth (AntiGravity)**: Full native OAuth session integration with Google Gemini Pro / Flash 2M context models without reverse proxies.
- **Official Claude Code CLI Bridge**: Directly integrates installed Claude Code binaries (`~/.local/bin/claude` & `~/.claude.json`) with zero session hijacking risk.
- **OpenAI Codex OAuth**: Native browser OAuth authorization for ChatGPT and Codex reasoning models.
- **Direct Cloud & Local Engines**: Supports DeepSeek (R1 Reasoner & V3 MoE), OpenRouter (100+ open weights), and local Hermes/Ollama nodes.

### 3. Project & Workspace Environment Isolation
- **Multi-Environment Support**: Create and manage distinct projects across four paradigms:
  1. `Local Workspace`: Scoped to any filesystem directory with automatic Git tracking.
  2. `Remote SSH Session`: Connects to remote servers via SSH keys/credentials.
  3. `Cloud / Docker Container`: Attaches directly to local/remote Docker daemons.
  4. `Ephemeral Scratchpad`: Fast, throwaway in-memory sandbox for quick experiments.
- **Full Thread Lifecycle**: Branch multiple threads per project with rename, pin, and permanent deletion controls.

### 4. Interactive Tri-Mode Orchestrator
- **Build Mode (`⚡ Build`)**: Hands-on code generation, refactoring, and command dispatch.
- **Plan Mode (`📄 Plan`)**: High-level architectural planning, boundary analysis, and structured task decomposition.
- **Ask Mode (`💬 Ask`)**: Low-latency questions and documentation exploration without modifying workspace files.
- **Slash Commands (`/`)**: Instant commands including `/plan`, `/build`, `/review`, `/test`, `/diff`, `/clear`, `/observe`, and `/providers`.

### 5. Live Step Telemetry & Multi-Engine Canvas
- **Real-Time WebSocket Pipeline**: Zero-mock streaming of execution steps (`step_start`, `step_finish`, `thinking_delta`, `artifact_created`).
- **Integrated File Explorer**: Tree navigation with file preview and syntax highlighting.
- **Diff & Artifact Viewer**: Side-by-side inspectable code changes and markdown artifacts.
- **Deep Observability**: Real-time token consumption, p95 turn latencies, error breakdown, and tool outcome statistics.

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Rezolotion Web Studio                           │
│     (React 18 + TypeScript + Tailwind CSS v4 + OKLCH Design Tokens)    │
│  Projects Tree  │  Tri-Mode Composer  │  File Explorer  │  Diff Viewer  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ WebSocket / REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      FastAPI Harness Core Server                       │
│  ┌───────────────────────┐  ┌──────────────────────┐  ┌──────────────┐ │
│  │ Projects & SQLite DB  │  │ WebSocket Dispatcher │  │ Telemetry    │ │
│  │ (Threads, Files, State)│  │ (Step Tracker, Plan) │  │ (Token/Turns)│ │
│  └───────────────────────┘  └──────────────────────┘  └──────────────┘ │
└──────────────┬────────────────────────────┬────────────────────────────┘
               │ Local CLI Dispatch         │ OAuth / HTTP Gateway
               ▼                            ▼
┌─────────────────────────────┐   ┌──────────────────────────────────────┐
│  Official Claude Code CLI   │   │        9Router Local Gateway         │
│ (~/.local/bin/claude binary)│   │       (Port :20128 Daemon)           │
│  100% Authentic CLI Session │   │  Google AntiGravity │ OpenAI Codex   │
│       Zero Ban Risk         │   │  OpenRouter Gateway │ Local Ollama   │
└─────────────────────────────┘   └──────────────────────────────────────┘
```

---

## ⚡ Getting Started

### Prerequisites
- Python 3.10+ (uv or venv recommended)
- Node.js 18+ (Node 22 LTS recommended)
- *(Optional)* [9Router](https://github.com) daemon running locally on port 20128
- *(Optional)* [Claude Code CLI](https://claude.ai) installed locally

### Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/rezolotion/rezolotion-harness.git
   cd rezolotion-harness
   ```

2. **Backend Setup**:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r <(echo "fastapi uvicorn httpx pydantic websockets python-dotenv typer")
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

4. **Environment Configuration**:
   ```bash
   cp .env.example .env
   # Edit .env with your desired API keys or leave empty for OAuth/CLI mode
   ```

5. **Launch Rezolotion Harness**:
   ```bash
   ./.venv/bin/uvicorn app:app --host 0.0.0.0 --port 8000 --reload
   ```

6. **Open the Studio**:
   Navigate to `http://localhost:8000/studio` in your browser.

---

## 🛡️ Provider Matrix

| Provider | Supported Authentication | Ban Risk | Context Window | Key Models |
|---|---|---|---|---|
| **Google AntiGravity** | 9Router Google OAuth / AI Studio API | Zero | Up to 2,000,000 | `ag/gemini-3.8-flash-high`, `ag/gemini-3.7-flash-high`, `ag/gemini-2.5-pro` |
| **Claude Code** | Official CLI Binary (`~/.local/bin/claude`) / API Key | Zero | 200,000 | `claude-3-7-sonnet`, `claude-3-5-sonnet`, `claude-3-5-haiku` |
| **OpenAI (ChatGPT / Codex)** | 9Router Codex OAuth / OpenAI API | Zero | 128,000 | `codex/gpt-4o`, `codex/o3-mini`, `gpt-4o` |
| **DeepSeek AI** | Direct API Key | Minimal | 64,000 | `deepseek-reasoner` (R1), `deepseek-chat` (V3) |
| **OpenRouter** | 9Router Gateway / API Key | Minimal | Varies | 100+ open and commercial weights |
| **Hermes / Ollama** | Localhost Daemon (`:11434`) | Zero | Configurable | `hermes-3-llama-3.1-8b`, `qwen2.5-coder` |

---

## 🎨 Design System Contract

Rezolotion adheres strictly to [`BRANDBOOK.md`](BRANDBOOK.md):
- **Palette**: Dark-first Linear/Vercel OKLCH color space with 3-tier surface elevation (`Base`, `Surface`, `Elevated`).
- **Borders**: Precision hairline borders (`rgba / oklch hairline`).
- **Typography**: Inter (Body/UI), JetBrains Mono (Code/Telemetry), Vazirmatn (Multilingual).
- **Iconography**: 100% vector SVG icons via `lucide-react` and official brand marks. Absolute **Zero-Emoji Policy**.

---

## 🧪 Testing & Verification

Run the automated black-box test suite:
```bash
./.venv/bin/python tests/blackbox_validation.py
```

Verify frontend compilation:
```bash
cd frontend && npm run build
```

---

## 📄 License

MIT © Rezolotion. Distributed under the MIT License. See [LICENSE](LICENSE) for details.

