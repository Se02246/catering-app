import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({ name: '', description: '', price_per_kg: '', image_url: '', images: [], is_visible: true, allow_multiple: false, order_increment: '', max_order_quantity: '' });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await api.getProducts();
            setProducts(data);
        } catch (err) {
            console.error('Failed to load products', err);
        }
    };

    const resetForm = () => {
        setCurrentProduct({
            name: '', description: '', price_per_kg: '', image_url: '', images: [],
            pieces_per_kg: '', min_order_quantity: '', order_increment: '', max_order_quantity: '',
            show_servings: false, servings_per_unit: '', is_visible: true, allow_multiple: false
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
                is_visible: currentProduct.is_visible !== undefined ? currentProduct.is_visible : true,
                allow_multiple: currentProduct.allow_multiple || false,
                max_order_quantity: currentProduct.max_order_quantity ? parseFloat(currentProduct.max_order_quantity) : null
            };

            if (currentProduct.id) {
                await api.updateProduct(currentProduct.id, productToSave);
            } else {
                await api.addProduct(productToSave);
            }
            setIsEditing(false);
            resetForm();
            loadProducts();
        } catch (err) {
            console.error(err);
            alert(err.message || 'Error saving product');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            await api.deleteProduct(id);
            loadProducts();
        }
    };

    const toggleVisibility = async (product) => {
        try {
            await api.updateProduct(product.id, { ...product, is_visible: !product.is_visible });
            loadProducts();
        } catch (err) {
            console.error('Failed to toggle visibility', err);
            alert('Errore durante l\'aggiornamento della visibilità');
        }
    };

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
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content">
                        <h3>{currentProduct.id ? 'Modifica Prodotto' : 'Nuovo Prodotto'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Nome</label>
                                <input
                                    className="form-control"
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={currentProduct.name}
                                    onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Descrizione</label>
                                <textarea
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={currentProduct.description}
                                    onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Prezzo al Kg (€)</label>
                                <input
                                    type="number" step="0.01"
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={currentProduct.price_per_kg}
                                    onChange={e => setCurrentProduct({ ...currentProduct, price_per_kg: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Immagini (Trascina per riordinare, la prima è la copertina)</label>
                                <ImageUpload
                                    images={currentProduct.images}
                                    onUpload={(newImages) => setCurrentProduct({ ...currentProduct, images: newImages })}
                                />
                            </div>
                            <div className="grid-3-cols" style={{ marginBottom: '1rem' }}>
                                <div>
                                    <label>Pezzi per Kg</label>
                                    <input
                                        type="number" step="0.1"
                                        style={{ width: '100%', padding: '0.5rem' }}
                                        value={currentProduct.pieces_per_kg || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, pieces_per_kg: e.target.value })}
                                        placeholder="Opzionale"
                                    />
                                </div>
                                <div>
                                    <label>Minimo Ordine</label>
                                    <input
                                        type="number" step="0.1"
                                        style={{ width: '100%', padding: '0.5rem' }}
                                        value={currentProduct.min_order_quantity || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, min_order_quantity: e.target.value })}
                                        placeholder="Default 1"
                                    />
                                </div>
                                <div>
                                    <label>Incremento</label>
                                    <input
                                        type="number" step="0.1"
                                        style={{ width: '100%', padding: '0.5rem' }}
                                        value={currentProduct.order_increment || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, order_increment: e.target.value })}
                                        placeholder="Default 1"
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label>Massimo Ordine</label>
                                <input
                                    type="number" step="0.1"
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={currentProduct.max_order_quantity || ''}
                                    onChange={e => setCurrentProduct({ ...currentProduct, max_order_quantity: e.target.value })}
                                    placeholder="Lascia vuoto per infinito"
                                />
                            </div>

                            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        id="show_servings"
                                        checked={currentProduct.show_servings || false}
                                        onChange={e => setCurrentProduct({ ...currentProduct, show_servings: e.target.checked })}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    <label htmlFor="show_servings" style={{ fontWeight: 'bold' }}>Mostra "per persone"</label>
                                </div>
                                {currentProduct.show_servings && (
                                    <div>
                                        <label>Persone per Unità (Kg o Pz)</label>
                                        <input
                                            type="number" step="0.1"
                                            style={{ width: '100%', padding: '0.5rem' }}
                                            value={currentProduct.servings_per_unit || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, servings_per_unit: e.target.value })}
                                            placeholder="Es. 20 persone per kg"
                                        />
                                        <small style={{ display: 'block', marginTop: '0.25rem', color: '#666' }}>
                                            Indica quante persone soddisfa 1 unità di questo prodotto.
                                        </small>
                                    </div>
                                )}
                            </div>
                            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        id="allow_multiple"
                                        checked={currentProduct.allow_multiple || false}
                                        onChange={e => setCurrentProduct({ ...currentProduct, allow_multiple: e.target.checked })}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    <label htmlFor="allow_multiple" style={{ fontWeight: 'bold' }}>Abilita "più di uno"</label>
                                </div>
                                <small style={{ display: 'block', marginTop: '0.25rem', color: '#666' }}>
                                    Se abilitato, permette di aggiungere il prodotto più volte (mostrando un contatore). Se disabilitato, il tasto diventa "Aggiunto".
                                </small>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => { setIsEditing(false); resetForm(); }}>Annulla</button>
                                <button type="submit" className="btn btn-primary">Salva</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid-responsive" style={{ gap: '1rem' }}>
                {products.map(p => (
                    <div key={p.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-sm)',
                        opacity: p.is_visible === false ? 0.6 : 1,
                        flexWrap: 'wrap', gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '200px' }}>
                            {p.image_url && (
                                <img
                                    src={p.image_url}
                                    alt={p.name}
                                    style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50?text=No+Img'; }}
                                />
                            )}
                            <div style={{ minWidth: 0 }}>
                                <h4 style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {p.name}
                                    {p.is_visible === false && <span style={{ fontSize: '0.8rem', color: 'red', marginLeft: '0.5rem' }}>(Nascosto)</span>}
                                </h4>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>€ {p.price_per_kg} / kg</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => toggleVisibility(p)} title={p.is_visible !== false ? "Nascondi" : "Mostra"}>
                                {p.is_visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => { setCurrentProduct(p); setIsEditing(true); }}>
                                <Edit size={16} />
                            </button>
                            <button className="btn btn-outline" style={{ padding: '0.5rem', color: 'red', borderColor: 'red' }} onClick={() => handleDelete(p.id)}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProductManager;
