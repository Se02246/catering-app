import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, Plus, Save } from 'lucide-react';

const PackageBuilder = () => {
    const [packages, setPackages] = useState([]);
    const [products, setProducts] = useState([]);
    const [isCreating, setIsCreating] = useState(false);

    // New Package State
    const [newPackage, setNewPackage] = useState({
        name: '',
        description: '',
        image_url: '',
        total_price: 0,
        items: [] // { product_id, quantity, tempId }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pkgs, prods] = await Promise.all([
                api.getCaterings(),
                api.getProducts()
            ]);
            setPackages(pkgs);
            setProducts(prods);
        } catch (err) {
            console.error('Failed to load data', err);
        }
    };

    const handleAddItem = () => {
        if (products.length === 0) return;
        setNewPackage({
            ...newPackage,
            items: [
                ...newPackage.items,
                { product_id: products[0].id, quantity: 1, tempId: Date.now() }
            ]
        });
    };

    const updateItem = (tempId, field, value) => {
        setNewPackage({
            ...newPackage,
            items: newPackage.items.map(item =>
                item.tempId === tempId ? { ...item, [field]: value } : item
            )
        });
    };

    const removeItem = (tempId) => {
        setNewPackage({
            ...newPackage,
            items: newPackage.items.filter(item => item.tempId !== tempId)
        });
    };

    const calculateSuggestedPrice = () => {
        return newPackage.items.reduce((sum, item) => {
            const prod = products.find(p => p.id == item.product_id);
            return sum + (prod ? prod.price_per_kg * item.quantity : 0);
        }, 0);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.createCatering(newPackage);
            setIsCreating(false);
            setNewPackage({ name: '', description: '', image_url: '', total_price: 0, items: [] });
            loadData();
        } catch (err) {
            alert('Error creating package');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Gestione Pacchetti Catering</h2>
                <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuovo Pacchetto
                </button>
            </div>

            {isCreating && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3>Nuovo Pacchetto Catering</h3>
                        <form onSubmit={handleSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label>Nome Pacchetto</label>
                                    <input
                                        className="form-control"
                                        style={{ width: '100%', padding: '0.5rem' }}
                                        value={newPackage.name}
                                        onChange={e => setNewPackage({ ...newPackage, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ marginBottom: '1rem' }}>
                                    <label>Prezzo Totale (€)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <input
                                            type="number" step="0.01"
                                            style={{ width: '100%', padding: '0.5rem' }}
                                            value={newPackage.total_price}
                                            onChange={e => setNewPackage({ ...newPackage, total_price: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}
                                            onClick={() => setNewPackage({ ...newPackage, total_price: calculateSuggestedPrice().toFixed(2) })}
                                        >
                                            Usa Suggerito (€ {calculateSuggestedPrice().toFixed(2)})
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Descrizione</label>
                                <textarea
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={newPackage.description}
                                    onChange={e => setNewPackage({ ...newPackage, description: e.target.value })}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>URL Immagine</label>
                                <input
                                    type="text"
                                    style={{ width: '100%', padding: '0.5rem' }}
                                    value={newPackage.image_url}
                                    onChange={e => setNewPackage({ ...newPackage, image_url: e.target.value })}
                                />
                            </div>

                            <h4 style={{ marginBottom: '0.5rem', marginTop: '1.5rem' }}>Prodotti Inclusi</h4>
                            {newPackage.items.map((item, index) => (
                                <div key={item.tempId} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <select
                                        style={{ flex: 2, padding: '0.5rem' }}
                                        value={item.product_id}
                                        onChange={e => updateItem(item.tempId, 'product_id', e.target.value)}
                                    >
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} (€ {p.price_per_kg}/kg)</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number" step="0.1" placeholder="Qtà"
                                        style={{ width: '80px', padding: '0.5rem' }}
                                        value={item.quantity}
                                        onChange={e => updateItem(item.tempId, 'quantity', e.target.value)}
                                    />
                                    <button type="button" className="btn btn-outline" style={{ color: 'red', borderColor: 'red' }} onClick={() => removeItem(item.tempId)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button type="button" className="btn btn-outline" onClick={handleAddItem} style={{ marginTop: '0.5rem' }}>
                                <Plus size={16} style={{ marginRight: '5px' }} /> Aggiungi Prodotto
                            </button>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                                <button type="button" className="btn btn-outline" onClick={() => setIsCreating(false)}>Annulla</button>
                                <button type="submit" className="btn btn-primary">
                                    <Save size={18} style={{ marginRight: '8px' }} />
                                    Salva Pacchetto
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {packages.map(pkg => (
                    <div key={pkg.id} style={{
                        padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        {pkg.image_url && <img src={pkg.image_url} alt={pkg.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }} />}
                        <h3 style={{ marginBottom: '0.5rem' }}>{pkg.name}</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', flex: 1 }}>{pkg.description}</p>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                            € {pkg.total_price}
                        </div>
                        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                            <strong>Include:</strong>
                            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                                {pkg.items && pkg.items.map((item, idx) => (
                                    <li key={idx}>{item.quantity}kg {item.name}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PackageBuilder;
