import React from 'react';
import { formatCustomText } from '../../utils/textFormatting';
import { useSetting } from '../../hooks/useData';
import { X, Calendar, Info, ShoppingCart } from 'lucide-react';

const ProductDetailsModal = ({ product, onClose, onAddToCart, isClosing }) => {
    const { setting: showQuoteSetting, isLoading: isSettingLoading } = useSetting('show_quote_builder');
    const showPrice = !isSettingLoading && showQuoteSetting?.value !== 'false';

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
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
            <div
                className={`modal-content ${isClosing ? 'bounce-out' : 'bounce-in'}`}
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '600px', padding: '0', overflow: 'hidden' }}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '1rem', right: '1rem',
                        background: 'rgba(255,255,255,0.8)', border: 'none',
                        width: '36px', height: '36px', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', zIndex: 100, backdropFilter: 'blur(4px)',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <X size={20} />
                </button>

                {/* Image Section */}
                {validImages.length > 0 && (
                    <div style={{ position: 'relative', height: '300px' }}>
                        {validImages.length > 1 ? (
                            <div style={{
                                display: 'flex',
                                overflowX: 'auto',
                                scrollSnapType: 'x mandatory',
                                height: '100%',
                                scrollbarWidth: 'none'
                            }}>
                                {validImages.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`${product.name} ${idx + 1}`}
                                        style={{ width: '100%', flexShrink: 0, objectFit: 'cover', scrollSnapAlign: 'start' }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <img
                                src={validImages[0]}
                                alt={product.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                        
                        {product.hide_at && (
                            <div className="package-badge" style={{ top: '1rem', left: '1rem', right: 'auto' }}>
                                <Calendar size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                                Disponibile fino al {new Date(product.hide_at).toLocaleDateString('it-IT')}
                            </div>
                        )}
                    </div>
                )}

                {/* Content Section */}
                <div style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div className="dietary-badges" style={{ marginBottom: '0.5rem' }}>
                            {product.is_gluten_free && <span className="badge-dietary badge-gf">Senza Glutine</span>}
                            {product.is_lactose_free && <span className="badge-dietary badge-lf">Senza Lattosio</span>}
                        </div>
                        <h2 style={{ fontSize: '2rem', color: 'var(--color-primary-dark)', margin: 0 }}>{product.name}</h2>
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
    );
};

export default ProductDetailsModal;
