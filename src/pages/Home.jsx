import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaterings, useSetting } from '../hooks/useData';
import Header from '../components/Layout/Header';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';
import { formatCustomText } from '../utils/textFormatting';
import { ChevronRight, ChevronLeft, Calendar, Info, ArrowRight, FileText } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const { caterings, isLoading, isError } = useCaterings();
    const { setting: showQuoteSetting, isLoading: isQuoteSettingLoading } = useSetting('show_quote_builder');
    
    const showQuoteBuilder = !isQuoteSettingLoading && showQuoteSetting?.value !== 'false';

    const [selectedPackage, setSelectedPackage] = React.useState(null);
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [isPackageClosing, setIsPackageClosing] = React.useState(false);
    const [isProductClosing, setIsProductClosing] = React.useState(false);
    
    // Swipe to close logic for Package Modal
    const [packageDragY, setPackageDragY] = React.useState(0);
    const [isPackageDragging, setIsPackageDragging] = React.useState(false);
    const packageTouchStartY = React.useRef(0);
    const packageScrollAreaRef = React.useRef(null);

    const handlePackageTouchStart = (e) => {
        if (packageScrollAreaRef.current && packageScrollAreaRef.current.scrollTop <= 0) {
            packageTouchStartY.current = e.touches[0].clientY;
            setIsPackageDragging(true);
        }
    };

    const handlePackageTouchMove = (e) => {
        if (!isPackageDragging) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - packageTouchStartY.current;
        
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
            // "Throw" it down
            setPackageDragY(window.innerHeight);
            setTimeout(closePackage, 300);
        } else {
            setPackageDragY(0);
        }
        setIsPackageDragging(false);
    };

    const processedCaterings = React.useMemo(() => {
        const now = new Date();
        return caterings
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

    React.useEffect(() => {
        if (selectedPackage || selectedProduct) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedPackage, selectedProduct]);

    React.useEffect(() => {
        const handlePopState = (event) => {
            if (selectedProduct) {
                setIsProductClosing(true);
                setTimeout(() => {
                    setSelectedProduct(null);
                    setIsProductClosing(false);
                }, 500);
            } else if (selectedPackage) {
                setIsPackageClosing(true);
                setTimeout(() => {
                    setSelectedPackage(null);
                    setIsPackageClosing(false);
                }, 500);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedPackage, selectedProduct]);

    const [activeImageIndex, setActiveImageIndex] = React.useState(0);

    const handleGalleryScroll = (e) => {
        const scrollPosition = e.target.scrollLeft;
        const width = e.target.offsetWidth;
        const newIndex = Math.round(scrollPosition / width);
        if (newIndex !== activeImageIndex) {
            setActiveImageIndex(newIndex);
        }
    };

    // Reset index when opening/closing
    React.useEffect(() => {
        if (!selectedPackage) setActiveImageIndex(0);
    }, [selectedPackage]);

    const openPackage = (pkg) => {
        window.history.pushState({ modal: 'package' }, '');
        setSelectedPackage(pkg);
    };

    const closePackage = () => {
        window.history.back();
    };

    const openProduct = (prod) => {
        window.history.pushState({ modal: 'product' }, '');
        setSelectedProduct(prod);
    };

    const closeProduct = () => {
        window.history.back();
    };

    const handleBookPackage = async (pkg) => {
        const url = `${window.location.origin}/package/${pkg.id}`;
        const phoneNumber = "393495416637";
        const message = `Ciao Barbara, sono interessato al pacchetto "${pkg.name}". Puoi vedere i dettagli qui:\n\n${url}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '5rem' }}>
            <Header />

            <section id="packages">
                <div className="section-header">
                    <h2>I Nostri Pacchetti</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        Selezioni curate per rendere ogni tuo evento indimenticabile.
                    </p>
                </div>

                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <div className="animate-float" style={{ fontSize: '1.1rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                            Curando i dettagli per te...
                        </div>
                    </div>
                )}

                {isError && (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: '2rem auto', maxWidth: '500px' }}>
                        <Info size={40} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--color-text)', fontWeight: 600 }}>Non siamo riusciti a caricare le proposte.</p>
                        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => window.location.reload()}>Riprova</button>
                    </div>
                )}

                {!isLoading && !isError && (
                    <div className="grid-responsive">
                        {processedCaterings.length === 0 ? (
                            <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '4rem' }}>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
                                    Al momento non ci sono pacchetti disponibili. Torna a trovarci presto!
                                </p>
                            </div>
                        ) : (
                            processedCaterings.map((pkg, index) => (
                                <div
                                    key={pkg.id}
                                    className="premium-card fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {pkg.hide_at && (
                                        <div className="package-badge">
                                            <Calendar size={14} /> Disponibile fino al {new Date(pkg.hide_at).toLocaleDateString('it-IT')}
                                        </div>
                                    )}

                                    <div className="image-wrapper" onClick={() => openPackage(pkg)} style={{ cursor: 'pointer' }}>
                                        <img
                                            src={pkg.image_url || 'https://placehold.co/600x400?text=Muse+Catering'}
                                            alt={pkg.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)' }}
                                            className="card-hover-img"
                                        />
                                    </div>

                                    <div className="card-body">
                                        <div className="dietary-badges" style={{ marginBottom: '1rem' }}>
                                            {pkg.is_gluten_free && <span className="badge-elegant badge-elegant-gf">Senza Glutine</span>}
                                            {pkg.is_lactose_free && <span className="badge-elegant badge-elegant-lf">Senza Lattosio</span>}
                                        </div>

                                        <h3 className="card-title">{pkg.name}</h3>
                                        
                                        <div 
                                            className="card-text"
                                            style={{ 
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}
                                            dangerouslySetInnerHTML={{ __html: formatCustomText(pkg.description) }}
                                        />

                                        <div className="card-footer">
                                            <div className="price-container">
                                                {pkg.discount_percentage > 0 ? (
                                                    <>
                                                        <span className="price-old">€ {pkg.total_price}</span>
                                                        <span className="price-main price-discount">
                                                            € {(pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="price-main">€ {pkg.total_price}</span>
                                                )}
                                            </div>
                                            <button className="btn btn-primary" onClick={() => openPackage(pkg)}>
                                                Scopri di più <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            {showQuoteBuilder && (
                <section id="quote-section" style={{ marginTop: '5rem' }}>
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,245,245,0.8) 100%)' }}>
                        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                            <div style={{ padding: '1rem', borderRadius: '50%', background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>
                                <FileText size={32} />
                            </div>
                        </div>
                        <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '1rem' }}>Non trovi quello che cerchi?</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
                            Crea il tuo preventivo personalizzato scegliendo i singoli prodotti dal nostro catalogo.
                        </p>
                        <button 
                            className="btn btn-primary" 
                            style={{ padding: '1rem 2rem', fontSize: '1.1rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}
                            onClick={() => navigate('/quote')}
                        >
                            Crea Preventivo Personalizzato <ChevronRight size={20} />
                        </button>
                    </div>
                </section>
            )}

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
                        {/* Package Badge outside modal-content to prevent clipping */}
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
                                <Calendar size={14} /> Disponibile fino al {new Date(selectedPackage.hide_at).toLocaleDateString('it-IT')}
                            </div>
                        )}

                        <div
                            className={`modal-content ${isPackageClosing ? 'closing' : ''}`}
                            style={{ 
                                width: '100%', 
                                maxWidth: '800px', 
                                padding: '0', 
                                overflow: 'hidden',
                                transform: packageDragY > 0 ? `translate3d(0, ${packageDragY}px, 0)` : '',
                                transition: isPackageDragging ? 'none' : 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), opacity 0.3s ease',
                                animation: isPackageDragging || packageDragY > 0 ? 'none' : undefined
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
                                {/* Left Side: Image Gallery */}
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

                                {/* Right Side: Content */}
                                <div className="package-modal-content-side" style={{ width: '100%', background: 'var(--color-bg)' }}>
                                    <div style={{ padding: window.innerWidth > 768 ? '2.5rem' : '1.5rem' }}>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <div className="dietary-badges" style={{ marginBottom: '0.75rem' }}>
                                                {selectedPackage.is_gluten_free && <span className="badge-elegant badge-elegant-gf">Senza Glutine</span>}
                                                {selectedPackage.is_lactose_free && <span className="badge-elegant badge-elegant-lf">Senza Lattosio</span>}
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
                                                        openProduct(item);
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
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 800, marginTop: '0.2rem' }}>
                                                            {(item.is_sold_by_piece || (item.pieces_per_kg && parseFloat(item.pieces_per_kg) > 0)) 
                                                                ? `${item.quantity} pz` 
                                                                : `${item.quantity} kg`
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
            
            {selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={closeProduct}
                    isClosing={isProductClosing}
                />
            )}
        </div>
    );
};

export default Home;
