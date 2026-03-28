"""Database connection and queries.

Connects to the SAME database as your recipe manager CLI,
so any recipes you added there will show up in the API too.
"""

import json
import sqlite3
from typing import Optional

from .config import DB_PATH


def get_connection() -> sqlite3.Connection:
    """Get a database connection."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA foreign_keys = ON")
    _create_tables(conn)
    return conn


def _create_tables(conn: sqlite3.Connection) -> None:
    """Create tables if they don't exist (same schema as the CLI app)."""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            steps TEXT NOT NULL,
            prep_time INTEGER NOT NULL,
            cook_time INTEGER NOT NULL,
            servings INTEGER NOT NULL,
            rating INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS ingredients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            amount TEXT NOT NULL,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recipe_id INTEGER NOT NULL,
            tag TEXT NOT NULL,
            FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
        CREATE INDEX IF NOT EXISTS idx_tags_tag ON tags(tag);
    """)
    conn.commit()


# ---------------------------------------------------------------------------
# READ operations
# ---------------------------------------------------------------------------

def get_all_recipes(conn: sqlite3.Connection) -> list[dict]:
    """Get all recipes as summary dicts."""
    rows = conn.execute(
        "SELECT id, name, prep_time, cook_time, servings, rating "
        "FROM recipes ORDER BY name"
    ).fetchall()

    results = []
    for row in rows:
        recipe_id, name, prep_time, cook_time, servings, rating = row
        tags = _get_tags(conn, recipe_id)
        results.append({
            "id": recipe_id,
            "name": name,
            "total_time": prep_time + cook_time,
            "servings": servings,
            "tags": tags,
            "rating": rating,
        })
    return results


def get_recipe_by_id(conn: sqlite3.Connection, recipe_id: int) -> Optional[dict]:
    """Get a single recipe with full details."""
    row = conn.execute(
        "SELECT id, name, steps, prep_time, cook_time, servings, rating "
        "FROM recipes WHERE id = ?",
        (recipe_id,),
    ).fetchone()

    if not row:
        return None

    rid, name, steps_json, prep_time, cook_time, servings, rating = row
    ingredients = _get_ingredients(conn, rid)
    tags = _get_tags(conn, rid)

    return {
        "id": rid,
        "name": name,
        "ingredients": ingredients,
        "steps": json.loads(steps_json),
        "prep_time": prep_time,
        "cook_time": cook_time,
        "total_time": prep_time + cook_time,
        "servings": servings,
        "tags": tags,
        "rating": rating,
    }


# ---------------------------------------------------------------------------
# CREATE
# ---------------------------------------------------------------------------

def add_recipe(conn: sqlite3.Connection, recipe_data: dict) -> int:
    """Insert a new recipe and return its ID."""
    cursor = conn.execute(
        "INSERT INTO recipes (name, steps, prep_time, cook_time, servings, rating) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            recipe_data["name"],
            json.dumps(recipe_data["steps"]),
            recipe_data["prep_time"],
            recipe_data["cook_time"],
            recipe_data["servings"],
            recipe_data.get("rating"),
        ),
    )
    recipe_id = cursor.lastrowid

    for ing in recipe_data["ingredients"]:
        conn.execute(
            "INSERT INTO ingredients (recipe_id, name, amount) VALUES (?, ?, ?)",
            (recipe_id, ing["name"].lower(), ing["amount"]),
        )

    for tag in recipe_data.get("tags", []):
        conn.execute(
            "INSERT INTO tags (recipe_id, tag) VALUES (?, ?)",
            (recipe_id, tag.lower()),
        )

    conn.commit()
    return recipe_id


# ---------------------------------------------------------------------------
# UPDATE
# ---------------------------------------------------------------------------

def update_recipe(conn: sqlite3.Connection, recipe_id: int, recipe_data: dict) -> bool:
    """Update an existing recipe. Returns True if found and updated."""
    # Check it exists
    existing = conn.execute(
        "SELECT id FROM recipes WHERE id = ?", (recipe_id,)
    ).fetchone()
    if not existing:
        return False

    # Update the main recipe row
    conn.execute(
        "UPDATE recipes SET name=?, steps=?, prep_time=?, cook_time=?, "
        "servings=?, rating=? WHERE id=?",
        (
            recipe_data["name"],
            json.dumps(recipe_data["steps"]),
            recipe_data["prep_time"],
            recipe_data["cook_time"],
            recipe_data["servings"],
            recipe_data.get("rating"),
            recipe_id,
        ),
    )

    # Replace ingredients — delete old ones, insert new ones
    conn.execute("DELETE FROM ingredients WHERE recipe_id = ?", (recipe_id,))
    for ing in recipe_data["ingredients"]:
        conn.execute(
            "INSERT INTO ingredients (recipe_id, name, amount) VALUES (?, ?, ?)",
            (recipe_id, ing["name"].lower(), ing["amount"]),
        )

    # Replace tags
    conn.execute("DELETE FROM tags WHERE recipe_id = ?", (recipe_id,))
    for tag in recipe_data.get("tags", []):
        conn.execute(
            "INSERT INTO tags (recipe_id, tag) VALUES (?, ?)",
            (recipe_id, tag.lower()),
        )

    conn.commit()
    return True


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

def delete_recipe(conn: sqlite3.Connection, recipe_id: int) -> bool:
    """Delete a recipe by ID. Returns True if something was deleted."""
    cursor = conn.execute("DELETE FROM recipes WHERE id = ?", (recipe_id,))
    conn.commit()
    return cursor.rowcount > 0


# ---------------------------------------------------------------------------
# SEARCH
# ---------------------------------------------------------------------------

def search_recipes(
    conn: sqlite3.Connection,
    ingredient: Optional[str] = None,
    tag: Optional[str] = None,
    max_time: Optional[int] = None,
) -> list[dict]:
    """Search recipes with optional filters. Filters can be combined."""
    query = "SELECT DISTINCT r.id, r.name, r.prep_time, r.cook_time, r.servings, r.rating FROM recipes r"
    joins = []
    conditions = []
    params = []

    if ingredient:
        joins.append("JOIN ingredients i ON r.id = i.recipe_id")
        conditions.append("i.name LIKE ?")
        params.append(f"%{ingredient.lower()}%")

    if tag:
        joins.append("JOIN tags t ON r.id = t.recipe_id")
        conditions.append("t.tag = ?")
        params.append(tag.lower())

    if max_time is not None:
        conditions.append("(r.prep_time + r.cook_time) <= ?")
        params.append(max_time)

    if joins:
        query += " " + " ".join(joins)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY r.name"

    rows = conn.execute(query, params).fetchall()

    results = []
    for row in rows:
        recipe_id, name, prep_time, cook_time, servings, rating = row
        tags = _get_tags(conn, recipe_id)
        results.append({
            "id": recipe_id,
            "name": name,
            "total_time": prep_time + cook_time,
            "servings": servings,
            "tags": tags,
            "rating": rating,
        })
    return results


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_ingredients(conn: sqlite3.Connection, recipe_id: int) -> list[dict]:
    rows = conn.execute(
        "SELECT name, amount FROM ingredients WHERE recipe_id = ?", (recipe_id,)
    ).fetchall()
    return [{"name": r[0], "amount": r[1]} for r in rows]


def _get_tags(conn: sqlite3.Connection, recipe_id: int) -> list[str]:
    rows = conn.execute(
        "SELECT tag FROM tags WHERE recipe_id = ?", (recipe_id,)
    ).fetchall()
    return [r[0] for r in rows]
