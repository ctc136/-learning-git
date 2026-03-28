"""Task Planner — Web App Backend.

A Trello-style project planner with user accounts.

Run with: python3 app.py
Then open: http://localhost:8000
"""

from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src import db
from src.auth import hash_password, verify_password, create_token, verify_token

app = FastAPI(title="Task Planner")

static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ---------------------------------------------------------------------------
# Request/Response models
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    username: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class BoardCreate(BaseModel):
    name: str

class ColumnCreate(BaseModel):
    name: str

class CardCreate(BaseModel):
    title: str
    description: str = ""
    category: str = ""
    due_date: Optional[str] = None
    priority: str = "medium"

class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None

class CardMove(BaseModel):
    column_id: int
    position: int = 0


# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------

def get_current_user(authorization: str = Header(None)) -> dict:
    """Extract and verify the user from the Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not logged in")

    token = authorization.split(" ")[1]
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"id": int(payload["sub"]), "username": payload["username"]}


# ---------------------------------------------------------------------------
# Page
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def serve_page():
    html_path = Path(__file__).parent / "static" / "index.html"
    return HTMLResponse(content=html_path.read_text())


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

@app.post("/api/register")
def register(req: RegisterRequest):
    if len(req.username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters")
    if len(req.password) < 4:
        raise HTTPException(status_code=400, detail="Password must be at least 4 characters")

    conn = db.get_connection()
    existing = db.get_user_by_username(conn, req.username)
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed = hash_password(req.password)
    user_id = db.create_user(conn, req.username, hashed)

    # Create a default board for new users
    db.create_board(conn, user_id, "My First Board")

    conn.close()

    token = create_token(user_id, req.username)
    return {"token": token, "username": req.username}


@app.post("/api/login")
def login(req: LoginRequest):
    conn = db.get_connection()
    user = db.get_user_by_username(conn, req.username)
    conn.close()

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_token(user["id"], user["username"])
    return {"token": token, "username": user["username"]}


# ---------------------------------------------------------------------------
# Board routes
# ---------------------------------------------------------------------------

@app.get("/api/boards")
def list_boards(authorization: str = Header(None)):
    user = get_current_user(authorization)
    conn = db.get_connection()
    boards = db.get_boards(conn, user["id"])
    conn.close()
    return boards


@app.post("/api/boards")
def create_board(req: BoardCreate, authorization: str = Header(None)):
    user = get_current_user(authorization)
    conn = db.get_connection()
    board_id = db.create_board(conn, user["id"], req.name)
    board = db.get_full_board(conn, board_id)
    conn.close()
    return board


@app.get("/api/boards/{board_id}")
def get_board(board_id: int, authorization: str = Header(None)):
    user = get_current_user(authorization)
    conn = db.get_connection()
    board = db.get_full_board(conn, board_id)
    conn.close()
    if not board or board["user_id"] != user["id"]:
        raise HTTPException(status_code=404, detail="Board not found")
    return board


@app.delete("/api/boards/{board_id}")
def delete_board(board_id: int, authorization: str = Header(None)):
    user = get_current_user(authorization)
    conn = db.get_connection()
    deleted = db.delete_board(conn, board_id, user["id"])
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Board not found")
    return {"message": "Board deleted"}


# ---------------------------------------------------------------------------
# Column routes
# ---------------------------------------------------------------------------

@app.post("/api/boards/{board_id}/columns")
def create_column(board_id: int, req: ColumnCreate, authorization: str = Header(None)):
    user = get_current_user(authorization)
    conn = db.get_connection()
    col_id = db.create_column(conn, board_id, req.name)
    conn.close()
    return {"id": col_id, "name": req.name, "board_id": board_id}


@app.delete("/api/columns/{column_id}")
def delete_column(column_id: int, authorization: str = Header(None)):
    get_current_user(authorization)
    conn = db.get_connection()
    deleted = db.delete_column(conn, column_id)
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Column not found")
    return {"message": "Column deleted"}


# ---------------------------------------------------------------------------
# Card routes
# ---------------------------------------------------------------------------

@app.post("/api/columns/{column_id}/cards")
def create_card(column_id: int, req: CardCreate, authorization: str = Header(None)):
    get_current_user(authorization)
    conn = db.get_connection()
    card_id = db.create_card(
        conn, column_id, req.title, req.description,
        req.category, req.due_date, req.priority,
    )
    conn.close()
    return {"id": card_id, "column_id": column_id, "title": req.title}


@app.put("/api/cards/{card_id}")
def update_card(card_id: int, req: CardUpdate, authorization: str = Header(None)):
    get_current_user(authorization)
    conn = db.get_connection()
    updates = {k: v for k, v in req.model_dump().items() if v is not None}
    updated = db.update_card(conn, card_id, **updates)
    conn.close()
    if not updated:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "Card updated"}


@app.put("/api/cards/{card_id}/move")
def move_card(card_id: int, req: CardMove, authorization: str = Header(None)):
    get_current_user(authorization)
    conn = db.get_connection()
    moved = db.move_card(conn, card_id, req.column_id, req.position)
    conn.close()
    if not moved:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "Card moved"}


@app.delete("/api/cards/{card_id}")
def delete_card(card_id: int, authorization: str = Header(None)):
    get_current_user(authorization)
    conn = db.get_connection()
    deleted = db.delete_card(conn, card_id)
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Card not found")
    return {"message": "Card deleted"}


# ---------------------------------------------------------------------------
# Start
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\n📋 Task Planner starting...")
    print("   Open your browser to: http://localhost:8000\n")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
