# Recipe Manager CLI

A command-line recipe manager built with Python and SQLite. Store, tag, search, and organize your recipes from the terminal.

## Setup

```bash
# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the app
python -m src.cli
```

## Usage

```bash
# Add a new recipe interactively
python -m src.cli add

# List all recipes
python -m src.cli list

# Search by ingredient
python -m src.cli search --ingredient "chicken"

# Search by tag
python -m src.cli search --tag "quick"

# Search by max prep time
python -m src.cli search --max-time 30

# View a specific recipe
python -m src.cli view "Pasta Carbonara"

# Delete a recipe
python -m src.cli delete "Pasta Carbonara"
```

## Project Structure

```
recipe-manager/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── cli.py          # CLI commands and user interaction
│   ├── db.py           # Database setup and queries
│   ├── models.py       # Data classes for Recipe, Ingredient
│   └── display.py      # Terminal formatting and output
└── tests/
    ├── __init__.py
    └── test_db.py       # Tests for database operations
```

## Feature Roadmap

- [x] Phase 1: Data model + database
- [ ] Phase 2: Add and view recipes
- [ ] Phase 3: Search and filtering
- [ ] Phase 4: Nice terminal display
- **Stretch goals:**
  - [ ] Import recipes from URLs
  - [ ] Grocery list generator from selected recipes
  - [ ] Scale ingredients by serving count
  - [ ] Natural language search via Anthropic API
