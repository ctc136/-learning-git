"""Database setup and queries for the AI journal."""

import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = Path.home() / ".ai-journal" / "journal.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    _create_tables(conn)
    return conn


def _create_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            mood TEXT NOT NULL DEFAULT 'neutral',
            mood_score INTEGER NOT NULL DEFAULT 3,
            ai_reflection TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------

def save_entry(conn, date: str, content: str, mood: str, mood_score: int,
               ai_reflection: str = None) -> int:
    """Save or update a journal entry for a given date."""
    existing = get_entry_by_date(conn, date)
    if existing:
        conn.execute(
            "UPDATE entries SET content=?, mood=?, mood_score=?, ai_reflection=?, "
            "updated_at=CURRENT_TIMESTAMP WHERE date=?",
            (content, mood, mood_score, ai_reflection, date),
        )
        conn.commit()
        return existing["id"]
    else:
        cursor = conn.execute(
            "INSERT INTO entries (date, content, mood, mood_score, ai_reflection) "
            "VALUES (?, ?, ?, ?, ?)",
            (date, content, mood, mood_score, ai_reflection),
        )
        conn.commit()
        return cursor.lastrowid


def get_entry_by_date(conn, date: str) -> Optional[dict]:
    row = conn.execute("SELECT * FROM entries WHERE date = ?", (date,)).fetchone()
    return dict(row) if row else None


def get_all_entries(conn) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM entries ORDER BY date DESC"
    ).fetchall()
    return [dict(r) for r in rows]


def get_entries_range(conn, start_date: str, end_date: str) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date",
        (start_date, end_date),
    ).fetchall()
    return [dict(r) for r in rows]


def search_entries(conn, query: str) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM entries WHERE content LIKE ? OR ai_reflection LIKE ? ORDER BY date DESC",
        (f"%{query}%", f"%{query}%"),
    ).fetchall()
    return [dict(r) for r in rows]


def get_mood_data(conn, limit: int = 30) -> list[dict]:
    """Get recent mood scores for charting."""
    rows = conn.execute(
        "SELECT date, mood, mood_score FROM entries ORDER BY date DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return [dict(r) for r in reversed(rows)]


def delete_entry(conn, date: str) -> bool:
    cursor = conn.execute("DELETE FROM entries WHERE date = ?", (date,))
    conn.commit()
    return cursor.rowcount > 0


def get_entries_for_summary(conn, limit: int = 7) -> list[dict]:
    """Get recent entries for AI summary."""
    rows = conn.execute(
        "SELECT date, content, mood, mood_score FROM entries ORDER BY date DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return [dict(r) for r in rows]
