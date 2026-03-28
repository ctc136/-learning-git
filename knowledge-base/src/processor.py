"""Document processor — reads files and splits them into searchable chunks.

The key concept here is CHUNKING. You can't send an entire 50-page PDF
to Claude in every request — it would be too expensive and too slow.
Instead, we split documents into smaller pieces (chunks), and when you
ask a question, we only send the most relevant chunks.

Think of it like a textbook. Instead of reading the whole book to answer
one question, you check the index, find the relevant pages, and only
read those.
"""

import re
from pathlib import Path
from typing import Optional

import httpx
from pypdf import PdfReader


def read_file(filepath: str) -> str:
    """Read a file and return its text content."""
    path = Path(filepath)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _read_pdf(path)
    elif suffix in (".txt", ".md", ".markdown", ".text"):
        return path.read_text(encoding="utf-8", errors="replace")
    elif suffix in (".html", ".htm"):
        text = path.read_text(encoding="utf-8", errors="replace")
        return _strip_html(text)
    else:
        # Try reading as text
        try:
            return path.read_text(encoding="utf-8", errors="replace")
        except Exception:
            return ""


def read_url(url: str) -> str:
    """Fetch a web page and extract its text content."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                          "AppleWebKit/537.36 (KHTML, like Gecko) "
                          "Chrome/120.0.0.0 Safari/537.36"
        }
        response = httpx.get(url, headers=headers, follow_redirects=True, timeout=15)
        response.raise_for_status()
        return _strip_html(response.text)
    except Exception as e:
        return f"Error fetching URL: {str(e)}"


def _read_pdf(path: Path) -> str:
    """Extract text from a PDF file."""
    try:
        reader = PdfReader(str(path))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n\n"
        return text.strip()
    except Exception as e:
        return f"Error reading PDF: {str(e)}"


def _strip_html(html: str) -> str:
    """Remove HTML tags and extract readable text."""
    # Remove script and style blocks
    text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
    # Remove tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'\n\s*\n', '\n\n', text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks for searching.
    
    Why overlap? If a key sentence falls right at the boundary between
    two chunks, the overlap ensures it appears in at least one complete
    chunk. Without overlap, you might cut a sentence in half and miss
    important context.
    
    Args:
        text: The full text to split
        chunk_size: Target number of words per chunk
        overlap: Number of words to overlap between chunks
    
    Returns:
        List of text chunks
    """
    words = text.split()
    if len(words) <= chunk_size:
        return [text] if text.strip() else []

    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        if chunk.strip():
            chunks.append(chunk)
        start += chunk_size - overlap

    return chunks
