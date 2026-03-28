"""Stock data scraper using yfinance.

yfinance is a Python library that pulls stock data from Yahoo Finance.
It's not technically "scraping" HTML like our recipe scraper — instead it
uses Yahoo's data endpoints to get clean, structured data. But the concept
is the same: go to the internet, grab data, bring it back.
"""

import yfinance as yf
from datetime import datetime, timedelta


def get_stock_history(symbol: str, period: str = "1y") -> dict:
    """Fetch historical stock prices.
    
    Args:
        symbol: Stock ticker like "AAPL", "TSLA", "MSFT"
        period: How far back to look. Options:
                "1mo", "3mo", "6mo", "1y", "2y", "5y", "max"
    
    Returns:
        A dict with dates and prices ready for charting.
    """
    ticker = yf.Ticker(symbol)
    hist = ticker.history(period=period)

    if hist.empty:
        return {"error": f"No data found for '{symbol}'"}

    # Convert to simple lists for JSON/charting
    dates = [d.strftime("%Y-%m-%d") for d in hist.index]
    
    return {
        "symbol": symbol.upper(),
        "dates": dates,
        "open": [round(p, 2) for p in hist["Open"].tolist()],
        "high": [round(p, 2) for p in hist["High"].tolist()],
        "low": [round(p, 2) for p in hist["Low"].tolist()],
        "close": [round(p, 2) for p in hist["Close"].tolist()],
        "volume": hist["Volume"].tolist(),
    }


def get_stock_info(symbol: str) -> dict:
    """Fetch company info and current stats."""
    ticker = yf.Ticker(symbol)
    info = ticker.info

    return {
        "symbol": symbol.upper(),
        "name": info.get("shortName", symbol.upper()),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "market_cap": info.get("marketCap", 0),
        "pe_ratio": info.get("trailingPE", None),
        "dividend_yield": info.get("dividendYield", None),
        "fifty_two_week_high": info.get("fiftyTwoWeekHigh", None),
        "fifty_two_week_low": info.get("fiftyTwoWeekLow", None),
        "current_price": info.get("currentPrice", info.get("regularMarketPrice", None)),
        "previous_close": info.get("previousClose", None),
    }


def compare_stocks(symbols: list[str], period: str = "1y") -> list[dict]:
    """Fetch historical data for multiple stocks for comparison.
    
    Returns normalized percentage change data so stocks at different
    price levels can be compared on the same chart.
    """
    results = []
    for symbol in symbols:
        data = get_stock_history(symbol, period)
        if "error" not in data:
            # Normalize to percentage change from first day
            first_close = data["close"][0]
            pct_change = [round(((p - first_close) / first_close) * 100, 2) for p in data["close"]]
            data["pct_change"] = pct_change
            results.append(data)
    return results
