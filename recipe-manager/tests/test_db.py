"""Tests for database operations."""

import sqlite3

from src.db import (
    _create_tables,
    add_recipe,
    delete_recipe,
    get_all_recipes,
    get_recipe_by_name,
    search_by_ingredient,
    search_by_max_time,
    search_by_tag,
)
from src.models import Ingredient, Recipe


def _get_test_db() -> sqlite3.Connection:
    """Create an in-memory database for testing."""
    conn = sqlite3.connect(":memory:")
    conn.execute("PRAGMA foreign_keys = ON")
    _create_tables(conn)
    return conn


def _sample_recipe(**overrides) -> Recipe:
    defaults = dict(
        name="Pasta Carbonara",
        ingredients=[
            Ingredient(name="spaghetti", amount="1 lb"),
            Ingredient(name="eggs", amount="4"),
            Ingredient(name="parmesan", amount="1 cup"),
            Ingredient(name="bacon", amount="8 oz"),
        ],
        steps=[
            "Boil pasta in salted water.",
            "Fry bacon until crispy.",
            "Whisk eggs and parmesan.",
            "Toss hot pasta with egg mixture and bacon.",
        ],
        prep_time=10,
        cook_time=20,
        servings=4,
        tags=["italian", "quick"],
        rating=5,
    )
    defaults.update(overrides)
    return Recipe(**defaults)


def test_add_and_retrieve():
    conn = _get_test_db()
    recipe = _sample_recipe()
    recipe_id = add_recipe(conn, recipe)

    assert recipe_id is not None

    fetched = get_recipe_by_name(conn, "Pasta Carbonara")
    assert fetched is not None
    assert fetched.name == "Pasta Carbonara"
    assert len(fetched.ingredients) == 4
    assert len(fetched.steps) == 4
    assert fetched.tags == ["italian", "quick"]
    conn.close()


def test_case_insensitive_lookup():
    conn = _get_test_db()
    add_recipe(conn, _sample_recipe())

    assert get_recipe_by_name(conn, "pasta carbonara") is not None
    assert get_recipe_by_name(conn, "PASTA CARBONARA") is not None
    conn.close()


def test_search_by_ingredient():
    conn = _get_test_db()
    add_recipe(conn, _sample_recipe())
    add_recipe(conn, _sample_recipe(
        name="Egg Fried Rice",
        ingredients=[Ingredient("eggs", "3"), Ingredient("rice", "2 cups")],
        tags=["asian"],
    ))

    results = search_by_ingredient(conn, "egg")
    assert len(results) == 2

    results = search_by_ingredient(conn, "rice")
    assert len(results) == 1
    assert results[0].name == "Egg Fried Rice"
    conn.close()


def test_search_by_tag():
    conn = _get_test_db()
    add_recipe(conn, _sample_recipe())
    add_recipe(conn, _sample_recipe(name="Quick Salad", tags=["quick", "healthy"]))

    results = search_by_tag(conn, "quick")
    assert len(results) == 2

    results = search_by_tag(conn, "italian")
    assert len(results) == 1
    conn.close()


def test_search_by_max_time():
    conn = _get_test_db()
    add_recipe(conn, _sample_recipe(prep_time=10, cook_time=20))  # 30 min total
    add_recipe(conn, _sample_recipe(name="Slow Roast", prep_time=30, cook_time=180))  # 210 min

    results = search_by_max_time(conn, 30)
    assert len(results) == 1
    assert results[0].name == "Pasta Carbonara"
    conn.close()


def test_delete():
    conn = _get_test_db()
    add_recipe(conn, _sample_recipe())

    assert delete_recipe(conn, "Pasta Carbonara") is True
    assert get_recipe_by_name(conn, "Pasta Carbonara") is None
    assert delete_recipe(conn, "Nonexistent") is False
    conn.close()


def test_get_all():
    conn = _get_test_db()
    add_recipe(conn, _sample_recipe(name="B Recipe"))
    add_recipe(conn, _sample_recipe(name="A Recipe"))

    recipes = get_all_recipes(conn)
    assert len(recipes) == 2
    assert recipes[0].name == "A Recipe"  # sorted alphabetically
    conn.close()
