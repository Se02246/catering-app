import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Minus, Trash2, Send, Check, ShoppingCart } from 'lucide-react';
import ProductDetailsModal from '../Common/ProductDetailsModal';

const QuoteBuilder = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuoteVisible, setIsQuoteVisible] = useState(false);

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsQuoteVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        const quoteSection = document.getElementById('quote-summary');
        if (quoteSection) {
            observer.observe(quoteSection);
        }

        return () => {
            if (quoteSection) {
                observer.unobserve(quoteSection);
            }
        };
    }, [cart.length]); // Re-run when cart changes as the section might appear/disappear

    const loadProducts = async () => {
        try {
            const data = await api.getProducts();
            const parsedData = data
                .filter(p => p.is_visible !== false) // Filter out hidden products
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
                    price_per_piece: p.price_per_piece ? parseFloat(p.price_per_piece) : null
                }));
            setProducts(parsedData);
        } catch (err) {
            console.error('Failed to load products', err);
        } finally {
            setLoading(false);
        }
    };

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

    const sendToWhatsApp = () => {
        const phoneNumber = "393495416637";
        const total = calculateTotal().toFixed(2);
        let message = `*Ciao Barbara, ho creato un prventivo (€ ${total}) sul tuo sito, e\` possibile avere maggiori informazioni?\n\n*`;

        const middleIndex = Math.floor(cart.length / 2);

        cart.forEach((item, index) => {
            const unit = item.is_sold_by_piece ? 'pz' : (item.pieces_per_kg ? 'pz' : 'kg');
            let priceUnit = '';
            if (item.is_sold_by_piece) {
                priceUnit = `€ ${item.price_per_piece.toFixed(2)} / pz`;
            } else if (item.pieces_per_kg) {
                priceUnit = `€ ${(item.price_per_kg / item.pieces_per_kg).toFixed(2)} / pz`;
            } else {
                priceUnit = `€ ${item.price_per_kg} / kg`;
            }

            const servingsText = (item.show_servings && item.servings_per_unit)
                ? ` (per ${(item.servings_per_unit * item.quantity).toFixed(0)} persone)`
                : '';

            const dietaryInfo = [
                item.is_gluten_free ? '(senza glutine)' : '',
                item.is_lactose_free ? '(senza lattosio)' : ''
            ].filter(Boolean).join(' ');

            let quantityDisplay = `${item.quantity} ${unit}`;
            if (item.is_sold_by_piece) {
                quantityDisplay = `${item.quantity} pz`;
            } else if (item.pieces_per_kg) {
                const weightInKg = item.quantity / item.pieces_per_kg;
                quantityDisplay = `${item.quantity} pz (${weightInKg.toFixed(2)} kg)`;
            }

            message += `• *${item.name}* ${dietaryInfo}${servingsText}\n`;
            message += `  ${quantityDisplay} x ${priceUnit} = € ${calculateItemPrice(item).toFixed(2)}\n\n`;

            if (index === middleIndex) {
                message += `• prezzo preventivo (€ ${total})\n\n`;
            }
        });

        message += `*Totale: € ${total}*`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    };

    // Handle browser back button for modals
    useEffect(() => {
        const handlePopState = (event) => {
            if (selectedProduct) {
                setSelectedProduct(null);
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

    if (loading) return <p>Caricamento prodotti...</p>;

    return (
        <div className="grid-quote-builder">
            {/* Product List */}
            <div>
                <h2 style={{ marginBottom: '1rem' }}>Seleziona Prodotti</h2>
                <div className="grid-responsive" style={{ gap: '1rem' }}>
                    {products.map(p => (
                        <div key={p.id}
                            style={{
                                padding: '0.75rem', border: '1px solid rgba(175, 68, 72, 0.1)', borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.6)', // Off-white / Glass effect
                                display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem',
                                cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                            onClick={() => openProduct(p)}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
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
            <div id="quote-summary" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)', height: 'fit-content' }}>
                <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Il Tuo Preventivo</h2>

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
                                            {' x '} {item.quantity} {item.is_sold_by_piece ? 'pz' : (item.pieces_per_kg ? 'pz' : 'kg')}
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
                                                style={{ padding: '0.25rem' }}
                                                onClick={() => updateQuantity(item.instanceId, -1)}
                                            >
                                                <Minus size={14} />
                                            </button>
                                        )}
                                        <span style={{ minWidth: '2rem', textAlign: 'center' }}>{item.quantity}</span>
                                        {item.order_increment !== 0 && (
                                            <button
                                                className="btn btn-outline"
                                                style={{ padding: '0.25rem' }}
                                                onClick={() => updateQuantity(item.instanceId, 1)}
                                                disabled={item.max_order_quantity && (item.quantity + (item.order_increment || 1)) > item.max_order_quantity}
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                                <span>Totale:</span>
                                <span>€ {calculateTotal().toFixed(2)}</span>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={sendToWhatsApp}
                            >
                                <Send size={18} style={{ marginRight: '8px' }} />
                                Invia su WhatsApp
                            </button>
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
                />
            )}
        </div>
    );
};

export default QuoteBuilder;
