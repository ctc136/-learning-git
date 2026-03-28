"""Multi-agent blog writing pipeline.

This is the core concept of the project. Instead of one big prompt that
says "write me a blog post," we break the work into four specialists:

1. RESEARCHER — gathers key points and facts about the topic
2. OUTLINER — takes the research and creates a structured outline
3. WRITER — takes the outline and writes the full blog post
4. EDITOR — reviews the draft and polishes it

Each agent is just a Claude API call with a different system prompt
(personality/instructions). The output of one becomes the input of
the next — like passing a baton in a relay race.

Why is this better than one prompt? For the same reason a team of
specialists often beats one generalist. The researcher focuses ONLY
on gathering info. The writer focuses ONLY on making it sound good.
The editor focuses ONLY on catching mistakes. Each step is simpler
and more focused, so the final result is usually better.
"""

import os
from anthropic import Anthropic

API_KEY = os.environ.get("ANTHROPIC_API_KEY")
MODEL = "claude-sonnet-4-20250514"

client = None
if API_KEY:
    client = Anthropic(api_key=API_KEY)


# ---------------------------------------------------------------------------
# Agent definitions — each has a name, emoji, and system prompt
# ---------------------------------------------------------------------------

AGENTS = [
    {
        "name": "Researcher",
        "emoji": "🔍",
        "description": "Gathers key points, facts, and angles on the topic",
        "system": """You are a Research Agent. Your ONLY job is to research a topic 
and produce a structured set of key points, interesting facts, relevant data, 
and different angles that a blog writer could use.

Format your output as:
- MAIN POINTS: 5-7 key points about the topic
- INTERESTING FACTS: 3-4 facts that would make the blog engaging
- ANGLES: 2-3 different perspectives or approaches a writer could take
- TARGET AUDIENCE: Who would find this interesting and why

Be thorough but concise. You are NOT writing the blog — you are gathering 
the raw materials for the next agent.""",
    },
    {
        "name": "Outliner",
        "emoji": "📋",
        "description": "Creates a structured outline from the research",
        "system": """You are an Outline Agent. You receive research notes and your ONLY 
job is to create a clear, structured blog post outline.

Create an outline with:
- A compelling TITLE (2-3 options)
- HOOK: An attention-grabbing opening idea (1-2 sentences describing the approach)
- SECTIONS: 4-6 sections, each with:
  - Section heading
  - 2-3 bullet points of what to cover
  - Key data or facts to include (pulled from the research)
- CONCLUSION: What the takeaway should be
- TONE: Recommend the writing tone (conversational, authoritative, humorous, etc.)

Make the outline detailed enough that a writer could follow it without 
seeing the original research. You are NOT writing the blog — you are 
creating the blueprint.""",
    },
    {
        "name": "Writer",
        "emoji": "✍️",
        "description": "Writes the full blog post from the outline",
        "system": """You are a Writing Agent. You receive a blog outline and your ONLY 
job is to write the full blog post.

Rules:
- Follow the outline closely but add your own flair
- Write in a conversational, engaging tone unless the outline specifies otherwise
- Use the title from the outline (pick the best one if multiple options)
- Include an attention-grabbing opening
- Use subheadings for each section
- Keep paragraphs short (2-4 sentences) for readability
- Aim for 600-900 words
- End with a strong conclusion
- Do NOT include any meta-commentary — just write the blog post itself

Write like a human blogger, not a corporate content mill.""",
    },
    {
        "name": "Editor",
        "emoji": "✨",
        "description": "Reviews and polishes the draft",
        "system": """You are an Editor Agent. You receive a blog post draft and your 
ONLY job is to review and improve it.

Your process:
1. First, provide a brief EDITORIAL NOTES section with:
   - What works well (1-2 points)
   - What you changed and why (2-4 points)
   
2. Then provide the FINAL VERSION — the complete, polished blog post.

Things to look for and fix:
- Weak or generic opening → make it hook the reader immediately
- Awkward phrasing or jargon → make it flow naturally
- Passive voice → switch to active where possible
- Filler words and padding → tighten the prose
- Weak transitions between sections → smooth them out
- Ending that fizzles → make it memorable

Keep the author's voice and style — don't rewrite everything. 
Just make it the best version of itself.""",
    },
]


def run_agent(agent_index: int, input_text: str, topic: str) -> dict:
    """Run a single agent and return its output.
    
    Args:
        agent_index: Which agent to run (0-3)
        input_text: The input from the previous agent (or the original topic)
        topic: The original topic (for context)
    
    Returns:
        Dict with agent name, emoji, and output text
    """
    if not client:
        return {
            "name": AGENTS[agent_index]["name"],
            "emoji": AGENTS[agent_index]["emoji"],
            "output": "API key not set. Please set ANTHROPIC_API_KEY.",
            "error": True,
        }

    agent = AGENTS[agent_index]

    # Build the message — first agent gets the topic, rest get previous output
    if agent_index == 0:
        user_message = f"Research this blog topic thoroughly: {topic}"
    else:
        user_message = (
            f"Original blog topic: {topic}\n\n"
            f"Here is the output from the previous step:\n\n{input_text}"
        )

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=2000,
            system=agent["system"],
            messages=[{"role": "user", "content": user_message}],
        )

        return {
            "name": agent["name"],
            "emoji": agent["emoji"],
            "output": response.content[0].text,
            "error": False,
        }
    except Exception as e:
        return {
            "name": agent["name"],
            "emoji": agent["emoji"],
            "output": f"Error: {str(e)}",
            "error": True,
        }


def get_agent_info() -> list[dict]:
    """Return info about all agents for the frontend."""
    return [
        {
            "name": a["name"],
            "emoji": a["emoji"],
            "description": a["description"],
        }
        for a in AGENTS
    ]
