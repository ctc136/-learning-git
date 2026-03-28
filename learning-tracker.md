# Learning Tracker — Chris Collins
### AI Engineer Roadmap · Started February 2026

---

## Month 1 (Feb–Mar 2026) — Phase 1: Coding & Fundamentals

### Summary
Completed all 20 coding projects. Built CLI tools, REST APIs, web apps with authentication, AI-powered chat interfaces, a multi-agent pipeline, and a full RAG system. Started Python fundamentals course and began learning to read code.

---

## Languages & Core Concepts

| Skill | What It Is | Projects Used In |
|-------|-----------|-----------------|
| **Python** | The programming language used for all backend code. Handles logic, data processing, and API communication. | All projects |
| **HTML/CSS** | The languages that build web pages. HTML is the structure (headings, buttons, text), CSS is the styling (colors, layout, fonts). | Weather Dashboard, Park Planner, Stock Dashboard, Task Planner, AI Journal, Blog Agents, Knowledge Base |
| **JavaScript** | The programming language that runs in the browser. Makes web pages interactive — handles button clicks, sends requests, updates the page without reloading. | Park Planner, Stock Dashboard, Task Planner, AI Journal, Blog Agents, Knowledge Base |
| **SQL** | The language for talking to databases. SELECT gets data, INSERT adds data, DELETE removes data, UPDATE changes data. | Recipe Manager, REST API, Task Planner, AI Journal, Blog Agents, Knowledge Base |
| **JSON** | A universal data format that looks like `{"name": "Tacos", "rating": 5}`. How apps send data back and forth. Everything from APIs to config files uses it. | All API projects |

---

## Frameworks & Libraries

| Skill | What It Is | Projects Used In |
|-------|-----------|-----------------|
| **FastAPI** | A Python framework for building web servers and APIs. You define routes (URLs) and it handles incoming requests. Automatically generates interactive docs at `/docs`. | REST API, Park Planner, Stock Dashboard, Task Planner, AI Journal, Blog Agents, Knowledge Base |
| **Typer** | A Python library for building command-line tools. Like FastAPI but for terminal commands instead of web URLs. | Recipe Manager |
| **Rich** | A Python library that makes terminal output look nice — colored text, tables, panels, progress bars. | Recipe Manager, CLI Chatbot |
| **Chart.js** | A JavaScript charting library. Turns data into interactive line charts, bar charts, etc. that you can hover over and explore. | Stock Dashboard, AI Journal |
| **yfinance** | A Python library that pulls stock market data from Yahoo Finance. No API key needed. | Stock Dashboard |
| **Anthropic SDK** | The official Python library for talking to Claude's API. Send messages, get responses. | CLI Chatbot, Park Planner, AI Journal, Blog Agents, Knowledge Base |
| **Uvicorn** | The server that actually runs your FastAPI app. FastAPI defines what to do, Uvicorn listens for requests and routes them. | All web app projects |
| **pypdf** | A Python library for reading PDF files — extracts text from pages. | Knowledge Base |

---

## Databases & Data Storage

| Skill | What It Is | Projects Used In |
|-------|-----------|-----------------|
| **SQLite** | A lightweight database stored as a single file. Perfect for single-user apps. Your recipes, journal entries, blog posts, and tasks all live in SQLite databases. | Recipe Manager, REST API, Task Planner, AI Journal, Blog Agents, Knowledge Base |
| **Database tables** | Like spreadsheets inside the database. Each table holds one type of data (recipes, ingredients, tags). Connected by IDs. | All database projects |
| **CRUD operations** | Create, Read, Update, Delete — the four basic things you do with data in any database. | All database projects |
| **Foreign keys** | Rules that connect tables together. An ingredient's `recipe_id` points to which recipe it belongs to. Prevents orphaned data. | Recipe Manager, Task Planner |
| **Hidden database files** | Databases stored in hidden folders (starting with `.`) in your home directory, like `~/.recipe-manager/recipes.db`. Convention for app data. | Recipe Manager, AI Journal, Blog Agents, Knowledge Base |

---

## API & Web Concepts

| Skill | What It Is | Projects Used In |
|-------|-----------|-----------------|
| **REST API** | A set of conventions for how apps talk to each other over the web. Use URLs to represent things (`/recipes`), HTTP methods for actions (GET, POST, DELETE). | REST API, all web apps |
| **API endpoints/routes** | Specific URLs that do specific things. `GET /recipes` returns all recipes. `POST /recipes` creates one. Each route is a function in your code. | All web apps |
| **HTTP methods** | GET (read data), POST (create data), PUT (update data), DELETE (remove data). Same URL, different action. | REST API, all web apps |
| **localhost** | Means "this computer." When you visit `localhost:8000`, you're connecting to a server running on your own machine, not the internet. | All web apps |
| **Ports** | Like apartment doors. Each server picks a port number to listen on (we used 8000). Only one server can use a port at a time. | All web apps |
| **API keys** | Secret passwords that identify you to an API service. Stored in environment variables, never in code. | CLI Chatbot, Park Planner, AI Journal, Blog Agents, Knowledge Base |
| **Environment variables** | Settings stored outside your code (in `~/.zshrc`). Your API key lives here so it's never exposed in your project files. | CLI Chatbot and all Anthropic API projects |
| **JSON responses** | When an API sends data back, it comes as JSON. Your browser or app then takes that JSON and displays it nicely. | All API projects |
| **Status codes** | Numbers that tell you what happened. 200 = success, 201 = created, 400 = bad request, 404 = not found, 500 = server error. | REST API, all web apps |

---

## AI & LLM Concepts

| Skill | What It Is | Projects Used In |
|-------|-----------|-----------------|
| **Anthropic API** | The service that lets you send messages to Claude programmatically. You send a request with a message, Claude sends back a response. | CLI Chatbot, Park Planner, AI Journal, Blog Agents, Knowledge Base |
| **System prompts** | Instructions you give Claude before the conversation starts. Defines its personality and behavior — like "you are a national park expert" or "you are a pirate." | CLI Chatbot, Park Planner, AI Journal, Blog Agents |
| **Conversation history** | A list of all messages sent back and forth. Sent with every API request so Claude "remembers" the conversation. Lives in memory, lost when you close the app. | CLI Chatbot, Park Planner |
| **Multi-agent pipelines** | Chaining multiple Claude calls together, each with a different role (researcher → outliner → writer → editor). Produces better results than one big prompt. | Blog Agents |
| **RAG (Retrieval-Augmented Generation)** | Before asking Claude a question, search your own documents for relevant info and include it in the prompt. Claude answers based on YOUR data, not just general knowledge. | Knowledge Base |
| **Chunking** | Splitting large documents into smaller pieces (~500 words) so you can search them and send only the relevant parts to Claude. | Knowledge Base |
| **Keyword search (TF-IDF)** | Finding relevant document chunks by matching words from your question. Words that appear in fewer chunks are weighted higher because they're more distinctive. | Knowledge Base |

---

## Authentication & Security

| Skill | What It Is | Projects Used In |
|-------|-----------|-----------------|
| **Password hashing** | Scrambling passwords before storing them. A one-way transformation — you can check if a password matches but can't reverse it. Never store plain text passwords. | Task Planner |
| **JWT (JSON Web Tokens)** | A token (like a concert wristband) given to you when you log in. Your browser sends it with every request to prove who you are without re-sending your password. Expires after a set time. | Task Planner |
| **User authentication** | The full login system — registering accounts, verifying passwords, issuing tokens, checking tokens on every request. | Task Planner |

---

## Web Scraping

| Skill | What It Is | Projects Used In |
|-------|-----------|-----------------|
| **Web scraping** | Fetching a web page and extracting data from it programmatically. Like reading a page but with code instead of eyes. | Recipe Manager |
| **JSON-LD** | Structured data that recipe websites embed in their HTML. A standardized format that makes scraping recipe data reliable. | Recipe Manager |
| **URL fetching** | Using Python to download a web page's content, like visiting a URL in your browser but from code. | Recipe Manager, Knowledge Base |

---

## Developer Tools & Workflow

| Skill | What It Is | Projects Used In |
|-------|-----------|-----------------|
| **Virtual environments (venv)** | A private bubble of Python packages for each project. Prevents conflicts between projects that need different versions of the same package. Created with `python3 -m venv venv`. | All projects |
| **requirements.txt** | A shopping list of packages a project needs. Anyone can run `pip install -r requirements.txt` to get the same setup you have. | All projects |
| **pip** | Python's package installer. Downloads and installs libraries from the internet. `pip install fastapi` grabs FastAPI and all its dependencies. | All projects |
| **VS Code** | A code editor (IDE) with color-coded syntax, error detection, built-in terminal, and file browsing. Way better than TextEdit for reading and writing code. | All projects (started using mid-way) |
| **Terminal/CLI** | The text-based interface for running commands, navigating folders, and starting servers. Where you run `python3 app.py` and `pip install`. | All projects |
| **Project structure** | Organizing code into folders: `src/` for source code, `static/` for web files, `tests/` for tests. `__init__.py` makes folders into Python packages. | All projects |
| **Server-Sent Events (SSE)** | A way for a server to send multiple updates over a single connection. Used to show real-time progress as each agent finishes in the blog pipeline. | Blog Agents |

---

## Python Fundamentals (freeCodeCamp Course)

| Concept | What It Is |
|---------|-----------|
| **Variables** | Named containers for storing data. `name = "Chris"` |
| **Data types** | Different kinds of data — strings (text), integers (whole numbers), floats (decimals), booleans (True/False) |
| **Lists** | Ordered collections you can add to and remove from. `["pasta", "tacos", "pizza"]` |
| **Dictionaries** | Key-value pairs. `{"name": "Tacos", "rating": 5}` — look things up by key |
| **Tuples** | Like lists but can't be changed after creation. Used for data that shouldn't be modified |
| **Functions** | Reusable blocks of code. Define once with `def`, call many times |
| **If statements** | Make decisions in code. `if rating > 4: print("Great recipe!")` |
| **For loops** | Do something for each item in a collection. "For each recipe in the list, print its name" |
| **While loops** | Keep doing something as long as a condition is true |
| **Classes & objects** | Blueprints for creating things. A Recipe class defines what a recipe looks like, each actual recipe is an object |
| **Inheritance** | One class can be based on another, getting all its features plus new ones |
| **Try/except** | Error handling. "Try this, and if it breaks, do this instead of crashing" |
| **File reading/writing** | Opening files to read their contents or write new data to them |
| **Modules & imports** | Using code from other files. `import json` loads the JSON tools |
| **Comments** | Notes in your code that Python ignores. For humans reading the code |

---

## Projects Completed

| # | Project | Type | Key Skills |
|---|---------|------|-----------|
| 1 | Weather Dashboard | Web page | HTML, CSS, API calls, JSON |
| 2 | Recipe Manager | CLI app | Python, SQLite, Typer, Rich, web scraping |
| 3 | REST API Server | API | FastAPI, HTTP methods, REST conventions |
| 4 | CLI Chatbot | Terminal app | Anthropic API, conversation history |
| 5 | National Park Planner | Web app | FastAPI, Anthropic API, system prompts |
| 6 | Stock Dashboard | Web app | yfinance, Chart.js, data visualization |
| 7 | Task Planner | Web app | Auth, JWT, password hashing, drag & drop |
| 8 | AI Journal | Web app | Anthropic API, mood tracking, Chart.js |
| 9 | Blog Agent Pipeline | Web app | Multi-agent, SSE, SQLite |
| 10 | Knowledge Base (RAG) | Web app | RAG, chunking, search, document upload |

*Plus 10 earlier projects from the original 20-project list (Mad Libs through Habit Tracker range)*

---

## Next Up
- **Phase 2**: Prompt Engineering & LLM Basics (Months 3–4)
- **Phase 3**: LLM App Development — tool calling, streaming, MCP (Months 5–6)
- **Anthropic Courses**: Continue "Building with the Claude API"
- **Git/GitHub**: Version control and backing up projects
- **Reading code**: Working through existing project files to understand Python in context

---

*Last updated: March 2026*
