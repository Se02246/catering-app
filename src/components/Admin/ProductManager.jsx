import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, Edit, Plus } from 'lucide-react';

const ProductManager = () => {
    const [products, setProducts] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState({ name: '', description: '', price_per_kg: '', image_url: '' });

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (currentProduct.id) {
                await api.updateProduct(currentProduct.id, currentProduct);
            } else {
                await api.addProduct(currentProduct);
            }
            setIsEditing(false);
            setCurrentProduct({ name: '', description: '', price_per_kg: '', image_url: '' });
            loadProducts();
        } catch (err) {
            alert('Error saving product');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure?')) {
            await api.deleteProduct(id);
            loadProducts();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Gestione Prodotti</h2>
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuovo Prodotto
                </button>
            </div>

            {isEditing && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '500px' }}>
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
                                <label>URL Immagine</label>
                                <input
                                    type="text"
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={currentProduct.image_url}
                                    onChange={e => setCurrentProduct({ ...currentProduct, image_url: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>Annulla</button>
                                <button type="submit" className="btn btn-primary">Salva</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '1rem' }}>
                {products.map(p => (
                    <div key={p.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-sm)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            {p.image_url && <img src={p.image_url} alt={p.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />}
                            <div>
                                <h4 style={{ margin: 0 }}>{p.name}</h4>
                                <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>€ {p.price_per_kg} / kg</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-outline" onClick={() => { setCurrentProduct(p); setIsEditing(true); }}>
                                <Edit size={16} />
                            </button>
                            <button className="btn btn-outline" style={{ color: 'red', borderColor: 'red' }} onClick={() => handleDelete(p.id)}>
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
