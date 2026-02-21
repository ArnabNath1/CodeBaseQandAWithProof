# AI Notes — CodeProof

## What AI was used for

This project was built with the assistance of **Antigravity (Google DeepMind)**, an AI coding agent.

### LLM Provider & Model

| Layer | Provider | Model | Why |
|---|---|---|---|
| **Q&A / Refactor** | [Groq](https://groq.com) | `llama-3.3-70b-versatile` | Ultra-fast inference (100+ tok/s); free tier; 128k context; excellent code reasoning |
| **Code generation** (this app) | Google DeepMind Antigravity | Internal agent model | Agentic IDE pair programmer |

**Why Groq + LLaMA 3.3-70B?**
- Groq's hardware (LPU) is the fastest LLM inference available publicly
- LLaMA 3.3-70B has strong code understanding and follows structured output instructions reliably
- Free tier is sufficient for demo use without a credit card
- The 128k token context means we can feed many files at once

---

## What AI generated

- All backend Python files (`main.py`, `codebase_parser.py`, `llm_handler.py`, `db.py`)
- All frontend React files (pages, components, context, API client)
- CSS design system (`index.css`)
- Docker/docker-compose setup
- All documentation files (README, AI_NOTES, ABOUTME, PROMPTS_USED)

## What I (the AI agent) verified / checked

- **Backend startup** — ran `uvicorn main:app --reload` and confirmed no import errors
- **Dependency versions** — pinned specific compatible versions in `requirements.txt`
- **Regex correctness** — tested the LLM JSON extraction regex with sample outputs
- **File filtering** — verified `SKIP_PATTERNS` skips `node_modules`, `.git`, `__pycache__`
- **Error paths** — confirmed 400/404/500 errors return JSON `{ detail: "..." }` matching FastAPI default
- **CORS** — set `allow_origins=["*"]` for development; should be restricted in production

## What was NOT AI-verified

- **LLM output quality** — the snippet JSON parsing relies on the LLM following the prompt format; real-world testing with varied repos is needed
- **GitHub API rate limits** — unauthenticated requests are limited to 60/hour; a token system was not implemented
- **Production hardening** — no rate limiting, auth, or input sanitization for production deployment
