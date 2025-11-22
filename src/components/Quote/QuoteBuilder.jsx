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
            setCart(cart.map(item =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQuantity = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price_per_kg * item.quantity), 0);
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
        const tableData = cart.map(item => [
            item.name,
            `€ ${item.price_per_kg} / kg`,
            item.quantity,
            `€ ${(item.price_per_kg * item.quantity).toFixed(2)}`
        ]);

        doc.autoTable({
            startY: 40,
            head: [['Prodotto', 'Prezzo Unitario', 'Quantità (kg/pz)', 'Totale']],
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
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>€ {item.price_per_kg} x {item.quantity}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.id, -1)}>
                                            <Minus size={14} />
                                        </button>
                                        <span>{item.quantity}</span>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => updateQuantity(item.id, 1)}>
                                            <Plus size={14} />
                                        </button>
                                        <button className="btn btn-outline" style={{ padding: '0.25rem', color: 'red', borderColor: 'red' }} onClick={() => updateQuantity(item.id, -item.quantity)}>
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
