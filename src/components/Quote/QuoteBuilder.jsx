import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Minus, Trash2, Send } from 'lucide-react';

const QuoteBuilder = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

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
                    allow_multiple: Boolean(p.allow_multiple)
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

                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean)); // Filter out nulls
    };

    const calculateItemPrice = (item) => {
        if (item.pieces_per_kg) {
            // Price is per kg, but quantity is in pieces
            // Price per piece = price_per_kg / pieces_per_kg
            return (item.price_per_kg / item.pieces_per_kg) * item.quantity;
        }
        return item.price_per_kg * item.quantity;
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + calculateItemPrice(item), 0);
    };

    const sendToWhatsApp = () => {
        const phoneNumber = "393495416637"; // Updated business number
        let message = "*Ciao Barbara, ho creato un prventivo sul tuo sito, e` possibile avere maggiori informazioni?\n\n*";

        cart.forEach(item => {
            const unit = item.pieces_per_kg ? 'pz' : 'kg';
            const priceUnit = item.pieces_per_kg
                ? `€ ${(item.price_per_kg / item.pieces_per_kg).toFixed(2)} / pz`
                : `€ ${item.price_per_kg} / kg`;

            const servingsText = (item.show_servings && item.servings_per_unit)
                ? ` (per ${(item.servings_per_unit * item.quantity).toFixed(0)} persone)`
                : '';

            message += `• *${item.name}*${servingsText}\n`;
            message += `  ${item.quantity} ${unit} x ${priceUnit} = € ${calculateItemPrice(item).toFixed(2)}\n\n`;
        });

        message += `*Totale: € ${calculateTotal().toFixed(2)}*`;

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
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
                                padding: '1rem', border: '1px solid rgba(175, 68, 72, 0.1)', borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.6)', // Off-white / Glass effect
                                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                            onClick={() => setSelectedProduct(p)}
                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                        >
                            {p.image_url && (
                                <img
                                    src={p.image_url}
                                    alt={p.name}
                                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=No+Img'; }}
                                />
                            )}
                            <div>
                                <h4 style={{ marginBottom: '0.5rem' }}>{p.name}</h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>€ {p.price_per_kg} / kg</p>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                {p.allow_multiple && cart.filter(item => item.id === p.id).length > 0 && (
                                    <div style={{
                                        backgroundColor: 'var(--color-primary)', color: 'white',
                                        borderRadius: '50%', width: '30px', height: '30px',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        fontWeight: 'bold', fontSize: '0.9rem'
                                    }}>
                                        {cart.filter(item => item.id === p.id).length}
                                    </div>
                                )}
                                <button
                                    className={`btn ${!p.allow_multiple && cart.find(item => item.id === p.id) ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ width: p.allow_multiple ? 'auto' : '100%', flex: p.allow_multiple ? 1 : 'none' }}
                                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                >
                                    {!p.allow_multiple && cart.find(item => item.id === p.id) ? 'Aggiunto' : 'Aggiungi'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart / Quote Summary */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: 'var(--shadow-md)', height: 'fit-content' }}>
                <h2 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Il Tuo Preventivo</h2>

                {cart.length === 0 ? (
                    <p style={{ color: 'var(--color-text-muted)' }}>Nessun prodotto selezionato.</p>
                ) : (
                    <>
                        <div style={{ marginBottom: '1rem' }}>
                            {cart.map(item => (
                                <div key={item.instanceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {item.pieces_per_kg
                                                ? `€ ${(item.price_per_kg / item.pieces_per_kg).toFixed(2)} / pz`
                                                : `€ ${item.price_per_kg} / kg`}
                                            {' x '} {item.quantity} {item.pieces_per_kg ? 'pz' : 'kg'}
                                            {item.show_servings && item.servings_per_unit && (
                                                <span style={{ color: 'var(--color-primary)', marginLeft: '0.5rem', fontWeight: 'bold' }}>
                                                    / per {(item.servings_per_unit * item.quantity).toFixed(0)} persone
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {item.order_increment !== 0 && (
                                            <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.instanceId, -1)}>
                                                <Minus size={14} />
                                            </button>
                                        )}
                                        <span style={{ minWidth: '2rem', textAlign: 'center' }}>{item.quantity}</span>
                                        {item.order_increment !== 0 && (
                                            <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.instanceId, 1)}>
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
            {/* Product Details Modal */}
            {selectedProduct && (
                <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{selectedProduct.name}</h2>
                            <button className="btn btn-outline" style={{ borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)', padding: '0.5rem 1rem' }} onClick={() => setSelectedProduct(null)}>Chiudi</button>
                        </div>

                        {selectedProduct.image_url && (
                            <img
                                src={selectedProduct.image_url}
                                alt={selectedProduct.name}
                                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400?text=No+Img'; }}
                            />
                        )}

                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text)', marginBottom: '1rem' }}>
                                {selectedProduct.description || 'Nessuna descrizione disponibile.'}
                            </p>
                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Prezzo</span>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>€ {selectedProduct.price_per_kg} / kg</span>
                                </div>
                                {selectedProduct.pieces_per_kg && (
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Pezzi per Kg</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{selectedProduct.pieces_per_kg}</span>
                                    </div>
                                )}
                                {selectedProduct.show_servings && selectedProduct.servings_per_unit && (
                                    <div>
                                        <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Porzioni</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Per {selectedProduct.servings_per_unit} persone / unità</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
                                onClick={() => {
                                    addToCart(selectedProduct);
                                    setSelectedProduct(null);
                                }}
                            >
                                Aggiungi al Preventivo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteBuilder;
