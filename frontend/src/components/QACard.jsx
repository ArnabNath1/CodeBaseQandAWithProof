import SnippetCard from './SnippetCard';

export default function QACard({ qa, expanded = false, onClick }) {
    const date = new Date(qa.created_at || qa.timestamp).toLocaleString();

    return (
        <div className="history-card" onClick={onClick}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-3)', marginBottom: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                        {date}
                    </div>
                    <h3 style={{ color: 'var(--text-0)', fontWeight: 600, fontSize: '0.975rem' }}>{qa.question}</h3>
                </div>
                {qa.tags && qa.tags.length > 0 && (
                    <div className="tag-list" style={{ flexShrink: 0 }}>
                        {qa.tags.map(tag => (
                            <span key={tag} className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview answer */}
            {!expanded && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-2)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                    {qa.answer}
                </p>
            )}

            {/* Full answer when expanded */}
            {expanded && (
                <div>
                    <div className="prose" style={{ marginBottom: '1.5rem' }}>
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>{qa.answer}</p>
                    </div>

                    {qa.snippets && qa.snippets.length > 0 && (
                        <div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
                                Code Snippets ({qa.snippets.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {qa.snippets.map((s, i) => (
                                    <SnippetCard key={i} snippet={s} index={i} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {!expanded && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--accent-light)' }}>
                    {qa.snippets?.length > 0 ? `${qa.snippets.length} code snippet(s) referenced` : 'Click to expand'} →
                </div>
            )}
        </div>
    );
}
