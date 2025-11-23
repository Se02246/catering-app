import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Plus, Minus, Trash2, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
            setProducts(data);
        } catch (err) {
            console.error('Failed to load products', err);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find(item => item.id === product.id);
        if (existing) {
            const increment = product.order_increment || 1;
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + increment } : item
            ));
        } else {
            const initialQty = product.min_order_quantity || 1;
            setCart([...cart, { ...product, quantity: initialQty }]);
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const increment = item.order_increment || 1;
                const minQty = item.min_order_quantity || 1;
                // delta is 1 or -1, multiply by increment
                const change = delta * increment;
                const newQty = item.quantity + change;

                // If going below minQty, remove item (or keep at minQty? User usually wants to remove if they go below min)
                // Let's say if they click minus at minQty, it removes it.
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

    const generatePDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFont('times', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(125, 28, 74); // #7D1C4A
        doc.text('Catering d\'Eccellenza', 105, 20, null, null, 'center');

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Preventivo Personalizzato', 105, 30, null, null, 'center');

        // Table
        const tableData = cart.map(item => {
            const unit = item.pieces_per_kg ? 'pz' : 'kg';
            const priceUnit = item.pieces_per_kg
                ? `€ ${(item.price_per_kg / item.pieces_per_kg).toFixed(2)} / pz`
                : `€ ${item.price_per_kg} / kg`;

            return [
                item.name,
                priceUnit,
                `${item.quantity} ${unit}`,
                `€ ${calculateItemPrice(item).toFixed(2)}`
            ];
        });

        doc.autoTable({
            startY: 40,
            head: [['Prodotto', 'Prezzo Unitario', 'Quantità', 'Totale']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [125, 28, 74] },
            foot: [['', '', 'Totale Complessivo', `€ ${calculateTotal().toFixed(2)}`]]
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY || 40;
        doc.setFontSize(10);
        doc.text('Grazie per averci scelto!', 105, finalY + 20, null, null, 'center');

        doc.save('preventivo_catering.pdf');
    };

    if (loading) return <p>Caricamento prodotti...</p>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
            {/* Product List */}
            <div>
                <h2 style={{ marginBottom: '1rem' }}>Seleziona Prodotti</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {products.map(p => (
                        <div key={p.id} style={{
                            padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '8px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                        }}>
                            {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '0.5rem' }} />}
                            <div>
                                <h4 style={{ marginBottom: '0.5rem' }}>{p.name}</h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>€ {p.price_per_kg} / kg</p>
                            </div>
                            <button
                                className="btn btn-outline"
                                style={{ marginTop: '1rem', width: '100%' }}
                                onClick={() => addToCart(p)}
                            >
                                Aggiungi
                            </button>
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
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            {item.pieces_per_kg
                                                ? `€ ${(item.price_per_kg / item.pieces_per_kg).toFixed(2)} / pz`
                                                : `€ ${item.price_per_kg} / kg`}
                                            {' x '} {item.quantity} {item.pieces_per_kg ? 'pz' : 'kg'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.id, -1)}>
                                            <Minus size={14} />
                                        </button>
                                        <span style={{ minWidth: '2rem', textAlign: 'center' }}>{item.quantity}</span>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.id, 1)}>
                                            <Plus size={14} />
                                        </button>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem', color: 'red', borderColor: 'red' }} onClick={() => updateQuantity(item.id, -1000)}> {/* Hack to force remove */}
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
                                onClick={generatePDF}
                            >
                                <FileDown size={18} style={{ marginRight: '8px' }} />
                                Scarica PDF
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QuoteBuilder;
