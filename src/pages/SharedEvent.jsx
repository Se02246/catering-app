import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useSetting, useCaterings, useReviews } from '../hooks/useData';
import { ArrowLeft, MapPin, Info, ShoppingBag, MessageSquare, MessageCircle, Instagram, Star } from 'lucide-react';
import { formatCustomText } from '../utils/textFormatting';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';
import ReviewCard from '../components/Common/ReviewCard';

const SharedEvent = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    
     const { setting: hideHomeBtnSetting } = useSetting('hide_event_home_button');
     const showHomeButton = hideHomeBtnSetting?.value !== 'true';
 
     const { setting: showQuoteSetting } = useSetting('show_quote_builder');
     const { setting: showPricesSetting } = useSetting('show_product_prices');
 
     const showProductPrices = showPricesSetting?.value !== 'false';
     const showQuoteBuilder = showQuoteSetting?.value !== 'false' && showProductPrices;
 
     const { caterings } = useCaterings();
     const { reviews } = useReviews();
 
     const processedCaterings = React.useMemo(() => {
         const now = new Date();
         return (caterings || [])
             .filter(pkg => {
                 const isVisible = pkg.is_visible !== false;
                 const isNotExpired = !pkg.hide_at || new Date(pkg.hide_at) > now;
                 return isVisible && isNotExpired;
             })
             .map(pkg => ({
                 ...pkg,
                 images: pkg.images || (pkg.image_url ? [pkg.image_url] : [])
             }));
     }, [caterings]);
 
     const sortedReviews = React.useMemo(() => {
         if (!reviews) return [];
         const byHelpful = [...reviews].sort((a, b) => {
             const netA = (a.helpful_count || 0) - (a.unhelpful_count || 0);
             const netB = (b.helpful_count || 0) - (b.unhelpful_count || 0);
             if (netB !== netA) return netB - netA;
             return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
         });
         return byHelpful.slice(0, 10);
     }, [reviews]);
 
     const contactWhatsApp = () => {
         const phoneNumber = "393495416637";
         const message = "Ciao Barbara, vorrei avere maggiori informazioni sui vostri servizi di catering.";
         window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
     };

    useEffect(() => {
        const fetchEvent = async () => {
            setLoading(true);
            try {
                const found = await api.getEventBySlug(slug);
                if (found) {
                    const isVisible = found.is_visible !== false;
                    let isExpired = false;
                    if (found.hide_at) {
                        const hideDate = new Date(found.hide_at);
                        const today = new Date();
                        const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const hideDateOnly = new Date(hideDate.getFullYear(), hideDate.getMonth(), hideDate.getDate());
                        if (todayDateOnly >= hideDateOnly) {
                            isExpired = true;
                        }
                    }

                    if (isVisible && !isExpired) {
                        setEvent(found);
                        setError(null);
                    } else {
                        setError('Questo evento non è più disponibile.');
                    }
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

        const getSnapPosition = (container, child, index, total) => {
            const X = child.offsetLeft;
            const w = child.offsetWidth;
            const W = container.clientWidth;
            
            if (index === 0) {
                return 0; // Align to start
            } else if (index === total - 1) {
                return container.scrollWidth - W; // Align to end
            } else {
                return X + (w / 2) - (W / 2); // Align to center
            }
        };

        const getCurrentIndex = (container) => {
            const childrenArr = Array.from(container.children);
            const total = childrenArr.length;
            if (total === 0) return 0;
            
            let closestIndex = 0;
            let minDiff = Infinity;
            
            childrenArr.forEach((child, index) => {
                const snapPos = getSnapPosition(container, child, index, total);
                const diff = Math.abs(container.scrollLeft - snapPos);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = index;
                }
            });
            
            return closestIndex;
        };

        const interval = setInterval(() => {
            if (isProductsPaused) return;

            const childrenArr = Array.from(container.children);
            const total = childrenArr.length;
            if (total <= 1) return;

            const currentIndex = getCurrentIndex(container);
            const nextIndex = (currentIndex + 1) % total;

            const targetChild = childrenArr[nextIndex];
            const targetScrollLeft = getSnapPosition(container, targetChild, nextIndex, total);

            container.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
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
            <div style={{ 
                display: 'flex', 
                justifyContent: showHomeButton ? 'space-between' : 'center', 
                alignItems: 'center', 
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem',
                width: '100%'
            }}>
                {showHomeButton && (
                    <button 
                        onClick={() => navigate('/')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
                    >
                        <ArrowLeft size={20} /> Vai al sito
                    </button>
                )}
                <h1 className="brand-logo" style={{ 
                    fontSize: showHomeButton ? '1.4rem' : '2.2rem', 
                    margin: 0,
                    textAlign: 'center'
                }}>
                    Muse Catering
                </h1>
            </div>

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
                        {event.products.map((prod, index) => (
                            <div 
                                key={prod.id} 
                                onClick={() => setSelectedProduct(prod)}
                                className="premium-card hover-lift"
                                style={{ 
                                    flex: '0 0 240px',
                                    scrollSnapAlign: index === 0 ? 'start' : (index === event.products.length - 1 ? 'end' : 'center'),
                                    scrollSnapStop: 'always',
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

            {/* Section 4: Scopri Muse Catering */}
            {showHomeButton && (
                <div className="premium-card fade-in" style={{ 
                    padding: '2rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2rem', 
                    marginTop: '4rem', 
                    border: '1px solid rgba(155, 57, 61, 0.1)',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(253, 250, 247, 0.95) 100%)',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-xl)'
                }}>
                    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <h2 style={{ fontSize: '2.2rem', margin: 0, color: 'var(--color-primary-dark)', fontFamily: 'var(--font-heading)', fontWeight: '800' }}>
                            Scopri Muse Catering
                        </h2>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => { navigate('/'); window.scrollTo(0, 0); }} 
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.5rem', 
                                padding: '0.6rem 2rem', 
                                fontSize: '0.95rem' 
                            }}
                        >
                            Vai al sito
                        </button>
                    </div>

                    {/* Packages Carousel */}
                    {processedCaterings.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem', fontWeight: 'bold' }}>
                                I Nostri Pacchetti
                            </h3>
                            <div style={{ 
                                display: 'flex', 
                                gap: '1.2rem', 
                                overflowX: 'auto', 
                                paddingBottom: '1rem',
                                scrollSnapType: 'x mandatory',
                                WebkitOverflowScrolling: 'touch'
                            }}>
                                {processedCaterings.map(pkg => (
                                    <div key={pkg.id} style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', flexShrink: 0 }}>
                                        <div 
                                            onClick={() => { navigate(`/package/${pkg.id}`); window.scrollTo(0, 0); }}
                                            className="premium-card hover-lift"
                                            style={{
                                                width: '240px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                overflow: 'hidden',
                                                border: '1px solid rgba(0,0,0,0.05)',
                                                transition: 'all 0.3s ease',
                                                background: 'var(--color-white)',
                                                borderRadius: 'var(--radius-md)'
                                            }}
                                        >
                                            <div style={{ height: '120px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                                                <img src={pkg.images?.[0] || pkg.image_url || 'https://placehold.co/600x400?text=Muse+Catering'} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                {pkg.discount_percentage > 0 && (
                                                    <span style={{ position: 'absolute', top: '8px', right: '8px', background: '#E11D48', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                        -{pkg.discount_percentage}%
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-primary-dark)', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {pkg.name}
                                                </h4>
                                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                    {pkg.is_gluten_free && <span className="badge-elegant badge-elegant-gf" style={{ fontSize: '0.5rem', padding: '1px 3px' }}>GF</span>}
                                                    {pkg.is_lactose_free && <span className="badge-elegant badge-elegant-lf" style={{ fontSize: '0.5rem', padding: '1px 3px' }}>LF</span>}
                                                    {pkg.is_vegetarian && <span className="badge-elegant badge-elegant-v" style={{ fontSize: '0.5rem', padding: '1px 3px' }}>VGT</span>}
                                                    {pkg.is_vegan && <span className="badge-elegant badge-elegant-vg" style={{ fontSize: '0.5rem', padding: '1px 3px' }}>VEG</span>}
                                                </div>
                                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px dashed rgba(0,0,0,0.05)' }}>
                                                    <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                                                        € {pkg.discount_percentage > 0 
                                                            ? (pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)
                                                            : parseFloat(pkg.total_price).toFixed(2)}
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                                        Scopri &rarr;
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Crea Preventivo Button */}
                    {showQuoteBuilder && (
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                            <button 
                                className="btn btn-outline"
                                onClick={() => { navigate('/quote'); window.scrollTo(0, 0); }}
                                style={{ 
                                    width: '100%', 
                                    maxWidth: '300px', 
                                    padding: '0.75rem 1.5rem', 
                                    fontSize: '0.95rem',
                                    borderRadius: 'var(--radius-full)'
                                }}
                            >
                                Crea Preventivo
                            </button>
                        </div>
                    )}

                    {/* Reviews Carousel */}
                    {sortedReviews.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem', fontWeight: 'bold' }}>
                                Dicono di Noi
                            </h3>
                            <div style={{ 
                                display: 'flex', 
                                gap: '1.2rem', 
                                overflowX: 'auto', 
                                paddingBottom: '1rem',
                                scrollSnapType: 'x mandatory',
                                WebkitOverflowScrolling: 'touch',
                                alignItems: 'stretch'
                            }}>
                                {sortedReviews.map(review => (
                                    <div key={review.id} style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', flexShrink: 0, display: 'flex' }}>
                                        <ReviewCard review={review} layout="carousel" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Dove Siamo & Contatti Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginTop: '0.5rem' }}>
                        {/* Dove Siamo */}
                        <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-white)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-dark)' }}>
                                <MapPin size={22} />
                                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Dove Siamo</h4>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                                Specializzati in <strong>catering a domicilio</strong> in tutta la provincia di Nuoro e oltre. Portiamo il servizio direttamente a casa tua!
                            </p>
                            <a 
                                href="https://www.google.com/maps/place/08020+Irgoli+NU/@40.4106048,9.6310529,15z/data=!3m1!4b1!4m6!3m5!1s0x12deede3d3e26b93:0x7986762e93de8660!8m2!3d40.4088282!4d9.6302764!16zL20vMGdxdm1j!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDQyMi4wIKXMDSoASAFQAw%3D%3D"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-outline"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', borderRadius: 'var(--radius-md)' }}
                            >
                                Apri Mappa &rarr;
                            </a>
                        </div>

                        {/* Contatti */}
                        <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-white)', borderRadius: 'var(--radius-md)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary-dark)' }}>
                                <MessageSquare size={22} />
                                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 'bold' }}>Contatti</h4>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                                Siamo a disposizione per organizzare il tuo prossimo evento perfetto. Contattaci!
                            </p>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                <button 
                                    onClick={contactWhatsApp}
                                    className="btn btn-primary"
                                    style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', borderRadius: 'var(--radius-md)' }}
                                >
                                    <MessageCircle size={14} /> WhatsApp
                                </button>
                                <button 
                                    onClick={() => window.open('https://www.instagram.com/muse_catering_?igsh=amNwajZrcW5kczAx', '_blank')}
                                    className="btn btn-outline"
                                    style={{ flex: 1, padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', borderRadius: 'var(--radius-md)' }}
                                >
                                    <Instagram size={14} /> Instagram
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
