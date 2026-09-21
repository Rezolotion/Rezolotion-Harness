"""
Rezolotion Harness — Projects & Workspace Manager
Manages workspace projects and conversations (as seen in Grok Build, Claude Desktop & AntiGravity).
"""
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "history.db")


class ProjectsManager:
    def __init__(self, db_path: str = DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _init_db(self):
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS projects (
                    id           TEXT PRIMARY KEY,
                    name         TEXT NOT NULL,
                    root_path    TEXT NOT NULL,
                    description  TEXT NOT NULL DEFAULT '',
                    pinned       INTEGER NOT NULL DEFAULT 0,
                    created_at   TEXT NOT NULL
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS project_threads (
                    id          TEXT PRIMARY KEY,
                    project_id  TEXT NOT NULL,
                    title       TEXT NOT NULL,
                    harness     TEXT NOT NULL DEFAULT 'claude',
                    model       TEXT NOT NULL DEFAULT 'claude-3-7-sonnet',
                    pinned      INTEGER NOT NULL DEFAULT 0,
                    created_at  TEXT NOT NULL,
                    updated_at  TEXT NOT NULL,
                    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
                )
            """)
            conn.commit()

        # Seed default project if empty
        projects = self.list_projects()
        if not projects:
            current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            proj = self.create_project(
                name="rezolotion-harness",
                root_path=current_dir,
                description="Meta-Harness Orchestrator Studio"
            )
            self.create_thread(
                project_id=proj["id"],
                title="معماری و طراحی سیستم",
                harness="claude",
                model="claude-3-7-sonnet"
            )

    def list_projects(self) -> List[Dict[str, Any]]:
        with self._get_conn() as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("SELECT * FROM projects ORDER BY pinned DESC, created_at DESC").fetchall()
            projects = []
            for r in rows:
                proj = dict(r)
                threads = conn.execute(
                    "SELECT * FROM project_threads WHERE project_id = ? ORDER BY pinned DESC, updated_at DESC",
                    (proj["id"],)
                ).fetchall()
                proj["threads"] = [dict(t) for t in threads]
                projects.append(proj)
            return projects

    def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
            if not row:
                return None
            proj = dict(row)
            threads = conn.execute(
                "SELECT * FROM project_threads WHERE project_id = ? ORDER BY pinned DESC, updated_at DESC",
                (project_id,)
            ).fetchall()
            proj["threads"] = [dict(t) for t in threads]
            return proj

    def create_project(self, name: str, root_path: str, description: str = "") -> Dict[str, Any]:
        proj_id = str(uuid.uuid4())[:8]
        now = datetime.now(timezone.utc).isoformat()
        with self._get_conn() as conn:
            conn.execute(
                "INSERT INTO projects (id, name, root_path, description, pinned, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (proj_id, name, os.path.abspath(root_path), description, 0, now)
            )
            conn.commit()
        return self.get_project(proj_id)

    def delete_project(self, project_id: str):
        with self._get_conn() as conn:
            conn.execute("DELETE FROM project_threads WHERE project_id = ?", (project_id,))
            conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            conn.commit()

    def create_thread(self, project_id: str, title: str, harness: str = "claude", model: str = "claude-3-7-sonnet") -> Dict[str, Any]:
        thread_id = str(uuid.uuid4())[:8]
        now = datetime.now(timezone.utc).isoformat()
        with self._get_conn() as conn:
            conn.execute(
                "INSERT INTO project_threads (id, project_id, title, harness, model, pinned, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (thread_id, project_id, title, harness, model, 0, now, now)
            )
            conn.commit()
        return {
            "id": thread_id,
            "project_id": project_id,
            "title": title,
            "harness": harness,
            "model": model,
            "pinned": 0,
            "created_at": now,
            "updated_at": now
        }

    def delete_thread(self, thread_id: str):
        with self._get_conn() as conn:
            conn.execute("DELETE FROM project_threads WHERE id = ?", (thread_id,))
            conn.commit()


projects_manager = ProjectsManager()
