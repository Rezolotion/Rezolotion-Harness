"""
Rezolotion Harness — Projects & Workspace Manager
Manages workspace projects and conversations (as seen in Grok Build, Claude Desktop & AntiGravity).
"""
import os
import json
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
                    id                 TEXT PRIMARY KEY,
                    name               TEXT NOT NULL,
                    root_path          TEXT NOT NULL,
                    description        TEXT NOT NULL DEFAULT '',
                    project_type       TEXT NOT NULL DEFAULT 'local',
                    connection_config  TEXT NOT NULL DEFAULT '{}',
                    pinned             INTEGER NOT NULL DEFAULT 0,
                    created_at         TEXT NOT NULL
                )
            """)
            # Migration check: add columns if table existed without them
            cur = conn.cursor()
            cur.execute("PRAGMA table_info(projects)")
            cols = [row[1] for row in cur.fetchall()]
            if "project_type" not in cols:
                conn.execute("ALTER TABLE projects ADD COLUMN project_type TEXT NOT NULL DEFAULT 'local'")
            if "connection_config" not in cols:
                conn.execute("ALTER TABLE projects ADD COLUMN connection_config TEXT NOT NULL DEFAULT '{}'")

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
                try:
                    proj["connection_config"] = json.loads(proj.get("connection_config") or "{}")
                except Exception:
                    proj["connection_config"] = {}
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
            try:
                proj["connection_config"] = json.loads(proj.get("connection_config") or "{}")
            except Exception:
                proj["connection_config"] = {}
            return proj

    def create_project(
        self,
        name: str,
        root_path: str = ".",
        description: str = "",
        project_type: str = "local",
        connection_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        proj_id = str(uuid.uuid4())[:8]
        now = datetime.now(timezone.utc).isoformat()
        cfg_str = json.dumps(connection_config or {})
        abs_path = os.path.abspath(root_path) if project_type == "local" else root_path

        with self._get_conn() as conn:
            conn.execute(
                """INSERT INTO projects
                   (id, name, root_path, description, project_type, connection_config, pinned, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (proj_id, name, abs_path, description, project_type, cfg_str, 0, now)
            )
            conn.commit()
        return self.get_project(proj_id)

    def rename_project(self, project_id: str, new_name: str) -> Optional[Dict[str, Any]]:
        with self._get_conn() as conn:
            conn.execute("UPDATE projects SET name = ? WHERE id = ?", (new_name, project_id))
            conn.commit()
        return self.get_project(project_id)

    def delete_project(self, project_id: str) -> bool:
        with self._get_conn() as conn:
            conn.execute("DELETE FROM project_threads WHERE project_id = ?", (project_id,))
            conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
            conn.commit()
        return True

    def create_thread(
        self,
        project_id: str,
        title: str,
        harness: str = "claude",
        model: str = "claude-3-7-sonnet"
    ) -> Dict[str, Any]:
        thread_id = str(uuid.uuid4())[:8]
        now = datetime.now(timezone.utc).isoformat()
        with self._get_conn() as conn:
            conn.execute(
                """INSERT INTO project_threads
                   (id, project_id, title, harness, model, pinned, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
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

    def rename_thread(self, thread_id: str, new_title: str) -> bool:
        now = datetime.now(timezone.utc).isoformat()
        with self._get_conn() as conn:
            conn.execute("UPDATE project_threads SET title = ?, updated_at = ? WHERE id = ?", (new_title, now, thread_id))
            conn.commit()
        return True

    def delete_thread(self, thread_id: str) -> bool:
        with self._get_conn() as conn:
            conn.execute("DELETE FROM project_threads WHERE id = ?", (thread_id,))
            conn.commit()
        return True


projects_manager = ProjectsManager()
