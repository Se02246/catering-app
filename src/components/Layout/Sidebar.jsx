import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Lock, LogOut, X } from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    const isActive = (path) => location.pathname === path;

    const linkStyle = (path) => ({
        display: 'flex',
        alignItems: 'center',
        padding: '1rem',
        color: isActive(path) ? 'var(--color-primary)' : 'var(--color-text)',
        backgroundColor: isActive(path) ? '#f3e6ed' : 'transparent',
        textDecoration: 'none',
        borderRight: isActive(path) ? '3px solid var(--color-primary)' : 'none',
        marginBottom: '0.5rem',
        transition: 'all 0.2s'
    });

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{
            backgroundColor: 'white',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', margin: 0 }}>Catering App</h2>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none' }}
                    className="mobile-close-btn"
                >
                    <X size={24} />
                </button>
            </div>

            <nav style={{ flex: 1, padding: '1rem 0' }}>
                <Link to="/" style={linkStyle('/')} onClick={onClose}>
                    <Home size={20} style={{ marginRight: '10px' }} />
                    Home
                </Link>
                <Link to="/quote" style={linkStyle('/quote')} onClick={onClose}>
                    <FileText size={20} style={{ marginRight: '10px' }} />
                    Crea Preventivo
                </Link>
                {!isAdmin && (
                    <Link to="/login" style={linkStyle('/login')} onClick={onClose}>
                        <Lock size={20} style={{ marginRight: '10px' }} />
                        Admin Login
                    </Link>
                )}
                {isAdmin && (
                    <Link to="/admin" style={linkStyle('/admin')} onClick={onClose}>
                        <Lock size={20} style={{ marginRight: '10px' }} />
                        Dashboard
                    </Link>
                )}
            </nav>

            {isAdmin && (
                <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <button
                        onClick={() => {
                            localStorage.removeItem('isAdmin');
                            window.location.href = '/';
                        }}
                        className="btn btn-outline"
                        style={{ width: '100%', justifyContent: 'center' }}
                    >
                        <LogOut size={18} style={{ marginRight: '8px' }} />
                        Logout
                    </button>
                </div>
            )}
            <style>{`
                @media (max-width: 768px) {
                    .mobile-close-btn {
                        display: block !important;
                    }
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
