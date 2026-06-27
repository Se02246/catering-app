import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useSetting, useCaterings, useReviews, useProducts } from '../hooks/useData';
import { ArrowLeft, MapPin, Info, ShoppingBag, MessageSquare, MessageCircle, Instagram, Star, ChevronLeft, ChevronRight, Gift, ArrowRight } from 'lucide-react';
import { formatCustomText } from '../utils/textFormatting';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';

const CompactReviewCard = ({ review }) => {
    const formattedDate = new Date(review.created_at).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div 
            className="glass-panel" 
            style={{ 
                padding: '1.2rem', 
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                minWidth: '260px',
                maxWidth: '260px',
                background: 'var(--color-white)',
                border: '1px solid rgba(155, 57, 61, 0.05)',
                boxShadow: 'var(--shadow-sm)',
                height: '100%',
                justifyContent: 'space-between'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                    <h4 style={{ 
                        margin: 0, 
                        fontSize: '1rem', 
                        color: 'var(--color-primary-dark)', 
                        fontWeight: 'bold', 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.4',
                        minHeight: '2.8rem'
                    }}>
                        {review.title}
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'block', marginTop: '2px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {review.author_name || 'Utente Anonimo'}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '1px', color: '#FFD700', flexShrink: 0 }}>
                    {[...Array(5)].map((_, i) => (
                        <Star 
                            key={i} 
                            size={14} 
                            fill={i < review.rating ? '#FFD700' : 'transparent'} 
                            color={i < review.rating ? '#FFD700' : 'var(--color-border)'} 
                        />
                    ))}
                </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '0.5rem' }}>
                {formattedDate}
            </span>
        </div>
    );
};

const SharedEventLotteryCard = ({ event, navigate }) => {
    const config = event.lottery_config;
    const { products } = useProducts();
    const [currentImgIndex, setCurrentImgIndex] = React.useState(0);
    
    let activeStep = config?.active_step || 1;

    if (activeStep === 1 && config?.step2?.activation_date) {
        if (new Date() >= new Date(config.step2.activation_date)) {
            activeStep = 2;
        }
    }
    
    // Gestione premi
    const prizeIds = config?.prize_product_ids || [];
    const showPrizes = activeStep > 1 || config?.show_prizes_step1;
    
    const prizeImages = prizeIds
        .map(id => products?.find(p => p.id === id)?.image_url)
        .filter(Boolean);
        
    React.useEffect(() => {
        if (!showPrizes || prizeImages.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentImgIndex(prev => (prev + 1) % prizeImages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [showPrizes, prizeImages.length]);

    if (!config || !config.is_enabled) return null;

    let displayTitle = config.step1?.title || 'Lotteria dell\'Evento';
    let displayDesc = config.step1?.description || 'Partecipa alla nostra lotteria!';

    if (activeStep === 2) {
        displayTitle = config.step2?.title || 'Lotteria Attiva!';
        displayDesc = config.step2?.description || 'Scopri come partecipare.';
    } else if (activeStep === 3) {
        displayTitle = config.step3?.title || 'Abbiamo un Vincitore!';
        displayDesc = config.step3?.description || 'Grazie per aver partecipato!';
    }
    
    // Fallback migration check
    const winnerNames = config.step3?.winner_names && config.step3.winner_names.length > 0 
        ? config.step3.winner_names 
        : (config.step3?.winner_name ? [config.step3.winner_name] : []);

    return (
        <section style={{ marginBottom: '3.5rem' }}>
            <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: '1.5rem' }}></div>
            
            <div className="premium-card fade-in hover-lift" 
                onClick={() => {
                    navigate(`/event/${event.slug}/lotteria`);
                    window.scrollTo(0, 0);
                }}
                style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    border: '1px solid rgba(197, 160, 89, 0.3)', 
                    background: 'linear-gradient(135deg, rgba(255,253,240,1) 0%, rgba(255,255,255,1) 100%)',
                    cursor: 'pointer',
                    overflow: 'hidden'
                }}
            >
                {showPrizes && prizeImages.length > 0 && (
                    <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                        {prizeImages.map((img, i) => (
                            <img
                                key={i}
                                src={img}
                                alt="Premio Lotteria"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'opacity 1s ease-in-out',
                                    opacity: currentImgIndex === i ? 1 : 0,
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    zIndex: currentImgIndex === i ? 2 : 1
                                }}
                            />
                        ))}
                    </div>
                )}

                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-accent)' }}>
                        <Gift size={28} />
                        <h3 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            LOTTERIA
                        </h3>
                    </div>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                        {displayTitle}
                    </h4>

                    <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.7', fontSize: '1.05rem', margin: 0 }}>
                        <span dangerouslySetInnerHTML={{ __html: formatCustomText(displayDesc) }} />
                    </p>



                    <button 
                        className="btn btn-outline" 
                        style={{ 
                            width: '100%', 
                            marginTop: '1rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.4rem', 
                            padding: '0.8rem 1rem', 
                            fontSize: '1rem', 
                            borderColor: 'var(--color-accent)', 
                            color: 'var(--color-accent)' 
                        }}
                    >
                        Scopri di più <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </section>
    );
};

const SharedEvent = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
     const [selectedProduct, setSelectedProduct] = useState(null);
     const [isClosing, setIsClosing] = useState(false);
     
     const [selectedPackage, setSelectedPackage] = useState(null);
     const [isPackageClosing, setIsPackageClosing] = useState(false);
     const [activeImageIndex, setActiveImageIndex] = useState(0);
 
     // Swipe-to-close states for Package Modal on mobile
     const [packageDragY, setPackageDragY] = useState(0);
     const [isPackageDragging, setIsPackageDragging] = useState(false);
     const [isPackageSwipingOut, setIsPackageSwipingOut] = useState(false);
     const packageTouchStartY = React.useRef(0);
     const packageTouchStartX = React.useRef(0);
     const packageScrollAreaRef = React.useRef(null);
 
     const { setting: hideHomeBtnSetting, isLoading: isHideHomeLoading } = useSetting('hide_event_home_button');
     const showHomeButton = !isHideHomeLoading && hideHomeBtnSetting?.value !== 'true';
 
     const { setting: showQuoteSetting, isLoading: isQuoteSettingLoading } = useSetting('show_quote_builder');
     const { setting: showPricesSetting, isLoading: isPricesSettingLoading } = useSetting('show_product_prices');
 
     const showProductPrices = !isPricesSettingLoading && showPricesSetting?.value !== 'false';
     const showQuoteBuilder = !isQuoteSettingLoading && showQuoteSetting?.value !== 'false' && showProductPrices;
 
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
 
     const openPackage = (pkg) => {
         setPackageDragY(0);
         setIsPackageDragging(false);
         setIsPackageSwipingOut(false);
         window.history.pushState({ modal: 'package' }, '');
         setSelectedPackage(pkg);
     };
 
     const closePackage = () => {
         window.history.back();
     };
 
     const handlePackageTouchStart = (e) => {
         if (packageScrollAreaRef.current && packageScrollAreaRef.current.scrollTop <= 0) {
             packageTouchStartY.current = e.touches[0].clientY;
             packageTouchStartX.current = e.touches[0].clientX;
         }
     };
 
     const handlePackageTouchMove = (e) => {
         const currentY = e.touches[0].clientY;
         const currentX = e.touches[0].clientX;
         const deltaY = currentY - packageTouchStartY.current;
         const deltaX = Math.abs(currentX - packageTouchStartX.current);
 
         if (!isPackageDragging) {
             if (deltaY > 10 && deltaY > deltaX && packageScrollAreaRef.current && packageScrollAreaRef.current.scrollTop <= 0) {
                 setIsPackageDragging(true);
             }
             return;
         }
 
         if (deltaY > 0) {
             setPackageDragY(deltaY);
             if (e.cancelable) e.preventDefault();
         } else {
             setPackageDragY(0);
             setIsPackageDragging(false);
         }
     };
 
     const handlePackageTouchEnd = () => {
         if (!isPackageDragging) return;
         if (packageDragY > 150) {
             setIsPackageSwipingOut(true);
             setPackageDragY(window.innerHeight);
             setTimeout(() => {
                 setSelectedPackage(null);
                 setIsPackageClosing(false);
                 setIsPackageSwipingOut(false);
             }, 300);
         } else {
             setPackageDragY(0);
         }
         setIsPackageDragging(false);
     };
 
     const handleGalleryScroll = (e) => {
         const scrollPosition = e.target.scrollLeft;
         const width = e.target.offsetWidth;
         const newIndex = Math.round(scrollPosition / width);
         if (newIndex !== activeImageIndex) {
             setActiveImageIndex(newIndex);
         }
     };
 
     useEffect(() => {
         if (!selectedPackage) setActiveImageIndex(0);
     }, [selectedPackage]);
 
     useEffect(() => {
         const handlePopState = () => {
             if (selectedPackage) {
                 setIsPackageClosing(true);
                 setTimeout(() => {
                     setSelectedPackage(null);
                     setIsPackageClosing(false);
                     setIsPackageSwipingOut(false);
                 }, 500);
             }
         };
 
         window.addEventListener('popstate', handlePopState);
         return () => window.removeEventListener('popstate', handlePopState);
     }, [selectedPackage]);
 
     const handleBookPackage = async (pkg) => {
         const url = `${window.location.origin}/package/${pkg.id}`;
         const phoneNumber = "393495416637";
         const message = `Ciao Barbara, sono interessato al pacchetto "${pkg.name}". Puoi vedere i dettagli qui:\n\n${url}`;
         window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
     };
 
     useEffect(() => {
         if (selectedPackage || selectedProduct) {
             document.body.style.overflow = 'hidden';
         } else {
             document.body.style.overflow = 'unset';
         }
         return () => {
             document.body.style.overflow = 'unset';
         };
     }, [selectedPackage, selectedProduct]);
 
     const packagesContainerRef = React.useRef(null);
     const [isPackagesPaused, setIsPackagesPaused] = useState(false);
     const packagesPauseTimeoutRef = React.useRef(null);
 
     const reviewsContainerRef = React.useRef(null);
     const [isReviewsPaused, setIsReviewsPaused] = useState(false);
     const reviewsPauseTimeoutRef = React.useRef(null);
 
     const handlePackagesInteraction = () => {
         setIsPackagesPaused(true);
         if (packagesPauseTimeoutRef.current) clearTimeout(packagesPauseTimeoutRef.current);
         packagesPauseTimeoutRef.current = setTimeout(() => {
             setIsPackagesPaused(false);
         }, 5000);
     };
 
     const handleReviewsInteraction = () => {
         setIsReviewsPaused(true);
         if (reviewsPauseTimeoutRef.current) clearTimeout(reviewsPauseTimeoutRef.current);
         reviewsPauseTimeoutRef.current = setTimeout(() => {
             setIsReviewsPaused(false);
         }, 5000);
     };
 
     useEffect(() => {
         const container = packagesContainerRef.current;
         if (!container || !processedCaterings || processedCaterings.length <= 1) return;
 
         const getSnapPosition = (container, child, index, total) => {
             const X = child.offsetLeft;
             const W = container.clientWidth;
             if (index === 0) return 0;
             if (index === total - 1) return Math.min(X, container.scrollWidth - W);
             return X;
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
             if (isPackagesPaused) return;
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
     }, [isPackagesPaused, processedCaterings.length]);
 
     useEffect(() => {
         const container = reviewsContainerRef.current;
         if (!container || !sortedReviews || sortedReviews.length <= 1) return;
 
         const getSnapPosition = (container, child, index, total) => {
             const X = child.offsetLeft;
             const W = container.clientWidth;
             if (index === 0) return 0;
             if (index === total - 1) return Math.min(X, container.scrollWidth - W);
             return X;
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
             if (isReviewsPaused) return;
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
     }, [isReviewsPaused, sortedReviews.length]);

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
    }, [isProductsPaused, event?.products?.length]);

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
                        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                    >
                        <ArrowLeft size={24} /> Visita il sito
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

            {/* Section: Lotteria */}
            <SharedEventLotteryCard event={event} navigate={navigate} />

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

            {/* Linea separatrice per far capire il cambio di sezione */}
            {showHomeButton && (
                <div style={{ borderTop: '2px solid var(--color-border)', margin: '4rem 0' }}></div>
            )}

            {/* Section 4: Scopri Muse Catering */}
            {showHomeButton && (
                <div className="premium-card fade-in" style={{ 
                    padding: '2rem', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '2rem', 
                    marginTop: '2rem', 
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
                                gap: '0.6rem', 
                                padding: '0.8rem 2.5rem', 
                                fontSize: '1.1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Visita il sito
                        </button>
                    </div>

                    {/* Dove Siamo */}
                    <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-white)', borderRadius: '24px' }}>
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

                    {/* Packages Carousel */}
                    {processedCaterings.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem', fontWeight: 'bold' }}>
                                I Nostri Pacchetti
                            </h3>
                            <div 
                                ref={packagesContainerRef}
                                onTouchStart={handlePackagesInteraction}
                                onMouseDown={handlePackagesInteraction}
                                onWheel={handlePackagesInteraction}
                                style={{ 
                                    display: 'flex', 
                                    gap: '1.2rem', 
                                    overflowX: 'auto', 
                                    paddingTop: '15px',
                                    marginTop: '-15px',
                                    paddingBottom: '1.5rem',
                                    marginBottom: '-0.5rem',
                                    scrollSnapType: 'x mandatory',
                                    WebkitOverflowScrolling: 'touch'
                                }}
                            >
                                {processedCaterings.map(pkg => (
                                    <div key={pkg.id} style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', flexShrink: 0 }}>
                                        <div 
                                            onClick={() => openPackage(pkg)}
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
                                                borderRadius: '24px' // Arrotondati di più
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
                             <div 
                                 ref={reviewsContainerRef}
                                 onTouchStart={handleReviewsInteraction}
                                 onMouseDown={handleReviewsInteraction}
                                 onWheel={handleReviewsInteraction}
                                 style={{ 
                                     display: 'flex', 
                                     gap: '1.2rem', 
                                     overflowX: 'auto', 
                                     paddingTop: '15px',
                                     marginTop: '-15px',
                                     paddingBottom: '1.5rem',
                                     marginBottom: '-0.5rem',
                                     scrollSnapType: 'x mandatory',
                                     WebkitOverflowScrolling: 'touch',
                                     alignItems: 'stretch'
                                 }}
                             >
                                 {sortedReviews.map(review => (
                                     <div key={review.id} style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always', flexShrink: 0, display: 'flex' }}>
                                         <CompactReviewCard review={review} />
                                     </div>
                                 ))}
                             </div>
                             <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                                 <button
                                     className="btn btn-outline"
                                     onClick={() => { navigate('/recensioni'); window.scrollTo(0, 0); }}
                                     style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                 >
                                     <Star size={16} /> Vedi tutte le recensioni
                                 </button>
                             </div>
                        </div>
                    )}

                    {/* Contatti */}
                    <div className="premium-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--color-white)', borderRadius: '24px', marginTop: '0.5rem' }}>
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
            )}

            {/* Package Details Modal */}
            {selectedPackage && (
                <div
                    className={`modal-overlay ${isPackageClosing ? 'closing' : ''}`}
                    onClick={closePackage}
                    style={{ zIndex: 3000 }}
                >
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '800px',
                            margin: 'auto',
                            touchAction: 'none'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {selectedPackage.hide_at && (
                            <div
                                className={`package-badge ${isPackageClosing ? 'closing' : ''}`}
                                style={{
                                    top: '-12px',
                                    right: '-5px',
                                    zIndex: 3010,
                                    position: 'absolute',
                                    opacity: isPackageDragging ? 1 - (packageDragY / 200) : (isPackageClosing ? 0 : 1),
                                    transform: packageDragY > 0 ? `translate3d(0, ${packageDragY}px, 0)` : 'none'
                                }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    Disponibile fino al {new Date(selectedPackage.hide_at).toLocaleDateString('it-IT')}
                                </span>
                            </div>
                        )}

                        <div
                            className={`modal-content ${isPackageClosing && !isPackageSwipingOut ? 'closing' : ''}`}
                            style={{
                                width: '100%',
                                maxWidth: '800px',
                                padding: '0',
                                overflow: 'hidden',
                                transform: packageDragY > 0 ? `translate3d(0, ${packageDragY}px, 0)` : '',
                                transition: isPackageDragging ? 'none' : 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), opacity 0.3s ease',
                                animation: isPackageDragging || packageDragY > 0 || isPackageSwipingOut ? 'none' : undefined,
                                opacity: isPackageSwipingOut ? 0 : 1
                            }}
                            onTouchStart={handlePackageTouchStart}
                            onTouchMove={handlePackageTouchMove}
                            onTouchEnd={handlePackageTouchEnd}
                        >
                            {/* Floating Back Button */}
                            <button
                                onClick={closePackage}
                                style={{
                                    position: 'absolute', top: '1rem', left: '1rem',
                                    background: 'rgba(255,255,255,0.9)', border: 'none',
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', zIndex: 100, boxShadow: 'var(--shadow-md)',
                                    backdropFilter: 'blur(4px)',
                                    opacity: isPackageDragging ? 1 - (packageDragY / 200) : 1
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>

                            <div
                                ref={packageScrollAreaRef}
                                className="modal-scroll-area"
                            >
                                {/* Image Gallery */}
                                <div className="package-modal-image-side" style={{ width: '100%', position: 'relative' }}>
                                    <div
                                        onScroll={handleGalleryScroll}
                                        style={{
                                            display: 'flex',
                                            overflowX: 'auto',
                                            scrollSnapType: 'x mandatory',
                                            width: '100%',
                                            height: '100%',
                                            scrollbarWidth: 'none',
                                            WebkitOverflowScrolling: 'touch'
                                        }}
                                    >
                                        {selectedPackage.images && selectedPackage.images.length > 0 ? (
                                            selectedPackage.images.map((img, idx) => (
                                                <div key={idx} style={{
                                                    minWidth: '100%',
                                                    height: '100%',
                                                    scrollSnapAlign: 'start',
                                                    scrollSnapStop: 'always'
                                                }}>
                                                    <img
                                                        src={img}
                                                        alt={`${selectedPackage.name} ${idx + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            display: 'block'
                                                        }}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ width: '100%', height: '100%' }}>
                                                <img
                                                    src={selectedPackage.image_url || 'https://placehold.co/600x400?text=Muse+Catering'}
                                                    alt={selectedPackage.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination Dots */}
                                    {selectedPackage.images?.length > 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '1rem',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            display: 'flex',
                                            gap: '6px',
                                            zIndex: 5,
                                            padding: '6px 10px',
                                            background: 'rgba(0,0,0,0.3)',
                                            borderRadius: '20px',
                                            backdropFilter: 'blur(4px)'
                                        }}>
                                            {selectedPackage.images.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        width: activeImageIndex === idx ? '8px' : '6px',
                                                        height: activeImageIndex === idx ? '8px' : '6px',
                                                        borderRadius: '50%',
                                                        background: activeImageIndex === idx ? 'white' : 'rgba(255,255,255,0.5)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Content Side */}
                                <div className="package-modal-content-side" style={{ width: '100%', background: 'var(--color-bg)' }}>
                                    <div style={{ padding: window.innerWidth > 768 ? '2.5rem' : '1.5rem' }}>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <div className="dietary-badges" style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                {selectedPackage.is_gluten_free && <span className="badge-elegant badge-elegant-gf">Senza Glutine</span>}
                                                {selectedPackage.is_lactose_free && <span className="badge-elegant badge-elegant-lf">Senza Lattosio</span>}
                                                {selectedPackage.is_vegetarian && <span className="badge-elegant badge-elegant-v">Vegetariano</span>}
                                                {selectedPackage.is_vegan && <span className="badge-elegant badge-elegant-vg">Vegano</span>}
                                            </div>
                                            <h2 style={{ fontSize: window.innerWidth > 768 ? '2.2rem' : '1.8rem', color: 'var(--color-primary-dark)', marginBottom: '1.2rem', lineHeight: '1.1' }}>
                                                {selectedPackage.name}
                                            </h2>
                                            <div
                                                style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--color-text-muted)' }}
                                                dangerouslySetInnerHTML={{ __html: formatCustomText(selectedPackage.description) }}
                                            />
                                        </div>

                                        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.2rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '25px', height: '2px', background: 'var(--color-accent)' }}></div>
                                            Incluso nel pacchetto
                                        </h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                                            {selectedPackage.items && selectedPackage.items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="glass-panel"
                                                    style={{
                                                        padding: '1.2rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1.2rem',
                                                        cursor: 'pointer',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid rgba(155, 57, 61, 0.05)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedProduct(item);
                                                    }}
                                                >
                                                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                                                        <img
                                                            src={item.image_url || item.images?.[0] || 'https://placehold.co/100x100?text=Food'}
                                                            alt={item.name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--color-text)' }}>{item.name}</div>
                                                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                                {item.is_gluten_free && !selectedPackage.is_gluten_free && (
                                                                    <span style={{ color: '#FF9800', fontSize: '0.6rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        Senza Glutine
                                                                    </span>
                                                                )}
                                                                {item.is_lactose_free && !selectedPackage.is_lactose_free && (
                                                                    <span style={{ color: '#03A9F4', fontSize: '0.6rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        Senza Lattosio
                                                                    </span>
                                                                )}
                                                                {item.is_vegetarian && !selectedPackage.is_vegetarian && (
                                                                    <span style={{ color: '#8BC34A', fontSize: '0.6rem', fontWeight: 'bold', backgroundColor: 'rgba(139, 195, 74, 0.1)', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        Vegetariano
                                                                    </span>
                                                                )}
                                                                {item.is_vegan && !selectedPackage.is_vegan && (
                                                                    <span style={{ color: '#388E3C', fontSize: '0.6rem', fontWeight: 'bold', backgroundColor: 'rgba(56, 142, 60, 0.1)', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        Vegano
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 800, marginTop: '0.2rem' }}>
                                                            {item.is_sold_by_piece
                                                                ? `${parseFloat(item.quantity)} pz`
                                                                : `${parseFloat(item.quantity)} kg`
                                                            }
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={20} color="var(--color-accent-light)" />
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{
                                            padding: '2rem 0 0.5rem',
                                            borderTop: '1px solid rgba(155, 57, 61, 0.1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1.2rem'
                                        }}>
                                            <div className="price-container" style={{ textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Totale Esperienza</span>
                                                {selectedPackage.discount_percentage > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>€ {selectedPackage.total_price}</span>
                                                        <span className="price-main price-discount" style={{ fontSize: '2.4rem' }}>
                                                            € {(selectedPackage.total_price * (1 - selectedPackage.discount_percentage / 100)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="price-main" style={{ fontSize: '2.4rem' }}>€ {selectedPackage.total_price}</span>
                                                )}
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '1.2rem', fontSize: '1.1rem' }}
                                                onClick={() => handleBookPackage(selectedPackage)}
                                            >
                                                Prenota Ora
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Details Modal */}
            {selectedProduct && (
                <ProductDetailsModal 
                    product={selectedProduct} 
                    alwaysShowPrices={showProductPrices}
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
