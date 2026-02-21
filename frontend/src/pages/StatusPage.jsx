import { useState, useEffect } from 'react';
import { api } from '../api';

function StatusCard({ icon, title, status, message, detail }) {
    const colorMap = {
        ok: 'var(--success)',
        error: 'var(--danger)',
        loading: 'var(--warning)',
    };
    const bgMap = {
        ok: 'rgba(16,185,129,0.08)',
        error: 'rgba(239,68,68,0.08)',
        loading: 'rgba(245,158,11,0.08)',
    };
    const borderMap = {
        ok: 'rgba(16,185,129,0.3)',
        error: 'rgba(239,68,68,0.3)',
        loading: 'rgba(245,158,11,0.3)',
    };
    const labelMap = { ok: 'Operational', error: 'Error', loading: 'Checking…' };
    const color = colorMap[status] || 'var(--text-3)';
    const bg = bgMap[status] || 'var(--bg-2)';
    const border = borderMap[status] || 'var(--border)';

    return (
        <div className="status-card" style={{ borderColor: border, background: `linear-gradient(135deg, ${bg}, var(--bg-glass))` }}>
            <div className="status-card-header">
                <div className="status-card-icon" style={{ background: bg, borderRadius: 'var(--radius-sm)' }}>
                    <span>{icon}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className={`status-dot ${status}`}></span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{labelMap[status]}</span>
                </div>
            </div>
            <h3 style={{ marginBottom: '0.35rem' }}>{title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>{message}</p>
            {detail && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: '0.4rem', fontFamily: 'var(--font-mono)' }}>{detail}</p>
            )}
        </div>
    );
}

export default function StatusPage() {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [lastChecked, setLastChecked] = useState(null);

    const checkHealth = async () => {
        setLoading(true);
        try {
            const data = await api.health();
            setStatus(data);
            setLastChecked(new Date().toLocaleTimeString());
        } catch (e) {
            setStatus({
                backend: { status: 'error', message: String(e.message) },
                database: { status: 'error', message: 'Could not reach backend' },
                llm: { status: 'error', message: 'Could not reach backend' },
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkHealth();
        const interval = setInterval(checkHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const overallOk = status &&
        status.backend.status === 'ok' &&
        status.database.status === 'ok' &&
        status.llm.status === 'ok';

    return (
        <div className="page-container">
            <div className="section-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1>System Status</h1>
                        <p>Real-time health of all services</p>
                    </div>
                    <div style={{ display: 'flex', align: 'center', gap: '1rem' }}>
                        {lastChecked && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Last checked: {lastChecked}</span>
                        )}
                        <button id="refresh-status-btn" className="btn btn-secondary" onClick={checkHealth} disabled={loading}>
                            {loading ? <><span className="spinner"></span> Checking…</> : '↻ Refresh'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Overall status banner */}
            <div className="card" style={{
                marginBottom: '1.5rem',
                background: overallOk
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.05))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.05))',
                borderColor: overallOk ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>{loading ? '⏳' : overallOk ? '✅' : '⚠️'}</span>
                    <div>
                        <h2 style={{ color: loading ? 'var(--warning)' : overallOk ? 'var(--success)' : 'var(--danger)' }}>
                            {loading ? 'Checking systems…' : overallOk ? 'All Systems Operational' : 'Some Issues Detected'}
                        </h2>
                        <p style={{ fontSize: '0.875rem' }}>
                            {status?.codebase_loaded
                                ? `Codebase loaded: ${status.file_count} files indexed`
                                : 'No codebase currently loaded'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Status grid */}
            <div className="status-grid">
                <StatusCard
                    icon="⚡"
                    title="Backend API"
                    status={loading ? 'loading' : (status?.backend?.status || 'error')}
                    message={loading ? 'Connecting…' : (status?.backend?.message || 'Unknown')}
                    detail="FastAPI · Python · Port 8000"
                />
                <StatusCard
                    icon="🗄️"
                    title="Database"
                    status={loading ? 'loading' : (status?.database?.status || 'error')}
                    message={loading ? 'Connecting…' : (status?.database?.message || 'Unknown')}
                    detail="SQLite · qa_history.db"
                />
                <StatusCard
                    icon="🤖"
                    title="LLM Connection"
                    status={loading ? 'loading' : (status?.llm?.status || 'error')}
                    message={loading ? 'Checking…' : (status?.llm?.message || 'Unknown')}
                    detail="Groq API · llama-3.3-70b-versatile"
                />
            </div>

            {/* Info section */}
            <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>System Information</h3>
                <div className="grid-2">
                    {[
                        { label: 'LLM Provider', value: 'Groq Cloud' },
                        { label: 'Model', value: 'llama-3.3-70b-versatile' },
                        { label: 'Backend Framework', value: 'FastAPI 0.115' },
                        { label: 'Frontend Framework', value: 'React 19 + Vite 7' },
                        { label: 'Database', value: 'SQLite (embedded)' },
                        { label: 'Max ZIP size', value: '50 MB' },
                        { label: 'Max files indexed', value: '300 files' },
                        { label: 'Context window', value: '~28,000 chars per query' },
                    ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>{label}</span>
                            <span style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-light)' }}>{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
