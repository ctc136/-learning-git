"""Chatbot settings."""

import os

# Your API key — reads from the environment variable we set up
API_KEY = os.environ.get("ANTHROPIC_API_KEY")

# Which Claude model to use
# "claude-sonnet-4-20250514" is fast and smart — great for a chatbot
MODEL = "claude-sonnet-4-20250514"

# System prompt — this tells Claude how to behave
# Change this to whatever personality you want!
SYSTEM_PROMPT = """You are a helpful, friendly assistant running in a terminal chatbot. 
Keep your responses concise since this is a terminal — aim for a few paragraphs max 
unless the user asks for something detailed. Be conversational and natural."""

# Max tokens per response (how long Claude's replies can be)
# 1024 tokens is roughly 750 words — plenty for a chatbot
MAX_TOKENS = 1024
