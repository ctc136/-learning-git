"""Stock Dashboard — Web App Backend.

Serves the interactive dashboard and provides API endpoints
for fetching stock data.

Run with: python3 app.py
Then open: http://localhost:8000
"""

from pathlib import Path

import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from src.scraper import get_stock_history, get_stock_info, compare_stocks

app = FastAPI(title="Stock Dashboard")

# Serve static files
static_dir = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/", response_class=HTMLResponse)
def serve_dashboard():
    """Serve the dashboard page."""
    html_path = Path(__file__).parent / "static" / "index.html"
    return HTMLResponse(content=html_path.read_text())


@app.get("/api/stock/{symbol}")
def stock_history(symbol: str, period: str = Query("1y")):
    """Get historical price data for a stock."""
    data = get_stock_history(symbol, period)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@app.get("/api/info/{symbol}")
def stock_info(symbol: str):
    """Get company info and current stats."""
    try:
        return get_stock_info(symbol)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.get("/api/compare")
def compare(symbols: str = Query(..., description="Comma-separated tickers"), period: str = "1y"):
    """Compare multiple stocks. Pass symbols as comma-separated: AAPL,MSFT,GOOGL"""
    symbol_list = [s.strip().upper() for s in symbols.split(",") if s.strip()]
    if len(symbol_list) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 symbols to compare")
    if len(symbol_list) > 5:
        raise HTTPException(status_code=400, detail="Max 5 symbols at once")
    
    results = compare_stocks(symbol_list, period)
    if not results:
        raise HTTPException(status_code=404, detail="No data found for those symbols")
    return results


if __name__ == "__main__":
    print("\n📈 Stock Dashboard starting...")
    print("   Open your browser to: http://localhost:8000\n")
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
