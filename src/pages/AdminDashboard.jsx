import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductManager from '../components/Admin/ProductManager';
import PackageBuilder from '../components/Admin/PackageBuilder';
import SettingsManager from '../components/Admin/SettingsManager';
import QuoteManager from '../components/Admin/QuoteManager';
import ReviewManager from '../components/Admin/ReviewManager';
import EventManager from '../components/Admin/EventManager';
import { 
    Menu, 
    X, 
    FileText, 
    Package, 
    Layers, 
    Calendar, 
    Star, 
    Settings, 
    Home, 
    LogOut,
    ChevronRight
} from 'lucide-react';

const TABS = [
    { id: 'quotes', label: 'Preventivi', icon: FileText, description: 'Gestione e creazione preventivi clienti' },
    { id: 'products', label: 'Prodotti', icon: Package, description: 'Catalogo prodotti, prezzi e visibilità' },
    { id: 'packages', label: 'Pacchetti', icon: Layers, description: 'Menu fissi e pacchetti catering' },
    { id: 'events', label: 'Eventi', icon: Calendar, description: 'Gestione eventi speciali e buffet' },
    { id: 'reviews', label: 'Recensioni', icon: Star, description: 'Approvazione e gestione recensioni clienti' },
    { id: 'settings', label: 'Impostazioni', icon: Settings, description: 'Configurazione generale del sito' },
];

const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'quotes');
    const [autoOpenQuoteModal, setAutoOpenQuoteModal] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const searchId = queryParams.get('searchId') || '';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
        }
    }, [navigate]);

    // Update active tab if URL query changes
    useEffect(() => {
        const tabFromUrl = queryParams.get('tab');
        if (tabFromUrl && tabFromUrl !== activeTab) {
            setActiveTab(tabFromUrl);
        }
    }, [location.search]);

    // Modal / Sidebar scroll lock
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isSidebarOpen]);

    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isSidebarOpen) {
                setIsSidebarOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSidebarOpen]);

    const handleTabSelect = (tabId) => {
        setActiveTab(tabId);
        navigate(`/admin?tab=${tabId}`, { replace: true });
        setIsSidebarOpen(false);
    };

    const currentTabObj = TABS.find(t => t.id === activeTab) || TABS[0];

    return (
        <div className="container admin-dashboard" style={{ position: 'relative', minHeight: '100vh', paddingBottom: '3rem' }}>
            
            {/* Top Navigation Bar with Sidebar Trigger */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 0',
                marginBottom: '1.75rem',
                borderBottom: '1px solid var(--color-border)',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                {/* Left: Button to open sidebar + Current section label */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(true)}
                        className="btn btn-outline"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.6rem',
                            padding: '0.6rem 1.1rem',
                            borderRadius: '12px',
                            fontWeight: '700',
                            backgroundColor: 'white',
                            boxShadow: 'var(--shadow-sm)',
                            border: '1.5px solid var(--color-border)'
                        }}
                        title="Apri menu sezioni"
                    >
                        <Menu size={20} style={{ color: 'var(--color-primary)' }} />
                        <span>Menu</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.35rem', fontWeight: '800', color: 'var(--color-primary-dark)', letterSpacing: '-0.3px' }}>
                            {currentTabObj.label}
                        </span>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', backgroundColor: 'rgba(0,0,0,0.04)', padding: '2px 8px', borderRadius: '6px' }}>
                            Pannello Admin
                        </span>
                    </div>
                </div>

                {/* Right: Quick actions (View public site + Logout) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <a
                        href="/"
                        className="btn btn-outline"
                        style={{
                            padding: '0.55rem 0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.88rem',
                            textDecoration: 'none',
                            borderRadius: '10px',
                            backgroundColor: 'white'
                        }}
                        title="Vai al sito pubblico"
                    >
                        <Home size={17} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ display: 'inline-block' }}>Vedi Sito</span>
                    </a>
                    <button
                        type="button"
                        onClick={() => {
                            localStorage.removeItem('token');
                            window.location.href = '/login';
                        }}
                        className="btn btn-outline"
                        style={{
                            padding: '0.55rem 1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            borderColor: 'rgba(220, 38, 38, 0.4)',
                            color: '#dc2626',
                            fontSize: '0.88rem',
                            borderRadius: '10px',
                            backgroundColor: 'white'
                        }}
                        title="Disconnetti"
                    >
                        <LogOut size={17} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>

            {/* Sidebar Drawer and Backdrop */}
            <div
                className="admin-sidebar-backdrop"
                onClick={() => setIsSidebarOpen(false)}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 5000,
                    opacity: isSidebarOpen ? 1 : 0,
                    pointerEvents: isSidebarOpen ? 'auto' : 'none',
                    transition: 'opacity 0.25s ease'
                }}
            >
                <aside
                    className="admin-sidebar-drawer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        width: '320px',
                        maxWidth: '85vw',
                        backgroundColor: '#1E1214',
                        color: 'white',
                        boxShadow: '6px 0 30px rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                        zIndex: 5001,
                        overflowY: 'auto'
                    }}
                >
                    {/* Sidebar Header */}
                    <div style={{
                        padding: '1.5rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)'
                    }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'white', fontWeight: '800', letterSpacing: '-0.3px' }}>
                                Muse Catering
                            </h3>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-accent-light)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                                Menu Amministrazione
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(false)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                color: 'white',
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease'
                            }}
                            title="Chiudi menu"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Navigation Items */}
                    <nav style={{ flex: 1, padding: '1.25rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isSelected = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => handleTabSelect(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.9rem 1.1rem',
                                        borderRadius: '14px',
                                        border: 'none',
                                        backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                        color: isSelected ? 'white' : 'rgba(255, 255, 255, 0.8)',
                                        fontWeight: isSelected ? '700' : '500',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.18s ease',
                                        boxShadow: isSelected ? '0 4px 16px rgba(155, 57, 61, 0.45)' : 'none'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Icon size={18} style={{ color: isSelected ? 'white' : 'var(--color-accent-light)' }} />
                                        </div>
                                        <div>
                                            <div style={{ lineHeight: '1.2' }}>{tab.label}</div>
                                            <div style={{ fontSize: '0.72rem', color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.45)', marginTop: '2px' }}>
                                                {tab.description}
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} style={{ opacity: isSelected ? 1 : 0.4 }} />
                                </button>
                            );
                        })}
                    </nav>

                    {/* Sidebar Footer */}
                    <div style={{
                        padding: '1.25rem',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)'
                    }}>
                        <a
                            href="/"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                color: 'rgba(255, 255, 255, 0.85)',
                                textDecoration: 'none',
                                fontSize: '0.92rem',
                                backgroundColor: 'rgba(255, 255, 255, 0.06)'
                            }}
                        >
                            <Home size={18} style={{ color: 'var(--color-accent-light)' }} />
                            <span>Vai al sito pubblico</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('token');
                                window.location.href = '/login';
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRadius: '10px',
                                border: '1px solid rgba(220, 38, 38, 0.35)',
                                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                                color: '#fca5a5',
                                fontSize: '0.92rem',
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}
                        >
                            <LogOut size={18} />
                            <span>Disconnetti</span>
                        </button>
                    </div>
                </aside>
            </div>

            {/* Active Content View */}
            {activeTab === 'quotes' && (
                <QuoteManager 
                    initialSearchId={searchId} 
                    autoOpenNewModal={autoOpenQuoteModal} 
                    onModalOpened={() => setAutoOpenQuoteModal(false)} 
                />
            )}
            {activeTab === 'products' && <ProductManager />}
            {activeTab === 'packages' && <PackageBuilder />}
            {activeTab === 'events' && <EventManager />}
            {activeTab === 'reviews' && <ReviewManager />}
            {activeTab === 'settings' && <SettingsManager />}

        </div>
    );
};

export default AdminDashboard;
