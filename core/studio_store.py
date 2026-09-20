"""
Rezolotion Harness — Studio Store
Manages persistence for Artifacts, MCP Marketplace Connectors, and Customize Skills.
"""
import json
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import aiosqlite


DEFAULT_SKILLS = [
    {
        "id": "algorithmic-art",
        "title": "algorithmic-art",
        "author": "Anthropic",
        "description": "Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration...",
        "icon": "🎨",
        "category": "creative",
        "isInstalled": True,
    },
    {
        "id": "brand-guidelines",
        "title": "brand-guidelines",
        "author": "Anthropic",
        "description": "Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit from polished design...",
        "icon": "📐",
        "category": "design",
        "isInstalled": False,
    },
    {
        "id": "canvas-design",
        "title": "canvas-design",
        "author": "Anthropic",
        "description": "Create beautiful visual art in .png and .pdf documents using design philosophy. You should use this when crafting visual specs...",
        "icon": "🖼️",
        "category": "design",
        "isInstalled": True,
    },
    {
        "id": "doc-coauthoring",
        "title": "doc-coauthoring",
        "author": "Anthropic",
        "description": "Guide users through a structured workflow for co-authoring documentation. Use when user needs help writing technical specs...",
        "icon": "📝",
        "category": "productivity",
        "isInstalled": False,
    },
    {
        "id": "internal-comms",
        "title": "internal-comms",
        "author": "Anthropic",
        "description": "A set of resources to help write all kinds of internal communications, using executive formats that work across engineering teams...",
        "icon": "📣",
        "category": "productivity",
        "isInstalled": False,
    },
    {
        "id": "learn",
        "title": "learn",
        "author": "Anthropic",
        "description": "Use this skill when the user wants intellectual understanding — learning how or why something works, with deep analogies...",
        "icon": "💡",
        "category": "education",
        "isInstalled": True,
    },
    {
        "id": "mcp-builder",
        "title": "mcp-builder",
        "author": "Anthropic",
        "description": "Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to inspect, query, and mutate external tools...",
        "icon": "⚙️",
        "category": "developer",
        "isInstalled": True,
    },
    {
        "id": "slack-gif-creator",
        "title": "slack-gif-creator",
        "author": "Anthropic",
        "description": "Knowledge and utilities for creating animated GIFs optimized for Slack. Provides frame rate constraints and clean export presets...",
        "icon": "🎞️",
        "category": "creative",
        "isInstalled": False,
    },
    {
        "id": "theme-factory",
        "title": "theme-factory",
        "author": "Anthropic",
        "description": "Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML widgets, and presentations...",
        "icon": "🎭",
        "category": "design",
        "isInstalled": False,
    },
    {
        "id": "web-artifacts-builder",
        "title": "web-artifacts-builder",
        "author": "Anthropic",
        "description": "Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern web frameworks and UI styling...",
        "icon": "🌐",
        "category": "developer",
        "isInstalled": True,
    },
]


DEFAULT_MCPS = [
    {
        "id": "github",
        "name": "GitHub Connector",
        "author": "ModelContextProtocol",
        "description": "Interact with GitHub repositories, pull requests, issues, commits, and workflows directly from your harness.",
        "icon": "🐙",
        "category": "developer",
        "command": "npx -y @modelcontextprotocol/server-github",
        "envKeys": ["GITHUB_PERSONAL_ACCESS_TOKEN"],
        "isConnected": True,
        "toolsCount": 26,
    },
    {
        "id": "postgres",
        "name": "PostgreSQL Database",
        "author": "ModelContextProtocol",
        "description": "Read-only and analytical queries against PostgreSQL databases with automatic schema reflection and plan analysis.",
        "icon": "🐘",
        "category": "database",
        "command": "npx -y @modelcontextprotocol/server-postgres postgresql://localhost/mydb",
        "envKeys": ["DATABASE_URL"],
        "isConnected": False,
        "toolsCount": 6,
    },
    {
        "id": "brave-search",
        "name": "Brave Web Search",
        "author": "Brave Software",
        "description": "High-privacy real-time web search with global index, news filtering, and domain queries.",
        "icon": "🦁",
        "category": "search",
        "command": "npx -y @modelcontextprotocol/server-brave-search",
        "envKeys": ["BRAVE_API_KEY"],
        "isConnected": True,
        "toolsCount": 2,
    },
    {
        "id": "filesystem",
        "name": "Local Filesystem",
        "author": "ModelContextProtocol",
        "description": "Safe, sandboxed directory access for reading, writing, and searching project workspaces and source code.",
        "icon": "📁",
        "category": "system",
        "command": "npx -y @modelcontextprotocol/server-filesystem /path/to/dir",
        "envKeys": ["WORKSPACE_PATH"],
        "isConnected": True,
        "toolsCount": 12,
    },
    {
        "id": "memory",
        "name": "Knowledge Graph Memory",
        "author": "ModelContextProtocol",
        "description": "Persistent long-term memory graph preserving entities, user preferences, and relations across conversations.",
        "icon": "🧠",
        "category": "ai",
        "command": "npx -y @modelcontextprotocol/server-memory",
        "envKeys": [],
        "isConnected": True,
        "toolsCount": 9,
    },
    {
        "id": "sqlite",
        "name": "SQLite Explorer",
        "author": "ModelContextProtocol",
        "description": "Direct fast inspection and queries on local SQLite database files (.db, .sqlite).",
        "icon": "🗄️",
        "category": "database",
        "command": "npx -y @modelcontextprotocol/server-sqlite --db-path ./data/history.db",
        "envKeys": ["SQLITE_DB_PATH"],
        "isConnected": False,
        "toolsCount": 4,
    },
    {
        "id": "docker",
        "name": "Docker Engine",
        "author": "Community",
        "description": "Inspect containers, images, volumes, and execute containerized workflows in isolated environments.",
        "icon": "🐳",
        "category": "developer",
        "command": "docker run -i --rm -v /var/run/docker.sock:/var/run/docker.sock mcp/docker",
        "envKeys": ["DOCKER_HOST"],
        "isConnected": False,
        "toolsCount": 14,
    },
    {
        "id": "puppeteer",
        "name": "Puppeteer Browser",
        "author": "ModelContextProtocol",
        "description": "Headless Chrome browser automation for rendering SPAs, taking screenshots, and testing web apps.",
        "icon": "🎭",
        "category": "developer",
        "command": "npx -y @modelcontextprotocol/server-puppeteer",
        "envKeys": [],
        "isConnected": False,
        "toolsCount": 8,
    },
]


DEFAULT_ARTIFACTS = [
    {
        "id": "art-1",
        "title": "Apple Liquid Glass Design Guidelines",
        "type": "docs",
        "badge": "Docs Beta",
        "author": "Rezolotion AI",
        "createdAt": "2026-09-20T11:00:00Z",
        "summary": "Full design tokens, contrast ratios, and frosted glass layer hierarchy based on naplesblue/apple-design-skill.",
        "content": """# Apple Liquid Glass Design Guidelines

## Core Principles
1. **Unified White Surfaces:** Background `#f5f5f7`, pure white panels with `rgba(0,0,0,0.07)` hairlines.
2. **Glass as Seasoning:** Apply `backdrop-filter: blur(20px)` only on overlapping sticky elements.
3. **Restrained Color:** Accent blue `#0071e3`, Claude terracotta `#e57c5c`, AntiGravity teal `#00897b`.

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.78);
  --glass-blur: 20px;
  --hairline: rgba(0, 0, 0, 0.07);
}
```
""",
    },
    {
        "id": "art-2",
        "title": "Meta-Harness Multi-Agent Architecture",
        "type": "slides",
        "badge": "Slides Beta",
        "author": "Rezolotion AI",
        "createdAt": "2026-09-20T12:30:00Z",
        "summary": "Keynote presentation detailing zero-ban-risk native execution and shared SQLite memory.",
        "content": """# Slide 1: Rezolotion Meta-Harness
### The Next-Generation Unified AI Orchestrator

- **Zero Ban Risk:** Official CLI subprocess invocation
- **Universal Context:** Shared SQLite memory across Claude & AntiGravity
- **Real-Time WebSockets:** Sub-millisecond response streaming

---

# Slide 2: Security Architecture
- Reverse proxies get banned due to TLS fingerprinting
- Rezolotion Harness runs the authentic binary locally
""",
    },
    {
        "id": "art-3",
        "title": "Mobile Terminal & Agent Dashboard",
        "type": "design",
        "badge": "Design Beta",
        "author": "Rezolotion AI",
        "createdAt": "2026-09-20T14:15:00Z",
        "summary": "Interactive mobile mockup featuring compact toolbar, model pills, and gesture routing.",
        "content": """<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; background: #141416; color: #fff; font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .phone { width: 340px; height: 680px; background: #1c1c1e; border: 12px solid #2c2c2e; border-radius: 44px; padding: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.6); display: flex; flex-direction: column; }
    .header { font-size: 18px; font-weight: 700; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .chat-bubble { background: #2c2c2e; border-radius: 16px; padding: 12px 16px; font-size: 13px; line-height: 1.4; margin-bottom: 12px; }
    .chat-bubble.accent { background: #0071e3; color: white; align-self: flex-end; }
    .bottom-bar { margin-top: auto; background: rgba(44,44,46,0.8); backdrop-filter: blur(20px); border-radius: 20px; padding: 10px; display: flex; align-items: center; justify-content: space-between; }
    .pill { font-size: 11px; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 12px; }
  </style>
</head>
<body>
  <div class="phone">
    <div class="header">
      <span>Rezolotion</span>
      <span style="color:#0071e3;">● Live</span>
    </div>
    <div class="chat-bubble">Analyzing full codebase with Native Claude Code CLI...</div>
    <div class="chat-bubble accent">Found 0 security vulnerabilities.</div>
    <div class="bottom-bar">
      <span class="pill">Opus 5</span>
      <span class="pill" style="color:#30d158;">Ultracode</span>
    </div>
  </div>
</body>
</html>
""",
    },
]


class StudioStore:
    def __init__(self, db_path: str = "./data/history.db") -> None:
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path

    async def _init(self, db: aiosqlite.Connection) -> None:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS skills (
                id           TEXT PRIMARY KEY,
                title        TEXT NOT NULL,
                author       TEXT NOT NULL,
                description  TEXT NOT NULL,
                icon         TEXT NOT NULL,
                category     TEXT NOT NULL,
                is_installed INTEGER NOT NULL DEFAULT 0
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS mcp_connectors (
                id           TEXT PRIMARY KEY,
                name         TEXT NOT NULL,
                author       TEXT NOT NULL,
                description  TEXT NOT NULL,
                icon         TEXT NOT NULL,
                category     TEXT NOT NULL,
                command      TEXT NOT NULL,
                env_keys     TEXT NOT NULL,
                is_connected INTEGER NOT NULL DEFAULT 0,
                tools_count  INTEGER NOT NULL DEFAULT 0,
                config_json  TEXT NOT NULL DEFAULT '{}'
            )
        """)

        await db.execute("""
            CREATE TABLE IF NOT EXISTS artifacts (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                type        TEXT NOT NULL,
                badge       TEXT NOT NULL,
                author      TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                summary     TEXT NOT NULL,
                content     TEXT NOT NULL
            )
        """)
        await db.commit()

        # Seed skills if table is empty
        async with db.execute("SELECT COUNT(*) FROM skills") as cursor:
            count = (await cursor.fetchone())[0]
            if count == 0:
                for s in DEFAULT_SKILLS:
                    await db.execute(
                        "INSERT INTO skills (id, title, author, description, icon, category, is_installed) VALUES (?,?,?,?,?,?,?)",
                        (s["id"], s["title"], s["author"], s["description"], s["icon"], s["category"], 1 if s["isInstalled"] else 0),
                    )

        # Seed MCP connectors if empty
        async with db.execute("SELECT COUNT(*) FROM mcp_connectors") as cursor:
            count = (await cursor.fetchone())[0]
            if count == 0:
                for m in DEFAULT_MCPS:
                    await db.execute(
                        "INSERT INTO mcp_connectors (id, name, author, description, icon, category, command, env_keys, is_connected, tools_count, config_json) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                        (m["id"], m["name"], m["author"], m["description"], m["icon"], m["category"], m["command"], json.dumps(m["envKeys"]), 1 if m["isConnected"] else 0, m["toolsCount"], "{}"),
                    )

        # Seed Artifacts if empty
        async with db.execute("SELECT COUNT(*) FROM artifacts") as cursor:
            count = (await cursor.fetchone())[0]
            if count == 0:
                for a in DEFAULT_ARTIFACTS:
                    await db.execute(
                        "INSERT INTO artifacts (id, title, type, badge, author, created_at, summary, content) VALUES (?,?,?,?,?,?,?,?)",
                        (a["id"], a["title"], a["type"], a["badge"], a["author"], a["createdAt"], a["summary"], a["content"]),
                    )

        await db.commit()

    # ── Skills API ──
    async def get_skills(self) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            db.row_factory = aiosqlite.Row
            rows = await db.execute_fetchall("SELECT * FROM skills ORDER BY id ASC")
            return [
                {
                    "id": r["id"],
                    "title": r["title"],
                    "author": r["author"],
                    "description": r["description"],
                    "icon": r["icon"],
                    "category": r["category"],
                    "isInstalled": bool(r["is_installed"]),
                }
                for r in rows
            ]

    async def toggle_skill(self, skill_id: str) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT is_installed FROM skills WHERE id = ?", (skill_id,)) as cursor:
                row = await cursor.fetchone()
                if not row:
                    return False
                new_state = 0 if row["is_installed"] else 1
                await db.execute("UPDATE skills SET is_installed = ? WHERE id = ?", (new_state, skill_id))
                await db.commit()
                return bool(new_state)

    # ── MCP API ──
    async def get_mcp_servers(self) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            db.row_factory = aiosqlite.Row
            rows = await db.execute_fetchall("SELECT * FROM mcp_connectors ORDER BY is_connected DESC, name ASC")
            return [
                {
                    "id": r["id"],
                    "name": r["name"],
                    "author": r["author"],
                    "description": r["description"],
                    "icon": r["icon"],
                    "category": r["category"],
                    "command": r["command"],
                    "envKeys": json.loads(r["env_keys"]),
                    "isConnected": bool(r["is_connected"]),
                    "toolsCount": r["tools_count"],
                    "config": json.loads(r["config_json"]),
                }
                for r in rows
            ]

    async def toggle_mcp(self, mcp_id: str, config: Optional[Dict[str, Any]] = None) -> bool:
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT is_connected, config_json FROM mcp_connectors WHERE id = ?", (mcp_id,)) as cursor:
                row = await cursor.fetchone()
                if not row:
                    return False
                new_state = 0 if row["is_connected"] else 1
                cfg_json = json.dumps(config) if config is not None else row["config_json"]
                await db.execute(
                    "UPDATE mcp_connectors SET is_connected = ?, config_json = ? WHERE id = ?",
                    (new_state, cfg_json, mcp_id),
                )
                await db.commit()
                return bool(new_state)

    async def add_custom_mcp(self, mcp_data: Dict[str, Any]) -> Dict[str, Any]:
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            m_id = mcp_data.get("id") or f"custom-{int(datetime.now().timestamp())}"
            await db.execute(
                """INSERT OR REPLACE INTO mcp_connectors 
                   (id, name, author, description, icon, category, command, env_keys, is_connected, tools_count, config_json) 
                   VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    m_id,
                    mcp_data.get("name", "Custom MCP"),
                    mcp_data.get("author", "User"),
                    mcp_data.get("description", "User-defined MCP server"),
                    mcp_data.get("icon", "🔌"),
                    mcp_data.get("category", "custom"),
                    mcp_data.get("command", ""),
                    json.dumps(mcp_data.get("envKeys", [])),
                    1,
                    mcp_data.get("toolsCount", 5),
                    json.dumps(mcp_data.get("config", {})),
                ),
            )
            await db.commit()
            return {"id": m_id, **mcp_data, "isConnected": True}

    # ── Artifacts API ──
    async def get_artifacts(self) -> List[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            db.row_factory = aiosqlite.Row
            rows = await db.execute_fetchall("SELECT * FROM artifacts ORDER BY created_at DESC")
            return [
                {
                    "id": r["id"],
                    "title": r["title"],
                    "type": r["type"],
                    "badge": r["badge"],
                    "author": r["author"],
                    "createdAt": r["created_at"],
                    "summary": r["summary"],
                    "content": r["content"],
                }
                for r in rows
            ]

    async def get_artifact(self, artifact_id: str) -> Optional[Dict[str, Any]]:
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            db.row_factory = aiosqlite.Row
            async with db.execute("SELECT * FROM artifacts WHERE id = ?", (artifact_id,)) as cursor:
                r = await cursor.fetchone()
                if not r:
                    return None
                return {
                    "id": r["id"],
                    "title": r["title"],
                    "type": r["type"],
                    "badge": r["badge"],
                    "author": r["author"],
                    "createdAt": r["created_at"],
                    "summary": r["summary"],
                    "content": r["content"],
                }

    async def create_artifact(self, data: Dict[str, Any]) -> Dict[str, Any]:
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            art_id = data.get("id") or f"art-{int(datetime.now().timestamp())}"
            type_val = data.get("type", "docs")
            badge_val = data.get("badge") or f"{type_val.capitalize()} Beta"
            created_at = data.get("createdAt") or datetime.now(timezone.utc).isoformat()

            await db.execute(
                """INSERT OR REPLACE INTO artifacts 
                   (id, title, type, badge, author, created_at, summary, content) 
                   VALUES (?,?,?,?,?,?,?,?)""",
                (
                    art_id,
                    data.get("title", "Untitled Artifact"),
                    type_val,
                    badge_val,
                    data.get("author", "User"),
                    created_at,
                    data.get("summary", ""),
                    data.get("content", ""),
                ),
            )
            await db.commit()
            return {"id": art_id, **data, "createdAt": created_at}


studio_store = StudioStore()
