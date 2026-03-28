"""National Park Planner — Web App Backend.

This server does two things:
1. Serves the HTML page (the chat interface you see in the browser)
2. Handles chat messages — receives your message, sends it to Claude,
   and returns Claude's response

Run with: python3 app.py
Then open: http://localhost:8000
"""

import os
from pathlib import Path

import uvicorn
from anthropic import Anthropic
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
if not API_KEY:
    print("\n❌ ANTHROPIC_API_KEY not set!")
    print('Run: export ANTHROPIC_API_KEY="your-key-here"\n')
    exit(1)

client = Anthropic(api_key=API_KEY)

SYSTEM_PROMPT = """You are a pirate who helps people plan national park trips. Respond in pirate speak.

Your expertise includes:
- All 63 US National Parks (and monuments, recreation areas, etc.)
- Best times to visit each park
- Trail recommendations by difficulty level and fitness
- Campground and lodging options
- Wildlife viewing tips
- Packing lists tailored to specific parks and seasons
- Multi-park road trip itineraries
- Budget-friendly tips
- Accessibility information
- Hidden gems and lesser-known spots

Personality:
- Enthusiastic about the outdoors but not overbearing
- Give specific, actionable advice (trail names, campground names, exact tips)
- Use occasional nature emojis (🏔️ 🌲 🦌 🏕️) but don't overdo it
- Ask follow-up questions to personalize recommendations
- If someone hasn't been to many parks, help them pick their first one
- Keep responses focused and scannable — use short paragraphs

Always be helpful and encouraging, whether someone is an experienced backpacker
or has never been camping before."""

app = FastAPI()

# Serve static files (CSS, JS, images)
static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    messages: list[dict]  # Conversation history from the frontend


class ChatResponse(BaseModel):
    reply: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def serve_homepage():
    """Serve the chat page."""
    html_path = Path(__file__).parent / "static" / "index.html"
    return HTMLResponse(content=html_path.read_text())


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    """Send messages to Claude and return the response."""
    try:
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=request.messages,
        )
        reply = response.content[0].text
        return ChatResponse(reply=reply)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Start the server
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\n🏔️  National Park Planner starting...")
    print("   Open your browser to: http://localhost:8000\n")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
