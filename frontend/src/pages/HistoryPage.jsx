import { useState, useEffect } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import QACard from '../components/QACard';

export default function HistoryPage() {
    const { addToast } = useToast();
    const [history, setHistory] = useState([]);
    const [allTags, setAllTags] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTag, setActiveTag] = useState('');
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    const loadHistory = async (s = search, t = activeTag) => {
        setLoading(true);
        try {
            const data = await api.history(s, t);
            setHistory(data.history);
        } catch (e) {
            addToast(`Failed to load history: ${e.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadTags = async () => {
        try {
            const data = await api.tags();
            setAllTags(data.tags);
        } catch (_) { }
    };

    useEffect(() => {
        loadHistory();
        loadTags();
    }, []);

    const handleSearch = (val) => {
        setSearch(val);
        loadHistory(val, activeTag);
    };

    const handleTagFilter = (tag) => {
        const next = activeTag === tag ? '' : tag;
        setActiveTag(next);
        loadHistory(search, next);
    };

    return (
        <div className="page-container">
            <div className="section-header">
                <h1>Q&A History</h1>
                <p>Last 10 questions asked about your codebase</p>
            </div>

            {/* Search + Tag filter */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            id="history-search"
                            className="input"
                            placeholder="Search questions and answers…"
                            value={search}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>

                    {allTags.length > 0 && (
                        <div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '0.4rem' }}>Filter by tag:</p>
                            <div className="filter-bar">
                                <span
                                    className={`tag ${activeTag === '' ? 'selected' : ''}`}
                                    onClick={() => handleTagFilter('')}
                                >
                                    All
                                </span>
                                {allTags.map(t => (
                                    <span
                                        key={t}
                                        className={`tag ${activeTag === t ? 'selected' : ''}`}
                                        onClick={() => handleTagFilter(t)}
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* History list */}
            {loading ? (
                <div className="loading-overlay">
                    <div className="spinner" style={{ width: 36, height: 36 }}></div>
                    <p>Loading history…</p>
                </div>
            ) : history.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-3)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                    <h2 style={{ color: 'var(--text-2)' }}>No Q&As found</h2>
                    <p style={{ marginTop: '0.5rem' }}>
                        {search || activeTag ? 'Try different search terms or tags.' : 'Ask your first question to get started!'}
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {history.map(qa => (
                        <QACard
                            key={qa.id}
                            qa={qa}
                            expanded={expandedId === qa.id}
                            onClick={() => setExpandedId(prev => prev === qa.id ? null : qa.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
