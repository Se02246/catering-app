import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useProducts } from '../../hooks/useData';
import { Trash2, Edit, Plus, Eye, EyeOff, Clock, X, Save } from 'lucide-react';
import ImageUpload from '../Common/ImageUpload';
import HideModal from '../Common/HideModal';

const ProductManager = () => {
    const { products, isLoading, mutate } = useProducts();
    const [isEditing, setIsEditing] = useState(false);
    const [isHideModalOpen, setIsHideModalOpen] = useState(false);
    const [productToHide, setProductToHide] = useState(null);
    const [currentProduct, setCurrentProduct] = useState({ name: '', description: '', price_per_kg: '', image_url: '', images: [], is_visible: true, hide_at: null, allow_multiple: false, order_increment: '', max_order_quantity: '', is_sold_by_piece: false, price_per_piece: '' });

    useEffect(() => {
        if (isEditing) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isEditing]);

    const resetForm = () => {
        setCurrentProduct({
            name: '', description: '', price_per_kg: '', image_url: '', images: [],
            pieces_per_kg: '', min_order_quantity: '', order_increment: '', max_order_quantity: '',
            show_servings: false, servings_per_unit: '', is_visible: true, hide_at: null, allow_multiple: false,
            is_gluten_free: false, is_lactose_free: false, is_sold_by_piece: false, price_per_piece: ''
        });
    };

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
                price_per_piece: currentProduct.price_per_piece ? parseFloat(currentProduct.price_per_piece) : null
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

    const calculatePricePerPiece = () => {
        const pricePerKg = parseFloat(currentProduct.price_per_kg);
        const piecesPerKg = parseFloat(currentProduct.pieces_per_kg);

        if (!currentProduct.price_per_kg || !currentProduct.pieces_per_kg || isNaN(pricePerKg) || isNaN(piecesPerKg) || piecesPerKg <= 0) {
            alert('Per favore, compila correttamente i campi "Prezzo al Kg" e "Pezzi per Kg". Assicurati che "Pezzi per Kg" sia maggiore di zero.');
            return;
        }

        const pricePerPiece = pricePerKg / piecesPerKg;
        setCurrentProduct({
            ...currentProduct,
            price_per_piece: pricePerPiece.toFixed(2)
        });
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Gestione Prodotti</h2>
                <button className="btn btn-primary" onClick={() => { resetForm(); setIsEditing(true); }}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuovo Prodotto
                </button>
            </div>

            {isEditing && (
                <div className="modal-overlay" onClick={() => { setIsEditing(false); resetForm(); }}>
                    <div className="modal-content" style={{ 
                        maxWidth: '600px', 
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
                                                onChange={e => setCurrentProduct({ ...currentProduct, price_per_kg: e.target.value })}
                                                required={!currentProduct.is_sold_by_piece}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', opacity: currentProduct.is_sold_by_piece ? 1 : 0.5 }}>Prezzo al Pezzo (€)</label>
                                            <input
                                                type="number" step="0.01"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', backgroundColor: !currentProduct.is_sold_by_piece ? '#eee' : 'white' }}
                                                value={currentProduct.price_per_piece || ''}
                                                onChange={e => setCurrentProduct({ ...currentProduct, price_per_piece: e.target.value })}
                                                required={currentProduct.is_sold_by_piece}
                                                disabled={!currentProduct.is_sold_by_piece}
                                            />
                                        </div>
                                    </div>

                                    {currentProduct.is_sold_by_piece && (
                                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed rgba(155, 57, 61, 0.1)' }}>
                                            <button 
                                                type="button" 
                                                className="btn btn-outline" 
                                                onClick={calculatePricePerPiece}
                                                style={{ width: '100%', marginBottom: '0.5rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                                            >
                                                Calcola
                                            </button>
                                            <p style={{ fontSize: '0.8rem', color: '#666', margin: 0, textAlign: 'center' }}>
                                                Assicurati di aver compilato correttamente il campo "prezzo al kg" e "pezzi al kg".
                                            </p>
                                        </div>
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
                                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Pezzi per Kg</label>
                                        <input
                                            type="number" step="0.1"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                            value={currentProduct.pieces_per_kg || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, pieces_per_kg: e.target.value })}
                                            placeholder="Opzionale"
                                        />
                                    </div>
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
