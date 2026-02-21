const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(method, path, body = null, isFormData = false) {
    const opts = {
        method,
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
    };
    if (body) {
        opts.body = isFormData ? body : JSON.stringify(body);
    }
    const res = await fetch(`${API_BASE}${path}`, opts);
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
