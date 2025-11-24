import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Minus, Trash2, Send } from 'lucide-react';

const QuoteBuilder = () => {
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

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
                    order_increment: p.order_increment ? parseFloat(p.order_increment) : 1,
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

    const updateQuantity = (instanceId, delta) => {
        setCart(cart.map(item => {
            if (item.instanceId === instanceId) {
                const increment = item.order_increment || 1;
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
                        <div key={p.id} style={{
                            padding: '1rem', border: '1px solid rgba(175, 68, 72, 0.1)', borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.6)', // Off-white / Glass effect
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                        }}>
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
                                    onClick={() => addToCart(p)}
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
                                        <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.instanceId, -1)}>
                                            <Minus size={14} />
                                        </button>
                                        <span style={{ minWidth: '2rem', textAlign: 'center' }}>{item.quantity}</span>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.instanceId, 1)}>
                                            <Plus size={14} />
                                        </button>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem', color: 'red', borderColor: 'red' }} onClick={() => updateQuantity(item.instanceId, -1000)}> {/* Hack to force remove */}
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
        </div>
    );
};

export default QuoteBuilder;
