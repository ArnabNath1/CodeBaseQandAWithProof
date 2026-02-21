import { useState, useCallback } from 'react';
import { api } from '../api';
import { useCodebase } from '../context/CodebaseContext';
import { useToast } from '../context/ToastContext';

export default function UploadPanel() {
    const { setCodebase } = useCodebase();
    const { addToast } = useToast();
    const [mode, setMode] = useState('zip'); // 'zip' | 'github'
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [githubUrl, setGithubUrl] = useState('');
    const [result, setResult] = useState(null);

    const handleFile = useCallback(async (file) => {
        if (!file) return;
        if (!file.name.endsWith('.zip')) {
            addToast('Only .zip files are supported', 'error');
            return;
        }
        setLoading(true);
        try {
            const data = await api.uploadZip(file);
            setCodebase({ source: data.source, fileCount: data.file_count, files: data.files });
            setResult(data);
            addToast(`✓ ${data.file_count} files loaded from ZIP`, 'success');
        } catch (e) {
            addToast(`Upload failed: ${e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    }, [setCodebase, addToast]);

    const handleGithub = async () => {
        if (!githubUrl.trim()) {
            addToast('Please enter a GitHub URL', 'error');
            return;
        }
        setLoading(true);
        try {
            const data = await api.loadGithub(githubUrl.trim());
            setCodebase({ source: githubUrl.trim(), fileCount: data.file_count, files: data.files });
            setResult(data);
            addToast(`✓ ${data.file_count} files loaded from GitHub`, 'success');
        } catch (e) {
            addToast(`GitHub load failed: ${e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    }, [handleFile]);

    return (
        <div>
            {/* Tab switcher */}
            <div className="tab-bar" style={{ marginBottom: '1.25rem' }}>
                <button id="tab-zip" className={`tab-item ${mode === 'zip' ? 'active' : ''}`} onClick={() => setMode('zip')}>
                    📦 Upload ZIP
                </button>
                <button id="tab-github" className={`tab-item ${mode === 'github' ? 'active' : ''}`} onClick={() => setMode('github')}>
                    🔗 GitHub URL
                </button>
            </div>

            {mode === 'zip' ? (
                <div
                    id="upload-dropzone"
                    className={`upload-zone ${dragging ? 'drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    onClick={() => document.getElementById('zip-input').click()}
                >
                    <input
                        id="zip-input"
                        type="file"
                        accept=".zip"
                        style={{ display: 'none' }}
                        onChange={e => handleFile(e.target.files[0])}
                    />
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="spinner" style={{ width: 32, height: 32 }}></div>
                            <p>Parsing codebase…</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📦</div>
                            <p style={{ color: 'var(--text-0)', fontWeight: 600, marginBottom: '0.35rem' }}>
                                Drop your ZIP file here
                            </p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-3)' }}>
                                or click to browse · Max 50 MB · Supports JS, Python, Go, Java, Rust, and more
                            </p>
                        </>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <input
                            id="github-url-input"
                            className="input"
                            type="url"
                            placeholder="https://github.com/owner/repo"
                            value={githubUrl}
                            onChange={e => setGithubUrl(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleGithub()}
                        />
                        <button
                            id="load-github-btn"
                            className="btn btn-primary"
                            onClick={handleGithub}
                            disabled={loading}
                            style={{ flexShrink: 0 }}
                        >
                            {loading ? <><span className="spinner"></span> Loading…</> : 'Load Repo'}
                        </button>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>
                        Only public repositories. GitHub API rate limit: 60 req/hour.
                    </p>
                    {/* Quick examples */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {[
                            'https://github.com/tiangolo/fastapi',
                            'https://github.com/pallets/flask',
                        ].map(url => (
                            <button
                                key={url}
                                className="btn btn-ghost"
                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                                onClick={() => setGithubUrl(url)}
                            >
                                {url.split('/').slice(-2).join('/')}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Result summary */}
            {result && (
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--success)' }}>✓</span>
                        <strong style={{ color: 'var(--success)' }}>{result.file_count} files indexed</strong>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxHeight: 100, overflowY: 'auto' }}>
                        {(result.files || []).slice(0, 30).map(f => (
                            <span key={f} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'var(--bg-3)', padding: '0.1rem 0.4rem', borderRadius: 4, color: 'var(--text-2)' }}>
                                {f}
                            </span>
                        ))}
                        {(result.files || []).length > 30 && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>+{result.file_count - 30} more</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
