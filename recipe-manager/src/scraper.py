"""Scrape recipes from URLs (optimized for AllRecipes, works on many sites)."""

import json
import re
from html.parser import HTMLParser
from typing import Optional
from urllib.request import urlopen, Request

from .models import Ingredient, Recipe


class _TagStripper(HTMLParser):
    """Strip HTML tags from a string."""

    def __init__(self):
        super().__init__()
        self.parts = []

    def handle_data(self, data):
        self.parts.append(data)

    def get_text(self):
        return "".join(self.parts).strip()


def _strip_html(text: str) -> str:
    """Remove HTML tags from a string."""
    s = _TagStripper()
    s.feed(text)
    return s.get_text()


def _parse_duration(iso_duration: str) -> int:
    """Convert ISO 8601 duration (e.g. 'PT30M', 'PT1H15M') to minutes."""
    if not iso_duration:
        return 0
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?", iso_duration)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    return hours * 60 + minutes


def _parse_ingredient(text: str) -> Ingredient:
    """Split an ingredient string like '2 cups flour' into amount and name.

    Uses a simple heuristic: amount is the leading numbers/fractions and
    unit word, the rest is the ingredient name.
    """
    text = _strip_html(text).strip()

    # Common units to look for
    units = (
        "cups?", "tablespoons?", "tbsp", "teaspoons?", "tsp",
        "pounds?", "lbs?", "ounces?", "oz", "cloves?", "cans?",
        "slices?", "pieces?", "pinch(?:es)?", "dash(?:es)?",
        "quarts?", "gallons?", "liters?", "ml", "g", "kg",
        "heads?", "bunche?s?", "stalks?", "sprigs?",
    )
    unit_pattern = "|".join(units)

    # Match: number (with optional fractions like 1/2 or ½) + optional unit
    pattern = rf"^([\d½⅓⅔¼¾⅛/\s\-.]+(?:\s+(?:{unit_pattern}))?)[\s,]+(.+)"
    match = re.match(pattern, text, re.IGNORECASE)

    if match:
        amount = match.group(1).strip()
        name = match.group(2).strip()
    else:
        # Fallback: try to split on first space after a number
        num_match = re.match(r"^([\d½⅓⅔¼¾⅛/\s\-.]+)\s+(.+)", text)
        if num_match:
            amount = num_match.group(1).strip()
            name = num_match.group(2).strip()
        else:
            amount = ""
            name = text

    return Ingredient(name=name, amount=amount if amount else "to taste")


def fetch_recipe(url: str) -> Optional[Recipe]:
    """Fetch a recipe from a URL and return a Recipe object.

    Looks for JSON-LD structured data first (used by AllRecipes and most
    major recipe sites), then falls back to basic HTML scraping.
    """
    # Fetch the page
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/120.0.0.0 Safari/537.36"
    }
    req = Request(url, headers=headers)
    with urlopen(req, timeout=15) as response:
        html = response.read().decode("utf-8", errors="replace")

    # Try JSON-LD first (most reliable)
    recipe_data = _extract_json_ld(html)
    if recipe_data:
        return _json_ld_to_recipe(recipe_data)

    return None


def _extract_json_ld(html: str) -> Optional[dict]:
    """Find and parse JSON-LD recipe data from HTML."""
    # Find all <script type="application/ld+json"> blocks
    pattern = r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>'
    matches = re.findall(pattern, html, re.DOTALL | re.IGNORECASE)

    for match in matches:
        try:
            data = json.loads(match)
        except json.JSONDecodeError:
            continue

        # Could be a single object or a list
        if isinstance(data, list):
            for item in data:
                if _is_recipe(item):
                    return item
        elif isinstance(data, dict):
            # Could be a @graph structure
            if "@graph" in data:
                for item in data["@graph"]:
                    if _is_recipe(item):
                        return item
            elif _is_recipe(data):
                return data

    return None


def _is_recipe(data: dict) -> bool:
    """Check if a JSON-LD object is a Recipe."""
    schema_type = data.get("@type", "")
    if isinstance(schema_type, list):
        return "Recipe" in schema_type
    return schema_type == "Recipe"


def _json_ld_to_recipe(data: dict) -> Recipe:
    """Convert JSON-LD recipe data to a Recipe object."""
    name = _strip_html(data.get("name", "Unknown Recipe"))

    # Ingredients
    raw_ingredients = data.get("recipeIngredient", [])
    ingredients = [_parse_ingredient(ing) for ing in raw_ingredients]

    # Steps — can be strings or objects with "text" field
    raw_steps = data.get("recipeInstructions", [])
    steps = []
    for step in raw_steps:
        if isinstance(step, str):
            steps.append(_strip_html(step))
        elif isinstance(step, dict):
            # Could be HowToStep or HowToSection
            if step.get("@type") == "HowToSection":
                # Section with sub-steps
                for sub in step.get("itemListElement", []):
                    if isinstance(sub, dict):
                        steps.append(_strip_html(sub.get("text", "")))
                    else:
                        steps.append(_strip_html(str(sub)))
            else:
                steps.append(_strip_html(step.get("text", "")))

    # Filter out empty steps
    steps = [s for s in steps if s]

    # Times
    prep_time = _parse_duration(data.get("prepTime", ""))
    cook_time = _parse_duration(data.get("cookTime", ""))

    # If only totalTime is given
    if not prep_time and not cook_time:
        total = _parse_duration(data.get("totalTime", ""))
        cook_time = total

    # Servings
    servings = 4  # default
    yield_val = data.get("recipeYield", "")
    if isinstance(yield_val, list):
        yield_val = yield_val[0] if yield_val else ""
    yield_str = str(yield_val)
    num_match = re.search(r"(\d+)", yield_str)
    if num_match:
        servings = int(num_match.group(1))

    # Rating
    rating = None
    agg_rating = data.get("aggregateRating", {})
    if agg_rating:
        try:
            rating = round(float(agg_rating.get("ratingValue", 0)))
            rating = max(1, min(5, rating))
        except (ValueError, TypeError):
            pass

    # Tags from category and keywords
    tags = []
    category = data.get("recipeCategory", "")
    if isinstance(category, list):
        tags.extend([c.lower().strip() for c in category])
    elif category:
        tags.append(category.lower().strip())

    keywords = data.get("keywords", "")
    if isinstance(keywords, str) and keywords:
        tags.extend([k.strip().lower() for k in keywords.split(",")[:5]])
    elif isinstance(keywords, list):
        tags.extend([k.strip().lower() for k in keywords[:5]])

    # Deduplicate tags
    seen = set()
    unique_tags = []
    for t in tags:
        if t and t not in seen:
            seen.add(t)
            unique_tags.append(t)

    return Recipe(
        name=name,
        ingredients=ingredients,
        steps=steps,
        prep_time=prep_time,
        cook_time=cook_time,
        servings=servings,
        tags=unique_tags[:8],  # cap at 8 tags
        rating=rating,
    )
