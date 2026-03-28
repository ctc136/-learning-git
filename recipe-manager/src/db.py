"""Database setup and queries using SQLite."""

import json
import sqlite3
from pathlib import Path
from typing import Optional

from .models import Ingredient, Recipe

DB_PATH = Path.home() / ".recipe-manager" / "recipes.db"


def get_connection() -> sqlite3.Connection:
    """Get a database connection, creating the DB and tables if needed."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON")
    _create_tables(conn)
    return conn


def _create_tables(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS recipes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            steps TEXT NOT NULL,        -- JSON array of strings
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
# CRUD operations
# ---------------------------------------------------------------------------

def add_recipe(conn: sqlite3.Connection, recipe: Recipe) -> int:
    """Insert a recipe and return its ID."""
    cursor = conn.execute(
        "INSERT INTO recipes (name, steps, prep_time, cook_time, servings, rating) "
        "VALUES (?, ?, ?, ?, ?, ?)",
        (
            recipe.name,
            json.dumps(recipe.steps),
            recipe.prep_time,
            recipe.cook_time,
            recipe.servings,
            recipe.rating,
        ),
    )
    recipe_id = cursor.lastrowid

    for ing in recipe.ingredients:
        conn.execute(
            "INSERT INTO ingredients (recipe_id, name, amount) VALUES (?, ?, ?)",
            (recipe_id, ing.name.lower(), ing.amount),
        )

    for tag in recipe.tags:
        conn.execute(
            "INSERT INTO tags (recipe_id, tag) VALUES (?, ?)",
            (recipe_id, tag.lower()),
        )

    conn.commit()
    return recipe_id


def get_recipe_by_name(conn: sqlite3.Connection, name: str) -> Optional[Recipe]:
    """Fetch a single recipe by exact name (case-insensitive)."""
    row = conn.execute(
        "SELECT id, name, steps, prep_time, cook_time, servings, rating "
        "FROM recipes WHERE LOWER(name) = LOWER(?)",
        (name,),
    ).fetchone()
    if not row:
        return None
    return _row_to_recipe(conn, row)


def get_all_recipes(conn: sqlite3.Connection) -> list[Recipe]:
    """Return all recipes, sorted by name."""
    rows = conn.execute(
        "SELECT id, name, steps, prep_time, cook_time, servings, rating "
        "FROM recipes ORDER BY name"
    ).fetchall()
    return [_row_to_recipe(conn, row) for row in rows]


def delete_recipe(conn: sqlite3.Connection, name: str) -> bool:
    """Delete a recipe by name. Returns True if something was deleted."""
    cursor = conn.execute(
        "DELETE FROM recipes WHERE LOWER(name) = LOWER(?)", (name,)
    )
    conn.commit()
    return cursor.rowcount > 0


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

def search_by_ingredient(conn: sqlite3.Connection, ingredient: str) -> list[Recipe]:
    """Find recipes that contain a given ingredient (partial match)."""
    rows = conn.execute(
        "SELECT DISTINCT r.id, r.name, r.steps, r.prep_time, r.cook_time, "
        "r.servings, r.rating FROM recipes r "
        "JOIN ingredients i ON r.id = i.recipe_id "
        "WHERE i.name LIKE ? ORDER BY r.name",
        (f"%{ingredient.lower()}%",),
    ).fetchall()
    return [_row_to_recipe(conn, row) for row in rows]


def search_by_tag(conn: sqlite3.Connection, tag: str) -> list[Recipe]:
    """Find recipes with a given tag."""
    rows = conn.execute(
        "SELECT DISTINCT r.id, r.name, r.steps, r.prep_time, r.cook_time, "
        "r.servings, r.rating FROM recipes r "
        "JOIN tags t ON r.id = t.recipe_id "
        "WHERE t.tag = ? ORDER BY r.name",
        (tag.lower(),),
    ).fetchall()
    return [_row_to_recipe(conn, row) for row in rows]


def search_by_max_time(conn: sqlite3.Connection, max_minutes: int) -> list[Recipe]:
    """Find recipes with total time <= max_minutes."""
    rows = conn.execute(
        "SELECT id, name, steps, prep_time, cook_time, servings, rating "
        "FROM recipes WHERE (prep_time + cook_time) <= ? ORDER BY name",
        (max_minutes,),
    ).fetchall()
    return [_row_to_recipe(conn, row) for row in rows]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _row_to_recipe(conn: sqlite3.Connection, row: tuple) -> Recipe:
    """Convert a database row into a Recipe object."""
    recipe_id, name, steps_json, prep_time, cook_time, servings, rating = row

    ingredients = [
        Ingredient(name=r[0], amount=r[1])
        for r in conn.execute(
            "SELECT name, amount FROM ingredients WHERE recipe_id = ?", (recipe_id,)
        ).fetchall()
    ]

    tags = [
        r[0]
        for r in conn.execute(
            "SELECT tag FROM tags WHERE recipe_id = ?", (recipe_id,)
        ).fetchall()
    ]

    return Recipe(
        id=recipe_id,
        name=name,
        ingredients=ingredients,
        steps=json.loads(steps_json),
        prep_time=prep_time,
        cook_time=cook_time,
        servings=servings,
        tags=tags,
        rating=rating,
    )
