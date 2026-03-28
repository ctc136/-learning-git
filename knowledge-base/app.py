"""Knowledge Base — Web App Backend.

A RAG (Retrieval-Augmented Generation) system that lets you upload
documents and ask questions about them.

Run with: python3 app.py
Then open: http://localhost:8000
"""

import json
import os
import shutil
from pathlib import Path

import uvicorn
from anthropic import Anthropic
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src import db
from src.processor import read_file, read_url, chunk_text
from src.search import search_chunks

app = FastAPI(title="Knowledge Base")

static_dir = Path(__file__).parent / "static"
uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(exist_ok=True)

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

# Claude setup
API_KEY = os.environ.get("ANTHROPIC_API_KEY")
MODEL = "claude-sonnet-4-20250514"
client = Anthropic(api_key=API_KEY) if API_KEY else None

SYSTEM_PROMPT = """You are a knowledgeable assistant that answers questions based on 
the user's personal document collection. You will be given relevant excerpts from 
their documents along with their question.

Rules:
- Answer based on the provided document excerpts whenever possible
- If the excerpts contain the answer, cite which document it came from
- If the excerpts don't contain enough info, say so honestly and give your best 
  general knowledge answer, clearly noting it's not from their documents
- Be concise and direct
- If asked about something completely unrelated to the documents, answer normally
  but mention that you didn't find anything relevant in their knowledge base"""


class QuestionRequest(BaseModel):
    question: str


class UrlRequest(BaseModel):
    url: str
    name: str = ""


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
def serve_page():
    html_path = Path(__file__).parent / "static" / "index.html"
    return HTMLResponse(content=html_path.read_text())


# ---------------------------------------------------------------------------
# Document management
# ---------------------------------------------------------------------------

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file (text, markdown, PDF, HTML)."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Save the file
    save_path = uploads_dir / file.filename
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Read and chunk the file
    text = read_file(str(save_path))
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    chunks = chunk_text(text)

    # Save to database
    conn = db.get_connection()
    doc_id = db.add_document(conn, file.filename, "file", str(save_path), chunks)
    conn.close()

    return {
        "id": doc_id,
        "name": file.filename,
        "chunks": len(chunks),
        "message": f"Uploaded and indexed {len(chunks)} chunks",
    }


@app.post("/api/add-url")
def add_url(req: UrlRequest):
    """Fetch and index a web page."""
    if not req.url.strip():
        raise HTTPException(status_code=400, detail="URL can't be empty")

    text = read_url(req.url)
    if not text.strip() or text.startswith("Error"):
        raise HTTPException(status_code=400, detail=f"Could not fetch URL: {text}")

    chunks = chunk_text(text)
    name = req.name.strip() if req.name.strip() else req.url

    conn = db.get_connection()
    doc_id = db.add_document(conn, name, "url", req.url, chunks)
    conn.close()

    return {
        "id": doc_id,
        "name": name,
        "chunks": len(chunks),
        "message": f"Indexed {len(chunks)} chunks from URL",
    }


@app.get("/api/documents")
def list_documents():
    """Get all indexed documents."""
    conn = db.get_connection()
    docs = db.get_all_documents(conn)
    conn.close()
    return docs


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int):
    """Remove a document from the knowledge base."""
    conn = db.get_connection()
    deleted = db.delete_document(conn, doc_id)
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document removed"}


# ---------------------------------------------------------------------------
# RAG Chat
# ---------------------------------------------------------------------------

@app.post("/api/ask")
def ask_question(req: QuestionRequest):
    """Ask a question — searches documents, then asks Claude with context."""
    if not client:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not set")

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question can't be empty")

    # Step 1: Get all chunks from the database
    conn = db.get_connection()
    all_chunks = db.get_all_chunks(conn)

    # Step 2: Search for relevant chunks
    results = search_chunks(req.question, all_chunks, top_k=5)

    # Step 3: Build context from results
    if results:
        context_parts = []
        sources_used = []
        for r in results:
            context_parts.append(f"[From: {r['source']}]\n{r['text']}")
            if r["source"] not in sources_used:
                sources_used.append(r["source"])

        context = "\n\n---\n\n".join(context_parts)
        user_message = (
            f"Here are relevant excerpts from my documents:\n\n{context}\n\n"
            f"---\n\nMy question: {req.question}"
        )
    else:
        user_message = (
            f"I searched my knowledge base but didn't find anything relevant.\n\n"
            f"My question: {req.question}"
        )
        sources_used = []

    # Step 4: Ask Claude
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        answer = response.content[0].text

        # Save the conversation
        db.save_conversation(
            conn, req.question, answer, json.dumps(sources_used)
        )
        conn.close()

        return {
            "answer": answer,
            "sources": sources_used,
            "chunks_found": len(results),
            "top_chunks": [
                {"source": r["source"], "score": r["score"],
                 "preview": r["text"][:200] + "..."}
                for r in results
            ],
        }
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/history")
def get_history():
    """Get past questions and answers."""
    conn = db.get_connection()
    convos = db.get_conversations(conn)
    conn.close()
    return convos


# ---------------------------------------------------------------------------
# Start
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("\n🧠 Knowledge Base starting...")
    print("   Open your browser to: http://localhost:8000\n")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
