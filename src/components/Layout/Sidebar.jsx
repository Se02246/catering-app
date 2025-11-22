import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Lock, LogOut } from 'lucide-react';

const Sidebar = () => {
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
        <aside style={{
            width: '250px',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            backgroundColor: 'white',
            borderRight: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000
        }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>Catering App</h2>
            </div>

            <nav style={{ flex: 1, padding: '1rem 0' }}>
                <Link to="/" style={linkStyle('/')}>
                    <Home size={20} style={{ marginRight: '10px' }} />
                    Home
                </Link>
                <Link to="/quote" style={linkStyle('/quote')}>
                    <FileText size={20} style={{ marginRight: '10px' }} />
                    Crea Preventivo
                </Link>
                {!isAdmin && (
                    <Link to="/login" style={linkStyle('/login')}>
                        <Lock size={20} style={{ marginRight: '10px' }} />
                        Admin Login
                    </Link>
                )}
                {isAdmin && (
                    <Link to="/admin" style={linkStyle('/admin')}>
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
        </aside>
    );
};

export default Sidebar;
