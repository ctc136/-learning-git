"""Blog Agent Pipeline — Web App Backend.

Runs four AI agents in sequence to produce a polished blog post.
Now with database storage for saving and browsing past posts.

Run with: python3 app.py
Then open: http://localhost:8000
"""

import json
from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from src.agents import run_agent, get_agent_info, AGENTS
from src import db

app = FastAPI(title="Blog Agent Pipeline")

static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


class TopicRequest(BaseModel):
    topic: str


class SaveRequest(BaseModel):
    topic: str
    agent_outputs: list[str]
    final_post: str


@app.get("/", response_class=HTMLResponse)
def serve_page():
    html_path = Path(__file__).parent / "static" / "index.html"
    return HTMLResponse(content=html_path.read_text())


@app.get("/api/agents")
def list_agents():
    return get_agent_info()


@app.post("/api/run")
def run_pipeline(req: TopicRequest):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic can't be empty")

    def generate():
        previous_output = ""
        for i in range(len(AGENTS)):
            yield f"data: {json.dumps({'type': 'start', 'agent': i, 'name': AGENTS[i]['name'], 'emoji': AGENTS[i]['emoji']})}\n\n"
            result = run_agent(i, previous_output, req.topic)
            yield f"data: {json.dumps({'type': 'result', 'agent': i, **result})}\n\n"
            if not result.get("error"):
                previous_output = result["output"]
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


@app.post("/api/blogs")
def save_blog(req: SaveRequest):
    conn = db.get_connection()
    blog_id = db.save_blog(conn, req.topic, req.agent_outputs, req.final_post)
    conn.close()
    return {"id": blog_id, "message": "Blog saved!"}


@app.get("/api/blogs")
def list_blogs():
    conn = db.get_connection()
    blogs = db.get_all_blogs(conn)
    conn.close()
    return blogs


@app.get("/api/blogs/{blog_id}")
def get_blog(blog_id: int):
    conn = db.get_connection()
    blog = db.get_blog_by_id(conn, blog_id)
    conn.close()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    return blog


@app.delete("/api/blogs/{blog_id}")
def delete_blog(blog_id: int):
    conn = db.get_connection()
    deleted = db.delete_blog(conn, blog_id)
    conn.close()
    if not deleted:
        raise HTTPException(status_code=404, detail="Blog not found")
    return {"message": "Blog deleted"}


if __name__ == "__main__":
    print("\n📝 Blog Agent Pipeline starting...")
    print("   Open your browser to: http://localhost:8000\n")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
