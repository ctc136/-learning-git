# National Park Planner 🏔️

A web-based chat interface for planning national park trips, powered by Claude.

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

Then open your browser to: **http://localhost:8000**

## How It Works

- `app.py` — The backend server. Serves the web page and forwards your messages to Claude's API.
- `static/index.html` — The frontend. A chat interface that sends your messages to the backend.

The system prompt in `app.py` tells Claude to act as a national park expert.
You can customize it to change the chatbot's personality and knowledge focus.

## Note

This uses the same API key and credits as your terminal chatbot.
Each message costs a fraction of a penny.
