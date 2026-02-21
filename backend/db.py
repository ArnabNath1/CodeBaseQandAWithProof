"""
Supabase database layer for Q&A history.
Replaces the SQLite implementation for better cloud deployment.
"""

import os
import json
from typing import Optional, List
from datetime import datetime
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

_supabase: Optional[Client] = None

def get_db() -> Client:
    global _supabase
    if _supabase is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL or SUPABASE_KEY not set in environment")
        _supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase

def check_db_health() -> tuple[bool, str]:
    """Checks if Supabase is reachable and the table exists."""
    try:
        get_db().table("qa_history").select("id").limit(1).execute()
        return True, "Connected to Supabase"
    except Exception as e:
        return False, str(e)


def init_db():
    health_ok, msg = check_db_health()
    if health_ok:
        print(f"✓ {msg}")
    else:
        print(f"⚠ Warning: {msg}")

def save_qa(
    question: str,
    answer: str,
    snippets: str = "[]",
    tags: str = "[]",
    source: str = "",
) -> int:
    # Convert string JSONs back to lists/dicts for Supabase jsonb
    try:
        snippets_data = json.loads(snippets)
    except:
        snippets_data = []
    
    try:
        tags_data = json.loads(tags)
    except:
        tags_data = []

    data = {
        "question": question,
        "answer": answer,
        "snippets": snippets_data,
        "tags": tags_data,
        "source": source
    }
    
    # Supabase uses 'returning' by default to get the inserted row
    response = get_db().table("qa_history").insert(data).execute()
    if response.data:
        return response.data[0]["id"]
    return 0

def get_recent_qas(
    limit: int = 10,
    search: Optional[str] = None,
    tag: Optional[str] = None,
) -> List[dict]:
    query = get_db().table("qa_history").select("*")

    if search:
        # Or filter for search in question OR answer
        query = query.or_(f"question.ilike.%{search}%,answer.ilike.%{search}%")

    # Supabase filter for JSON arrays: 'tags' @> '["mytag"]'
    if tag:
        query = query.contains("tags", [tag])

    response = query.order("created_at", desc=True).limit(limit).execute()
    
    # Format data for frontend (ensure snippets/tags are present)
    results = []
    for row in (response.data or []):
        results.append(row)
    
    return results

def get_all_tags() -> List[str]:
    # This is a bit complex in Supabase SQL without a dedicated tags table.
    # For now, we fetch recent rows and aggregate locally.
    response = get_db().table("qa_history").select("tags").execute()
    
    all_tags = set()
    for row in (response.data or []):
        tags = row.get("tags")
        if isinstance(tags, list):
            all_tags.update(tags)
    
    return sorted(list(all_tags))

def get_qa_by_id(qa_id: int) -> Optional[dict]:
    response = get_db().table("qa_history").select("*").eq("id", qa_id).single().execute()
    return response.data if response.data else None
