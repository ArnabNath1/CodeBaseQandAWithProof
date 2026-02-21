# CodeProof — Codebase Q&A with Proof

Ask natural-language questions about any codebase and get answers backed by **exact file paths, line ranges, and code snippets**.

---

## 🚀 Quick Start

### Requirements
- Python 3.9+
- Node.js 18+
- A Groq API key (free at [groq.com](https://console.groq.com))
- A Supabase project (free at [supabase.com](https://supabase.com))

### 1. Clone & Configure

```bash
git clone <repo-url>
cd CodeBaseQandAWithProof
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Copy and fill in your keys
cp .env.example .env
# Edit .env and set GROQ_API_KEY, SUPABASE_URL, and SUPABASE_KEY
```

### 3. Database Setup (Supabase)
Run the following SQL in your Supabase SQL Editor to create the history table:

```sql
create table if not exists qa_history (
  id bigint primary key generated always as identity,
  question text not null,
  answer text not null,
  snippets jsonb default '[]'::jsonb,
  tags jsonb default '[]'::jsonb,
  source text default '',
  created_at timestamptz default now()
);
```

### 3. Run Backend

```bash
# From backend/ directory, with venv activated:
uvicorn main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

### 4. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`

---

## 🐳 Docker (One-Command)

```bash
# From project root:
docker-compose up --build
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:8000

---

## 🌐 Hosting

1. **Frontend**: Can be hosted on **Vercel**, **Netlify**, or **Cloudflare Pages**.
   - Set `VITE_API_URL` environment variable to your backend URL.
2. **Backend**: Can be hosted on **Render**, **Railway**, or **Fly.io**.
   - Set `GROQ_API_KEY`, `SUPABASE_URL`, and `SUPABASE_KEY` in the service settings.
3. **Database**: Now using **Supabase (PostgreSQL)**, which is cloud-hosted and persists history regardless of server restarts or deployments.

---


## ✅ What's Done

- **ZIP Upload** — drag-and-drop or click to upload a ZIP (up to 50 MB); indexes up to 300 source files
- **GitHub Repo Loading** — paste any public GitHub repo URL; fetches files via GitHub API
- **Natural Language Q&A** — ask any question about the codebase (auth, retries, routing, etc.)
- **Proof with snippets** — every answer cites file paths + line ranges + the actual code
- **Code Snippet Viewer** — collapsible inline code viewer with copy button
- **Tagging** — add tags to each Q&A for future reference
- **History** — last 10 Q&As persisted in Supabase; searchable by keyword and tag
- **Refactor Suggestions** — AI-generated, file-aware refactor ideas with before/after context
- **Status Page** — health checks for backend, DB, and LLM with auto-refresh
- **Responsive UI** — works on mobile
- **Error handling** — empty/invalid inputs show inline toasts; missing API key handled gracefully

## ❌ What's NOT Done

- **Authentication / multi-user** — single shared session; no user accounts
- **Persistent codebase storage** — codebase is held in memory per server process; re-upload after restart
- **Streaming responses** — answers appear all at once, not word-by-word
- **Private GitHub repos** — GitHub token support not implemented
- **Diff view** — no side-by-side before/after for refactor suggestions
- **Vector search** — uses keyword scoring + LLM context, not embeddings
- **File browser** — no full file-tree UI explorer (only referenced files shown)

---

## 🏗️ Architecture

```
frontend/          React + Vite SPA
  src/
    pages/         HomePage, AskPage, HistoryPage, RefactorPage, StatusPage
    components/    Navbar, UploadPanel, SnippetCard, QACard
    context/       CodebaseContext, ToastContext
    api.js         Fetch wrapper

backend/           FastAPI Python app
  main.py          Routes & app entry point
  codebase_parser.py  ZIP + GitHub repo indexer
  llm_handler.py   Groq API call + context builder
  db.py            Supabase (PostgreSQL) layer
```

## 🔑 Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | `backend/.env` | Your Groq API key |
| `SUPABASE_URL` | `backend/.env` | Your Supabase Project URL |
| `SUPABASE_KEY` | `backend/.env` | Your Supabase Anon Key |
| `GITHUB_TOKEN` | `backend/.env` | (Optional) GitHub Token for higher rate limits |
| `VITE_API_URL` | `frontend/.env` | Backend URL (default: `http://localhost:8000`) |
