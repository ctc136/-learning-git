# Blog Agent Pipeline 📝

A multi-agent workflow tool that chains four AI agents together to produce a polished blog post.

## The Pipeline

1. 🔍 **Researcher** — Gathers key points, facts, and angles about the topic
2. 📋 **Outliner** — Creates a structured outline from the research
3. ✍️ **Writer** — Writes the full blog post following the outline
4. ✨ **Editor** — Reviews, polishes, and produces the final version

Each agent passes its output to the next, like a relay race. The key concept: instead of one big prompt, breaking work into focused specialists produces better results.

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

- `src/agents.py` — Defines the four agents (system prompts + pipeline logic)
- `app.py` — FastAPI backend that runs agents in sequence via Server-Sent Events
- `static/index.html` — Frontend that shows each agent's progress in real time

## Cost

Each blog post generation uses 4 Claude API calls (one per agent).
At current Sonnet pricing, that's roughly 2-4 cents per blog post.

## Project Structure

```
blog-agents/
├── app.py              # Backend server
├── requirements.txt
├── src/
│   ├── __init__.py
│   └── agents.py       # Agent definitions and pipeline
└── static/
    └── index.html      # Frontend interface
```
