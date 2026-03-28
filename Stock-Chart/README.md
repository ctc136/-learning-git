# Stock Dashboard 📈

An interactive stock market dashboard that scrapes financial data from Yahoo Finance and displays it with beautiful charts.

## Features

- **Price charts** — interactive line charts with hover tooltips
- **Volume bars** — color-coded green (up day) and red (down day)
- **Company info** — market cap, P/E ratio, 52-week range, sector
- **Compare stocks** — see how multiple stocks performed on one chart
- **Time periods** — switch between 1 month to 5 years of data
- **Quick picks** — popular tickers and comparison groups (Big Tech, Banks, etc.)

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
python3 app.py
```

Then open: **http://localhost:8000**

## How It Works

- `src/scraper.py` — Uses yfinance to fetch stock data from Yahoo Finance
- `app.py` — FastAPI backend that serves the page and provides data endpoints
- `static/index.html` — The dashboard frontend with Chart.js for interactive charts

## Project Structure

```
stock-dashboard/
├── app.py              # Backend server
├── requirements.txt
├── src/
│   ├── __init__.py
│   └── scraper.py      # Yahoo Finance data scraper
└── static/
    └── index.html      # Interactive dashboard
```
