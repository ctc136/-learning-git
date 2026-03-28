"""Data shapes for the API.

These are like blueprints that tell FastAPI what data should look like
when someone sends a request or gets a response. If someone sends data
that doesn't match the blueprint, FastAPI automatically rejects it
with a helpful error message.
"""

from typing import Optional
from pydantic import BaseModel, Field


class IngredientIn(BaseModel):
    """What an ingredient looks like when someone sends it TO the API."""
    name: str = Field(example="chicken breast")
    amount: str = Field(example="2 lbs")


class RecipeIn(BaseModel):
    """What a recipe looks like when someone sends it TO the API (for creating/updating)."""
    name: str = Field(example="Grilled Chicken")
    ingredients: list[IngredientIn]
    steps: list[str] = Field(example=["Season the chicken", "Grill for 6 minutes per side"])
    prep_time: int = Field(ge=0, example=15, description="Prep time in minutes")
    cook_time: int = Field(ge=0, example=20, description="Cook time in minutes")
    servings: int = Field(ge=1, example=4)
    tags: list[str] = Field(default=[], example=["dinner", "healthy"])
    rating: Optional[int] = Field(default=None, ge=1, le=5, example=4)


class IngredientOut(BaseModel):
    """What an ingredient looks like when the API sends it BACK."""
    name: str
    amount: str


class RecipeOut(BaseModel):
    """What a recipe looks like when the API sends it BACK (includes the ID)."""
    id: int
    name: str
    ingredients: list[IngredientOut]
    steps: list[str]
    prep_time: int
    cook_time: int
    total_time: int
    servings: int
    tags: list[str]
    rating: Optional[int]


class RecipeSummary(BaseModel):
    """A short version of a recipe for list views."""
    id: int
    name: str
    total_time: int
    servings: int
    tags: list[str]
    rating: Optional[int]


class MessageResponse(BaseModel):
    """A simple message response (e.g. for delete confirmations)."""
    message: str
