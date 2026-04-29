import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Download, FileText, MessageCircle, ArrowLeft, MessageSquare, Star, MapPin } from 'lucide-react';
import { useInstallPromptContext } from '../../context/InstallPromptContext';
import { formatCustomText } from '../../utils/textFormatting';
import { useSetting } from '../../hooks/useData';

const Header = ({ isReviewsPage = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showPrompt, handleInstallClick } = useInstallPromptContext();
    const { setting: headerSetting } = useSetting('header_text');
    const { setting: showQuoteSetting, isLoading: isQuoteSettingLoading } = useSetting('show_quote_builder');
    
    const headerText = headerSetting?.value || " ";
    const showQuoteBuilder = !isQuoteSettingLoading && showQuoteSetting?.value !== 'false';
    const isLoggedIn = !!localStorage.getItem('token');

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

    const scrollToContacts = () => {
        const performScroll = () => {
            const element = document.getElementById('contatti-box');
            if (element) {
                const yOffset = -80; 
                const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        };

        if (location.pathname === '/') {
            performScroll();
        } else {
            navigate('/');
            setTimeout(performScroll, 300);
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

            {(isReviewsPage || location.pathname === '/quote' || location.pathname === '/catalogo') && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '3rem' }}>
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
            
            {!(isReviewsPage || location.pathname === '/quote' || location.pathname === '/catalogo') && (
                <>
                    <div className="header-description"
                        dangerouslySetInnerHTML={{ __html: formatCustomText(headerText) }}
                    />

                    <div style={{ maxWidth: '400px', margin: '1.5rem auto 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {showQuoteBuilder && (
                            <button
                                onClick={scrollToQuote}
                                className="btn btn-outline"
                                style={{ 
                                    width: '100%', 
                                    padding: '0.6rem 1rem', 
                                    fontSize: '0.9rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '0.5rem',
                                    borderRadius: '50px',
                                    border: '1px solid var(--color-primary)',
                                    color: 'var(--color-primary)',
                                    background: 'transparent'
                                }}
                            >
                                <FileText size={18} />
                                Crea il tuo preventivo
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/recensioni')}
                            className="btn btn-outline"
                            style={{ 
                                width: '100%', 
                                padding: '0.6rem 1rem', 
                                fontSize: '0.9rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '0.5rem',
                                borderRadius: '50px',
                                border: '1px solid var(--color-primary)',
                                color: 'var(--color-primary)',
                                background: 'transparent'
                            }}
                        >
                            <Star size={18} />
                            Recensioni
                        </button>

                        <button
                            onClick={() => {
                                const el = document.getElementById('chi-siamo');
                                if (el) {
                                    const yOffset = -80; // Offset per lo scrolling
                                    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
                                    window.scrollTo({ top: y, behavior: 'smooth' });
                                } else {
                                    navigate('/#chi-siamo');
                                }
                            }}
                            className="btn btn-outline"
                            style={{ 
                                width: '100%', 
                                padding: '0.6rem 1rem', 
                                fontSize: '0.9rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '0.5rem',
                                borderRadius: '50px',
                                border: '1px solid var(--color-primary)',
                                color: 'var(--color-primary)',
                                background: 'transparent'
                            }}
                        >
                            <MapPin size={18} />
                            Chi e Dove siamo
                        </button>

                        <button
                            onClick={scrollToContacts}
                            className="btn btn-outline"
                            style={{ 
                                width: '100%', 
                                padding: '0.6rem 1rem', 
                                fontSize: '0.9rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '0.5rem',
                                borderRadius: '50px',
                                border: '1px solid var(--color-primary)',
                                color: 'var(--color-primary)',
                                background: 'transparent'
                            }}
                        >
                            <MessageCircle size={18} />
                            Contatti
                        </button>

                        {showPrompt && (
                            <button
                                onClick={handleInstallClick}
                                className="btn btn-outline"
                                style={{ 
                                    width: '100%', 
                                    padding: '0.6rem 1rem', 
                                    fontSize: '0.9rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '0.5rem',
                                    borderRadius: '50px',
                                    border: '1px solid var(--color-primary)',
                                    color: 'var(--color-primary)',
                                    background: 'transparent'
                                }}
                            >
                                <Download size={18} />
                                Installa App
                            </button>
                        )}
                    </div>
                </>
            )}
        </header>
    );
};

export default Header;

