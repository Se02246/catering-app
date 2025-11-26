import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Download } from 'lucide-react';
import { useInstallPromptContext } from '../../context/InstallPromptContext';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';
    const isQuote = location.pathname === '/quote';
    const { showPrompt, handleInstallClick } = useInstallPromptContext();

    const scrollToPackages = () => {
        if (isHome) {
            const element = document.getElementById('packages');
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            navigate('/');
            // We might need a timeout or context to scroll after navigation, 
            // but for now simple navigation is a good start. 
            // The user just said "la selezione per tornare alla pagina pacchetti".
            // If they want auto-scroll, we can add that later.
            setTimeout(() => {
                const element = document.getElementById('packages');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    };

    return (
        <header style={{ textAlign: 'center', marginBottom: '3rem', paddingTop: '2rem', position: 'relative' }}>
            {/* Admin Lock Icon - Absolute positioned */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
                <div
                    onClick={() => {
                        const token = localStorage.getItem('token');
                        if (token) {
                            navigate('/admin');
                        } else {
                            navigate('/login');
                        }
                    }}
                    style={{ color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', cursor: 'pointer' }}
                >
                    <Lock size={24} />
                </div>
            </div>

            <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--color-primary-dark)' }}>Muse Catering</h1>
            <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto', marginBottom: '2rem' }}>
                Catering dolci e salati preparati con passione per i tuoi eventi speciali.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                maxWidth: '500px',
                margin: '0 auto'
            }}>
                <button
                    onClick={scrollToPackages}
                    style={{
                        padding: '1rem 0', // Removed horizontal padding, width handled by grid
                        width: '100%',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: isHome ? 'white' : 'var(--color-primary-dark)',
                        backgroundColor: isHome ? 'var(--color-primary)' : 'white',
                        border: '2px solid var(--color-primary)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                >
                    Pacchetti
                </button>
                <button
                    onClick={() => navigate('/quote')}
                    style={{
                        padding: '1rem 0',
                        width: '100%',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: isQuote ? 'white' : 'var(--color-primary-dark)',
                        backgroundColor: isQuote ? 'var(--color-primary)' : 'white',
                        border: '2px solid var(--color-primary)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseOver={e => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                >
                    Crea preventivo
                </button>

                {/* PWA Install Button - Spans full width */}
                {showPrompt && (
                    <button
                        onClick={handleInstallClick}
                        style={{
                            gridColumn: '1 / -1',
                            padding: '1rem 0',
                            width: '100%',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: 'white',
                            backgroundColor: 'var(--color-primary-dark)',
                            border: '2px solid var(--color-primary-dark)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer',
                            boxShadow: 'var(--shadow-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                        }}
                    >
                        <Download size={20} />
                        Installa App
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
