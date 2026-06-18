import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, MapPin, Info, ShoppingBag } from 'lucide-react';
import { formatCustomText } from '../utils/textFormatting';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';

const SharedEvent = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            try {
                const found = await api.getEventBySlug(slug);
                if (found) {
                    setEvent(found);
                    setError(null);
                } else {
                    setError('Evento non trovato.');
                }
            } catch (err) {
                console.error('Error fetching event:', err);
                setError('Errore nel caricamento dell\'evento.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [slug]);

    const productsContainerRef = React.useRef(null);
    const [isProductsPaused, setIsProductsPaused] = useState(false);
    const productsPauseTimeoutRef = React.useRef(null);

    useEffect(() => {
        const container = productsContainerRef.current;
        if (!container || !event?.products || event.products.length <= 1) return;

        const interval = setInterval(() => {
            if (isProductsPaused) return;

            const cardWidth = container.firstChild?.offsetWidth || 240;
            const gap = 24; // 1.5rem gap is 24px
            const scrollStep = cardWidth + gap;

            const maxScrollLeft = container.scrollWidth - container.clientWidth;
            if (container.scrollLeft >= maxScrollLeft - 10) {
                container.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                container.scrollBy({ left: scrollStep, behavior: 'smooth' });
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [isProductsPaused, event?.products]);

    const handleProductsInteraction = () => {
        setIsProductsPaused(true);
        if (productsPauseTimeoutRef.current) clearTimeout(productsPauseTimeoutRef.current);
        productsPauseTimeoutRef.current = setTimeout(() => {
            setIsProductsPaused(false);
        }, 5000);
    };

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            <p>Caricamento evento...</p>
        </div>
    );

    if (error || !event) return (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h2 style={{ color: 'var(--color-primary-dark)' }}>Oops!</h2>
            <p>{error || 'Si è verificato un errore.'}</p>
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>Torna alla Home</button>
        </div>
    );

    const hasWhere = !!(event.where_description || event.where_image_url);
    const hasProducts = event.products && event.products.length > 0;
    const hasInfo = !!event.info_description;

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem 1rem', position: 'relative' }}>
            <h1 className="brand-logo" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '1.4rem', margin: 0, zIndex: 10 }}>Muse Catering</h1>
            
            <button 
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginBottom: '2rem', fontSize: '1rem', fontWeight: 'bold' }}
            >
                <ArrowLeft size={20} /> Torna alla Home
            </button>

            {/* Event Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem', padding: '0 1rem' }}>
                <h1 style={{ 
                    color: 'var(--color-primary-dark)', 
                    fontWeight: '800', 
                    fontSize: '2.4rem', 
                    marginBottom: '0.5rem',
                    lineHeight: '1.2' 
                }}>
                    {event.name}
                </h1>
                <div style={{ 
                    color: 'var(--color-primary)', 
                    fontWeight: '700', 
                    fontSize: '1.6rem',
                    letterSpacing: '0.05em'
                }}>
                    {event.date_text}
                </div>
            </div>

            {/* Section 1: Dove saremo */}
            {hasWhere && (
                <section style={{ marginBottom: '3.5rem' }}>
                    <a 
                        href={event.where_link || '#'} 
                        target={event.where_link ? "_blank" : undefined}
                        rel={event.where_link ? "noopener noreferrer" : undefined} 
                        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                        className={event.where_link ? "card-clickable-link" : ""}
                    >
                        <div className="premium-card" style={{ 
                            display: 'flex', 
                            flexDirection: window.innerWidth > 600 ? 'row' : 'column', 
                            overflow: 'hidden', 
                            cursor: event.where_link ? 'pointer' : 'default',
                            transition: 'all 0.3s ease',
                            border: '1px solid rgba(0,0,0,0.05)'
                        }}>
                            {event.where_image_url && (
                                <div style={{ 
                                    width: window.innerWidth > 600 ? '250px' : '100%', 
                                    height: '250px', 
                                    flexShrink: 0,
                                    overflow: 'hidden'
                                }}>
                                    <img 
                                        src={event.where_image_url} 
                                        alt="Dove saremo" 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} 
                                        className="card-hover-img"
                                    />
                                </div>
                            )}
                            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary-dark)' }}>
                                    <MapPin size={28} />
                                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{event.where_title || 'Dove saremo'}</h3>
                                </div>
                                <p 
                                    style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', fontSize: '1.05rem' }}
                                    dangerouslySetInnerHTML={{ __html: formatCustomText(event.where_description) }}
                                />
                                {event.where_link && (
                                    <span style={{ 
                                        color: 'var(--color-primary)', 
                                        fontWeight: '700', 
                                        fontSize: '0.95rem',
                                        marginTop: 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        Apri mappa esterno &rarr;
                                    </span>
                                )}
                            </div>
                        </div>
                    </a>
                </section>
            )}

            {/* Section 2: I prodotti che porteremo */}
            {hasProducts && (
                <section style={{ marginBottom: '3.5rem' }}>
                    <h2 style={{ 
                        color: 'var(--color-primary-dark)', 
                        fontSize: '1.7rem', 
                        marginBottom: '1.2rem',
                        fontWeight: '700',
                        borderBottom: '1px solid var(--color-border)',
                        paddingBottom: '0.5rem'
                    }}>
                        {event.products_title || 'I prodotti che porteremo'}
                    </h2>
                    
                    {event.products_description && (
                        <p 
                            style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}
                            dangerouslySetInnerHTML={{ __html: formatCustomText(event.products_description) }}
                        />
                    )}

                    <div 
                        ref={productsContainerRef}
                        onTouchStart={handleProductsInteraction}
                        onMouseDown={handleProductsInteraction}
                        onWheel={handleProductsInteraction}
                        style={{ 
                            display: 'flex', 
                            gap: '1.5rem', 
                            overflowX: 'auto', 
                            paddingTop: '15px',
                            marginTop: '-15px',
                            paddingBottom: '1.5rem',
                            marginBottom: '-0.5rem',
                            scrollSnapType: 'x mandatory',
                            WebkitOverflowScrolling: 'touch',
                            paddingLeft: '0.25rem'
                        }}
                    >
                        {event.products.map(prod => (
                            <div 
                                key={prod.id} 
                                onClick={() => setSelectedProduct(prod)}
                                className="premium-card hover-lift"
                                style={{ 
                                    flex: '0 0 240px',
                                    scrollSnapAlign: 'start',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {prod.image_url && (
                                    <div style={{ height: '160px', width: '100%', overflow: 'hidden' }}>
                                        <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                )}
                                <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)', fontWeight: 'bold' }}>{prod.name}</h4>
                                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-primary)', fontWeight: '700' }}>
                                        {prod.is_sold_by_piece 
                                            ? `€ ${Number(prod.price_per_piece || 0).toFixed(2)} / pz` 
                                            : `€ ${Number(prod.price_per_kg || 0).toFixed(2)} / kg`}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                                        {prod.is_gluten_free && <span className="badge-elegant badge-elegant-gf" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>GF</span>}
                                        {prod.is_lactose_free && <span className="badge-elegant badge-elegant-lf" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>LF</span>}
                                        {prod.is_vegetarian && <span className="badge-elegant badge-elegant-v" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>VGT</span>}
                                        {prod.is_vegan && <span className="badge-elegant badge-elegant-vg" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>VEG</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Section 3: Altre informazioni */}
            {hasInfo && (
                <section style={{ marginBottom: '3.5rem' }}>
                    <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '1.5rem' }}></div>
                    
                    <div className="premium-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary-dark)' }}>
                            <Info size={28} />
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{event.info_title || 'Altre informazioni'}</h3>
                        </div>
                        <p 
                            style={{ color: 'var(--color-text-muted)', lineHeight: '1.7', fontSize: '1.05rem' }}
                            dangerouslySetInnerHTML={{ __html: formatCustomText(event.info_description) }}
                        />
                    </div>
                </section>
            )}

            {/* Product Details Modal */}
            {selectedProduct && (
                <ProductDetailsModal 
                    product={selectedProduct} 
                    alwaysShowPrices={true}
                    onClose={() => {
                        setIsClosing(true);
                        setTimeout(() => {
                            setSelectedProduct(null);
                            setIsClosing(false);
                        }, 300);
                    }}
                    isClosing={isClosing}
                />
            )}
        </div>
    );
};

export default SharedEvent;
