"""Data models for recipes and ingredients."""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Ingredient:
    name: str
    amount: str  # e.g. "2 cups", "1 lb", "3 cloves"

    def __str__(self) -> str:
        return f"{self.amount} {self.name}"


@dataclass
class Recipe:
    name: str
    ingredients: list[Ingredient]
    steps: list[str]
    prep_time: int  # minutes
    cook_time: int  # minutes
    servings: int
    tags: list[str] = field(default_factory=list)
    rating: Optional[int] = None  # 1-5 stars
    id: Optional[int] = None

    @property
    def total_time(self) -> int:
        return self.prep_time + self.cook_time

    def __str__(self) -> str:
        return f"{self.name} ({self.total_time} min, serves {self.servings})"
