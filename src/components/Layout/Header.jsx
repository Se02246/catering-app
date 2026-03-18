import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Download } from 'lucide-react';
import { useInstallPromptContext } from '../../context/InstallPromptContext';
import { formatCustomText } from '../../utils/textFormatting';
import { useSetting } from '../../hooks/useData';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/';
    const isQuote = location.pathname === '/quote';
    const { showPrompt, handleInstallClick } = useInstallPromptContext();
    const { setting: headerSetting } = useSetting('header_text');
    const { setting: showQuoteSetting, isLoading: isQuoteSettingLoading } = useSetting('show_quote_builder');
    
    const headerText = headerSetting?.value || " ";
    const showQuoteBuilder = !isQuoteSettingLoading && showQuoteSetting?.value !== 'false';
    const isLoggedIn = !!localStorage.getItem('token');

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
            {/* Admin Lock Icon - Invisible for clients, visible for logged admin */}
            <div style={{ position: 'absolute', top: '0', right: '0', width: '50px', height: '50px', zIndex: 100 }}>
                <div
                    onClick={() => {
                        const token = localStorage.getItem('token');
                        if (token) {
                            navigate('/admin');
                        } else {
                            navigate('/login');
                        }
                    }}
                    style={{ 
                        color: isLoggedIn ? 'var(--color-primary-dark)' : 'transparent', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: '0.5rem', 
                        cursor: isLoggedIn ? 'pointer' : 'default',
                        width: '100%',
                        height: '100%'
                    }}
                >
                    <Lock size={24} style={{ opacity: isLoggedIn ? 1 : 0 }} />
                </div>
            </div>

            <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--color-primary-dark)' }}>Muse Catering</h1>
            <p
                style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', maxWidth: '600px', margin: '0 auto', marginBottom: '2rem' }}
                dangerouslySetInnerHTML={{ __html: formatCustomText(headerText) }}
            />

            {showQuoteBuilder ? (
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
                            padding: '1rem 0',
                            width: '100%',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            color: isHome ? 'var(--color-primary-dark)' : 'white',
                            backgroundColor: isHome ? 'white' : 'var(--color-primary)',
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
                            color: isQuote ? 'var(--color-primary-dark)' : 'white',
                            backgroundColor: isQuote ? 'white' : 'var(--color-primary)',
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

                    {/* PWA Install Button - Spans full width when quote builder is visible */}
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
            ) : (
                /* Show ONLY Install Button if quote builder is hidden */
                showPrompt && (
                    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                        <button
                            onClick={handleInstallClick}
                            style={{
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
                    </div>
                )
            )}
        </header>
    );
};

export default Header;
