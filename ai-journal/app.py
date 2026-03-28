"""AI Journal — Web App Backend.

A daily journal with mood tracking and AI-powered reflections.

Run with: python3 app.py
Then open: http://localhost:8000
"""

from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src import db
from src.ai import get_reflection, get_weekly_summary

app = FastAPI(title="AI Journal")

static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ---------------------------------------------------------------------------
# Request/Response models
# ---------------------------------------------------------------------------

class EntryCreate(BaseModel):
    date: str
    content: str
    mood: str
    mood_score: int


class EntryResponse(BaseModel):
    id: int
    date: str
    content: str
    mood: str
    mood_score: int
    ai_reflection: Optional[str]
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def serve_page():
    html_path = Path(__file__).parent / "static" / "index.html"
    return HTMLResponse(content=html_path.read_text())


@app.post("/api/entries")
def save_entry(entry: EntryCreate):
    """Save a journal entry and get an AI reflection."""
    if not entry.content.strip():
        raise HTTPException(status_code=400, detail="Entry can't be empty")

    # Get AI reflection
    reflection = get_reflection(entry.content, entry.mood)

    conn = db.get_connection()
    entry_id = db.save_entry(
        conn, entry.date, entry.content, entry.mood,
        entry.mood_score, reflection,
    )
    saved = db.get_entry_by_date(conn, entry.date)
    conn.close()
    return saved


@app.get("/api/entries")
def list_entries():
    """Get all journal entries."""
    conn = db.get_connection()
    entries = db.get_all_entries(conn)
    conn.close()
    return entries


@app.get("/api/entries/{date}")
def get_entry(date: str):
    """Get a specific entry by date."""
    conn = db.get_connection()
    entry = db.get_entry_by_date(conn, date)
    conn.close()
    if not entry:
        raise HTTPException(status_code=404, detail="No entry for this date")
    return entry


@app.delete("/api/entries/{date}")
def delete_entry(date: str):
    """Delete an entry."""
    conn = db.get_connection()
    deleted = db.delete_entry(conn, date)
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="No entry for this date")
    return {"message": "Entry deleted"}


@app.get("/api/search")
def search(q: str = Query(..., description="Search text")):
    """Search journal entries."""
    conn = db.get_connection()
    results = db.search_entries(conn, q)
    conn.close()
    return results


@app.get("/api/mood-data")
def mood_data(days: int = 30):
    """Get mood scores for the chart."""
    conn = db.get_connection()
    data = db.get_mood_data(conn, days)
    conn.close()
    return data


@app.get("/api/weekly-summary")
def weekly_summary():
    """Get an AI-generated summary of the past week."""
    conn = db.get_connection()
    entries = db.get_entries_for_summary(conn, 7)
    conn.close()
    summary = get_weekly_summary(entries)
    return {"summary": summary}


# ---------------------------------------------------------------------------
# Start
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\n📓 AI Journal starting...")
    print("   Open your browser to: http://localhost:8000\n")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
