import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, Plus, Save, Pencil, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import ImageUpload from '../Common/ImageUpload';

const PackageBuilder = () => {
    const [packages, setPackages] = useState([]);
    const [products, setProducts] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [discountedPriceInput, setDiscountedPriceInput] = useState('');

    // New Package State
    const [newPackage, setNewPackage] = useState({
        name: '',
        description: '',
        image_url: '',
        images: [],
        total_price: 0,
        discount_percentage: 0,
        items: [], // { product_id, quantity, tempId }
        is_gluten_free: false,
        is_lactose_free: false
    });



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

    useEffect(() => {
        loadData();
    }, []);



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
            if (!prod) return sum;

            if (prod.pieces_per_kg > 0) {
                // quantity is in pieces
                // weight = quantity / pieces_per_kg
                // price = weight * price_per_kg
                return sum + ((item.quantity / prod.pieces_per_kg) * prod.price_per_kg);
            } else {
                // quantity is in kg
                return sum + (prod.price_per_kg * item.quantity);
            }
        }, 0);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.updateCatering(editingId, newPackage);
            } else {
                await api.createCatering(newPackage);
            }
            setIsCreating(false);
            setEditingId(null);
            setNewPackage({ name: '', description: '', image_url: '', total_price: 0, discount_percentage: 0, items: [] });
            setDiscountedPriceInput('');
            loadData();
        } catch {
            alert('Error saving package');
        }
    };

    const handleEdit = (pkg) => {
        setEditingId(pkg.id);
        const price = pkg.total_price * (1 - (parseFloat(pkg.discount_percentage) || 0) / 100);
        setDiscountedPriceInput(pkg.discount_percentage > 0 ? price.toFixed(2) : '');

        setNewPackage({
            name: pkg.name,
            description: pkg.description,
            image_url: pkg.image_url,
            images: pkg.images || (pkg.image_url ? [pkg.image_url] : []),
            total_price: pkg.total_price,
            discount_percentage: parseFloat(pkg.discount_percentage) || 0,
            items: pkg.items.map(i => ({ ...i, tempId: Date.now() + Math.random() })),
            is_gluten_free: pkg.is_gluten_free || false,
            is_lactose_free: pkg.is_lactose_free || false
        });
        setIsCreating(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo pacchetto?')) return;
        try {
            await api.deleteCatering(id);
            loadData();
        } catch {
            alert('Errore durante l\'eliminazione');
        }
    };

    const handleMoveUp = async (index) => {
        if (index === 0) return;
        const newPackages = [...packages];
        const temp = newPackages[index];
        newPackages[index] = newPackages[index - 1];
        newPackages[index - 1] = temp;

        // Update sort_order for all
        const updates = newPackages.map((pkg, idx) => ({ id: pkg.id, sort_order: idx }));

        // Optimistic update
        setPackages(newPackages);

        try {
            await api.reorderCaterings(updates);
        } catch (err) {
            console.error('Failed to reorder', err);
            loadData(); // Revert on error
        }
    };

    const handleMoveDown = async (index) => {
        if (index === packages.length - 1) return;
        const newPackages = [...packages];
        const temp = newPackages[index];
        newPackages[index] = newPackages[index + 1];
        newPackages[index + 1] = temp;

        // Update sort_order for all
        const updates = newPackages.map((pkg, idx) => ({ id: pkg.id, sort_order: idx }));

        // Optimistic update
        setPackages(newPackages);

        try {
            await api.reorderCaterings(updates);
        } catch (err) {
            console.error('Failed to reorder', err);
            loadData(); // Revert on error
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Gestione Pacchetti Catering</h2>
                <button className="btn btn-primary" onClick={() => {
                    setIsCreating(true);
                    setEditingId(null);
                    setNewPackage({ name: '', description: '', image_url: '', images: [], total_price: 0, discount_percentage: 0, items: [] });
                    setDiscountedPriceInput('');
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuovo Pacchetto
                </button>
            </div>

            {isCreating && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000
                }}>
                    <div className="modal-content" style={{ width: '1200px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--color-bg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3>{editingId ? 'Modifica Pacchetto' : 'Nuovo Pacchetto Catering'}</h3>
                            <button className="btn btn-outline" onClick={() => setIsCreating(false)}>Chiudi</button>
                        </div>

                        <form onSubmit={handleSave} className="grid-quote-builder">

                            {/* Left Column: Product Selection (Grid of Cards) */}
                            <div style={{ overflowY: 'auto', maxHeight: '70vh', paddingRight: '0.5rem' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Seleziona Prodotti</h4>
                                <input
                                    type="text"
                                    placeholder="Cerca prodotto..."
                                    style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="grid-responsive" style={{ gap: '1rem' }}>
                                    {products.filter(p => p.name.toLowerCase().includes((searchTerm || '').toLowerCase())).map(p => (
                                        <div key={p.id} style={{
                                            padding: '1rem', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)',
                                            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            {p.image_url && (
                                                <img
                                                    src={p.image_url}
                                                    alt={p.name}
                                                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem' }}
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x300?text=No+Img'; }}
                                                />
                                            )}
                                            <div>
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
                                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>€ {p.price_per_kg} / kg</p>
                                            </div>
                                            {(() => {
                                                const existing = newPackage.items.find(i => i.product_id === p.id);
                                                const isAdded = !!existing;
                                                return (
                                                    <button
                                                        type="button"
                                                        className={isAdded ? "btn btn-primary" : "btn btn-outline"}
                                                        style={{ marginTop: '1rem', width: '100%', borderRadius: 'var(--radius-full)' }}
                                                        onClick={() => {
                                                            if (p.allow_multiple) {
                                                                setNewPackage({
                                                                    ...newPackage,
                                                                    items: [...newPackage.items, { product_id: p.id, quantity: 1, tempId: Date.now() + Math.random() }]
                                                                });
                                                            } else {
                                                                if (existing) {
                                                                    updateItem(existing.tempId, 'quantity', parseFloat(existing.quantity) + 1);
                                                                } else {
                                                                    setNewPackage({
                                                                        ...newPackage,
                                                                        items: [...newPackage.items, { product_id: p.id, quantity: 1, tempId: Date.now() }]
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {isAdded ? (p.allow_multiple ? 'Aggiungi un altro' : 'Aggiungi (+1)') : 'Aggiungi'}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Column: Package Summary (Cart Style) */}
                            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', height: 'fit-content' }}>
                                <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Dettagli Pacchetto</h4>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Nome</label>
                                    <input
                                        className="form-control"
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '0.5rem' }}
                                        value={newPackage.name}
                                        onChange={e => setNewPackage({ ...newPackage, name: e.target.value })}
                                        required
                                        placeholder="Es. Buffet Compleanno"
                                    />

                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Prezzo (€)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="number" step="0.01"
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                            value={newPackage.total_price}
                                            onChange={e => {
                                                const newTotal = e.target.value;
                                                setNewPackage({ ...newPackage, total_price: newTotal });
                                                // Update discounted price input if percentage exists
                                                if (newPackage.discount_percentage > 0 && newTotal) {
                                                    const price = parseFloat(newTotal) * (1 - newPackage.discount_percentage / 100);
                                                    setDiscountedPriceInput(price.toFixed(2));
                                                }
                                            }}
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                            onClick={() => setNewPackage({ ...newPackage, total_price: calculateSuggestedPrice().toFixed(2) })}
                                        >
                                            Suggerito: €{calculateSuggestedPrice().toFixed(2)}
                                        </button>
                                    </div>

                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Prezzo Scontato (€)</label>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="number" step="0.01"
                                            style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                            value={discountedPriceInput}
                                            placeholder="Lascia vuoto per nessun sconto"
                                            onChange={e => {
                                                const val = e.target.value;
                                                setDiscountedPriceInput(val);

                                                const price = parseFloat(val);
                                                const total = parseFloat(newPackage.total_price);

                                                if (!isNaN(price) && !isNaN(total) && total > 0) {
                                                    const discount = ((1 - (price / total)) * 100);
                                                    setNewPackage(prev => ({ ...prev, discount_percentage: Math.max(0, discount) }));
                                                } else {
                                                    setNewPackage(prev => ({ ...prev, discount_percentage: 0 }));
                                                }
                                            }}
                                        />
                                    </div>
                                    {newPackage.discount_percentage > 0 && (
                                        <div style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'green' }}>
                                            Sconto applicato: {newPackage.discount_percentage.toFixed(1)}%
                                        </div>
                                    )}

                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Descrizione</label>
                                    <textarea
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', height: '60px', marginBottom: '0.5rem' }}
                                        value={newPackage.description}
                                        onChange={e => setNewPackage({ ...newPackage, description: e.target.value })}
                                        placeholder="Breve descrizione..."
                                    />

                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                id="pkg_gluten_free"
                                                checked={newPackage.is_gluten_free || false}
                                                onChange={e => setNewPackage({ ...newPackage, is_gluten_free: e.target.checked })}
                                                style={{ marginRight: '0.5rem' }}
                                            />
                                            <label htmlFor="pkg_gluten_free" style={{ fontWeight: 'bold', color: '#FF9800', fontSize: '0.9rem' }}>Senza Glutine!</label>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                id="pkg_lactose_free"
                                                checked={newPackage.is_lactose_free || false}
                                                onChange={e => setNewPackage({ ...newPackage, is_lactose_free: e.target.checked })}
                                                style={{ marginRight: '0.5rem' }}
                                            />
                                            <label htmlFor="pkg_lactose_free" style={{ fontWeight: 'bold', color: '#03A9F4', fontSize: '0.9rem' }}>Senza Lattosio!</label>
                                        </div>
                                    </div>

                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Immagini (Trascina per riordinare)</label>
                                    <ImageUpload
                                        images={newPackage.images}
                                        onUpload={(newImages) => setNewPackage({
                                            ...newPackage,
                                            images: newImages,
                                            image_url: newImages.length > 0 ? newImages[0] : ''
                                        })}
                                    />
                                </div>

                                <h5 style={{ marginBottom: '0.5rem', marginTop: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Prodotti Inclusi ({newPackage.items.length})</h5>
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {newPackage.items.length === 0 ? (
                                        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>Nessun prodotto aggiunto.</p>
                                    ) : (
                                        newPackage.items.map((item) => {
                                            const product = products.find(p => p.id === item.product_id);
                                            const isPieces = product?.pieces_per_kg > 0;
                                            const unit = isPieces ? 'pz' : 'kg';
                                            const step = isPieces ? 1 : 0.1;
                                            const min = isPieces ? 1 : 0.1;

                                            return (
                                                <div key={item.tempId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600' }}>
                                                            {product ? product.name : 'Unknown'}
                                                            <div style={{ display: 'inline-flex', gap: '0.25rem', marginLeft: '0.5rem', flexWrap: 'wrap' }}>
                                                                {product?.is_gluten_free && (
                                                                    <span style={{ color: '#FF9800', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                                                        Senza Glutine!
                                                                    </span>
                                                                )}
                                                                {product?.is_lactose_free && (
                                                                    <span style={{ color: '#03A9F4', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                                                        Senza Lattosio!
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                                            {isPieces
                                                                ? `€ ${(product?.price_per_kg / product.pieces_per_kg).toFixed(2)} / pz`
                                                                : `€ ${product?.price_per_kg}/kg`}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.25rem' }}
                                                            onClick={() => updateItem(item.tempId, 'quantity', Math.max(min, (parseFloat(item.quantity) || 0) - step).toFixed(isPieces ? 0 : 1))}
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            step={step}
                                                            min={min}
                                                            style={{ width: '60px', textAlign: 'center', fontSize: '0.9rem', padding: '0.25rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(item.tempId, 'quantity', e.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline"
                                                            style={{ padding: '0.25rem' }}
                                                            onClick={() => updateItem(item.tempId, 'quantity', ((parseFloat(item.quantity) || 0) + step).toFixed(isPieces ? 0 : 1))}
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                        <span style={{ fontSize: '0.8rem', marginLeft: '0.25rem' }}>{unit}</span>
                                                        <button type="button" className="btn btn-outline" style={{ color: 'red', borderColor: 'red', padding: '0.25rem', border: 'none', marginLeft: '0.5rem' }} onClick={() => removeItem(item.tempId)}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                        <Save size={18} style={{ marginRight: '8px' }} />
                                        {editingId ? 'Aggiorna Pacchetto' : 'Salva Pacchetto'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {packages.map((pkg, index) => (
                    <div key={pkg.id} style={{
                        padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)',
                        display: 'flex', flexDirection: 'column', position: 'relative'
                    }}>
                        <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.25rem', zIndex: 10 }}>
                            <button
                                className="btn btn-outline"
                                style={{
                                    padding: '0.25rem',
                                    borderColor: index === 0 ? '#ccc' : 'var(--color-border)',
                                    color: index === 0 ? '#ccc' : 'var(--color-text)',
                                    cursor: index === 0 ? 'default' : 'pointer'
                                }}
                                onClick={() => handleMoveUp(index)}
                                disabled={index === 0}
                            >
                                <ArrowUp size={16} />
                            </button>
                            <button
                                className="btn btn-outline"
                                style={{
                                    padding: '0.25rem',
                                    borderColor: index === packages.length - 1 ? '#ccc' : 'var(--color-border)',
                                    color: index === packages.length - 1 ? '#ccc' : 'var(--color-text)',
                                    cursor: index === packages.length - 1 ? 'default' : 'pointer'
                                }}
                                onClick={() => handleMoveDown(index)}
                                disabled={index === packages.length - 1}
                            >
                                <ArrowDown size={16} />
                            </button>
                        </div>
                        {pkg.image_url && <img src={pkg.image_url} alt={pkg.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }} />}
                        <h3 style={{ marginBottom: '0.5rem' }}>{pkg.name}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            {pkg.is_gluten_free && (
                                <span style={{ color: '#FF9800', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    Senza Glutine!
                                </span>
                            )}
                            {pkg.is_lactose_free && (
                                <span style={{ color: '#03A9F4', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    Senza Lattosio!
                                </span>
                            )}
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', flex: 1 }}>{pkg.description}</p>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                            {pkg.discount_percentage > 0 ? (
                                <div>
                                    <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '1rem', marginRight: '0.5rem' }}>
                                        € {pkg.total_price}
                                    </span>
                                    <span>
                                        € {(pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)}
                                    </span>
                                </div>
                            ) : (
                                <span>€ {pkg.total_price}</span>
                            )}
                        </div>
                        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                            <strong>Include:</strong>
                            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                                {pkg.items && pkg.items.map((item, idx) => (
                                    <li key={idx}>
                                        {item.pieces_per_kg > 0
                                            ? `${item.quantity} pz ${item.name}`
                                            : `${item.quantity}kg ${item.name}`
                                        }
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => handleEdit(pkg)}>
                                <Pencil size={16} style={{ marginRight: '4px' }} /> Modifica
                            </button>
                            <button className="btn btn-outline" style={{ flex: 1, color: 'red', borderColor: 'red' }} onClick={() => handleDelete(pkg.id)}>
                                <Trash2 size={16} style={{ marginRight: '4px' }} /> Elimina
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PackageBuilder;
