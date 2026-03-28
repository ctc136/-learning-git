# Personal Finance App

A full-stack personal finance tracker built with Node.js + Express + SQLite on the backend and React + Recharts on the frontend.

## Quick Start

### Backend

```bash
cd backend
npm install
npm start
```

Runs on http://localhost:3001

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173

## Features

- **Dashboard** — Summary cards, income vs expenses bar chart, spending pie chart, net worth line chart, recent transactions, top categories
- **Transactions** — Search, filter by account/category/date, inline category editing, pagination
- **Import** — Drag & drop CSV/OFX/QFX file upload with duplicate detection and auto-categorization
- **Categories** — Full CRUD with drag-and-drop rule management between categories
- **Budgets** — Monthly budget tracking with progress bars (green/yellow/red)
- **Net Worth** — Manual snapshots with editable history and line chart
- **PDF Export** — One-click dashboard export via jspdf + html2canvas

## Supported Import Formats

- **CSV**: Auto-detects date, description/memo, amount/debit/credit columns
- **OFX/QFX**: Parses STMTTRN elements (works with most US bank exports)

## Tech Stack

- Backend: Node.js, Express, better-sqlite3, csv-parse, multer
- Frontend: React 18, Vite, Recharts, react-beautiful-dnd, axios, jspdf, html2canvas
