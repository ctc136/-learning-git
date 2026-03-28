# Knowledge Base 🧠

A personal RAG (Retrieval-Augmented Generation) system. Upload your documents, then ask questions and get answers grounded in YOUR data.

## What is RAG?

Normally when you ask Claude a question, it answers from general knowledge. RAG adds a step: before answering, the system searches YOUR documents to find relevant information, then sends those excerpts to Claude along with your question. This way Claude's answers are based on your actual data, not just what it was trained on.

## Features

- **Upload documents** — drag and drop PDFs, text files, markdown, HTML
- **Add web URLs** — fetch and index web pages
- **Ask questions** — natural language questions about your documents
- **Source citations** — see which documents the answer came from
- **View matched chunks** — inspect exactly which text excerpts were used
- **Conversation history** — browse past questions and answers

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

1. **Upload** — You add documents (files or URLs)
2. **Chunk** — The system splits each document into ~500-word pieces
3. **Ask** — You type a question
4. **Search** — The system finds the most relevant chunks using keyword matching
5. **Answer** — Claude reads those chunks + your question and gives a grounded answer

## Project Structure

```
knowledge-base/
├── app.py              # Backend server
├── requirements.txt
├── uploads/            # Uploaded files stored here
├── src/
│   ├── __init__.py
│   ├── db.py           # SQLite database
│   ├── processor.py    # File reading and text chunking
│   └── search.py       # Keyword search engine
└── static/
    └── index.html      # Frontend interface
```

## How the Search Works

Instead of using embeddings (which require a separate AI model), this uses
TF-IDF-style keyword matching. It looks at which words appear in your question,
finds chunks containing those words, and ranks them by relevance. It's simpler
than embeddings but works well for most use cases.

## Cost

Each question uses one Claude API call. The search itself is free — it runs
locally on your computer.
