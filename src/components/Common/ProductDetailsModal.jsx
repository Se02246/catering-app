import React from 'react';
import { formatCustomText } from '../../utils/textFormatting';
import { useSetting } from '../../hooks/useData';

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

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 3000 }}>
            <div
                className={`modal-content ${isClosing ? 'bounce-out' : 'bounce-in'}`}
                onClick={e => e.stopPropagation()}
                style={{ position: 'relative' }}
            >
                {product.hide_at && (
                    <div style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '20px',
                        backgroundColor: 'var(--color-primary-dark)',
                        color: 'white',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        pointerEvents: 'none'
                    }}>
                        Disponibile fino al {new Date(product.hide_at).toLocaleDateString('it-IT')}
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{product.name}</h2>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                            {product.is_gluten_free && (
                                <span style={{ color: '#FF9800', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    Senza Glutine!
                                </span>
                            )}
                            {product.is_lactose_free && (
                                <span style={{ color: '#03A9F4', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    Senza Lattosio!
                                </span>
                            )}
                        </div>
                    </div>
                    <button className="btn btn-outline" style={{ borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)', padding: '0.5rem 1rem' }} onClick={onClose}>Chiudi</button>
                </div>

                {(() => {
                    const validImages = product.images && product.images.length > 0
                        ? product.images.filter(img => img && img.trim() !== '')
                        : (product.image_url && product.image_url.trim() !== '' ? [product.image_url] : []);

                    if (validImages.length === 0) return null;

                    return (
                        <div style={{ position: 'relative', marginBottom: '2rem' }}>
                            <div style={{
                                display: 'flex',
                                overflowX: 'auto',
                                scrollSnapType: 'x mandatory',
                                scrollSnapStop: 'always',
                                gap: '1rem',
                                paddingBottom: '1rem',
                                WebkitOverflowScrolling: 'touch',
                                scrollBehavior: 'smooth',
                                touchAction: 'pan-x'
                            }}>
                                {validImages.map((img, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            minWidth: '100%',
                                            scrollSnapAlign: 'center',
                                            scrollSnapStop: 'always'
                                        }}
                                    >
                                        <img
                                            src={img}
                                            alt={`${product.name} ${idx + 1}`}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '4/5',
                                                objectFit: 'cover',
                                                borderRadius: '16px',
                                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                                display: 'block'
                                            }}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                ))}
                            </div>
                            {validImages.length > 1 && (
                                <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                    Scorri per vedere altre foto
                                </div>
                            )}
                        </div>
                    );
                })()}

                <div style={{ marginBottom: '2rem' }}>
                    <p 
                        style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text)', marginBottom: '1rem' }}
                        dangerouslySetInnerHTML={{ __html: formatCustomText(product.description || 'Nessuna descrizione disponibile.') }}
                    />
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                        {showPrice && (
                            <>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Prezzo</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                        {product.is_sold_by_piece
                                            ? `€ ${product.price_per_piece} / pz`
                                            : `€ ${product.price_per_kg} / kg`
                                        }
                                    </span>
                                </div>
                                {product.pieces_per_kg && !product.is_sold_by_piece && (
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Pezzi per Kg</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{product.pieces_per_kg}</span>
                                    </div>
                                )}
                            </>
                        )}
                        {product.show_servings && product.servings_per_unit && (
                            <div>
                                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Porzioni</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Per {product.servings_per_unit} persone / unità</span>
                            </div>
                        )}
                    </div>
                </div>

                {onAddToCart && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                            onClick={() => {
                                onAddToCart(product);
                                onClose();
                            }}
                        >
                            Aggiungi al Preventivo
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailsModal;
