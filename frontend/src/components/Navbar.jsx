import { NavLink, useLocation } from 'react-router-dom';
import { useCodebase } from '../context/CodebaseContext';

export default function Navbar() {
    const { codebase } = useCodebase();

    return (
        <nav className="nav">
            <NavLink to="/" className="nav-brand">
                Code<span>Proof</span>
            </NavLink>

            {codebase && (
                <div className="badge badge-success" style={{ fontSize: '0.72rem', marginLeft: '0.75rem' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                    {codebase.fileCount} files loaded
                </div>
            )}

            <div className="nav-links">
                <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                    Home
                </NavLink>
                <NavLink to="/ask" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Ask
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    History
                </NavLink>
                <NavLink to="/refactor" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Refactor
                </NavLink>
                <NavLink to="/status" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    Status
                </NavLink>
            </div>
        </nav>
    );
}
