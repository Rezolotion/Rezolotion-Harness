"""
Rezolotion Harness — File System & Workspace Context Manager
Provides directory tree and file inspection for the Project Explorer panel (Screenshot 3).
"""
import os
from typing import Dict, Any, List, Optional

IGNORE_DIRS = {
    ".git", "__pycache__", "node_modules", ".venv", "dist",
    ".idea", ".vscode", ".pytest_cache"
}


class FSManager:
    def get_tree(self, root_path: str, max_depth: int = 3, current_depth: int = 0) -> List[Dict[str, Any]]:
        if not os.path.exists(root_path) or not os.path.isdir(root_path):
            return []

        if current_depth >= max_depth:
            return []

        items = []
        try:
            entries = sorted(os.listdir(root_path))
        except Exception:
            return []

        for entry in entries:
            if entry in IGNORE_DIRS:
                continue
            full_path = os.path.join(root_path, entry)
            is_dir = os.path.isdir(full_path)
            item = {
                "name": entry,
                "path": full_path,
                "is_dir": is_dir,
                "size": os.path.getsize(full_path) if not is_dir else 0,
            }
            if is_dir:
                item["children"] = self.get_tree(full_path, max_depth, current_depth + 1)
            items.append(item)

        # Sort: directories first, then files
        items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))
        return items

    def read_file(self, filepath: str, max_bytes: int = 200_000) -> Dict[str, Any]:
        if not os.path.exists(filepath):
            return {"error": "File not found", "content": ""}
        if os.path.isdir(filepath):
            return {"error": "Path is a directory", "content": ""}

        try:
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                content = f.read(max_bytes)
            return {
                "path": filepath,
                "name": os.path.basename(filepath),
                "size": os.path.getsize(filepath),
                "content": content,
                "truncated": os.path.getsize(filepath) > max_bytes
            }
        except Exception as e:
            return {"error": str(e), "content": ""}


fs_manager = FSManager()
