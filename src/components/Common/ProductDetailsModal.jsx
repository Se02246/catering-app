import React from 'react';
import { formatCustomText } from '../../utils/textFormatting';
import { useSetting } from '../../hooks/useData';
import { ChevronLeft, Calendar, Info, ShoppingCart } from 'lucide-react';

const ProductDetailsModal = ({ product, onClose, onAddToCart, isClosing }) => {
    const { setting: showQuoteSetting, isLoading: isSettingLoading } = useSetting('show_quote_builder');
    const showPrice = !isSettingLoading && showQuoteSetting?.value !== 'false';
    const [activeImageIndex, setActiveImageIndex] = React.useState(0);
    const scrollAreaRef = React.useRef(null);
    const [dragY, setDragY] = React.useState(0);
    const [isDragging, setIsDragging] = React.useState(false);
    const touchStartY = React.useRef(0);

    const handleTouchStart = (e) => {
        if (scrollAreaRef.current && scrollAreaRef.current.scrollTop <= 0) {
            touchStartY.current = e.touches[0].clientY;
            setIsDragging(true);
        }
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - touchStartY.current;
        
        if (deltaY > 0) {
            setDragY(deltaY);
            // Prevent default scrolling when dragging down at top
            if (e.cancelable) e.preventDefault();
        } else {
            setDragY(0);
            setIsDragging(false);
        }
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        if (dragY > 150) {
            // "Throw" it down
            setDragY(window.innerHeight);
            setTimeout(onClose, 300);
        } else {
            setDragY(0);
        }
        setIsDragging(false);
    };

    const handleGalleryScroll = (e) => {
        const scrollPosition = e.target.scrollLeft;
        const width = e.target.offsetWidth;
        const newIndex = Math.round(scrollPosition / width);
        if (newIndex !== activeImageIndex) {
            setActiveImageIndex(newIndex);
        }
    };

    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!product) return null;

    const validImages = product.images && product.images.length > 0
        ? product.images.filter(img => img && img.trim() !== '')
        : (product.image_url && product.image_url.trim() !== '' ? [product.image_url] : []);

    return (
        <div 
            className={`modal-overlay ${isClosing ? 'closing' : ''}`} 
            onClick={onClose} 
            style={{ zIndex: 3000 }}
        >
            <div 
                style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: 'auto' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Package Badge outside modal-content to prevent clipping */}
                {product.hide_at && (
                    <div 
                        className={`package-badge ${isClosing ? 'closing' : ''}`} 
                        style={{ 
                            top: '-12px', 
                            right: '-5px',
                            zIndex: 3010,
                            position: 'absolute',
                            opacity: isDragging ? 1 - (dragY / 200) : (isClosing ? 0 : 1)
                        }}>
                        <Calendar size={14} /> Disponibile fino al {new Date(product.hide_at).toLocaleDateString('it-IT')}
                    </div>
                )}

                <div
                    className={`modal-content ${isClosing ? 'closing' : ''}`}
                    style={{ 
                        width: '100%', 
                        maxWidth: '600px', 
                        padding: '0', 
                        overflow: 'hidden',
                        transform: dragY > 0 ? `translateY(${dragY}px)` : '',
                        transition: isDragging ? 'none' : 'all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1)'
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Floating Back Button */}
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: '1rem', left: '1rem',
                            background: 'rgba(255,255,255,0.9)', border: 'none',
                            width: '40px', height: '40px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', zIndex: 100, backdropFilter: 'blur(4px)',
                            boxShadow: 'var(--shadow-md)',
                            opacity: isDragging ? 1 - (dragY / 200) : 1
                        }}
                    >
                        <ChevronLeft size={24} />
                    </button>

                    {/* Scrollable Area */}
                    <div 
                        ref={scrollAreaRef}
                        className="modal-scroll-area"
                    >
                        {/* Image Section */}
                        {validImages.length > 0 && (
                            <div style={{ 
                                position: 'relative', 
                                aspectRatio: '4/5',
                                background: '#1A1515', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                                borderRadius: 'var(--radius-xl)'
                            }}>
                                {validImages.length > 1 ? (
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
                                        {validImages.map((img, idx) => (
                                            <div key={idx} style={{ 
                                                minWidth: '100%', 
                                                height: '100%', 
                                                scrollSnapAlign: 'start',
                                                scrollSnapStop: 'always'
                                            }}>
                                                <img
                                                    src={img}
                                                    alt={`${product.name} ${idx + 1}`}
                                                    style={{ 
                                                        width: '100%', 
                                                        height: '100%', 
                                                        objectFit: 'cover',
                                                        display: 'block'
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ width: '100%', height: '100%' }}>
                                        <img
                                            src={validImages[0]}
                                            alt={product.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>
                                )}

                                {/* Instagram-style Pagination Dots */}
                                {validImages.length > 1 && (
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
                                        {validImages.map((_, idx) => (
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
                        )}

                        {/* Content Section */}
                        <div style={{ padding: window.innerWidth > 768 ? '2.5rem' : '1.5rem' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <div className="dietary-badges" style={{ marginBottom: '0.5rem' }}>
                                    {product.is_gluten_free && <span className="badge-dietary badge-gf">Senza Glutine</span>}
                                    {product.is_lactose_free && <span className="badge-dietary badge-lf">Senza Lattosio</span>}
                                </div>
                                <h2 style={{ fontSize: window.innerWidth > 768 ? '2rem' : '1.6rem', color: 'var(--color-primary-dark)', margin: 0 }}>{product.name}</h2>
                            </div>

                            <div 
                                style={{ fontSize: '1rem', lineHeight: '1.7', color: 'var(--color-text-muted)', marginBottom: '2rem' }}
                                dangerouslySetInnerHTML={{ __html: formatCustomText(product.description || 'Nessuna descrizione disponibile.') }}
                            />

                            {/* Product Specs */}
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                gap: '1.5rem',
                                padding: '1.5rem',
                                background: 'rgba(155, 57, 61, 0.03)',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '2rem'
                            }}>
                                {showPrice && (
                                    <div>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                            Prezzo
                                        </span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                                            {product.is_sold_by_piece
                                                ? `€ ${product.price_per_piece} / pz`
                                                : `€ ${product.price_per_kg} / kg`
                                            }
                                        </span>
                                    </div>
                                )}
                                {product.pieces_per_kg && !product.is_sold_by_piece && (
                                    <div>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                            Pezzi/Kg
                                        </span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>{product.pieces_per_kg}</span>
                                    </div>
                                )}
                                {product.show_servings && product.servings_per_unit && (
                                    <div>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem', textTransform: 'uppercase', fontWeight: 700 }}>
                                            Porzioni
                                        </span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '800' }}>{product.servings_per_unit} pers.</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {onAddToCart ? (
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 1, padding: '1rem' }}
                                        onClick={() => {
                                            onAddToCart(product);
                                            onClose();
                                        }}
                                    >
                                        <ShoppingCart size={20} style={{ marginRight: '0.6rem' }} />
                                        Aggiungi al Preventivo
                                    </button>
                                ) : (
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
                                        Chiudi
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsModal;
