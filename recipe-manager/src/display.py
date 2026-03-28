"""Terminal formatting and display using Rich."""

from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

from .models import Recipe

console = Console()


def display_recipe(recipe: Recipe) -> None:
    """Display a single recipe in a nice formatted panel."""
    # Header info
    stars = "★" * (recipe.rating or 0) + "☆" * (5 - (recipe.rating or 0))
    header = f"[bold]{recipe.name}[/bold]\n"
    header += f"⏱  Prep: {recipe.prep_time}min  Cook: {recipe.cook_time}min  "
    header += f"Total: {recipe.total_time}min\n"
    header += f"🍽  Serves: {recipe.servings}  |  {stars}"
    if recipe.tags:
        header += f"\n🏷  {', '.join(recipe.tags)}"

    # Ingredients
    ing_lines = "\n".join(f"  • {ing}" for ing in recipe.ingredients)

    # Steps
    step_lines = "\n".join(
        f"  {i}. {step}" for i, step in enumerate(recipe.steps, 1)
    )

    body = f"{header}\n\n[bold underline]Ingredients[/bold underline]\n{ing_lines}"
    body += f"\n\n[bold underline]Steps[/bold underline]\n{step_lines}"

    console.print(Panel(body, border_style="green", padding=(1, 2)))


def display_recipe_list(recipes: list[Recipe]) -> None:
    """Display a summary table of multiple recipes."""
    if not recipes:
        console.print("[yellow]No recipes found.[/yellow]")
        return

    table = Table(title="Recipes", show_lines=True)
    table.add_column("Name", style="bold cyan", min_width=20)
    table.add_column("Time", justify="right")
    table.add_column("Servings", justify="center")
    table.add_column("Tags")
    table.add_column("Rating", justify="center")

    for r in recipes:
        stars = "★" * (r.rating or 0) + "☆" * (5 - (r.rating or 0))
        table.add_row(
            r.name,
            f"{r.total_time} min",
            str(r.servings),
            ", ".join(r.tags) if r.tags else "—",
            stars,
        )

    console.print(table)


def build_grocery_list(recipes: list[Recipe]) -> dict[str, list[str]]:
    """Combine ingredients from multiple recipes into a grocery list.

    Returns a dict mapping ingredient name → list of amounts
    (e.g. {"chicken": ["1 lb", "2 cups"]}).
    """
    grocery: dict[str, list[str]] = {}
    for recipe in recipes:
        for ing in recipe.ingredients:
            key = ing.name.lower().strip()
            if key not in grocery:
                grocery[key] = []
            grocery[key].append(f"{ing.amount} ({recipe.name})")
    return dict(sorted(grocery.items()))


def display_grocery_list(grocery: dict[str, list[str]], recipe_names: list[str]) -> None:
    """Display the grocery list in a nice panel."""
    lines = []
    for item, amounts in grocery.items():
        if len(amounts) == 1:
            lines.append(f"  ☐ {item} — {amounts[0]}")
        else:
            lines.append(f"  ☐ {item}")
            for amt in amounts:
                lines.append(f"      · {amt}")

    header = f"[bold]Grocery list for:[/bold] {', '.join(recipe_names)}"
    header += f"\n[dim]{len(grocery)} items total[/dim]"
    body = header + "\n\n" + "\n".join(lines)

    console.print(Panel(body, title="🛒 Grocery List", border_style="cyan", padding=(1, 2)))


def save_grocery_list(grocery: dict[str, list[str]], recipe_names: list[str]) -> Path:
    """Save the grocery list as a plain text file and return the path."""
    timestamp = datetime.now().strftime("%Y-%m-%d")
    filename = f"grocery-list-{timestamp}.txt"
    filepath = Path.home() / "Desktop" / filename

    lines = []
    lines.append("🛒 GROCERY LIST")
    lines.append(f"Recipes: {', '.join(recipe_names)}")
    lines.append(f"Date: {timestamp}")
    lines.append(f"Items: {len(grocery)}")
    lines.append("-" * 40)
    lines.append("")

    for item, amounts in grocery.items():
        if len(amounts) == 1:
            lines.append(f"[ ] {item} — {amounts[0]}")
        else:
            lines.append(f"[ ] {item}")
            for amt in amounts:
                lines.append(f"      · {amt}")

    lines.append("")
    lines.append("-" * 40)
    lines.append("Happy shopping! 🍳")

    filepath.write_text("\n".join(lines))
    return filepath
