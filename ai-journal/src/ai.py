"""AI features — reflections and mood analysis powered by Claude."""

import os
from anthropic import Anthropic

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
MODEL = "claude-sonnet-4-20250514"

client = None
if API_KEY:
    client = Anthropic(api_key=API_KEY)


def get_reflection(entry_content: str, mood: str) -> str:
    """Generate a short, thoughtful reflection on a journal entry."""
    if not client:
        return "AI reflections unavailable — set your ANTHROPIC_API_KEY."

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=300,
            system="""You are a thoughtful, warm journal companion. When someone shares a 
journal entry with you, write a brief reflection (2-3 sentences max). 
Be empathetic and observant — notice what they seem to care about, 
acknowledge their feelings, and gently offer a positive or thoughtful 
perspective. Never be preachy or give unsolicited advice. 
Keep it short and genuine.""",
            messages=[{
                "role": "user",
                "content": f"Today's mood: {mood}\n\nJournal entry:\n{entry_content}"
            }],
        )
        return response.content[0].text
    except Exception as e:
        return f"Couldn't generate reflection: {str(e)}"


def get_weekly_summary(entries: list[dict]) -> str:
    """Generate a summary of the past week's entries."""
    if not client:
        return "AI summaries unavailable — set your ANTHROPIC_API_KEY."

    if not entries:
        return "No entries to summarize yet. Keep writing!"

    try:
        entries_text = "\n\n".join(
            f"**{e['date']}** (mood: {e['mood']}, {e['mood_score']}/5):\n{e['content']}"
            for e in entries
        )

        response = client.messages.create(
            model=MODEL,
            max_tokens=500,
            system="""You are a thoughtful journal companion reviewing someone's recent entries.
Write a brief weekly summary that:
1. Identifies the main themes or topics they wrote about
2. Notes their overall mood trend (improving, steady, dipping)
3. Highlights one positive thing you noticed
Keep it warm, brief (3-4 sentences), and genuine. Don't be preachy.""",
            messages=[{
                "role": "user",
                "content": f"Here are my journal entries from the past week:\n\n{entries_text}"
            }],
        )
        return response.content[0].text
    except Exception as e:
        return f"Couldn't generate summary: {str(e)}"
