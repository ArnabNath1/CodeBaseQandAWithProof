const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Sanitize: ensure no trailing slash
const API_BASE = VITE_API_URL.endsWith('/') ? VITE_API_URL.slice(0, -1) : VITE_API_URL;

async function request(method, path, body = null, isFormData = false) {
    const opts = {
        method,
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    };
    if (body) {
        opts.body = isFormData ? body : JSON.stringify(body);
    }
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const res = await fetch(`${API_BASE}${cleanPath}`, opts);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
}

export const api = {
    health: () => request('GET', '/api/health'),

    uploadZip: (file) => {
        const fd = new FormData();
        fd.append('file', file);
        return request('POST', '/api/upload', fd, true);
    },

    loadGithub: (repo_url) => request('POST', '/api/github', { repo_url }),

    ask: (question, tags = []) =>
        request('POST', '/api/ask', { question, tags }),

    refactor: (question) =>
        request('POST', '/api/refactor', { question }),

    history: (search = '', tag = '') => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (tag) params.set('tag', tag);
        return request('GET', `/api/history?${params}`);
    },

    tags: () => request('GET', '/api/tags'),

    files: () => request('GET', '/api/files'),

    fileContent: (path) => request('GET', `/api/files/${encodeURIComponent(path)}`),
};
