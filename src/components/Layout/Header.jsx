import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Download, Utensils, FileText } from 'lucide-react';
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
            setTimeout(() => {
                const element = document.getElementById('packages');
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
        }
    };

    return (
        <header className="main-header">
            {/* Admin Access - Discreet */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 100 }}>
                <div
                    onClick={() => {
                        const token = localStorage.getItem('token');
                        if (token) navigate('/admin');
                        else navigate('/login');
                    }}
                    style={{ 
                        color: isLoggedIn ? 'var(--color-primary)' : 'rgba(0,0,0,0.05)', 
                        padding: '0.5rem', 
                        cursor: 'pointer',
                        transition: 'var(--transition-base)'
                    }}
                    onMouseOver={e => isLoggedIn && (e.currentTarget.style.color = 'var(--color-primary-dark)')}
                >
                    <Lock size={20} />
                </div>
            </div>

            <h1 className="brand-logo">Muse Catering</h1>
            
            <div 
                className="header-description"
                dangerouslySetInnerHTML={{ __html: formatCustomText(headerText) }}
            />

            <div className="nav-container">
                {showQuoteBuilder && (
                    <>
                        <button
                            onClick={scrollToPackages}
                            className={`nav-btn ${isHome ? 'active' : ''}`}
                        >
                            <Utensils size={20} />
                            Pacchetti
                        </button>
                        <button
                            onClick={() => navigate('/quote')}
                            className={`nav-btn ${isQuote ? 'active' : ''}`}
                        >
                            <FileText size={20} />
                            Preventivo
                        </button>
                    </>
                )}
            </div>

            {showPrompt && (
                <div style={{ maxWidth: '400px', margin: '1.5rem auto 0' }}>
                    <button
                        onClick={handleInstallClick}
                        className="btn install-btn"
                    >
                        <Download size={20} style={{ marginRight: '0.5rem' }} />
                        Installa l'App
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;
