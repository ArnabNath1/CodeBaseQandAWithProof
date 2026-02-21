import { useState } from 'react';

export default function SnippetCard({ snippet, index }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(true);

    const handleCopy = () => {
        navigator.clipboard.writeText(snippet.code || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
    };

    const ext = snippet.file?.split('.').pop() || '';

    return (
        <div className="snippet-card">
            <div className="snippet-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="snippet-path">
                        <span style={{ color: 'var(--text-3)' }}>📄</span>
                        {snippet.file}
                    </div>
                    {snippet.description && (
                        <div className="snippet-desc">{snippet.description}</div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {snippet.start_line && (
                        <span className="line-range-badge">
                            L{snippet.start_line}–{snippet.end_line}
                        </span>
                    )}
                    <button className="btn btn-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={handleCopy}>
                        {copied ? '✓ Copied' : 'Copy'}
                    </button>
                    <button className="btn btn-ghost" style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }} onClick={() => setExpanded(e => !e)}>
                        {expanded ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {expanded && snippet.code && (
                <div className="snippet-code">
                    <pre><code>{snippet.code}</code></pre>
                </div>
            )}
        </div>
    );
}
