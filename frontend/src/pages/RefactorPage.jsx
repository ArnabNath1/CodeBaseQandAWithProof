import { useState } from 'react';
import { api } from '../api';
import { useCodebase } from '../context/CodebaseContext';
import { useToast } from '../context/ToastContext';
import SnippetCard from '../components/SnippetCard';
import UploadPanel from '../components/UploadPanel';

const REFACTOR_PROMPTS = [
    'Identify functions that are too long and suggest splitting them',
    'Find duplicated code and suggest consolidation',
    'Suggest better error handling patterns',
    'Identify hard-coded values that should be constants or config',
    'Suggest improvements to naming conventions',
    'Find missing input validation and suggest fixes',
];

export default function RefactorPage() {
    const { codebase } = useCodebase();
    const { addToast } = useToast();
    const [topic, setTopic] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleRefactor = async () => {
        if (!topic.trim()) { addToast('Please describe what to refactor', 'error'); return; }
        if (!codebase) { addToast('Load a codebase first', 'error'); return; }
        setLoading(true);
        setResult(null);
        try {
            const data = await api.refactor(topic.trim());
            setResult(data);
            addToast('Refactor suggestions ready!', 'success');
        } catch (e) {
            addToast(`Error: ${e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!codebase) {
        return (
            <div className="page-container">
                <div className="section-header">
                    <h1>Refactor Suggestions</h1>
                    <p>Load a codebase first to generate refactor ideas.</p>
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem' }}>Load a Codebase to Get Started</h3>
                    <UploadPanel />
                </div>
            </div>
        );
    }

    return (
        <div className="page-container">
            <div className="section-header">
                <h1>Refactor Suggestions</h1>
                <p>Get specific, actionable refactor ideas with before/after code examples from your codebase.</p>
            </div>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="refactor-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.5rem' }}>
                            What do you want to refactor?
                        </label>
                        <textarea
                            id="refactor-input"
                            className="input"
                            style={{ minHeight: 80 }}
                            placeholder="e.g. Functions that are too long, or error handling patterns…"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleRefactor(); }}
                        />
                    </div>

                    {/* Quick prompts */}
                    <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '0.5rem' }}>Quick suggestions:</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                            {REFACTOR_PROMPTS.map(p => (
                                <button
                                    key={p}
                                    className="btn btn-ghost"
                                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                                    onClick={() => setTopic(p)}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        id="refactor-btn"
                        className="btn btn-primary"
                        onClick={handleRefactor}
                        disabled={loading}
                        style={{ alignSelf: 'flex-start', padding: '0.65rem 1.75rem' }}
                    >
                        {loading ? <><span className="spinner"></span> Analyzing…</> : '✨ Generate Suggestions'}
                    </button>
                </div>
            </div>

            {loading && (
                <div className="loading-overlay">
                    <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
                    <p>Analyzing codebase for refactor opportunities…</p>
                </div>
            )}

            {result && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <h2>Refactor Suggestions</h2>
                            <span className="badge badge-warning">AI-Generated</span>
                        </div>
                        <div className="prose">
                            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.8 }}>{result.suggestions}</p>
                        </div>
                    </div>

                    {result.snippets && result.snippets.length > 0 && (
                        <div className="card">
                            <h2 style={{ marginBottom: '1rem' }}>
                                Relevant Code Snippets
                                <span className="badge badge-accent" style={{ marginLeft: '0.75rem', verticalAlign: 'middle' }}>
                                    {result.snippets.length}
                                </span>
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {result.snippets.map((s, i) => (
                                    <SnippetCard key={i} snippet={s} index={i} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
