# Terminal Chatbot

A command-line chatbot powered by Claude. Chat with AI right from your terminal.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Make sure your API key is set:
```bash
echo $ANTHROPIC_API_KEY
```

## Usage

```bash
python -m src
```

### Commands
- Type a message and press Enter to chat
- `clear` — start a fresh conversation
- `quit` or `exit` — leave the chatbot

## Customization

Edit `src/config.py` to change:
- **SYSTEM_PROMPT** — change Claude's personality and behavior
- **MODEL** — switch to a different Claude model
- **MAX_TOKENS** — make responses longer or shorter
