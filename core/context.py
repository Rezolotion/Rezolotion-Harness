"""
Rezolotion Harness — Shared Context (SQLite-backed chat history)
All harnesses read and write to the same history so everyone stays in sync.
"""
import json
import os
from datetime import datetime, timezone

import aiosqlite


class SharedContext:
    """
    Persists the full conversation history across all harnesses.
    When harness A responds, harness B can see what A said — and vice versa.
    """

    def __init__(self, db_path: str = "./data/history.db") -> None:
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self.db_path = db_path

    async def _init(self, db: aiosqlite.Connection) -> None:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                ts        TEXT    NOT NULL,
                role      TEXT    NOT NULL,
                harness   TEXT    NOT NULL DEFAULT '',
                model     TEXT    NOT NULL DEFAULT '',
                content   TEXT    NOT NULL,
                metadata  TEXT    NOT NULL DEFAULT '{}'
            )
        """)
        await db.commit()

    async def add(
        self,
        role: str,
        content: str,
        harness: str = "",
        model: str = "",
        metadata: dict | None = None,
    ) -> int:
        """Append a message to the shared history. Returns the new message ID."""
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            cursor = await db.execute(
                "INSERT INTO messages (ts, role, harness, model, content, metadata) VALUES (?,?,?,?,?,?)",
                (
                    datetime.now(timezone.utc).isoformat(),
                    role,
                    harness,
                    model,
                    content,
                    json.dumps(metadata or {}),
                ),
            )
            await db.commit()
            return cursor.lastrowid  # type: ignore[return-value]

    async def get_messages(
        self,
        limit: int = 100,
        for_harness: str = "",
    ) -> list[dict]:
        """
        Fetch recent messages formatted for LLM consumption.
        Messages from *other* harnesses are labelled so the current harness
        understands who said what.
        """
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            db.row_factory = aiosqlite.Row
            rows = await db.execute_fetchall(
                "SELECT role, harness, content FROM messages ORDER BY id DESC LIMIT ?",
                (limit,),
            )

        result = []
        for row in reversed(rows):
            role = row["role"]
            harness = row["harness"]
            content = row["content"]

            if role == "user":
                result.append({"role": "user", "content": content})
            else:
                # Label responses from OTHER harnesses so current harness understands
                if harness and harness != for_harness:
                    content = f"[{harness.upper()}]: {content}"
                result.append({"role": "assistant", "content": content})

        return result

    async def get_all_raw(self, limit: int = 200) -> list[dict]:
        """Fetch raw message rows for the UI to display."""
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            db.row_factory = aiosqlite.Row
            rows = await db.execute_fetchall(
                "SELECT id, ts, role, harness, model, content FROM messages ORDER BY id DESC LIMIT ?",
                (limit,),
            )
        return [dict(r) for r in reversed(rows)]

    async def clear(self) -> None:
        """Wipe the entire history (use with caution)."""
        async with aiosqlite.connect(self.db_path) as db:
            await self._init(db)
            await db.execute("DELETE FROM messages")
            await db.commit()
