# Recipe API Server

A REST API that serves your recipe data over the web. Built with FastAPI and connected to your existing recipe manager's SQLite database.

## Setup

```bash
# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python -m src.main
```

Then open your browser to: http://localhost:8000/docs
(This gives you an interactive page where you can test all your endpoints)

## Endpoints

| Method | URL                     | What it does                    |
|--------|-------------------------|---------------------------------|
| GET    | /recipes                | List all recipes                |
| GET    | /recipes/{id}           | Get one recipe by ID            |
| POST   | /recipes                | Add a new recipe                |
| PUT    | /recipes/{id}           | Update an existing recipe       |
| DELETE | /recipes/{id}           | Delete a recipe                 |
| GET    | /recipes/search         | Search by ingredient, tag, time |

## Project Structure

```
recipe-api/
├── README.md
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── main.py         # FastAPI app and server startup
│   ├── routes.py       # All the API endpoints (URLs)
│   ├── db.py           # Database connection and queries
│   ├── models.py       # Data shapes for requests and responses
│   └── config.py       # Settings (database path, etc.)
└── tests/
    ├── __init__.py
    └── test_api.py     # Tests for the API endpoints
```

## Feature Roadmap

- [ ] Phase 1: Basic GET endpoints (list and view recipes)
- [ ] Phase 2: POST, PUT, DELETE (add, update, remove recipes)
- [ ] Phase 3: Search endpoint
- [ ] Phase 4: Authentication (API keys)
- [ ] Phase 5: Error handling and polish
