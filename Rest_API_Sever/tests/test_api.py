"""Tests for the Recipe API.

Run with: pytest tests/
"""

from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_root():
    """The root URL should return a welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data


def test_list_recipes():
    """GET /recipes should return a list."""
    response = client.get("/recipes")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_get_nonexistent_recipe():
    """GET /recipes/99999 should return 404."""
    response = client.get("/recipes/99999")
    assert response.status_code == 404


def test_create_and_delete_recipe():
    """POST a recipe, verify it, then DELETE it."""
    new_recipe = {
        "name": "Test Recipe API",
        "ingredients": [
            {"name": "test ingredient", "amount": "1 cup"}
        ],
        "steps": ["Step one", "Step two"],
        "prep_time": 5,
        "cook_time": 10,
        "servings": 2,
        "tags": ["test"],
        "rating": 3,
    }

    # Create
    response = client.post("/recipes", json=new_recipe)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Recipe API"
    recipe_id = data["id"]

    # Verify it exists
    response = client.get(f"/recipes/{recipe_id}")
    assert response.status_code == 200

    # Delete
    response = client.delete(f"/recipes/{recipe_id}")
    assert response.status_code == 200

    # Verify it's gone
    response = client.get(f"/recipes/{recipe_id}")
    assert response.status_code == 404


def test_search_requires_filter():
    """GET /recipes/search with no filters should return 400."""
    response = client.get("/recipes/search")
    assert response.status_code == 400
