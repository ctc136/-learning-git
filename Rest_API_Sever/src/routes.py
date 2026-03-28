"""API routes — each function here handles a specific URL.

Think of this like a phone menu:
  "Press 1 for all recipes"     → GET /recipes
  "Press 2 for a specific one"  → GET /recipes/3
  "Press 3 to add a new one"    → POST /recipes
  "Press 4 to update one"       → PUT /recipes/3
  "Press 5 to delete one"       → DELETE /recipes/3
  "Press 6 to search"           → GET /recipes/search
"""

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from . import db
from .models import (
    MessageResponse,
    RecipeIn,
    RecipeOut,
    RecipeSummary,
)

# A "router" is a collection of related endpoints
router = APIRouter()


# ---------------------------------------------------------------------------
# GET /recipes — list all recipes
# ---------------------------------------------------------------------------
@router.get("/recipes", response_model=list[RecipeSummary])
def list_recipes():
    """Get a summary list of all recipes."""
    conn = db.get_connection()
    recipes = db.get_all_recipes(conn)
    conn.close()
    return recipes


# ---------------------------------------------------------------------------
# GET /recipes/search — search with filters
# (This MUST come before /recipes/{recipe_id} or FastAPI will think
#  "search" is a recipe ID!)
# ---------------------------------------------------------------------------
@router.get("/recipes/search", response_model=list[RecipeSummary])
def search_recipes(
    ingredient: Optional[str] = Query(None, description="Search by ingredient name"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    max_time: Optional[int] = Query(None, description="Max total time in minutes"),
):
    """Search recipes by ingredient, tag, and/or max time. Filters can be combined."""
    if not ingredient and not tag and max_time is None:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one filter: ingredient, tag, or max_time",
        )

    conn = db.get_connection()
    results = db.search_recipes(conn, ingredient=ingredient, tag=tag, max_time=max_time)
    conn.close()
    return results


# ---------------------------------------------------------------------------
# GET /recipes/{recipe_id} — get one recipe with full details
# ---------------------------------------------------------------------------
@router.get("/recipes/{recipe_id}", response_model=RecipeOut)
def get_recipe(recipe_id: int):
    """Get a single recipe by its ID, with all ingredients and steps."""
    conn = db.get_connection()
    recipe = db.get_recipe_by_id(conn, recipe_id)
    conn.close()

    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe


# ---------------------------------------------------------------------------
# POST /recipes — add a new recipe
# ---------------------------------------------------------------------------
@router.post("/recipes", response_model=RecipeOut, status_code=201)
def create_recipe(recipe: RecipeIn):
    """Add a new recipe. Send a JSON body with the recipe details."""
    conn = db.get_connection()
    try:
        recipe_id = db.add_recipe(conn, recipe.model_dump())
        new_recipe = db.get_recipe_by_id(conn, recipe_id)
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return new_recipe


# ---------------------------------------------------------------------------
# PUT /recipes/{recipe_id} — update an existing recipe
# ---------------------------------------------------------------------------
@router.put("/recipes/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: int, recipe: RecipeIn):
    """Update a recipe. Send a full JSON body with all fields."""
    conn = db.get_connection()
    updated = db.update_recipe(conn, recipe_id, recipe.model_dump())

    if not updated:
        conn.close()
        raise HTTPException(status_code=404, detail="Recipe not found")

    result = db.get_recipe_by_id(conn, recipe_id)
    conn.close()
    return result


# ---------------------------------------------------------------------------
# DELETE /recipes/{recipe_id} — delete a recipe
# ---------------------------------------------------------------------------
@router.delete("/recipes/{recipe_id}", response_model=MessageResponse)
def delete_recipe(recipe_id: int):
    """Delete a recipe by its ID."""
    conn = db.get_connection()
    deleted = db.delete_recipe(conn, recipe_id)
    conn.close()

    if not deleted:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": f"Recipe {recipe_id} deleted"}
