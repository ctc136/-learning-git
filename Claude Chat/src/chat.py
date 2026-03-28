"""Terminal chatbot powered by Claude."""

import sys

from anthropic import Anthropic
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel

from .config import API_KEY, MAX_TOKENS, MODEL, SYSTEM_PROMPT

console = Console()


def check_api_key() -> None:
    """Make sure the API key is set before we try to use it."""
    if not API_KEY:
        console.print(
            "\n[bold red]Error: ANTHROPIC_API_KEY not found![/bold red]\n"
            "Run this command to set it:\n"
            '  export ANTHROPIC_API_KEY="your-key-here"\n'
        )
        sys.exit(1)


def display_welcome() -> None:
    """Show a welcome message when the chatbot starts."""
    welcome = (
        "[bold cyan]Terminal Chatbot[/bold cyan]\n"
        f"[dim]Powered by {MODEL}[/dim]\n\n"
        "Type your message and press Enter to chat.\n"
        "Type [bold]quit[/bold] or [bold]exit[/bold] to leave.\n"
        "Type [bold]clear[/bold] to start a fresh conversation."
    )
    console.print(Panel(welcome, border_style="cyan", padding=(1, 2)))
    console.print()


def chat() -> None:
    """Main chat loop."""
    check_api_key()
    display_welcome()

    # Create the Anthropic client — this is what talks to the API
    client = Anthropic(api_key=API_KEY)

    # Conversation history — this is how Claude "remembers" what you've talked about.
    # Each message is a dict with "role" (either "user" or "assistant") and "content".
    # We send the ENTIRE history with every request so Claude has the full context.
    history = []

    while True:
        # Get input from the user
        try:
            user_input = console.input("[bold green]You:[/bold green] ")
        except (KeyboardInterrupt, EOFError):
            # Handle Ctrl+C or Ctrl+D gracefully
            console.print("\n\n[dim]Goodbye![/dim]\n")
            break

        # Check for special commands
        command = user_input.strip().lower()
        if command in ("quit", "exit"):
            console.print("\n[dim]Goodbye![/dim]\n")
            break
        if command == "clear":
            history = []
            console.print("[yellow]Conversation cleared — starting fresh.[/yellow]\n")
            continue
        if not command:
            continue

        # Add the user's message to the history
        history.append({"role": "user", "content": user_input})

        # Send the request to Claude
        try:
            console.print()  # blank line before response
            with console.status("[cyan]Thinking...[/cyan]", spinner="dots"):
                response = client.messages.create(
                    model=MODEL,
                    max_tokens=MAX_TOKENS,
                    system=SYSTEM_PROMPT,
                    messages=history,
                )

            # Pull out Claude's reply
            assistant_message = response.content[0].text

            # Add Claude's reply to the history so it remembers next time
            history.append({"role": "assistant", "content": assistant_message})

            # Display it nicely with markdown formatting
            console.print("[bold cyan]Claude:[/bold cyan]")
            console.print(Markdown(assistant_message))
            console.print()

        except Exception as e:
            console.print(f"\n[bold red]Error: {e}[/bold red]\n")
            # Remove the failed message from history so we can try again
            history.pop()
