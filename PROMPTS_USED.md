# Prompts Used During Development

This file records the evolutionary prompts given to the AI coding assistant during the creation of **CodeProof**.

---

## 🏗️ Phase 1: Core Foundation

### Project Scaffolding
> Build a full-stack Codebase Q&A application named "CodeProof". 
> - **Frontend**: React + Vite + CSS (Glassmorphism design).
> - **Backend**: FastAPI (Python).
> - **Core Logic**: Support ZIP uploads and GitHub URL indexing.
> - **AI Integration**: Use Groq (Llama 3.3 70B) for speed and quality. Cites exact file paths and line ranges.
> - **Features**: Searchable history, tagging system, and "AI Refactor Suggestions" mode.

### Database Initialization
> Set up an SQLite database using the `sqlite3` library to store the last 10 Q&A pairs. Include fields for `question`, `answer`, `snippets` (as JSON), and `tags`.

---

## 🎨 Phase 2: User Experience & Design

### UI Design System
> Create a comprehensive CSS design system in `index.css` featuring a premium dark theme, glassmorphism cards, vibrant accents (`#6366f1`), and smooth micro-animations for buttons and transitions. Use Google Fonts (Inter and Outfit).

### Component Orchestration
> Develop a tabbed `UploadPanel` for switching between ZIP and GitHub modes. Build a `SnippetCard` component that makes code blocks collapsible and includes a "Copy Code" button.

---

## 🔌 Phase 3: Cloud Pivot & Infrastructure

### Supabase Integration
> I want to deploy this. Replace the SQLite implementation with Supabase (Postgres). 
> - Install the `supabase-py` client.
> - Update `db.py` to handle JSONB columns for snippets and tags.
> - Update the "Status Page" to verify the Supabase connection health.

### Dockerization
> Create a `docker-compose.yml` and `Dockerfile`s for both services. The frontend should use a multi-stage Nginx build.

---

## 🛠️ Phase 4: Production Hardening

### Github API Rate Limiting
> When indexing a public repo, I'm hitting the 60 calls/hour limit. Update the backend to accept an optional `GITHUB_TOKEN` from the environment to increase the limit to 5000 calls/hour.

### Render & Vercel Fixes
> - The Render build is failing because it's defaulting to Python 3.14. Force Python 3.11 using `runtime.txt`.
> - The frontend is getting 404s because of a double slash (//api) in the URL. Sanitize the `VITE_API_URL` to remove trailing slashes.

---

## 📄 Phase 5: Documentation & Presentation

### README and AI Notes
> Finalize the documentation. Write a `README.md` with hosting instructions for Render/Vercel. Create `AI_NOTES.md` explaining why we chose Groq (LPU speed) and Llama 3.3. Update `ABOUTME.md` with my resume placeholder.
