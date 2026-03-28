"""Database setup and queries for the task planner."""

import json
import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = Path.home() / ".task-planner" / "planner.db"


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row  # Lets us access columns by name
    _create_tables(conn)
    return conn


def _create_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS boards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS columns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            board_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            column_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT DEFAULT '',
            category TEXT DEFAULT '',
            due_date TEXT,
            priority TEXT DEFAULT 'medium',
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE
        );
    """)
    conn.commit()


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

def create_user(conn, username: str, password_hash: str) -> int:
    cursor = conn.execute(
        "INSERT INTO users (username, password_hash) VALUES (?, ?)",
        (username, password_hash),
    )
    conn.commit()
    return cursor.lastrowid


def get_user_by_username(conn, username: str) -> Optional[dict]:
    row = conn.execute(
        "SELECT * FROM users WHERE username = ?", (username,)
    ).fetchone()
    return dict(row) if row else None


# ---------------------------------------------------------------------------
# Boards
# ---------------------------------------------------------------------------

def create_board(conn, user_id: int, name: str) -> int:
    cursor = conn.execute(
        "INSERT INTO boards (user_id, name) VALUES (?, ?)",
        (user_id, name),
    )
    board_id = cursor.lastrowid

    # Create default columns
    for i, col_name in enumerate(["To Do", "In Progress", "Done"]):
        conn.execute(
            "INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)",
            (board_id, col_name, i),
        )

    conn.commit()
    return board_id


def get_boards(conn, user_id: int) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM boards WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def delete_board(conn, board_id: int, user_id: int) -> bool:
    cursor = conn.execute(
        "DELETE FROM boards WHERE id = ? AND user_id = ?",
        (board_id, user_id),
    )
    conn.commit()
    return cursor.rowcount > 0


# ---------------------------------------------------------------------------
# Columns
# ---------------------------------------------------------------------------

def get_columns(conn, board_id: int) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM columns WHERE board_id = ? ORDER BY position",
        (board_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def create_column(conn, board_id: int, name: str) -> int:
    max_pos = conn.execute(
        "SELECT COALESCE(MAX(position), -1) FROM columns WHERE board_id = ?",
        (board_id,),
    ).fetchone()[0]

    cursor = conn.execute(
        "INSERT INTO columns (board_id, name, position) VALUES (?, ?, ?)",
        (board_id, name, max_pos + 1),
    )
    conn.commit()
    return cursor.lastrowid


def delete_column(conn, column_id: int) -> bool:
    cursor = conn.execute("DELETE FROM columns WHERE id = ?", (column_id,))
    conn.commit()
    return cursor.rowcount > 0


# ---------------------------------------------------------------------------
# Cards
# ---------------------------------------------------------------------------

def get_cards(conn, column_id: int) -> list[dict]:
    rows = conn.execute(
        "SELECT * FROM cards WHERE column_id = ? ORDER BY position",
        (column_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def create_card(conn, column_id: int, title: str, description: str = "",
                category: str = "", due_date: str = None,
                priority: str = "medium") -> int:
    max_pos = conn.execute(
        "SELECT COALESCE(MAX(position), -1) FROM cards WHERE column_id = ?",
        (column_id,),
    ).fetchone()[0]

    cursor = conn.execute(
        "INSERT INTO cards (column_id, title, description, category, due_date, priority, position) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (column_id, title, description, category, due_date, priority, max_pos + 1),
    )
    conn.commit()
    return cursor.lastrowid


def update_card(conn, card_id: int, **kwargs) -> bool:
    valid_fields = {"title", "description", "category", "due_date", "priority", "column_id", "position"}
    updates = {k: v for k, v in kwargs.items() if k in valid_fields}
    if not updates:
        return False

    set_clause = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [card_id]

    cursor = conn.execute(f"UPDATE cards SET {set_clause} WHERE id = ?", values)
    conn.commit()
    return cursor.rowcount > 0


def delete_card(conn, card_id: int) -> bool:
    cursor = conn.execute("DELETE FROM cards WHERE id = ?", (card_id,))
    conn.commit()
    return cursor.rowcount > 0


def move_card(conn, card_id: int, new_column_id: int, new_position: int) -> bool:
    """Move a card to a different column and/or position."""
    cursor = conn.execute(
        "UPDATE cards SET column_id = ?, position = ? WHERE id = ?",
        (new_column_id, new_position, card_id),
    )
    conn.commit()
    return cursor.rowcount > 0


# ---------------------------------------------------------------------------
# Full board data (for loading everything at once)
# ---------------------------------------------------------------------------

def get_full_board(conn, board_id: int) -> Optional[dict]:
    """Get a board with all its columns and cards in one call."""
    board = conn.execute(
        "SELECT * FROM boards WHERE id = ?", (board_id,)
    ).fetchone()
    if not board:
        return None

    board_data = dict(board)
    columns = get_columns(conn, board_id)

    for col in columns:
        col["cards"] = get_cards(conn, col["id"])

    board_data["columns"] = columns
    return board_data
