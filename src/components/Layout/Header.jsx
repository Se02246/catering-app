import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Download, Utensils, FileText, MessageCircle, ArrowLeft } from 'lucide-react';
import { useInstallPromptContext } from '../../context/InstallPromptContext';
import { formatCustomText } from '../../utils/textFormatting';
import { useSetting } from '../../hooks/useData';

const Header = ({ isReviewsPage = false }) => {
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

    const scrollToQuote = () => {
        const performScroll = () => {
            const element = document.getElementById('catalog-top');
            if (element) {
                const yOffset = -20; // Slight offset to land just above the title
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        };

        if (location.pathname === '/quote') {
            performScroll();
        } else {
            navigate('/quote');
            setTimeout(performScroll, 200); // Increased timeout to ensure page content is loaded
        }
    };

    const contactWhatsApp = () => {
        const phoneNumber = "393495416637";
        const message = "Ciao Barbara, vorrei avere maggiori informazioni sui vostri servizi di catering.";
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
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

            {isReviewsPage && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <button 
                        onClick={() => navigate('/')}
                        className="btn btn-outline"
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            borderRadius: '50px',
                            fontSize: '0.9rem',
                            backgroundColor: 'rgba(255,255,255,0.5)',
                            border: '1px solid var(--color-border)'
                        }}
                    >
                        <ArrowLeft size={16} /> Torna alla Home
                    </button>
                </div>
            )}
            
            {!isReviewsPage && (
                <>
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
                                    onClick={scrollToQuote}
                                    className={`nav-btn ${isQuote ? 'active' : ''}`}
                                >
                                    <FileText size={20} />
                                    Preventivo
                                </button>
                            </>
                        )}
                    </div>

                    <div style={{ maxWidth: '400px', margin: '1.5rem auto 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <button
                            onClick={contactWhatsApp}
                            className="btn install-btn"
                        >
                            <MessageCircle size={20} style={{ marginRight: '0.5rem' }} />
                            Contatta
                        </button>

                        {showPrompt && (
                            <button
                                onClick={handleInstallClick}
                                className="btn install-btn"
                            >
                                <Download size={20} style={{ marginRight: '0.5rem' }} />
                                Installa l'App
                            </button>
                        )}
                    </div>
                </>
            )}
        </header>
    );
};

export default Header;
