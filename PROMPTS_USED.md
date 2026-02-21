# Prompts Used During Development

This file records the prompts given to the AI coding agent (Antigravity) during the development of CodeProof.

---

## Session 1 — Initial Build

### Prompt 1
> Codebase Q&A with Proof. Build a web app where I can:
> - upload a zip of a small codebase (or connect a public GitHub repo URL)
> - ask questions like "Where is auth handled?" or "How do retries work?"
> - get an answer with: file paths + line ranges (or code snippets), links to the referenced files in the UI, show the retrieved code snippets separately
> - save last 10 Q&As
> Make it your own: for example, add search, tags, or "generate refactor suggestions".
>
> What to include:
> - A simple home page with clear steps
> - A status page, that shows health of backend, database, and llm connection.
> - Basic handling for empty/wrong input
> - A short README: how to run, what is done, what is not done
> - A short AI_NOTES.md: what you used AI for, and what you checked yourself. Which LLM and provider does your app use and why.
> - Put your name and resume in ABOUTME.md
> - A PROMPTS_USED.md, with records of your prompts used for app development.
>
> Rules for Github repo: Do not put API keys or passwords in the code. Use a .env.example file for settings.

### Prompt 2
> Create a virtual environment in the backend, activate it and then continue

---

*Note: Agent responses, API keys, and internal tool calls are not included per the instructions.*
