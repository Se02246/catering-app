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
        padding: '1rem 1.5rem',
        color: isActive(path) ? 'white' : 'rgba(255,255,255,0.7)',
        backgroundColor: isActive(path) ? 'rgba(255,255,255,0.15)' : 'transparent',
        textDecoration: 'none',
        borderLeft: isActive(path) ? '4px solid white' : '4px solid transparent',
        marginBottom: '0.5rem',
        transition: 'all 0.3s ease',
        fontWeight: isActive(path) ? '700' : '500',
        borderRadius: '0 16px 16px 0',
        marginRight: '1rem'
    });

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.8rem', color: 'white', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Catering App</h2>
                <button
                    onClick={onClose}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none', color: 'white' }}
                    className="mobile-close-btn"
                >
                    <X size={24} />
                </button>
            </div>

            <nav style={{ flex: 1, padding: '2rem 0' }}>
                <Link to="/" style={linkStyle('/')} onClick={onClose}>
                    <Home size={20} style={{ marginRight: '12px' }} />
                    Home
                </Link>
                <Link to="/quote" style={linkStyle('/quote')} onClick={onClose}>
                    <FileText size={20} style={{ marginRight: '12px' }} />
                    Crea Preventivo
                </Link>
                {!isAdmin && (
                    <Link to="/login" style={linkStyle('/login')} onClick={onClose}>
                        <Lock size={20} style={{ marginRight: '12px' }} />
                        Admin Login
                    </Link>
                )}
                {isAdmin && (
                    <Link to="/admin" style={linkStyle('/admin')} onClick={onClose}>
                        <Lock size={20} style={{ marginRight: '12px' }} />
                        Dashboard
                    </Link>
                )}
            </nav>

            {isAdmin && (
                <div style={{ padding: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={() => {
                            localStorage.removeItem('isAdmin');
                            window.location.href = '/';
                        }}
                        className="btn btn-outline"
                        style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
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
