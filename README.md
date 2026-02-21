# CodeProof — Codebase Q&A with Proof

Ask natural-language questions about any codebase and get answers backed by **exact file paths, line ranges, and code snippets**.

---

## 🚀 Quick Start

### Requirements
- Python 3.9+
- Node.js 18+
- A Groq API key (free at [groq.com](https://console.groq.com))

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

# Copy and fill in your Groq API key
cp .env.example .env
# Edit .env and set GROQ_API_KEY=your_key_here
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

To keep the app live for review:

1. **Frontend**: Can be hosted on **Vercel**, **Netlify**, or **Cloudflare Pages**.
   - Set `VITE_API_URL` environment variable to your backend URL.
2. **Backend**: Can be hosted on **Render**, **Railway**, or **Fly.io**.
   - Create a Web Service and set `GROQ_API_KEY`.
   - Ensure the `qa_history.db` is stored on a persistent volume if you want history to survive restarts.
3. **Database**: The app uses SQLite for simplicity, which works on persistent disks. For serverless backends like Vercel Functions, consider switching to a hosted PostgreSQL (e.g., Supabase or Neon) and updating `db.py`.

---


## ✅ What's Done

- **ZIP Upload** — drag-and-drop or click to upload a ZIP (up to 50 MB); indexes up to 300 source files
- **GitHub Repo Loading** — paste any public GitHub repo URL; fetches files via GitHub API
- **Natural Language Q&A** — ask any question about the codebase (auth, retries, routing, etc.)
- **Proof with snippets** — every answer cites file paths + line ranges + the actual code
- **Code Snippet Viewer** — collapsible inline code viewer with copy button
- **Tagging** — add tags to each Q&A for future reference
- **History** — last 10 Q&As persisted in SQLite; searchable by keyword and tag
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
  db.py            SQLite layer
```

## 🔑 Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GROQ_API_KEY` | `backend/.env` | Your Groq API key |
| `VITE_API_URL` | `frontend/.env` | Backend URL (default: `http://localhost:8000`) |
