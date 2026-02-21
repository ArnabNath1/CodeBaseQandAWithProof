import UploadPanel from '../components/UploadPanel';
import { useCodebase } from '../context/CodebaseContext';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
    { icon: '🔍', title: 'Natural Language Search', desc: 'Ask questions like "Where is auth handled?" in plain English' },
    { icon: '📍', title: 'Proof with File Paths', desc: 'Every answer cites exact file paths and line ranges from your codebase' },
    { icon: '💡', title: 'Code Snippet Viewer', desc: 'See the referenced code inline — no file-hunting required' },
    { icon: '🔄', title: 'Refactor Suggestions', desc: 'Get AI-powered refactor ideas with before/after code examples' },
    { icon: '🏷️', title: 'Tagging & History', desc: 'Save, tag, and search the last 10 Q&As for easy reference' },
    { icon: '⚡', title: 'Powered by Groq LLM', desc: 'Uses llama-3.3-70b-versatile for ultra-fast, high-quality answers' },
];

const STEPS = [
    { title: 'Load your codebase', desc: 'Upload a ZIP (≤50 MB) or paste a public GitHub URL' },
    { title: 'Ask any question', desc: 'Type a natural-language question about the code' },
    { title: 'Get answers with proof', desc: 'See file paths, line ranges, and code snippets' },
    { title: 'Save & revisit', desc: 'Tag your Q&As and browse history anytime' },
];

export default function HomePage() {
    const { codebase } = useCodebase();
    const navigate = useNavigate();

    return (
        <div className="page-container">
            {/* Hero */}
            <div className="hero">
                <div className="hero-badge">
                    <span>⚡</span> Powered by Groq · LLaMA 3.3 70B
                </div>
                <h1>
                    Understand any codebase<br />
                    <span className="gradient-text">with proof</span>
                </h1>
                <p>
                    Upload a ZIP or connect a GitHub repo. Ask questions in plain English.
                    Get answers pinpointing exact file paths, line ranges, and code snippets.
                </p>
                {codebase ? (
                    <button id="go-to-ask-btn" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }} onClick={() => navigate('/ask')}>
                        Ask a Question →
                    </button>
                ) : (
                    <a href="#load-section" className="btn btn-primary" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
                        Load a Codebase ↓
                    </a>
                )}
            </div>

            {/* Load section */}
            <div id="load-section" className="card" style={{ marginBottom: '3rem' }}>
                <h2 style={{ marginBottom: '0.35rem' }}>Load a Codebase</h2>
                <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>Start by uploading a ZIP file or connecting a public GitHub repository.</p>
                <UploadPanel />
                {codebase && (
                    <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
                        <button id="start-asking-btn" className="btn btn-primary" onClick={() => navigate('/ask')}>
                            Start Asking Questions →
                        </button>
                    </div>
                )}
            </div>

            {/* How it works */}
            <div style={{ marginBottom: '3rem' }}>
                <div className="section-header">
                    <h2>How it works</h2>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.35rem' }}>Four simple steps to understand any codebase</p>
                </div>
                <div className="card-flat">
                    <div className="steps">
                        {STEPS.map((s, i) => (
                            <div key={i} className="step-item">
                                <div className="step-num">{i + 1}</div>
                                <div className="step-content">
                                    <div className="step-title">{s.title}</div>
                                    <div className="step-desc">{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Features */}
            <div>
                <div className="section-header">
                    <h2>Features</h2>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.35rem' }}>Everything you need to understand and improve code</p>
                </div>
                <div className="grid-3">
                    {FEATURES.map((f, i) => (
                        <div key={i} className="card" style={{ padding: '1.25rem' }}>
                            <div style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                            <h3 style={{ marginBottom: '0.35rem' }}>{f.title}</h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-2)' }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
