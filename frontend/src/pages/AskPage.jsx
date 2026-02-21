import { useState } from 'react';
import { api } from '../api';
import { useCodebase } from '../context/CodebaseContext';
import { useToast } from '../context/ToastContext';
import SnippetCard from '../components/SnippetCard';
import UploadPanel from '../components/UploadPanel';

const EXAMPLE_QUESTIONS = [
    'Where is authentication handled?',
    'How do retries work?',
    'Where are API routes defined?',
    'How is the database connected?',
    'Where are environment variables loaded?',
    'What error handling patterns are used?',
];

export default function AskPage() {
    const { codebase } = useCodebase();
    const { addToast } = useToast();

    const [question, setQuestion] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleAddTag = () => {
        const t = tagInput.trim().toLowerCase();
        if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); }
        setTagInput('');
    };

    const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

    const handleAsk = async () => {
        if (!question.trim()) { addToast('Please enter a question', 'error'); return; }
        if (!codebase) { addToast('Load a codebase first', 'error'); return; }
        setLoading(true);
        setResult(null);
        try {
            const data = await api.ask(question.trim(), tags);
            setResult(data);
            addToast('Answer ready!', 'success');
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
                    <h1>Ask a Question</h1>
                    <p>Load a codebase first, then ask away.</p>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1>Ask a Question</h1>
                        <p style={{ marginTop: '0.25rem' }}>
                            {codebase.fileCount} files loaded from <span style={{ color: 'var(--accent-light)', fontFamily: 'var(--font-mono)', fontSize: '0.85em' }}>{codebase.source}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Question input */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label htmlFor="question-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.5rem' }}>
                            Your Question
                        </label>
                        <textarea
                            id="question-input"
                            className="input"
                            style={{ minHeight: 90 }}
                            placeholder="e.g. Where is authentication handled? How do retries work?"
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAsk(); }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: '0.35rem' }}>Tip: Ctrl+Enter to submit</p>
                    </div>

                    {/* Example pill buttons */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {EXAMPLE_QUESTIONS.map(q => (
                            <button
                                key={q}
                                className="btn btn-ghost"
                                style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                                onClick={() => setQuestion(q)}
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Tags */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '0.5rem' }}>
                            Tags <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                id="tag-input"
                                className="input"
                                placeholder="Add tag and press Enter"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                style={{ flex: 1 }}
                            />
                            <button className="btn btn-secondary" onClick={handleAddTag}>Add</button>
                        </div>
                        {tags.length > 0 && (
                            <div className="tag-list" style={{ marginTop: '0.5rem' }}>
                                {tags.map(t => (
                                    <span key={t} className="tag" onClick={() => removeTag(t)}>
                                        {t} ✕
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        id="ask-submit-btn"
                        className="btn btn-primary"
                        onClick={handleAsk}
                        disabled={loading}
                        style={{ alignSelf: 'flex-start', fontSize: '0.975rem', padding: '0.65rem 1.75rem' }}
                    >
                        {loading ? <><span className="spinner"></span> Analyzing codebase…</> : '🔍 Ask'}
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="loading-overlay">
                    <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }}></div>
                    <p>Scanning codebase and querying LLM…</p>
                </div>
            )}

            {/* Result answer */}
            {result && !loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Answer text */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2>Answer</h2>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {result.tags?.map(t => (
                                    <span key={t} className="badge badge-accent">{t}</span>
                                ))}
                                <span className="badge badge-grey">{result.snippets?.length || 0} snippets</span>
                            </div>
                        </div>
                        <div className="prose">
                            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', lineHeight: 1.8 }}>{result.answer}</p>
                        </div>
                    </div>

                    {/* Code snippets */}
                    {result.snippets && result.snippets.length > 0 && (
                        <div className="card">
                            <h2 style={{ marginBottom: '1rem' }}>
                                Referenced Code Snippets
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
