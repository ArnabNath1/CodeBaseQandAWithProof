import os
import json
import zipfile
import tempfile
import shutil
import sqlite3
import re
import time
import httpx
from pathlib import Path
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

from codebase_parser import parse_codebase, fetch_github_repo
from llm_handler import ask_llm_with_context, check_llm_health
from db import init_db, save_qa, get_recent_qas, get_all_tags, get_qa_by_id, check_db_health

app = FastAPI(title="Codebase Q&A with Proof", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for current codebase session
current_codebase: dict = {}

init_db()


# ─── Models ───────────────────────────────────────────────────────────────────

class QuestionRequest(BaseModel):
    question: str
    tags: Optional[List[str]] = []

class GitHubRequest(BaseModel):
    repo_url: str


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Status page - checks backend, DB, and LLM connection."""
    db_ok, db_msg = check_db_health()

    llm_ok, llm_msg = await check_llm_health()

    return {
        "backend": {"status": "ok", "message": "FastAPI running"},
        "database": {"status": "ok" if db_ok else "error", "message": db_msg},
        "llm": {"status": "ok" if llm_ok else "error", "message": llm_msg},
        "codebase_loaded": len(current_codebase) > 0,
        "file_count": len(current_codebase),
    }


# ─── Upload ZIP ───────────────────────────────────────────────────────────────

@app.post("/api/upload")
async def upload_zip(file: UploadFile = File(...)):
    """Upload a ZIP file of a codebase."""
    global current_codebase

    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip files are supported.")

    # 50 MB limit
    contents = await file.read()
    if len(contents) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 50 MB.")

    tmp_dir = tempfile.mkdtemp()
    zip_path = os.path.join(tmp_dir, "upload.zip")

    try:
        with open(zip_path, "wb") as f:
            f.write(contents)

        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(tmp_dir)

        current_codebase = parse_codebase(tmp_dir, source_name=file.filename)

        return {
            "message": f"Codebase loaded: {len(current_codebase)} files indexed",
            "file_count": len(current_codebase),
            "files": list(current_codebase.keys())[:50],
            "source": file.filename,
        }
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Invalid ZIP file.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing ZIP: {str(e)}")
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ─── GitHub Repo ──────────────────────────────────────────────────────────────

@app.post("/api/github")
async def load_github(req: GitHubRequest):
    """Fetch a public GitHub repo and index it."""
    global current_codebase

    url = req.repo_url.strip()
    # Validate GitHub URL
    if not re.match(r"https?://github\.com/[\w\-]+/[\w\-\.]+", url):
        raise HTTPException(status_code=400, detail="Invalid GitHub URL. Use format: https://github.com/owner/repo")

    try:
        current_codebase = await fetch_github_repo(url)
        return {
            "message": f"GitHub repo loaded: {len(current_codebase)} files indexed",
            "file_count": len(current_codebase),
            "files": list(current_codebase.keys())[:50],
            "source": url,
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error loading GitHub repo: {str(e)}")


# ─── Ask Question ─────────────────────────────────────────────────────────────

@app.post("/api/ask")
async def ask_question(req: QuestionRequest):
    """Ask a question about the loaded codebase."""
    global current_codebase

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    if not current_codebase:
        raise HTTPException(
            status_code=400,
            detail="No codebase loaded. Please upload a ZIP or connect a GitHub repo first."
        )

    try:
        result = await ask_llm_with_context(req.question, current_codebase)

        # Save to DB
        qa_id = save_qa(
            question=req.question,
            answer=result["answer"],
            snippets=json.dumps(result["snippets"]),
            tags=json.dumps(req.tags or []),
            source=result.get("source", ""),
        )

        return {
            "id": qa_id,
            "question": req.question,
            "answer": result["answer"],
            "snippets": result["snippets"],
            "tags": req.tags or [],
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")


# ─── History ──────────────────────────────────────────────────────────────────

@app.get("/api/history")
async def get_history(search: Optional[str] = None, tag: Optional[str] = None):
    """Get last 10 Q&As with optional search and tag filter."""
    qas = get_recent_qas(limit=10, search=search, tag=tag)
    return {"history": qas}


@app.get("/api/history/{qa_id}")
async def get_single_qa(qa_id: int):
    qa = get_qa_by_id(qa_id)
    if not qa:
        raise HTTPException(status_code=404, detail="Q&A not found.")
    return qa


@app.get("/api/tags")
async def get_tags():
    """Get all unique tags used."""
    return {"tags": get_all_tags()}


# ─── Current files ────────────────────────────────────────────────────────────

@app.get("/api/files")
async def list_files():
    """List all files in the current loaded codebase."""
    if not current_codebase:
        return {"files": [], "message": "No codebase loaded"}
    return {
        "files": list(current_codebase.keys()),
        "file_count": len(current_codebase),
    }


@app.get("/api/files/{file_path:path}")
async def get_file_content(file_path: str):
    """Get content of a specific file."""
    if file_path not in current_codebase:
        raise HTTPException(status_code=404, detail="File not found in loaded codebase.")
    content = current_codebase[file_path]
    lines = content.split("\n")
    return {
        "path": file_path,
        "content": content,
        "line_count": len(lines),
    }


# ─── Refactor Suggestions ─────────────────────────────────────────────────────

@app.post("/api/refactor")
async def suggest_refactor(req: QuestionRequest):
    """Generate refactor suggestions for a specific file or topic."""
    if not current_codebase:
        raise HTTPException(status_code=400, detail="No codebase loaded.")

    question = f"Generate specific refactor suggestions for: {req.question}. Include file paths, line numbers, and concrete code improvements."
    try:
        result = await ask_llm_with_context(question, current_codebase, mode="refactor")
        return {
            "suggestions": result["answer"],
            "snippets": result["snippets"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
