"""Database for storing documents and their chunks."""

import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = Path.home() / ".knowledge-base" / "kb.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    _create_tables(conn)
    return conn


def _create_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            source_type TEXT NOT NULL,
            source_path TEXT,
            total_chunks INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doc_id INTEGER NOT NULL,
            chunk_index INTEGER NOT NULL,
            text TEXT NOT NULL,
            FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            sources_used TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)
    conn.commit()


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------

def add_document(conn, name: str, source_type: str, source_path: str,
                 chunks: list[str]) -> int:
    cursor = conn.execute(
        "INSERT INTO documents (name, source_type, source_path, total_chunks) "
        "VALUES (?, ?, ?, ?)",
        (name, source_type, source_path, len(chunks)),
    )
    doc_id = cursor.lastrowid

    for i, chunk_text in enumerate(chunks):
        conn.execute(
            "INSERT INTO chunks (doc_id, chunk_index, text) VALUES (?, ?, ?)",
            (doc_id, i, chunk_text),
        )

    conn.commit()
    return doc_id


def get_all_documents(conn) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM documents ORDER BY created_at DESC"
    ).fetchall()
    return [dict(r) for r in rows]


def delete_document(conn, doc_id: int) -> bool:
    cursor = conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
    conn.commit()
    return cursor.rowcount > 0


def get_all_chunks(conn) -> list[dict]:
    """Get all chunks from all documents, with source info."""
    rows = conn.execute(
        "SELECT c.id, c.doc_id, c.chunk_index, c.text, d.name as source "
        "FROM chunks c JOIN documents d ON c.doc_id = d.id "
        "ORDER BY c.doc_id, c.chunk_index"
    ).fetchall()
    return [dict(r) for r in rows]


# ---------------------------------------------------------------------------
# Conversations
# ---------------------------------------------------------------------------

def save_conversation(conn, question: str, answer: str, sources: str) -> int:
    cursor = conn.execute(
        "INSERT INTO conversations (question, answer, sources_used) VALUES (?, ?, ?)",
        (question, answer, sources),
    )
    conn.commit()
    return cursor.lastrowid


def get_conversations(conn, limit: int = 20) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM conversations ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    return [dict(r) for r in rows]
