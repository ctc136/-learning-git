"""CLI commands using Typer."""

from typing import Optional

import typer
from rich.console import Console
from rich.prompt import IntPrompt, Prompt

from . import db
from .display import (
    console,
    display_recipe,
    display_recipe_list,
    build_grocery_list,
    display_grocery_list,
    save_grocery_list,
)
from .models import Ingredient, Recipe
from .scraper import fetch_recipe

app = typer.Typer(help="🍳 Recipe Manager — store, search, and organize your recipes.")


@app.command()
def add() -> None:
    """Add a new recipe interactively."""
    console.print("\n[bold green]➕ Add a New Recipe[/bold green]\n")

    name = Prompt.ask("Recipe name")
    prep_time = IntPrompt.ask("Prep time (minutes)")
    cook_time = IntPrompt.ask("Cook time (minutes)")
    servings = IntPrompt.ask("Servings")
    rating = IntPrompt.ask("Rating (1-5, 0 to skip)", default=0)
    if rating == 0:
        rating = None

    # Tags
    tags_input = Prompt.ask("Tags (comma-separated, e.g. quick,vegetarian)", default="")
    tags = [t.strip() for t in tags_input.split(",") if t.strip()]

    # Ingredients
    console.print("\n[bold]Ingredients[/bold] (enter a blank name to finish):")
    ingredients = []
    while True:
        ing_name = Prompt.ask("  Ingredient name", default="")
        if not ing_name:
            break
        ing_amount = Prompt.ask(f"  Amount for {ing_name}")
        ingredients.append(Ingredient(name=ing_name, amount=ing_amount))

    # Steps
    console.print("\n[bold]Steps[/bold] (enter a blank step to finish):")
    steps = []
    step_num = 1
    while True:
        step = Prompt.ask(f"  Step {step_num}", default="")
        if not step:
            break
        steps.append(step)
        step_num += 1

    recipe = Recipe(
        name=name,
        ingredients=ingredients,
        steps=steps,
        prep_time=prep_time,
        cook_time=cook_time,
        servings=servings,
        tags=tags,
        rating=rating,
    )

    conn = db.get_connection()
    try:
        db.add_recipe(conn, recipe)
        console.print(f"\n[bold green]✅ '{name}' saved![/bold green]\n")
    except Exception as e:
        console.print(f"\n[bold red]Error: {e}[/bold red]\n")
    finally:
        conn.close()


@app.command("list")
def list_recipes() -> None:
    """List all saved recipes."""
    conn = db.get_connection()
    recipes = db.get_all_recipes(conn)
    conn.close()
    display_recipe_list(recipes)


@app.command("import-url")
def import_url(url: str) -> None:
    """Import a recipe from a URL (works great with AllRecipes)."""
    console.print(f"\n[bold green]🌐 Importing recipe from URL...[/bold green]\n")

    try:
        recipe = fetch_recipe(url)
    except Exception as e:
        console.print(f"[bold red]Error fetching URL: {e}[/bold red]")
        return

    if not recipe:
        console.print("[red]Couldn't find recipe data on that page.[/red]")
        console.print("[dim]Try a different URL — AllRecipes works best.[/dim]")
        return

    # Show what we found
    display_recipe(recipe)

    # Save it
    conn = db.get_connection()
    try:
        db.add_recipe(conn, recipe)
        console.print(f"\n[bold green]✅ '{recipe.name}' imported and saved![/bold green]\n")
    except Exception as e:
        console.print(f"\n[bold red]Error saving: {e}[/bold red]")
        console.print("[dim]A recipe with this name might already exist.[/dim]\n")
    finally:
        conn.close()


@app.command()
def view(name: str) -> None:
    """View a recipe in detail."""
    conn = db.get_connection()
    recipe = db.get_recipe_by_name(conn, name)
    conn.close()

    if recipe:
        display_recipe(recipe)
    else:
        console.print(f"[red]Recipe '{name}' not found.[/red]")


@app.command()
def search(
    ingredient: Optional[str] = typer.Option(None, "--ingredient", "-i", help="Search by ingredient"),
    tag: Optional[str] = typer.Option(None, "--tag", "-t", help="Filter by tag"),
    max_time: Optional[int] = typer.Option(None, "--max-time", "-m", help="Max total time in minutes"),
) -> None:
    """Search recipes by ingredient, tag, or time."""
    conn = db.get_connection()
    results = None

    if ingredient:
        results = db.search_by_ingredient(conn, ingredient)
        console.print(f"\n🔍 Recipes with [bold]{ingredient}[/bold]:\n")
    elif tag:
        results = db.search_by_tag(conn, tag)
        console.print(f"\n🏷  Recipes tagged [bold]{tag}[/bold]:\n")
    elif max_time:
        results = db.search_by_max_time(conn, max_time)
        console.print(f"\n⏱  Recipes under [bold]{max_time} minutes[/bold]:\n")
    else:
        console.print("[yellow]Provide at least one filter: --ingredient, --tag, or --max-time[/yellow]")
        conn.close()
        return

    conn.close()
    display_recipe_list(results)


@app.command()
def grocery() -> None:
    """Pick recipes and generate a grocery list."""
    conn = db.get_connection()
    all_recipes = db.get_all_recipes(conn)

    if not all_recipes:
        console.print("[yellow]No recipes saved yet. Add some first![/yellow]")
        conn.close()
        return

    # Show numbered list
    console.print("\n[bold green]🛒 Grocery List Generator[/bold green]\n")
    for i, r in enumerate(all_recipes, 1):
        stars = "★" * (r.rating or 0) + "☆" * (5 - (r.rating or 0))
        console.print(f"  [bold cyan]{i}.[/bold cyan] {r.name}  [dim]({r.total_time} min, serves {r.servings})[/dim]  {stars}")

    console.print()
    picks = Prompt.ask("Enter recipe numbers (comma-separated, e.g. 1,3,4)")

    # Parse selections
    selected = []
    for num in picks.split(","):
        num = num.strip()
        if num.isdigit() and 1 <= int(num) <= len(all_recipes):
            selected.append(all_recipes[int(num) - 1])
        else:
            console.print(f"[yellow]Skipping invalid selection: {num}[/yellow]")

    conn.close()

    if not selected:
        console.print("[red]No valid recipes selected.[/red]")
        return

    # Build and display
    recipe_names = [r.name for r in selected]
    grocery_items = build_grocery_list(selected)
    display_grocery_list(grocery_items, recipe_names)

    # Save to file
    filepath = save_grocery_list(grocery_items, recipe_names)
    console.print(f"\n[bold green]✅ Saved to:[/bold green] {filepath}")
    console.print("[dim]You can AirDrop this file to your phone or open it in Notes.[/dim]\n")


@app.command()
def delete(name: str) -> None:
    """Delete a recipe by name."""
    confirm = Prompt.ask(f"Delete '{name}'? This can't be undone", choices=["y", "n"])
    if confirm != "y":
        console.print("Cancelled.")
        return

    conn = db.get_connection()
    deleted = db.delete_recipe(conn, name)
    conn.close()

    if deleted:
        console.print(f"[green]Deleted '{name}'.[/green]")
    else:
        console.print(f"[red]Recipe '{name}' not found.[/red]")


if __name__ == "__main__":
    app()


# Allow running as: python -m src.cli
def main():
    app()
