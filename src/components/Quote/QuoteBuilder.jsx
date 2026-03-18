import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useProducts } from '../../hooks/useData';
import { Plus, Minus, Trash2, Send, Check, ShoppingCart } from 'lucide-react';
import ProductDetailsModal from '../Common/ProductDetailsModal';

const QuoteBuilder = () => {
    const { products: rawProducts, isLoading } = useProducts();
    const [cart, setCart] = useState(() => {
        // Load initial cart from localStorage
        const savedCart = localStorage.getItem('active_quote_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuoteVisible, setIsQuoteVisible] = useState(false);
    const [isProductClosing, setIsProductClosing] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const quoteSummaryRef = useRef(null);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('active_quote_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsQuoteVisible(entry.isIntersecting);
            },
            {
                threshold: 0.1, // Trigger when 10% of the element is visible
                rootMargin: '0px'
            }
        );

        if (quoteSummaryRef.current) {
            observer.observe(quoteSummaryRef.current);
        }

        return () => {
            if (quoteSummaryRef.current) {
                observer.unobserve(quoteSummaryRef.current);
            }
        };
    }, [cart.length]); // Re-observe if cart changes as it might change the summary height

    const products = React.useMemo(() => {
        const now = new Date();
        return rawProducts
            .filter(p => {
                const isVisible = p.is_visible !== false;
                const isNotExpired = !p.hide_at || new Date(p.hide_at) > now;
                return isVisible && isNotExpired;
            })
            .map(p => ({
                ...p,
                price_per_kg: parseFloat(p.price_per_kg),
                pieces_per_kg: p.pieces_per_kg ? parseFloat(p.pieces_per_kg) : null,
                min_order_quantity: p.min_order_quantity ? parseFloat(p.min_order_quantity) : 1,
                order_increment: p.order_increment !== undefined ? parseFloat(p.order_increment) : 1,
                show_servings: Boolean(p.show_servings),
                servings_per_unit: p.servings_per_unit ? parseFloat(p.servings_per_unit) : null,
                allow_multiple: Boolean(p.allow_multiple),
                max_order_quantity: p.max_order_quantity ? parseFloat(p.max_order_quantity) : null,
                images: p.images || (p.image_url ? [p.image_url] : []),
                is_sold_by_piece: Boolean(p.is_sold_by_piece),
                price_per_piece: p.price_per_piece ? parseFloat(p.price_per_piece) : null,
                hide_at: p.hide_at
            }));
    }, [rawProducts]);

    const addToCart = (product) => {
        if (product.allow_multiple) {
            // Always add a new instance
            const newItem = {
                ...product,
                quantity: product.min_order_quantity || 1,
                instanceId: Date.now() + Math.random() // Unique ID for this instance
            };

            // Check max quantity for this specific instance
            if (product.max_order_quantity && newItem.quantity > product.max_order_quantity) {
                alert(`Hai raggiunto il limite massimo di ${product.max_order_quantity} per questo prodotto.`);
                return;
            }

            setCart([...cart, newItem]);
        } else {
            const existing = cart.find(item => item.id === product.id);
            if (existing) {
                // Toggle off
                setCart(cart.filter(item => item.id !== product.id));
            } else {
                // Add new
                const newItem = {
                    ...product,
                    quantity: product.min_order_quantity || 1,
                    instanceId: Date.now() + Math.random()
                };

                if (product.max_order_quantity && newItem.quantity > product.max_order_quantity) {
                    alert(`Hai raggiunto il limite massimo di ${product.max_order_quantity} per questo prodotto.`);
                    return;
                }

                setCart([...cart, newItem]);
            }
        }
    };

    const removeFromCart = (instanceId) => {
        setCart(cart.filter(item => item.instanceId !== instanceId));
    };

    const updateQuantity = (instanceId, delta) => {
        setCart(cart.map(item => {
            if (item.instanceId === instanceId) {
                const increment = item.order_increment !== undefined ? item.order_increment : 1;
                if (increment === 0) return item; // No changes allowed if increment is 0
                const minQty = item.min_order_quantity || 1;
                // delta is 1 or -1, multiply by increment
                const change = delta * increment;
                const newQty = item.quantity + change;

                // If going below minQty, remove item
                if (newQty < minQty) return null;

                // Check max quantity PER INSTANCE
                if (item.max_order_quantity && newQty > item.max_order_quantity) {
                    // Don't update if exceeds max
                    return item;
                }

                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean)); // Filter out nulls
    };

    const calculateItemPrice = (item) => {
        if (item.is_sold_by_piece) {
            return item.price_per_piece * item.quantity;
        }
        if (item.pieces_per_kg) {
            // Legacy logic or specific use case where pieces_per_kg is set but not sold_by_piece (maybe sold by kg but tracked by piece?)
            // For now, if is_sold_by_piece is true, we use that.
            // If not, we assume standard weight based logic.
            // But wait, if pieces_per_kg is set, the quantity might be in pieces?
            // Let's stick to the new flag for the new behavior.
            return (item.price_per_kg / item.pieces_per_kg) * item.quantity;
        }
        return item.price_per_kg * item.quantity;
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + calculateItemPrice(item), 0);
    };

    const [shareUrl, setShareUrl] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleShareQuote = async () => {
        setIsSaving(true);
        try {
            const result = await api.saveQuote(cart, calculateTotal());
            const url = `${window.location.origin}/quote/${result.id}`;
            setShareUrl(url);
            
            // Optionally auto-open WhatsApp with the link
            const phoneNumber = "393495416637";
            const message = `Ciao Barbara, ho creato un preventivo sul tuo sito. Puoi visualizzarlo qui:\n\n${url}`;
            window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
        } catch (err) {
            console.error('Error saving quote:', err);
            alert('Errore durante il salvataggio del preventivo.');
        } finally {
            setIsSaving(false);
        }
    };

    // Handle browser back button for modals
    useEffect(() => {
        const handlePopState = (event) => {
            if (selectedProduct) {
                // Trigger close animation
                setIsProductClosing(true);
                setTimeout(() => {
                    setSelectedProduct(null);
                    setIsProductClosing(false);
                }, 400); // Match animation duration
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedProduct]);

    const openProduct = (prod) => {
        window.history.pushState({ modal: 'product' }, '');
        setSelectedProduct(prod);
    };

    const closeProduct = () => {
        window.history.back();
    };

    const clearCart = () => {
        setShowClearConfirm(true);
    };

    const confirmClearCart = () => {
        setCart([]);
        setShowClearConfirm(false);
    };

    if (isLoading) return <p>Caricamento prodotti...</p>;

    return (
        <div className="grid-quote-builder">
            {/* ... Product List and Cart UI ... */}
            {/* Product List */}
            <div>
                <h2 style={{ marginBottom: '1rem' }}>Seleziona Prodotti</h2>
                <div className="grid-responsive" style={{ gap: '1rem' }}>
                    {products.map((p, index) => (
                        <div key={p.id}
                            className="bounce-in"
                            style={{
                                animationDelay: `${index * 0.1}s`,
                                padding: '0.75rem', border: '1px solid rgba(175, 68, 72, 0.1)', borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.6)', // Off-white / Glass effect
                                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem',
                                cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                position: 'relative'
                            }}
                            onClick={() => openProduct(p)}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            {p.hide_at && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    left: '10px',
                                    backgroundColor: 'var(--color-primary-dark)',
                                    color: 'white',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '12px',
                                    fontSize: '0.65rem',
                                    fontWeight: 'bold',
                                    zIndex: 10,
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    pointerEvents: 'none'
                                }}>
                                    Fino al {new Date(p.hide_at).toLocaleDateString('it-IT')}
                                </div>
                            )}
                            {p.image_url && (
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                    <img
                                        src={p.image_url}
                                        alt={p.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=No+Img'; }}
                                    />
                                </div>
                            )}
                            <div style={{ flex: 1 }}>
                                <h4 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>{p.name}</h4>
                                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                    {p.is_gluten_free && (
                                        <span style={{ color: '#FF9800', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                            Senza Glutine!
                                        </span>
                                    )}
                                    {p.is_lactose_free && (
                                        <span style={{ color: '#03A9F4', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                            Senza Lattosio!
                                        </span>
                                    )}
                                </div>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                    {p.is_sold_by_piece ? `€ ${p.price_per_piece} / pz` : `€ ${p.price_per_kg} / kg`}
                                </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {p.allow_multiple && cart.filter(item => item.id === p.id).length > 0 && (
                                    <div style={{
                                        backgroundColor: 'var(--color-primary)', color: 'white',
                                        borderRadius: '50%', width: '24px', height: '24px',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontWeight: 'bold', fontSize: '0.8rem'
                                    }}>
                                        {cart.filter(item => item.id === p.id).length}
                                    </div>
                                )}
                                <button
                                    className={`btn ${!p.allow_multiple && cart.find(item => item.id === p.id) ? 'btn-primary' : 'btn-outline'}`}
                                    style={{
                                        width: '40px', height: '40px', padding: 0,
                                        borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        flexShrink: 0
                                    }}
                                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                >
                                    {!p.allow_multiple && cart.find(item => item.id === p.id) ? <Check size={20} /> : <Plus size={20} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart / Quote Summary */}
            <div 
                ref={quoteSummaryRef}
                id="quote-summary" 
                style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)', height: 'fit-content' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    <h2 style={{ margin: 0 }}>Il Tuo Preventivo</h2>
                    {cart.length > 0 && (
                        <button 
                            onClick={clearCart}
                            style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#e63946', 
                                cursor: 'pointer', 
                                fontSize: '0.85rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.25rem',
                                fontWeight: '600'
                            }}
                        >
                            <Trash2 size={16} />
                            Svuota carrello
                        </button>
                    )}
                </div>

                {cart.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>Nessun prodotto selezionato.</p>
                ) : (
                    <>
                        <div style={{ marginBottom: '1rem' }}>
                            {cart.map(item => (
                                <div key={item.instanceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600' }}>
                                            {item.name}
                                            <div style={{ display: 'inline-flex', gap: '0.25rem', marginLeft: '0.5rem', flexWrap: 'wrap' }}>
                                                {item.is_gluten_free && (
                                                    <span style={{ color: '#FF9800', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                                        Senza Glutine!
                                                    </span>
                                                )}
                                                {item.is_lactose_free && (
                                                    <span style={{ color: '#03A9F4', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                                        Senza Lattosio!
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {item.is_sold_by_piece
                                                ? `€ ${item.price_per_piece.toFixed(2)} / pz`
                                                : (item.pieces_per_kg
                                                    ? `€ ${(item.price_per_kg / item.pieces_per_kg).toFixed(2)} / pz`
                                                    : `€ ${item.price_per_kg} / kg`
                                                )
                                            }
                                            {' x '} {parseFloat(item.quantity)} {item.is_sold_by_piece ? 'pz' : (item.pieces_per_kg ? 'pz' : 'kg')}
                                            {item.show_servings && item.servings_per_unit && (
                                                <span style={{ color: 'var(--color-primary)', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                                                    / per {(item.servings_per_unit * item.quantity).toFixed(0)} persone
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {item.order_increment !== 0 && (
                                            <button
                                                className="btn btn-outline"
                                                style={{ 
                                                    padding: '0.25rem',
                                                    opacity: item.quantity <= (item.min_order_quantity || 1) ? 0.4 : 1,
                                                    cursor: item.quantity <= (item.min_order_quantity || 1) ? 'default' : 'pointer',
                                                    borderColor: item.quantity <= (item.min_order_quantity || 1) ? '#ccc' : 'var(--color-primary)',
                                                    color: item.quantity <= (item.min_order_quantity || 1) ? '#999' : 'var(--color-primary)'
                                                }}
                                                onClick={() => {
                                                    if (item.quantity > (item.min_order_quantity || 1)) {
                                                        updateQuantity(item.instanceId, -1);
                                                    }
                                                }}
                                                disabled={item.quantity <= (item.min_order_quantity || 1)}
                                            >
                                                <Minus size={14} />
                                            </button>
                                        )}
                                        <span style={{ minWidth: '2rem', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                                        {item.order_increment !== 0 && (
                                            <button
                                                className="btn btn-outline"
                                                style={{ 
                                                    padding: '0.25rem',
                                                    opacity: item.max_order_quantity && item.quantity >= item.max_order_quantity ? 0.4 : 1,
                                                    cursor: item.max_order_quantity && item.quantity >= item.max_order_quantity ? 'default' : 'pointer',
                                                    borderColor: item.max_order_quantity && item.quantity >= item.max_order_quantity ? '#ccc' : 'var(--color-primary)',
                                                    color: item.max_order_quantity && item.quantity >= item.max_order_quantity ? '#999' : 'var(--color-primary)'
                                                }}
                                                onClick={() => updateQuantity(item.instanceId, 1)}
                                                disabled={item.max_order_quantity && item.quantity >= item.max_order_quantity}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        )}
                                        <button className="btn btn-outline" style={{ padding: '0.25rem', color: 'red', borderColor: 'red' }} onClick={() => removeFromCart(item.instanceId)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>Totale:</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', fontWeight: 'normal' }}>(prezzo indicativo)</span>
                                </div>
                                <span>€ {calculateTotal().toFixed(2)}</span>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', marginBottom: shareUrl ? '1rem' : 0 }}
                                onClick={handleShareQuote}
                                disabled={isSaving}
                            >
                                <Send size={18} style={{ marginRight: '8px' }} />
                                {isSaving ? 'Salvataggio...' : 'Crea Link e Invia WhatsApp'}
                            </button>

                            {shareUrl && (
                                <div style={{ 
                                    padding: '1rem', 
                                    backgroundColor: 'rgba(175, 68, 72, 0.05)', 
                                    borderRadius: '8px', 
                                    border: '1px dashed var(--color-primary)',
                                    fontSize: '0.85rem'
                                }}>
                                    <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Link Preventivo:</p>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input 
                                            readOnly 
                                            value={shareUrl} 
                                            style={{ flex: 1, padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.8rem' }} 
                                        />
                                        <button 
                                            className="btn btn-outline" 
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                            onClick={() => {
                                                navigator.clipboard.writeText(shareUrl);
                                                alert('Link copiato!');
                                            }}
                                        >
                                            Copia
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Floating Cart Button */}
            {cart.length > 0 && (
                <button
                    onClick={() => {
                        const element = document.getElementById('quote-summary');
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        border: 'none',
                        cursor: 'pointer',
                        zIndex: 1000,
                        transition: 'all 0.3s ease-in-out',
                        opacity: isQuoteVisible ? 0 : 1,
                        transform: isQuoteVisible ? 'scale(0.8)' : 'scale(1)',
                        pointerEvents: isQuoteVisible ? 'none' : 'auto'
                    }}
                    onMouseOver={e => { if (!isQuoteVisible) e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseOut={e => { if (!isQuoteVisible) e.currentTarget.style.transform = 'scale(1)'; }}
                >
                    <ShoppingCart size={28} />
                    <div style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        backgroundColor: 'white',
                        color: 'var(--color-primary)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        border: '2px solid var(--color-primary)'
                    }}>
                        {cart.length}
                    </div>
                </button>
            )}

            {/* Product Details Modal */}
            {selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={closeProduct}
                    onAddToCart={addToCart}
                    isClosing={isProductClosing}
                />
            )}
            {/* Clear Cart Confirmation Modal */}
            {showClearConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 3000,
                    padding: '1rem'
                }}>
                    <div className="glass-panel bounce-in" style={{
                        padding: '2rem',
                        maxWidth: '400px',
                        width: '100%',
                        textAlign: 'center',
                        backgroundColor: 'white',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <Trash2 size={48} color="#e63946" style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '1rem' }}>Svuota carrello</h3>
                        <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>Vuoi davvero svuotare il carrello?</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                className="btn btn-outline" 
                                style={{ flex: 1 }} 
                                onClick={() => setShowClearConfirm(false)}
                            >
                                No
                            </button>
                            <button 
                                className="btn btn-primary" 
                                style={{ flex: 1, backgroundColor: '#e63946', borderColor: '#e63946' }} 
                                onClick={confirmClearCart}
                            >
                                Sì
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteBuilder;
