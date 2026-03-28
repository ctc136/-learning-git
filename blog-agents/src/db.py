"""Database for saving generated blog posts."""

import json
import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = Path.home() / ".blog-agents" / "blogs.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    _create_tables(conn)
    return conn


def _create_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS blogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT NOT NULL,
            research TEXT,
            outline TEXT,
            draft TEXT,
            edited TEXT,
            final_post TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()


def save_blog(conn, topic: str, agent_outputs: list[str], final_post: str) -> int:
    """Save a completed blog post with all agent outputs."""
    cursor = conn.execute(
        "INSERT INTO blogs (topic, research, outline, draft, edited, final_post) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            topic,
            agent_outputs[0] if len(agent_outputs) > 0 else "",
            agent_outputs[1] if len(agent_outputs) > 1 else "",
            agent_outputs[2] if len(agent_outputs) > 2 else "",
            agent_outputs[3] if len(agent_outputs) > 3 else "",
            final_post,
        ),
    )
    conn.commit()
    return cursor.lastrowid


def get_all_blogs(conn) -> list[dict]:
    rows = conn.execute(
        "SELECT id, topic, created_at FROM blogs ORDER BY created_at DESC"
    ).fetchall()
    return [dict(r) for r in rows]


def get_blog_by_id(conn, blog_id: int) -> Optional[dict]:
    row = conn.execute("SELECT * FROM blogs WHERE id = ?", (blog_id,)).fetchone()
    return dict(row) if row else None


def delete_blog(conn, blog_id: int) -> bool:
    cursor = conn.execute("DELETE FROM blogs WHERE id = ?", (blog_id,))
    conn.commit()
    return cursor.rowcount > 0
