"""
LLM handler: Groq-powered Q&A with codebase context.
Uses llama-3.3-70b-versatile for fast, high-quality answers.
"""

import os
import json
import re
import httpx
from typing import Dict, List, Tuple, Optional

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
MODEL = "llama-3.3-70b-versatile"
MAX_CONTEXT_CHARS = 28000   # ~7k tokens of context for files
MAX_SNIPPET_LINES = 60      # max lines per file snippet

def get_api_key():
    return os.getenv("GROQ_API_KEY", "")


# ─── Health Check ─────────────────────────────────────────────────────────────

async def check_llm_health() -> Tuple[bool, str]:
    api_key = get_api_key()
    if not api_key:
        return False, "GROQ_API_KEY not set in environment"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{GROQ_BASE_URL}/models",
                headers={"Authorization": f"Bearer {api_key}"},
            )
            if resp.status_code == 200:
                return True, f"Connected (model: {MODEL})"
            else:
                return False, f"API returned {resp.status_code}"
    except Exception as e:
        return False, f"Connection error: {str(e)}"


# ─── Context Builder ──────────────────────────────────────────────────────────

def _score_file_relevance(path: str, content: str, question: str) -> float:
    """Simple keyword relevance scoring to pick the most relevant files."""
    q_words = set(re.findall(r'\w+', question.lower()))
    score = 0.0

    # Path relevance
    path_lower = path.lower()
    for word in q_words:
        if len(word) > 3 and word in path_lower:
            score += 3.0

    # Content relevance
    content_lower = content.lower()
    for word in q_words:
        if len(word) > 3:
            count = content_lower.count(word)
            score += min(count * 0.5, 5.0)

    # Boost common important files
    important_names = ["auth", "login", "retry", "error", "api", "route", "handler",
                       "middleware", "config", "main", "index", "app", "server",
                       "database", "db", "model", "schema", "util", "helper"]
    for name in important_names:
        if name in path_lower:
            score += 1.0

    return score


def _build_context(codebase: Dict[str, str], question: str) -> Tuple[str, List[dict]]:
    """
    Select the most relevant files and build a context string.
    Returns (context_text, list_of_included_files_with_metadata).
    """
    # Score and sort files
    scored = [
        (path, content, _score_file_relevance(path, content, question))
        for path, content in codebase.items()
    ]
    scored.sort(key=lambda x: x[2], reverse=True)

    context_parts = []
    included_files = []
    total_chars = 0

    for path, content, score in scored:
        if total_chars >= MAX_CONTEXT_CHARS:
            break

        lines = content.split("\n")
        # Truncate very long files
        if len(lines) > MAX_SNIPPET_LINES * 2:
            # Take first MAX_SNIPPET_LINES and last 10
            preview_lines = lines[:MAX_SNIPPET_LINES] + ["... (truncated) ..."] + lines[-10:]
            display_content = "\n".join(preview_lines)
        else:
            display_content = content

        chunk = f"### FILE: {path}\n```\n{display_content}\n```\n"
        if total_chars + len(chunk) > MAX_CONTEXT_CHARS:
            # Include partial
            remaining = MAX_CONTEXT_CHARS - total_chars
            chunk = chunk[:remaining] + "\n...(truncated)\n"

        context_parts.append(chunk)
        included_files.append({
            "path": path,
            "line_count": len(lines),
            "relevance_score": round(score, 2),
        })
        total_chars += len(chunk)

    return "\n".join(context_parts), included_files


# ─── Line Range Extractor ─────────────────────────────────────────────────────

def _extract_line_ranges(content: str, search_text: str, context_lines: int = 5) -> Optional[dict]:
    """Find the line range of a code snippet within file content."""
    if not search_text or not content:
        return None
    lines = content.split("\n")
    search_lines = [l.strip() for l in search_text.strip().split("\n") if l.strip()]
    if not search_lines:
        return None

    # Search for first line of snippet
    for i, line in enumerate(lines):
        if search_lines[0] in line:
            start = max(0, i - context_lines)
            end = min(len(lines), i + len(search_lines) + context_lines)
            return {
                "start_line": start + 1,
                "end_line": end,
                "snippet": "\n".join(lines[start:end]),
            }
    return None


# ─── Main LLM Call ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert code analyst. You are given a codebase and must answer questions about it with precision.

RULES:
1. Always cite the EXACT file paths from the codebase (e.g., `src/auth/login.py`).
2. Always include LINE RANGES when referencing code (e.g., "lines 45-67").
3. Structure your answer with clear sections.
4. After your explanation, output a JSON block with this exact format:

```json
{
  "snippets": [
    {
      "file": "path/to/file.py",
      "start_line": 10,
      "end_line": 25,
      "description": "What this snippet shows",
      "code": "the actual code here"
    }
  ]
}
```

5. Be concise but thorough. If something is not in the codebase, say so clearly.
6. For refactor mode: provide specific, actionable suggestions with before/after code."""

REFACTOR_PROMPT = """You are an expert software engineer specializing in code refactoring and best practices.
Given the codebase, provide specific refactor suggestions with:
1. What to change and WHY (with concrete benefits)
2. The files and line ranges affected
3. Before/after code examples

After your explanation, output the same JSON snippet format for the relevant code sections."""


async def ask_llm_with_context(
    question: str,
    codebase: Dict[str, str],
    mode: str = "qa"
) -> dict:
    """
    Main function: build context, call Groq LLM, parse response.
    Returns { answer, snippets, source }.
    """
    api_key = get_api_key()
    if not api_key:
        raise ValueError("GROQ_API_KEY not configured. Please set it in the .env file.")

    context, included_files = _build_context(codebase, question)
    system = REFACTOR_PROMPT if mode == "refactor" else SYSTEM_PROMPT

    user_message = f"""CODEBASE CONTEXT ({len(codebase)} files total, showing most relevant):

{context}

---
QUESTION: {question}

Remember to cite exact file paths and line numbers from the codebase above."""

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{GROQ_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_message},
                ],
                "temperature": 0.2,
                "max_tokens": 4096,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    raw_answer = data["choices"][0]["message"]["content"]

    # Parse the JSON snippet block from the answer
    snippets = _parse_snippets_from_answer(raw_answer, codebase)

    # Clean answer (remove trailing JSON block for display)
    clean_answer = re.sub(r'```json\s*\{[\s\S]*?"snippets"[\s\S]*?```', "", raw_answer).strip()
    # Fallback if regex didn't catch it
    if "```json" in clean_answer:
        clean_answer = clean_answer[:clean_answer.rfind("```json")].strip()

    return {
        "answer": clean_answer or raw_answer,
        "snippets": snippets,
        "source": f"{len(included_files)} files analyzed",
        "included_files": included_files[:10],
    }


def _parse_snippets_from_answer(raw: str, codebase: Dict[str, str]) -> List[dict]:
    """Extract the JSON snippets block from LLM response."""
    snippets = []

    # Try to find JSON block
    json_match = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", raw)
    if json_match:
        try:
            parsed = json.loads(json_match.group(1))
            raw_snippets = parsed.get("snippets", [])
            for s in raw_snippets:
                file_path = s.get("file", "")
                # Try to enrich with actual line content from codebase
                if file_path in codebase:
                    content = codebase[file_path]
                    lines = content.split("\n")
                    start = max(0, s.get("start_line", 1) - 1)
                    end = min(len(lines), s.get("end_line", start + 10))
                    actual_code = "\n".join(lines[start:end])
                    s["code"] = actual_code
                    s["start_line"] = start + 1
                    s["end_line"] = end
                snippets.append(s)
        except (json.JSONDecodeError, KeyError):
            pass

    # Fallback: extract file references from text
    if not snippets:
        file_refs = re.findall(r"`([^`]+\.[a-zA-Z]{1,10})`", raw)
        for ref in file_refs:
            # Try to match against codebase
            for path in codebase:
                if ref in path or path.endswith(ref):
                    content = codebase[path]
                    lines = content.split("\n")
                    snippets.append({
                        "file": path,
                        "start_line": 1,
                        "end_line": min(20, len(lines)),
                        "description": f"Referenced in answer: {path}",
                        "code": "\n".join(lines[:20]),
                    })
                    break
            if len(snippets) >= 5:
                break

    return snippets[:8]  # Cap at 8 snippets
