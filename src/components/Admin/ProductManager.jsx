import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useProducts } from '../../hooks/useData';
import { Trash2, Edit, Plus, Eye, EyeOff, Clock, X, Save, FileText, Minus, Search, Send } from 'lucide-react';
import ImageUpload from '../Common/ImageUpload';
import HideModal from '../Common/HideModal';
import { useNavigate } from 'react-router-dom';

const ProductManager = () => {
    const { products, isLoading, mutate } = useProducts();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isHideModalOpen, setIsHideModalOpen] = useState(false);
    const [productToHide, setProductToHide] = useState(null);
    const [currentProduct, setCurrentProduct] = useState({ 
        name: '', description: '', price_per_kg: '', image_url: '', images: [], 
        is_visible: true, hide_at: null, allow_multiple: false, order_increment: '', 
        max_order_quantity: '', is_sold_by_piece: false, price_per_piece: '',
        hide_quantity: false
    });


    const [calcError, setCalcError] = useState('');

    const [isCreatingQuote, setIsCreatingQuote] = useState(false);
    const [searchTermQuote, setSearchTermQuote] = useState('');
    const [newQuote, setNewQuote] = useState({
        items: [], // { product_id, quantity, tempId }
        total_price: 0
    });

    useEffect(() => {
        if (isEditing || isCreatingQuote) {
            document.body.classList.add('modal-open');
            setCalcError('');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isEditing, isCreatingQuote]);

    const updateQuoteItem = (tempId, field, value) => {
        setNewQuote({
            ...newQuote,
            items: newQuote.items.map(item =>
                item.tempId === tempId ? { ...item, [field]: value } : item
            )
        });
    };

    const removeQuoteItem = (tempId) => {
        setNewQuote({
            ...newQuote,
            items: newQuote.items.filter(item => item.tempId !== tempId)
        });
    };

    const calculateQuoteTotal = () => {
        return newQuote.items.reduce((sum, item) => {
            const prod = products.find(p => p.id == item.product_id);
            if (!prod) return sum;

            if (prod.is_sold_by_piece) {
                return sum + (prod.price_per_piece * item.quantity);
            } else if (prod.pieces_per_kg > 0) {
                return sum + ((item.quantity / prod.pieces_per_kg) * prod.price_per_kg);
            } else {
                return sum + (prod.price_per_kg * item.quantity);
            }
        }, 0);
    };

    const handleSaveQuoteToWhatsApp = async () => {
        if (newQuote.items.length === 0) {
            alert('Aggiungi almeno un prodotto al preventivo');
            return;
        }

        try {
            const suggestedTotal = calculateQuoteTotal();
            const finalTotal = parseFloat(newQuote.total_price) || suggestedTotal;
            
            const quoteToSave = {
                items: newQuote.items.map(item => {
                    const p = products.find(prod => prod.id === item.product_id);
                    return {
                        ...p,
                        quantity: item.quantity
                    };
                }),
                total_price: finalTotal.toFixed(2)
            };

            const savedQuote = await api.createQuote(quoteToSave);
            const quoteId = savedQuote.id;
            const shareUrl = `${window.location.origin}/quote/${quoteId}`;

            const phoneNumber = "393495416637"; // Barbara
            let message = `Preventivo da ${finalTotal.toFixed(2)} euro\n`;
            
            newQuote.items.forEach(item => {
                const p = products.find(prod => prod.id === item.product_id);
                const isPieces = (p?.pieces_per_kg && parseFloat(p.pieces_per_kg) > 0) || p?.is_sold_by_piece;
                const unit = isPieces ? 'pz' : 'kg';
                const itemPrice = p.is_sold_by_piece 
                    ? (p.price_per_piece * item.quantity) 
                    : (p.pieces_per_kg > 0 ? (item.quantity / p.pieces_per_kg) * p.price_per_kg : p.price_per_kg * item.quantity);
                
                message += `${item.quantity}${unit} ${p.name} [${itemPrice.toFixed(2)}€]\n`;
            });

            message += `\n${shareUrl}`;

            window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
            setIsCreatingQuote(false);
            setNewQuote({ items: [], total_price: 0 });
        } catch (err) {
            console.error(err);
            alert('Errore durante la creazione del preventivo');
        }
    };

    const resetForm = () => {
        setCurrentProduct({
            name: '', description: '', price_per_kg: '', image_url: '', images: [],
            pieces_per_kg: '', min_order_quantity: '', order_increment: '', max_order_quantity: '',
            show_servings: false, servings_per_unit: '', is_visible: true, hide_at: null, allow_multiple: false,
            is_gluten_free: false, is_lactose_free: false, is_sold_by_piece: false, price_per_piece: '',
            hide_quantity: false
        });
        setCalcError('');
    };

    const handlePricePerKgChange = (val) => {
        // ... rest of the code ...
    };

    // ... handlePricePerPieceChange and handlePiecesPerKgChange ...

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const productToSave = {
                ...currentProduct,
                price_per_kg: currentProduct.price_per_kg ? parseFloat(currentProduct.price_per_kg) : 0,
                pieces_per_kg: currentProduct.pieces_per_kg ? parseFloat(currentProduct.pieces_per_kg) : null,
                min_order_quantity: currentProduct.min_order_quantity ? parseFloat(currentProduct.min_order_quantity) : 1,
                order_increment: (currentProduct.order_increment !== '' && currentProduct.order_increment !== null && currentProduct.order_increment !== undefined) ? parseFloat(currentProduct.order_increment) : 1,
                show_servings: currentProduct.show_servings || false,
                servings_per_unit: currentProduct.servings_per_unit ? parseFloat(currentProduct.servings_per_unit) : null,
                is_visible: currentProduct.is_visible !== undefined ? currentProduct.is_visible : true,
                hide_at: currentProduct.hide_at || null,
                allow_multiple: currentProduct.allow_multiple || false,
                max_order_quantity: currentProduct.max_order_quantity ? parseFloat(currentProduct.max_order_quantity) : null,
                is_gluten_free: currentProduct.is_gluten_free || false,
                is_lactose_free: currentProduct.is_lactose_free || false,
                is_sold_by_piece: currentProduct.is_sold_by_piece || false,
                price_per_piece: currentProduct.price_per_piece ? parseFloat(currentProduct.price_per_piece) : null,
                hide_quantity: currentProduct.hide_quantity || false
            };

            if (currentProduct.id) {
                await api.updateProduct(currentProduct.id, productToSave);
            } else {
                await api.addProduct(productToSave);
            }
            setIsEditing(false);
            resetForm();
            mutate();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error saving product');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Sei sicuro di voler eliminare questo prodotto?')) {
            await api.deleteProduct(id);
            mutate();
        }
    };

    const toggleVisibility = async (product) => {
        setProductToHide(product);
        setIsHideModalOpen(true);
    };

    const confirmHide = async (hideAt) => {
        if (!productToHide) return;
        try {
            const isUnhiding = hideAt === 'unhide';
            await api.updateProduct(productToHide.id, { 
                ...productToHide, 
                is_visible: isUnhiding ? true : (hideAt ? true : false),
                hide_at: isUnhiding ? null : hideAt 
            });
            setIsHideModalOpen(false);
            setProductToHide(null);
            mutate();
        } catch (err) {
            console.error('Failed to update visibility', err);
            alert('Errore durante l\'aggiornamento della visibilità');
        }
    };

    if (isLoading) return <p>Caricamento prodotti...</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>Gestione Prodotti</h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        className="btn btn-outline" 
                        onClick={() => setIsCreatingQuote(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        <FileText size={18} />
                        Crea Preventivo
                    </button>
                    <button className="btn btn-primary" onClick={() => { resetForm(); setIsEditing(true); }}>
                        <Plus size={18} style={{ marginRight: '8px' }} />
                        Nuovo Prodotto
                    </button>
                </div>
            </div>

            {isCreatingQuote && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000
                }} onClick={() => setIsCreatingQuote(false)}>
                    <div className="modal-content bounce-in" style={{ 
                        width: '95vw', 
                        maxWidth: '1200px', 
                        maxHeight: '90vh', 
                        padding: '0', 
                        backgroundColor: 'var(--color-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>
                        
                        {/* Fixed Header */}
                        <div style={{ 
                            padding: '1.5rem', 
                            borderBottom: '1px solid var(--color-border)', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            backgroundColor: 'white',
                            zIndex: 10
                        }}>
                            <h3 style={{ margin: 0 }}>Nuovo Preventivo Condivisibile</h3>
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
                                onClick={() => setIsCreatingQuote(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Main Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                            <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: window.innerWidth > 992 ? '1.2fr 1fr' : '1fr', 
                                gap: '2rem' 
                            }}>
                                
                                {/* Section 1: Product Picker */}
                                <div style={{ minWidth: 0 }}>
                                    <div style={{ 
                                        position: 'sticky', 
                                        top: '0', 
                                        backgroundColor: 'var(--color-bg)', 
                                        paddingBottom: '1rem',
                                        zIndex: 5
                                    }}>
                                        <h4 style={{ marginBottom: '1rem' }}>1. Seleziona Prodotti</h4>
                                        <div style={{ position: 'relative' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                            <input
                                                type="text"
                                                placeholder="Cerca prodotto nel catalogo..."
                                                style={{ width: '100%', padding: '0.75rem 0.75rem 0.75rem 2.5rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}
                                                onChange={(e) => setSearchTermQuote(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                                        gap: '1rem',
                                        maxHeight: window.innerWidth > 992 ? 'none' : '400px',
                                        overflowY: 'auto',
                                        padding: '0.5rem'
                                    }}>
                                        {products.filter(p => p.name.toLowerCase().includes((searchTermQuote || '').toLowerCase())).map(p => {
                                            const existing = newQuote.items.find(i => i.product_id === p.id);
                                            const isAdded = !!existing;
                                            return (
                                                <div key={p.id} className="glass-panel" style={{
                                                    padding: '1rem', border: isAdded ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                    display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease'
                                                }}>
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                                                        <img
                                                            src={p.image_url || 'https://placehold.co/100x100?text=No+Img'}
                                                            alt={p.name}
                                                            style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }}
                                                        />
                                                        <div style={{ minWidth: 0 }}>
                                                            <h5 style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h5>
                                                            <p style={{ margin: 0, color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: '700' }}>
                                                                {p.is_sold_by_piece ? `€${p.price_per_piece}/pz` : `€${p.price_per_kg}/kg`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className={isAdded ? "btn btn-primary" : "btn btn-outline"}
                                                        style={{ width: '100%', padding: '0.5rem', fontSize: '0.8rem' }}
                                                        onClick={() => {
                                                            if (p.allow_multiple) {
                                                                setNewQuote({
                                                                    ...newQuote,
                                                                    items: [...newQuote.items, { product_id: p.id, quantity: 1, tempId: Date.now() + Math.random() }]
                                                                });
                                                            } else {
                                                                if (existing) {
                                                                    updateQuoteItem(existing.tempId, 'quantity', parseFloat(existing.quantity) + 1);
                                                                } else {
                                                                    setNewQuote({
                                                                        ...newQuote,
                                                                        items: [...newQuote.items, { product_id: p.id, quantity: 1, tempId: Date.now() }]
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {isAdded ? '+ Aggiungi un altro' : 'Aggiungi'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Section 2: Quote Summary */}
                                <div>
                                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' }}>
                                        <h4 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>2. Configura Preventivo</h4>

                                        <h5 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                            Prodotti Selezionati <span>({newQuote.items.length})</span>
                                        </h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                                            {newQuote.items.length === 0 ? (
                                                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>Seleziona i prodotti dalla lista a sinistra.</p>
                                            ) : (
                                                newQuote.items.map((item) => {
                                                    const product = products.find(p => p.id === item.product_id);
                                                    const isPieces = (product?.pieces_per_kg && parseFloat(product.pieces_per_kg) > 0) || product?.is_sold_by_piece;
                                                    const unit = isPieces ? 'pz' : 'kg';
                                                    const step = isPieces ? 1 : 0.1;
                                                    
                                                    const itemPrice = product.is_sold_by_piece 
                                                        ? (product.price_per_piece * item.quantity) 
                                                        : (product.pieces_per_kg > 0 ? (item.quantity / product.pieces_per_kg) * product.price_per_kg : product.price_per_kg * item.quantity);

                                                    return (
                                                        <div key={item.tempId} className="glass-panel" style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{product?.name}</div>
                                                                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                                                                        {product?.is_gluten_free && (
                                                                            <span style={{ color: '#FF9800', fontSize: '0.55rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>GF</span>
                                                                        )}
                                                                        {product?.is_lactose_free && (
                                                                            <span style={{ color: '#03A9F4', fontSize: '0.55rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>LF</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                                                    € {itemPrice.toFixed(2)}
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <button type="button" className="btn btn-outline" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => updateQuoteItem(item.tempId, 'quantity', Math.max(step, (parseFloat(item.quantity) || 0) - step).toFixed(isPieces ? 0 : 1))}>
                                                                    <Minus size={14} />
                                                                </button>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                    <input
                                                                        type="number" step={step}
                                                                        style={{ width: '50px', textAlign: 'center', border: 'none', background: 'transparent', fontWeight: 'bold' }}
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateQuoteItem(item.tempId, 'quantity', e.target.value)}
                                                                    />
                                                                    <span style={{ fontSize: '0.8rem' }}>{unit}</span>
                                                                </div>
                                                                <button type="button" className="btn btn-outline" style={{ padding: '0.25rem', borderRadius: '4px' }} onClick={() => updateQuoteItem(item.tempId, 'quantity', ((parseFloat(item.quantity) || 0) + step).toFixed(isPieces ? 0 : 1))}>
                                                                    <Plus size={14} />
                                                                </button>
                                                                <button type="button" style={{ background: 'none', border: 'none', color: '#E11D48', marginLeft: '0.5rem', cursor: 'pointer' }} onClick={() => removeQuoteItem(item.tempId)}>
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>

                                        {newQuote.items.length > 0 && (
                                            <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Prezzo Finale da mostrare (€)</label>
                                                        <input
                                                            type="number" step="0.01"
                                                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                            value={newQuote.total_price}
                                                            onChange={e => setNewQuote({ ...newQuote, total_price: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.75rem', fontSize: '0.75rem' }}
                                                            onClick={() => setNewQuote({ ...newQuote, total_price: calculateQuoteTotal().toFixed(2) })}
                                                        >
                                                            Usa Suggerito: €{calculateQuoteTotal().toFixed(2)}
                                                        </button>
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginRight: '1rem' }}>Totale Preventivo:</span>
                                                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>
                                                        € {parseFloat(newQuote.total_price || 0).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fixed Footer */}
                        <div style={{ 
                            padding: '1.5rem', 
                            borderTop: '1px solid var(--color-border)', 
                            backgroundColor: 'white',
                            display: 'flex',
                            gap: '1rem',
                            zIndex: 10
                        }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsCreatingQuote(false)}>Annulla</button>
                            <button 
                                className="btn btn-primary" 
                                style={{ flex: 1, backgroundColor: '#25D366', borderColor: '#25D366' }}
                                onClick={handleSaveQuoteToWhatsApp}
                            >
                                <Send size={18} style={{ marginRight: '8px' }} />
                                Salva e Invia su WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000
                }} onClick={() => { setIsEditing(false); resetForm(); }}>
                    <div className="modal-content bounce-in" style={{ 
                        width: '95vw', 
                        maxWidth: '600px', 
                        maxHeight: '90vh', 
                        padding: '0',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }} onClick={e => e.stopPropagation()}>
                        
                        {/* Fixed Header */}
                        <div style={{ 
                            padding: '1.5rem', 
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'white',
                            zIndex: 10
                        }}>
                            <h3 style={{ margin: 0 }}>{currentProduct.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h3>
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
                                onClick={() => { setIsEditing(false); resetForm(); }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            <form id="product-form" onSubmit={handleSubmit}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Nome</label>
                                    <input
                                        className="form-control"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                        value={currentProduct.name}
                                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                        required
                                        placeholder="Nome del prodotto"
                                    />
                                </div>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Descrizione</label>
                                    <textarea
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', height: '100px' }}
                                        value={currentProduct.description}
                                        onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                        placeholder="Descrizione del prodotto..."
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.05)' }}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Pezzi per Kg</label>
                                        <input
                                            type="number" step="0.1"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                                            value={currentProduct.pieces_per_kg || ''}
                                            onChange={e => handlePiecesPerKgChange(e.target.value)}
                                            placeholder="Es. 20"
                                        />
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            id="is_sold_by_piece"
                                            checked={currentProduct.is_sold_by_piece || false}
                                            onChange={e => setCurrentProduct({ ...currentProduct, is_sold_by_piece: e.target.checked })}
                                            style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                        />
                                        <label htmlFor="is_sold_by_piece" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Vendi al pezzo</label>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Prezzo al Kg (€)</label>
                                            <input
                                                type="number" step="0.01"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: 'white' }}
                                                value={currentProduct.price_per_kg}
                                                onChange={e => handlePricePerKgChange(e.target.value)}
                                                required={!currentProduct.is_sold_by_piece}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', opacity: currentProduct.is_sold_by_piece ? 1 : 0.5 }}>Prezzo al Pezzo (€)</label>
                                            <input
                                                type="number" step="0.01"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: !currentProduct.is_sold_by_piece ? '#eee' : 'white' }}
                                                value={currentProduct.price_per_piece || ''}
                                                onChange={e => handlePricePerPieceChange(e.target.value)}
                                                required={currentProduct.is_sold_by_piece}
                                                disabled={!currentProduct.is_sold_by_piece}
                                            />
                                        </div>
                                    </div>

                                    {calcError && (
                                        <p style={{ fontSize: '0.8rem', color: '#f44336', marginTop: '0.5rem', marginBottom: 0, textAlign: 'center', fontWeight: 'bold' }}>
                                            {calcError}
                                        </p>
                                    )}
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Immagini</label>
                                    <ImageUpload
                                        images={currentProduct.images}
                                        onUpload={(newImages) => setCurrentProduct({
                                            ...currentProduct,
                                            images: newImages,
                                            image_url: newImages.length > 0 ? newImages[0] : ''
                                        })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Minimo Ordine</label>
                                        <input
                                            type="number" step="0.1"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                            value={currentProduct.min_order_quantity || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, min_order_quantity: e.target.value })}
                                            placeholder="Default 1"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Incremento</label>
                                        <input
                                            type="number" step="0.1"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                            value={currentProduct.order_increment || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, order_increment: e.target.value })}
                                            placeholder="Default 1"
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Massimo Ordine</label>
                                        <input
                                            type="number" step="0.1"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                            value={currentProduct.max_order_quantity || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, max_order_quantity: e.target.value })}
                                            placeholder="Illimitato"
                                        />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                                        <input
                                            type="checkbox"
                                            id="show_servings"
                                            checked={currentProduct.show_servings || false}
                                            onChange={e => setCurrentProduct({ ...currentProduct, show_servings: e.target.checked })}
                                            style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                        />
                                        <label htmlFor="show_servings" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Mostra "per persone"</label>
                                    </div>
                                    {currentProduct.show_servings && (
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Persone per Unità (Kg o Pz)</label>
                                            <input
                                                type="number" step="0.1"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                value={currentProduct.servings_per_unit || ''}
                                                onChange={e => setCurrentProduct({ ...currentProduct, servings_per_unit: e.target.value })}
                                                placeholder="Es. 20"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            id="allow_multiple"
                                            checked={currentProduct.allow_multiple || false}
                                            onChange={e => setCurrentProduct({ ...currentProduct, allow_multiple: e.target.checked })}
                                            style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                        />
                                        <label htmlFor="allow_multiple" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Abilita "più di uno"</label>
                                    </div>
                                    <small style={{ color: '#666' }}>Permette di aggiungere il prodotto più volte nel preventivo.</small>
                                </div>

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            id="hide_quantity"
                                            checked={currentProduct.hide_quantity || false}
                                            onChange={e => setCurrentProduct({ ...currentProduct, hide_quantity: e.target.checked })}
                                            style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                        />
                                        <label htmlFor="hide_quantity" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Nascondi quantità</label>
                                    </div>
                                    <small style={{ color: '#666' }}>Nasconde il valore della quantità (es. "2 Kg" o "40 Pz") nelle pagine pubbliche.</small>
                                </div>

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.05)' }}>
                                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                id="is_gluten_free"
                                                checked={currentProduct.is_gluten_free || false}
                                                onChange={e => setCurrentProduct({ ...currentProduct, is_gluten_free: e.target.checked })}
                                                style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                            />
                                            <label htmlFor="is_gluten_free" style={{ fontWeight: 'bold', color: '#FF9800', cursor: 'pointer' }}>Senza Glutine!</label>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                id="is_lactose_free"
                                                checked={currentProduct.is_lactose_free || false}
                                                onChange={e => setCurrentProduct({ ...currentProduct, is_lactose_free: e.target.checked })}
                                                style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                            />
                                            <label htmlFor="is_lactose_free" style={{ fontWeight: 'bold', color: '#03A9F4', cursor: 'pointer' }}>Senza Lattosio!</label>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Fixed Footer */}
                        <div style={{ 
                            padding: '1.5rem', 
                            borderTop: '1px solid var(--color-border)',
                            backgroundColor: 'white',
                            display: 'flex',
                            gap: '1rem'
                        }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setIsEditing(false); resetForm(); }}>Annulla</button>
                            <button type="submit" form="product-form" className="btn btn-primary" style={{ flex: 1 }}>
                                <Save size={18} style={{ marginRight: '8px' }} />
                                Salva Prodotto
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid-responsive" style={{ gap: '1rem' }}>
                {products.map(p => {
                    const isExpired = p.hide_at && new Date(p.hide_at) < new Date();
                    const isHidden = p.is_visible === false || isExpired;
                    
                    return (
                        <div key={p.id} className="glass-panel" style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '1.2rem', opacity: isHidden ? 0.6 : 1,
                            flexWrap: 'wrap', gap: '1rem', transition: 'all 0.3s ease'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '200px' }}>
                                {p.image_url && (
                                    <img
                                        src={p.image_url}
                                        alt={p.name}
                                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                                        onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/60x60?text=No+Img'; }}
                                    />
                                )}
                                <div style={{ minWidth: 0 }}>
                                    <h4 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {p.name}
                                        {isHidden && <span style={{ fontSize: '0.8rem', color: 'red', marginLeft: '0.5rem' }}>({isExpired ? 'Scaduto' : 'Nascosto'})</span>}
                                    </h4>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', margin: '0.2rem 0' }}>
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
                                    <p style={{ margin: 0, color: 'var(--color-primary)', fontWeight: '700', fontSize: '0.9rem' }}>
                                        {p.is_sold_by_piece ? `€ ${p.price_per_piece} / pz` : `€ ${p.price_per_kg} / kg`}
                                    </p>
                                    {p.hide_at && !isExpired && (
                                        <p style={{ margin: '0.2rem 0 0 0', color: 'var(--color-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={12} /> Nascondi il: {new Date(p.hide_at).toLocaleString('it-IT')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                <button 
                                    className="btn btn-outline" 
                                    style={{ padding: '0.6rem', color: isHidden ? 'var(--color-text)' : 'var(--color-primary)' }} 
                                    onClick={() => toggleVisibility(p)} 
                                    title={!isHidden ? "Nascondi" : "Mostra"}
                                >
                                    {!isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                                </button>
                                <button className="btn btn-outline" style={{ padding: '0.6rem' }} onClick={() => { setCurrentProduct(p); setIsEditing(true); }}>
                                    <Edit size={18} />
                                </button>
                                <button className="btn btn-outline" style={{ padding: '0.6rem', color: 'red', borderColor: 'red' }} onClick={() => handleDelete(p.id)}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <HideModal 
                isOpen={isHideModalOpen}
                onClose={() => { setIsHideModalOpen(false); setProductToHide(null); }}
                onConfirm={confirmHide}
                initialDate={productToHide?.hide_at}
                isVisible={productToHide?.is_visible !== false && !(productToHide?.hide_at && new Date(productToHide.hide_at) < new Date())}
            />
        </div>
    );
};

export default ProductManager;
