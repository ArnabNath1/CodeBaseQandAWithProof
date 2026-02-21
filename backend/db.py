"""
SQLite database layer for Q&A history.
"""

import sqlite3
import json
from typing import Optional, List
from datetime import datetime

# Use a persistent path if running on Render/Docker, otherwise local
if os.path.exists("/app/data"):
    DB_PATH = "/app/data/qa_history.db"
else:
    DB_PATH = "qa_history.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS qa_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            snippets TEXT DEFAULT '[]',
            tags TEXT DEFAULT '[]',
            source TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()


def save_qa(
    question: str,
    answer: str,
    snippets: str = "[]",
    tags: str = "[]",
    source: str = "",
) -> int:
    conn = get_conn()
    cursor = conn.execute(
        """INSERT INTO qa_history (question, answer, snippets, tags, source)
           VALUES (?, ?, ?, ?, ?)""",
        (question, answer, snippets, tags, source),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id


def get_recent_qas(
    limit: int = 10,
    search: Optional[str] = None,
    tag: Optional[str] = None,
) -> List[dict]:
    conn = get_conn()
    query = "SELECT * FROM qa_history"
    params = []
    conditions = []

    if search:
        conditions.append("(question LIKE ? OR answer LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%"])

    if conditions:
        query += " WHERE " + " AND ".join(conditions)

    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    rows = conn.execute(query, params).fetchall()
    conn.close()

    results = []
    for row in rows:
        item = dict(row)
        try:
            item["snippets"] = json.loads(item["snippets"])
        except Exception:
            item["snippets"] = []
        try:
            item["tags"] = json.loads(item["tags"])
        except Exception:
            item["tags"] = []

        # Filter by tag if provided
        if tag and tag not in item["tags"]:
            continue

        results.append(item)

    return results


def get_all_tags() -> List[str]:
    conn = get_conn()
    rows = conn.execute("SELECT tags FROM qa_history WHERE tags != '[]'").fetchall()
    conn.close()

    all_tags = set()
    for row in rows:
        try:
            tags = json.loads(row["tags"])
            all_tags.update(tags)
        except Exception:
            pass
    return sorted(list(all_tags))


def get_qa_by_id(qa_id: int) -> Optional[dict]:
    conn = get_conn()
    row = conn.execute("SELECT * FROM qa_history WHERE id = ?", (qa_id,)).fetchone()
    conn.close()
    if not row:
        return None
    item = dict(row)
    try:
        item["snippets"] = json.loads(item["snippets"])
    except Exception:
        item["snippets"] = []
    try:
        item["tags"] = json.loads(item["tags"])
    except Exception:
        item["tags"] = []
    return item
