# AI Journal 📓

A daily journal web app with mood tracking and AI-powered reflections.

## Features

- **Daily entries** — one entry per day, navigate between dates
- **Mood tracking** — pick your mood (awful → great), see it charted over time
- **AI reflections** — Claude reads your entry and writes a brief, thoughtful reflection
- **Weekly summaries** — AI-generated summary of your recent entries
- **Search** — find past entries by keyword
- **Mood chart** — visual mood trend with emoji data points

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Make sure your API key is set:
```bash
echo $ANTHROPIC_API_KEY
```

## Run

```bash
python3 app.py
```

Then open: **http://localhost:8000**

## How It Works

- `app.py` — FastAPI backend
- `src/db.py` — SQLite database for entries and mood data
- `src/ai.py` — Claude API calls for reflections and summaries
- `static/index.html` — Journal frontend with Chart.js mood graph

## Project Structure

```
ai-journal/
├── app.py              # Backend server
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── db.py           # Database operations
│   └── ai.py           # Claude AI features
└── static/
    └── index.html      # Frontend interface
```

## Cost

Each entry reflection uses one Claude API call (~fraction of a penny).
Weekly summaries use one additional call.
