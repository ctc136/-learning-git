# Git Cheatsheet for Beginners

## First-Time Setup
```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

## Starting a Project
```bash
git init                    # Start tracking a folder with git
git clone <url>             # Download an existing repo from GitHub
```

## The Basic Daily Workflow
```bash
git status                  # See what files have changed
git add <filename>          # Stage a specific file
git add .                   # Stage all changed files
git commit -m "message"     # Save a snapshot with a description
git push                    # Upload your commits to GitHub
git pull                    # Download the latest changes from GitHub
```

## Viewing History
```bash
git log                     # Show all past commits
git log --oneline           # Show commits in a compact one-line format
git diff                    # See exactly what changed in your files
```

## Branches
```bash
git branch                  # List all branches
git branch <name>           # Create a new branch
git checkout <name>         # Switch to a branch
git checkout -b <name>      # Create and switch in one step
git merge <name>            # Merge a branch into your current branch
```

## Undoing Things
```bash
git restore <filename>      # Discard unsaved changes to a file
git reset HEAD~1            # Undo the last commit (keeps your changes)
```

## Connecting to GitHub
```bash
git remote add origin <url> # Link your local repo to a GitHub repo
git remote -v               # Show the linked remote URL
git push -u origin main     # Push for the first time and set upstream
```

## Tips
- Commit often with clear messages — future you will be grateful
- `git status` is your best friend; run it constantly
- A commit message should finish the sentence: "This commit will..."
  - Good: `"Add score display to platformer"`
  - Bad: `"stuff"` or `"asdfgh"`
