"""
Codebase parser: reads files from a directory or GitHub repo.
Returns a dict of { "relative/path.py": "file content" }
"""

import os
import re
import httpx
import base64
from pathlib import Path
from typing import Dict, Optional

# Extensions to index (code + config files)
SUPPORTED_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".java", ".go", ".rs",
    ".cpp", ".c", ".h", ".hpp", ".cs", ".rb", ".php", ".swift",
    ".kt", ".scala", ".sh", ".bash", ".yaml", ".yml", ".json",
    ".toml", ".env", ".md", ".txt", ".html", ".css", ".scss",
    ".sql", ".graphql", ".proto", ".xml", ".tf", ".dockerfile",
    ".vue", ".svelte", ".r", ".dart", ".ex", ".exs",
}

# Files/dirs to skip
SKIP_PATTERNS = {
    "node_modules", ".git", "__pycache__", ".pytest_cache",
    "venv", "env", ".env", "dist", "build", ".next", ".nuxt",
    "coverage", ".nyc_output", "target", "vendor",
}

MAX_FILE_SIZE = 200 * 1024  # 200 KB per file
MAX_FILES = 300


def should_skip(path: str) -> bool:
    parts = Path(path).parts
    return any(part in SKIP_PATTERNS for part in parts)


def parse_codebase(root_dir: str, source_name: str = "") -> Dict[str, str]:
    """Walk a directory and collect file contents."""
    files = {}
    root = Path(root_dir)

    for file_path in root.rglob("*"):
        if len(files) >= MAX_FILES:
            break
        if not file_path.is_file():
            continue

        rel = str(file_path.relative_to(root))
        rel = rel.replace("\\", "/")

        # Skip hidden/build folders
        if should_skip(rel):
            continue

        # Only supported extensions (or no extension for Dockerfile etc)
        suffix = file_path.suffix.lower()
        name_lower = file_path.name.lower()
        if suffix not in SUPPORTED_EXTENSIONS and "dockerfile" not in name_lower:
            continue

        # Skip huge files
        if file_path.stat().st_size > MAX_FILE_SIZE:
            continue

        try:
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            # Strip top-level folder from path (from ZIP extraction)
            parts = rel.split("/")
            if len(parts) > 1:
                # Remove the first folder (usually the zip root folder)
                cleaned = "/".join(parts[1:]) if len(parts) > 1 else rel
            else:
                cleaned = rel
            files[cleaned] = content
        except Exception:
            continue

    return files


async def fetch_github_repo(repo_url: str) -> Dict[str, str]:
    """
    Fetch a public GitHub repo via the GitHub API. 
    Uses GITHUB_TOKEN from environment if available to avoid rate limits.
    """
    # Extract owner/repo from URL
    match = re.search(r"github\.com/([^/]+)/([^/\s]+?)(?:\.git)?(?:/|$)", repo_url)
    if not match:
        raise ValueError("Could not parse GitHub URL")

    owner, repo = match.group(1), match.group(2)
    api_base = f"https://api.github.com/repos/{owner}/{repo}"
    
    # Check for token to avoid rate limits (60/hr -> 5000/hr)
    token = os.getenv("GITHUB_TOKEN", "")
    headers = {"Accept": "application/vnd.github.v3+json"}
    if token:
        headers["Authorization"] = f"token {token}"
    
    files = {}

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get default branch
        resp = await client.get(api_base, headers=headers)
        if resp.status_code == 404:
            raise ValueError(f"Repository not found: {owner}/{repo}")
        if resp.status_code == 403:
            raise ValueError("GitHub API rate limit exceeded. Please add a GITHUB_TOKEN to your .env file to increase limits.")
        resp.raise_for_status()
        repo_info = resp.json()
        default_branch = repo_info.get("default_branch", "main")

        # Get file tree
        tree_resp = await client.get(
            f"{api_base}/git/trees/{default_branch}?recursive=1",
            headers=headers
        )
        tree_resp.raise_for_status()
        tree = tree_resp.json()

        if tree.get("truncated"):
            # Repo is too large, take first MAX_FILES eligible files
            pass

        blobs = [
            item for item in tree.get("tree", [])
            if item["type"] == "blob" and _is_supported_path(item["path"])
        ][:MAX_FILES]

        # Fetch each file content
        for item in blobs:
            path = item["path"]
            if should_skip(path):
                continue
            if item.get("size", 0) > MAX_FILE_SIZE:
                continue

            try:
                content_resp = await client.get(
                    f"{api_base}/contents/{path}",
                    headers=headers
                )
                if content_resp.status_code != 200:
                    continue
                data = content_resp.json()
                if data.get("encoding") == "base64":
                    content = base64.b64decode(data["content"]).decode("utf-8", errors="ignore")
                    files[path] = content
            except Exception:
                continue

    if not files:
        raise ValueError("No supported source files found in repository.")

    return files


def _is_supported_path(path: str) -> bool:
    suffix = Path(path).suffix.lower()
    name = Path(path).name.lower()
    return suffix in SUPPORTED_EXTENSIONS or "dockerfile" in name
