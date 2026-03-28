# AI Engineer Roadmap v3 — Chris Collins
### 12 months · 5–10 hrs/week · ~480 hrs total · 6 phases
### Updated March 2026

---

## What Changed in v3

- **Git/GitHub added as immediate priority** (not deferred to later)
- **Structured outputs & tool calling** made explicit in Phase 2
- **Embeddings & vector databases** emphasized in Phase 4 (RAG)
- **Evaluation/testing** introduced earlier and woven throughout
- **MCP emphasis increased** — now a core skill, not optional
- **Early deployment** — ship something to the internet by end of Phase 1
- **Computer upgrade recommendation** added
- **Resource links** added for each phase

---

## Recommended Hardware

Your 2017 MacBook Air (8GB RAM, Intel i5) served you well for Phase 1 but will become a bottleneck as projects get more complex. Here's what to get:

### Best Value: MacBook Air M5 — 24GB RAM, 512GB SSD (~$1,299)

This is the sweet spot for AI engineering learners. The M5 chip handles everything on this roadmap: running VS Code with multiple projects, local AI models up to 14B parameters via Ollama, Docker containers, and all-day battery life. The 24GB unified memory is the key spec — it's shared between CPU and GPU, which is ideal for AI workloads.

**Why not 16GB?** It works for now but you'll hit the ceiling within 6 months when running local models + Docker + VS Code simultaneously. The $200 upgrade to 24GB is worth it.

**Why not MacBook Pro?** You don't need it yet. The Air handles everything in this roadmap. If you later specialize in running large local models or fine-tuning, you can upgrade then. Don't overspend now.

**Why not 32GB?** Diminishing returns for your current stage. Save the money and spend it on API credits or courses instead.

---

## Phase 0: Immediate Priority (This Week)

### Git & GitHub

Every project you build from now on should live on GitHub. This is your portfolio, your backup, and your version control. If your laptop dies, your code survives.

**What to learn:**
- `git init`, `add`, `commit`, `push`, `pull`
- Creating repos on GitHub
- Writing README files
- Understanding `.gitignore` (exclude `venv/`, `__pycache__/`, `.env`)
- Branching basics

**Resources:**
- GitHub Skills (free, interactive): https://skills.github.com/
- Learn Git Branching (visual, interactive): https://learngitbranching.js.org/

**Action item:** Push ALL your existing projects (recipe manager, stock dashboard, park planner, etc.) to GitHub this week. One repo per project.

---

## Phase 1: Coding & Fundamentals (Months 1–2, ~80 hrs)

### ✅ COMPLETED — Here's What You Built

**Skills acquired:** Python, FastAPI, SQLite, HTML/CSS/JavaScript, API calls, JSON, web scraping, CLI tools, virtual environments, pip, terminal navigation

**Projects completed:**
1. Weather Dashboard (API + HTML)
2. Recipe Manager (SQLite + CLI + web scraper + grocery list)
3. REST API Server (FastAPI + HTTP methods)
4. CLI Chatbot (Anthropic API + conversation history)
5. National Park Planner (web app + AI chat)
6. Stock Dashboard (yfinance + Chart.js)
7. Task Planner (auth + JWT + drag & drop)
8. AI Journal (mood tracking + AI reflections)
9. Blog Agent Pipeline (multi-agent + SSE + SQLite)
10. Knowledge Base (RAG + chunking + search + document upload)

**Python fundamentals:** Completed freeCodeCamp full course (30 exercises covering variables through inheritance)

**What's still needed from Phase 1:**
- ✅ Git/GitHub (move to Phase 0 — do this NOW)
- Deploy one project to the internet (Railway or Render) — carry this into Phase 2

**Anthropic Courses:**
- [ ] Claude 101 — skim
- [ ] Building with the Claude API — START NOW, continue through Phase 2

---

## Phase 2: Prompt Engineering & LLM Basics (Months 3–4, ~80 hrs)

Prompt engineering is the first real superpower of an AI engineer. Learn how models respond to instructions before writing complex LLM app code. Most beginners skip this — don't.

### Skills to Learn

**Prompt Design:**
- System vs user messages (you've used these — now go deeper)
- Few-shot examples (showing the model examples of what you want)
- Chain-of-thought prompting (asking the model to think step by step)
- Prompt templates and variables
- How small wording changes dramatically shift output quality

**Structured Outputs (NEW — was missing from v2):**
- Forcing Claude to return clean JSON matching a schema you define
- Pydantic models for validation
- The difference between asking for JSON vs enforcing a schema
- Handling cases where the model refuses or returns unexpected data

**Tool Calling (NEW — was missing from v2):**
- Letting Claude decide WHEN to call your functions
- Defining tools with clear JSON Schema descriptions
- The full loop: model decides → returns tool call → you execute → send result back
- This is the foundation of agents (Phase 5)

**Token Economics:**
- What tokens are (roughly 4 characters ≈ 1 token)
- Input vs output pricing
- Context window limits
- When to use cheaper models vs expensive ones

### Build Projects
- A Q&A bot that answers questions about a specific topic using structured prompts
- A structured data extractor that takes messy text and outputs clean JSON (e.g., parse job listings into structured fields)
- A tool-calling assistant with 3-4 tools (calculator, weather, note search)

### Resources
- Anthropic Prompt Engineering Tutorial (GitHub, free): https://github.com/anthropics/prompt-eng-interactive-tutorial
- Anthropic Prompt Engineering Docs: https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview
- Anthropic Tool Use Docs: https://docs.anthropic.com/en/docs/build-with-claude/tool-use
- PromptingGuide.ai: https://www.promptingguide.ai/

### Deploy Milestone
Deploy one of your existing projects (park planner or knowledge base) to Railway or Render so it's accessible on the real internet. This is a critical skill to learn early.

### Anthropic Courses
- [ ] Building with the Claude API — continue (prompt engineering + structured output sections)
- [ ] AI Fluency: Framework & Foundations — optional but useful

---

## Phase 3: LLM App Development (Months 5–6, ~80 hrs)

Build real LLM-powered applications. Understand multi-turn conversation, streaming, and when to use frameworks vs raw API calls.

### Skills to Learn

**Streaming Responses:**
- Server-Sent Events (you built this in the blog agent pipeline)
- Go deeper: word-by-word streaming in a chat UI
- Why streaming matters for user experience

**Memory Patterns:**
- Conversation summarization (compress long histories)
- Sliding window (keep only recent messages)
- When to truncate vs summarize

**Context Management:**
- Working within context window limits
- Strategies for long documents
- Multi-turn conversation design

**MCP — Model Context Protocol (INCREASED EMPHASIS):**
- What MCP is: a universal standard for connecting AI to external tools
- Building MCP servers in Python
- Connecting Claude to databases, files, APIs via MCP
- MCP is now adopted by OpenAI, Google, and hosted by the Linux Foundation — this is becoming essential

### Build Projects
- Ship a working chatbot with memory that a real person can use
- Build an MCP server that connects Claude to one of your existing databases (e.g., your recipe database)
- A streaming chat app with conversation summarization

### Resources
- Anthropic Messages API: https://docs.anthropic.com/en/api/messages
- Anthropic Streaming Docs: https://docs.anthropic.com/en/api/messages-streaming
- MCP Official Docs: https://modelcontextprotocol.io/
- MCP Python SDK: https://github.com/modelcontextprotocol/python-sdk
- FastMCP (simplified MCP building): search for fastmcp on GitHub

### Anthropic Courses
- [ ] Introduction to Model Context Protocol — start here
- [ ] Building with the Claude API — finish

---

## Phase 4: RAG Systems (Months 7–8, ~80 hrs)

RAG is the most practical and in-demand skill in the AI engineer stack. You built a basic version (keyword search) — now learn the production approach.

### Skills to Learn

**Embeddings (NEW — the big upgrade from your current approach):**
- What embeddings are: turning text into numbers that capture meaning
- Why "automobile" and "car" produce similar vectors even though they share no letters
- Embedding models (OpenAI, HuggingFace sentence-transformers)
- Cosine similarity for finding matches

**Vector Databases:**
- Chroma (best for local prototyping — start here)
- How to store, query, and filter embeddings
- The difference between your keyword search and vector search

**Advanced Chunking:**
- Recursive chunking for structured documents
- Semantic chunking for better boundary detection
- Chunk size vs retrieval precision tradeoffs

**Reranking:**
- Two-stage search: fast retrieval → accurate reranking
- Cohere rerank API
- Why this dramatically improves answer quality

**Hallucination Reduction:**
- Prompting models to say "I don't know" when the answer isn't in the docs
- Citation and grounding strategies
- Confidence thresholds

**Evaluation (START BUILDING THE HABIT):**
- Create 20-30 test question-answer pairs for your RAG system
- Measure retrieval quality: did the right chunks come back?
- Measure answer quality: is the answer correct and grounded?

### Build Projects
- Upgrade your Knowledge Base to use embeddings + Chroma instead of keyword search
- Build a "chat with your codebase" tool that indexes all your project files
- Add evaluation: test suite of questions with expected answers

### Resources
- Stack Overflow: Intuitive Intro to Embeddings: https://stackoverflow.blog/2023/11/09/an-intuitive-introduction-to-text-embeddings/
- Chroma Docs: https://docs.trychroma.com/
- OpenAI Embeddings Guide: https://platform.openai.com/docs/guides/embeddings
- Anthropic Citations Docs: https://docs.anthropic.com/en/docs/build-with-claude/citations
- Ragas (RAG evaluation): https://docs.ragas.io/

### Anthropic Courses
- [ ] Model Context Protocol: Advanced Topics

---

## Phase 5: Agents & Evals (Months 9–10, ~80 hrs)

Agents are powerful but fail in predictable ways. Build multi-step automated workflows, then immediately learn to evaluate them.

### Skills to Learn

**Agent Loops:**
- The perceive → plan → act → observe cycle
- Building an agent from scratch (no framework) — just API calls + a while loop
- When the loop should terminate
- What happens when a tool call fails

**Tool Selection & Description:**
- Writing tool descriptions that get selected correctly
- Testing with ambiguous inputs
- The art of clear parameter naming

**Multi-Step Workflows:**
- Chaining (output of one call feeds the next — you did this with blog agents)
- Routing (classify input, send to specialized handler)
- Parallelization (run multiple calls at once)
- Orchestrator-worker pattern

**When NOT to Use Agents:**
- Single LLM call if the task can be solved in one prompt
- Workflow if steps are fixed and predictable
- Agent ONLY if the number of steps is genuinely unpredictable
- Agents are slow, expensive, and hard to debug — use the simplest approach that works

**Evaluation Harnesses:**
- Golden test sets (20-50 representative inputs with expected outputs)
- Automated eval runs when you change prompts or models
- LLM-as-judge for evaluating open-ended outputs
- Process metrics (did it call the right tool?) vs outcome metrics (did the task succeed?)

### Build Projects
- Build an agent from scratch with 3+ tools and a goal
- Build a proper eval harness for your RAG system from Phase 4
- An agent that automates a real workflow you care about

### Resources
- Anthropic: Building Effective Agents: https://www.anthropic.com/research/building-effective-agents
- OpenAI: Practical Guide to Building Agents: https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf
- DeepEval (testing framework): https://deepeval.com/docs/getting-started
- Promptfoo (prompt testing): https://github.com/promptfoo/promptfoo

### Anthropic Courses
- [ ] Introduction to Agent Skills
- [ ] Claude Code in Action

---

## Phase 6: Deploy, Security & Ship (Months 11–12, ~80 hrs)

Production is where most self-taught builders stop. Learn Docker, logging, cost control, and security. Then specialize, build your portfolio, and ship.

### Skills to Learn

**Docker:**
- Containerize a FastAPI + LLM app
- Docker Compose for multi-service setups
- Environment variables for secrets

**Observability & Logging:**
- Tracing every LLM call (prompt, response, tokens, latency, cost)
- Structured logging (JSON format)
- Langfuse or LangSmith for LLM-specific monitoring

**Cost Control:**
- Spending limits per day/month
- Per-user rate limiting
- Using cheaper models for simple tasks
- Caching repeated requests with Redis

**Prompt Injection Defense:**
- Direct injection (user tries to override system prompt)
- Indirect injection (malicious content in documents/URLs)
- Input validation and output verification
- Never trust unvalidated LLM output for consequential actions

**Auth & API Security:**
- JWT tokens (you built this in Task Planner)
- API key management
- Rate limiting
- OWASP API Security Top 10

### Build Projects
- Add prompt injection tests to your eval suite
- Containerize your best project with Docker
- Deploy one polished end-to-end product that you're proud to show

### Resources
- Docker Getting Started: https://docs.docker.com/get-started/
- FastAPI Deployment Docs: https://fastapi.tiangolo.com/deployment/
- Langfuse (LLM observability): https://langfuse.com/
- OWASP LLM Top 10: https://genai.owasp.org/llmrisk/llm01-prompt-injection/

### Anthropic Courses
- No courses — focus on building and shipping

---

## Anthropic Courses Summary

| Course | When to Take | Status |
|--------|-------------|--------|
| Claude 101 | Phase 1 (skim) | [ ] |
| Building with the Claude API | Phases 1–3 | [ ] |
| AI Fluency: Framework & Foundations | Phase 2 (optional) | [ ] |
| Introduction to Model Context Protocol | Phase 3 | [ ] |
| Model Context Protocol: Advanced Topics | Phase 4 | [ ] |
| Introduction to Agent Skills | Phase 5 | [ ] |
| Claude Code in Action | Phase 5 | [ ] |

---

## Philosophy

- **Build products, not tutorials.** Every phase ends with something real that works.
- **Deploy early.** Don't wait until Month 12 to put something on the internet.
- **Evaluate everything.** If you can't measure it, you can't improve it.
- **Depth over breadth.** Master one provider (Anthropic/Claude) before trying to learn them all.
- **Push to GitHub.** Every project, every time. This is your portfolio.
- **Read your own code.** Understanding what you built is as important as building it.

---

*Last updated: March 2026*
