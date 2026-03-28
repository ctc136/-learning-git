"""Settings and configuration."""

from pathlib import Path

# Point to your existing recipe manager database
# This is the same DB your CLI app uses, so they share the same recipes!
DB_PATH = Path.home() / ".recipe-manager" / "recipes.db"

# Server settings
HOST = "127.0.0.1"  # localhost — only your computer can access it
PORT = 8000
