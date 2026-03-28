from .main import app
import uvicorn
from .config import HOST, PORT

print("
🍳 Recipe API Server starting...")
print(f"   Open your browser to: http://{HOST}:{PORT}/docs
")
uvicorn.run(
    "src.main:app",
    host=HOST,
    port=PORT,
    reload=True,
)
