"""Recipe API Server — main entry point.

This file creates the FastAPI app and starts the server.
Run it with: python -m src.main
"""

import uvicorn
from fastapi import FastAPI

from .config import HOST, PORT
from .routes import router

# Create the app
app = FastAPI(
    title="Recipe API",
    description="A REST API for your recipe collection. "
                "Connected to the same database as your CLI recipe manager!",
    version="1.0.0",
)

# Attach all the routes (endpoints) to the app
app.include_router(router)


# A simple welcome message at the root URL
@app.get("/")
def root():
    return {
        "message": "Welcome to the Recipe API!",
        "docs": "Visit /docs to see all available endpoints",
        "recipes": "Visit /recipes to see your recipes",
    }


# Start the server when this file is run directly
if __name__ == "__main__":
    print("\n🍳 Recipe API Server starting...")
    print(f"   Open your browser to: http://{HOST}:{PORT}/docs\n")
    uvicorn.run(
        "src.main:app",
        host=HOST,
        port=PORT,
        reload=True,  # Auto-restarts when you change code
    )
