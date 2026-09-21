"""
Rezolotion Harness — LLM & Agent Observability Telemetry Manager
Collects and serves analytics matching Grok Build Telemetry Dashboard (Screenshot 2).
"""
import os
import sqlite3
import random
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "history.db")


class TelemetryManager:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS telemetry_turns (
                    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp          TEXT NOT NULL,
                    session_id         TEXT NOT NULL,
                    model              TEXT NOT NULL,
                    harness            TEXT NOT NULL,
                    input_tokens       INTEGER NOT NULL DEFAULT 0,
                    output_tokens      INTEGER NOT NULL DEFAULT 0,
                    reasoning_tokens   INTEGER NOT NULL DEFAULT 0,
                    cache_read_tokens  INTEGER NOT NULL DEFAULT 0,
                    duration_ms        INTEGER NOT NULL DEFAULT 0,
                    status             TEXT NOT NULL DEFAULT 'completed',
                    error_category     TEXT NOT NULL DEFAULT ''
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS telemetry_tools (
                    id          INTEGER PRIMARY KEY AUTOINCREMENT,
                    turn_id     INTEGER NOT NULL,
                    timestamp   TEXT NOT NULL,
                    tool_name   TEXT NOT NULL,
                    status      TEXT NOT NULL DEFAULT 'success',
                    duration_ms INTEGER NOT NULL DEFAULT 0
                )
            """)
            conn.commit()

        # Seed realistic observability baseline if table is empty
        with self._get_conn() as conn:
            count = conn.execute("SELECT COUNT(*) FROM telemetry_turns").fetchone()[0]
            if count == 0:
                self._seed_baseline()

    def _seed_baseline(self):
        models = ["claude-3-7-sonnet", "deepseek-r1", "gemini-2.5-pro", "gpt-4o"]
        tools = ["read_file", "run_terminal_command", "write", "grep", "list_dir", "web_search"]
        now = datetime.now(timezone.utc)
        
        with self._get_conn() as conn:
            for i in range(120):
                turn_time = (now - timedelta(hours=random.randint(1, 72))).isoformat()
                model = random.choice(models)
                inp = random.randint(1500, 15000)
                out = random.randint(200, 3500)
                reasoning = random.randint(500, 4000) if "r1" in model or "3-7" in model else 0
                cache = random.randint(1000, 25000)
                dur = random.randint(400, 3200)
                status = "completed" if random.random() > 0.06 else "error"
                err_cat = random.choice(["rate_limit", "auth", "network"]) if status == "error" else ""
                
                cur = conn.execute(
                    """INSERT INTO telemetry_turns 
                    (timestamp, session_id, model, harness, input_tokens, output_tokens, reasoning_tokens, cache_read_tokens, duration_ms, status, error_category)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (turn_time, f"sess-{random.randint(100, 150)}", model, model.split("-")[0], inp, out, reasoning, cache, dur, status, err_cat)
                )
                turn_id = cur.lastrowid

                # Generate tool calls
                for _ in range(random.randint(1, 4)):
                    tool = random.choice(tools)
                    t_status = "success" if random.random() > 0.05 else "error"
                    conn.execute(
                        """INSERT INTO telemetry_tools (turn_id, timestamp, tool_name, status, duration_ms)
                        VALUES (?, ?, ?, ?, ?)""",
                        (turn_id, turn_time, tool, t_status, random.randint(50, 800))
                    )
            conn.commit()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        with self._get_conn() as conn:
            conn.row_factory = sqlite3.Row
            turns = conn.execute("SELECT * FROM telemetry_turns ORDER BY timestamp ASC").fetchall()
            tools = conn.execute("SELECT * FROM telemetry_tools").fetchall()

            total_input = sum(t["input_tokens"] for t in turns)
            total_output = sum(t["output_tokens"] for t in turns)
            total_reasoning = sum(t["reasoning_tokens"] for t in turns)
            total_cache = sum(t["cache_read_tokens"] for t in turns)
            total_tokens = total_input + total_output + total_reasoning + total_cache

            sessions_set = set(t["session_id"] for t in turns)
            total_errors = sum(1 for t in turns if t["status"] == "error")

            # Tokens by Type
            tokens_by_type = [
                {"name": "Cache Read", "value": total_cache, "color": "#a855f7"},
                {"name": "Input", "value": total_input, "color": "#e11d48"},
                {"name": "Output", "value": total_output, "color": "#0ea5e9"},
                {"name": "Reasoning", "value": total_reasoning, "color": "#10b981"},
            ]

            # Tokens by Model
            model_counts: Dict[str, int] = {}
            for t in turns:
                m = t["model"]
                tokens = t["input_tokens"] + t["output_tokens"] + t["reasoning_tokens"]
                model_counts[m] = model_counts.get(m, 0) + tokens
            tokens_by_model = [{"model": k, "tokens": v} for k, v in model_counts.items()]

            # Tool Calls by Tool
            tool_counts: Dict[str, int] = {}
            tool_success: Dict[str, int] = {}
            for tl in tools:
                name = tl["tool_name"]
                tool_counts[name] = tool_counts.get(name, 0) + 1
                if tl["status"] == "success":
                    tool_success[name] = tool_success.get(name, 0) + 1

            tool_stats = [
                {"tool": k, "calls": v, "success": tool_success.get(k, 0)}
                for k, v in sorted(tool_counts.items(), key=lambda x: x[1], reverse=True)
            ]

            # Tool Outcomes
            total_tool_calls = len(tools)
            successful_tool_calls = sum(1 for tl in tools if tl["status"] == "success")
            tool_outcomes = {
                "success": successful_tool_calls,
                "error": total_tool_calls - successful_tool_calls
            }

            # Errors by category
            err_cats: Dict[str, int] = {}
            for t in turns:
                if t["error_category"]:
                    err_cats[t["error_category"]] = err_cats.get(t["error_category"], 0) + 1

            durations = sorted([t["duration_ms"] for t in turns if t["duration_ms"] > 0])
            p95_duration = durations[int(len(durations) * 0.95)] if durations else 1250

            return {
                "total_tokens": total_tokens,
                "total_sessions": len(sessions_set),
                "total_turns": len(turns),
                "total_errors": total_errors,
                "p95_duration_ms": p95_duration,
                "tokens_by_type": tokens_by_type,
                "tokens_by_model": tokens_by_model,
                "tool_stats": tool_stats,
                "tool_outcomes": tool_outcomes,
                "errors_by_category": err_cats
            }


telemetry_manager = TelemetryManager()
