# Task Planner 📋

A Trello-style project planner with user accounts, drag-and-drop cards, multiple boards, and more.

## Features

- **User accounts** — register, login, each user has their own boards
- **Multiple boards** — create boards for different projects
- **Drag and drop** — move cards between columns
- **Card details** — title, description, priority, category, due dates
- **Columns** — create, delete, customize your workflow

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python3 app.py
```

Then open: **http://localhost:8000**

## How It Works

- `app.py` — FastAPI backend with auth and CRUD routes
- `src/db.py` — SQLite database for users, boards, columns, cards
- `src/auth.py` — Password hashing and JWT token authentication
- `static/index.html` — Trello-style interactive frontend

## Project Structure

```
task-planner/
├── app.py              # Backend server
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── db.py           # Database operations
│   └── auth.py         # Authentication (passwords + tokens)
└── static/
    └── index.html      # Frontend interface
```
