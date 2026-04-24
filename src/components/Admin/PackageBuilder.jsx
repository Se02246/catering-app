import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useProducts, useCaterings } from '../../hooks/useData';
import { Trash2, Plus, Save, Pencil, Minus, Eye, EyeOff, Clock, X, Search, Edit, ChevronUp, ChevronDown } from 'lucide-react';
import ImageUpload from '../Common/ImageUpload';
import HideModal from '../Common/HideModal';

const PackageBuilder = () => {
    const { caterings: packages, mutate: mutateCaterings } = useCaterings();
    const { products } = useProducts();
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [discountedPriceInput, setDiscountedPriceInput] = useState('');
    const [isHideModalOpen, setIsHideModalOpen] = useState(false);
    const [packageToHide, setPackageToHide] = useState(null);
    
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItemData, setEditingItemData] = useState(null);

    // New Package State
    const [newPackage, setNewPackage] = useState({
        name: '',
        description: '',
        image_url: '',
        images: [],
        total_price: 0,
        discount_percentage: 0,
        items: [], // { product_id, quantity, tempId, is_sold_by_piece, ...overrides }
        is_gluten_free: false,
        is_lactose_free: false,
        is_visible: true,
        hide_at: null
    });

    useEffect(() => {
        if (isCreating) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isCreating]);

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

    const moveItem = (index, direction) => {
        const newItems = [...newPackage.items];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;
        
        const temp = newItems[index];
        newItems[index] = newItems[targetIndex];
        newItems[targetIndex] = temp;
        
        setNewPackage({ ...newPackage, items: newItems });
    };

    const calculateSuggestedPrice = () => {
        return newPackage.items.reduce((sum, item) => {
            const prod = products.find(p => p.id == item.product_id);
            if (!prod) return sum;

            const isPieces = item.is_sold_by_piece !== undefined ? item.is_sold_by_piece : prod.is_sold_by_piece;
            const price = isPieces ? (Number(item.price_per_piece) || Number(prod.price_per_piece) || 0) : (Number(item.price_per_kg) || Number(prod.price_per_kg) || 0);
            return sum + (price * item.quantity);
        }, 0);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            let packageToSave = { ...newPackage };

            if (!packageToSave.images || packageToSave.images.length === 0) {
                const productImages = newPackage.items
                    .map(item => {
                        if (item.image_url) return item.image_url;
                        return products.find(p => p.id === item.product_id)?.image_url;
                    })
                    .filter(url => url && url.trim() !== '');
                
                const uniqueProductImages = [...new Set(productImages)];
                
                if (uniqueProductImages.length > 0) {
                    packageToSave.images = uniqueProductImages;
                    packageToSave.image_url = uniqueProductImages[0];
                }
            }

            if (editingId) {
                await api.updateCatering(editingId, packageToSave);
            } else {
                await api.createCatering(packageToSave);
            }
            setIsCreating(false);
            setEditingId(null);
            setNewPackage({ name: '', description: '', image_url: '', images: [], total_price: 0, discount_percentage: 0, items: [], is_visible: true, hide_at: null });
            setDiscountedPriceInput('');
            mutateCaterings();
        } catch {
            alert('Errore durante il salvataggio del pacchetto');
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
            items: pkg.items.map(i => ({ 
                ...i, 
                tempId: i.tempId || (Date.now() + Math.random()),
                // Ensure catalog values are used as baseline if not present in item
                is_sold_by_piece: i.is_sold_by_piece !== undefined ? i.is_sold_by_piece : products.find(p => p.id === i.product_id)?.is_sold_by_piece
            })),
            is_gluten_free: pkg.is_gluten_free || false,
            is_lactose_free: pkg.is_lactose_free || false,
            is_visible: pkg.is_visible !== undefined ? pkg.is_visible : true,
            hide_at: pkg.hide_at || null
        });
        setIsCreating(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo pacchetto?')) return;
        try {
            await api.deleteCatering(id);
            mutateCaterings();
        } catch {
            alert('Errore durante l\'eliminazione');
        }
    };

    const toggleVisibility = async (pkg) => {
        setPackageToHide(pkg);
        setIsHideModalOpen(true);
    };

    const confirmHide = async (hideAt) => {
        if (!packageToHide) return;
        try {
            const isUnhiding = hideAt === 'unhide';
            await api.updateCatering(packageToHide.id, { 
                ...packageToHide, 
                is_visible: isUnhiding ? true : (hideAt ? true : false),
                hide_at: isUnhiding ? null : hideAt 
            });
            setIsHideModalOpen(false);
            setPackageToHide(null);
            mutateCaterings();
        } catch (err) {
            console.error('Failed to update visibility', err);
            alert('Errore durante l\'aggiornamento della visibilità');
        }
    };

    const handleMovePackageUp = async (index) => {
        if (index === 0) return;
        const newPackages = [...packages];
        const temp = newPackages[index];
        newPackages[index] = newPackages[index - 1];
        newPackages[index - 1] = temp;
        const updates = newPackages.map((pkg, idx) => ({ id: pkg.id, sort_order: idx }));
        mutateCaterings(newPackages, false);
        try {
            await api.reorderCaterings(updates);
            mutateCaterings();
        } catch (err) {
            mutateCaterings();
        }
    };

    const handleMovePackageDown = async (index) => {
        if (index === packages.length - 1) return;
        const newPackages = [...packages];
        const temp = newPackages[index];
        newPackages[index] = newPackages[index + 1];
        newPackages[index + 1] = temp;
        const updates = newPackages.map((pkg, idx) => ({ id: pkg.id, sort_order: idx }));
        mutateCaterings(newPackages, false);
        try {
            await api.reorderCaterings(updates);
            mutateCaterings();
        } catch (err) {
            mutateCaterings();
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>Gestione Pacchetti</h2>
                <button className="btn btn-primary" onClick={() => {
                    setIsCreating(true);
                    setEditingId(null);
                    setNewPackage({ name: '', description: '', image_url: '', images: [], total_price: 0, discount_percentage: 0, items: [], is_visible: true, hide_at: null });
                    setDiscountedPriceInput('');
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuovo Pacchetto
                </button>
            </div>

            {isCreating && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000
                }} onClick={() => setIsCreating(false)}>
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
                            <h3 style={{ margin: 0 }}>{editingId ? 'Modifica Pacchetto' : 'Nuovo Pacchetto'}</h3>
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
                                onClick={() => setIsCreating(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Main Area */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                            <form id="package-form" onSubmit={handleSave} style={{ 
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
                                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                        {products.filter(p => p.name.toLowerCase().includes((searchTerm || '').toLowerCase())).map(p => {
                                            const existing = newPackage.items.find(i => i.product_id === p.id);
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
                                                                setNewPackage({
                                                                    ...newPackage,
                                                                    items: [...newPackage.items, { ...p, product_id: p.id, quantity: 1, tempId: Date.now() + Math.random() }]
                                                                });
                                                            } else {
                                                                if (existing) {
                                                                    updateItem(existing.tempId, 'quantity', parseFloat(existing.quantity) + 1);
                                                                } else {
                                                                    setNewPackage({
                                                                        ...newPackage,
                                                                        items: [...newPackage.items, { ...p, product_id: p.id, quantity: 1, tempId: Date.now() }]
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

                                {/* Section 2: Package Details */}
                                <div>
                                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' }}>
                                        <h4 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>2. Configura Pacchetto</h4>

                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Nome Pacchetto</label>
                                            <input
                                                className="form-control"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                value={newPackage.name}
                                                onChange={e => setNewPackage({ ...newPackage, name: e.target.value })}
                                                required
                                                placeholder="Es. Buffet Premium Aziendale"
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Prezzo Totale (€)</label>
                                                <input
                                                    type="number" step="0.01"
                                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                    value={newPackage.total_price}
                                                    onChange={e => {
                                                        const newTotal = e.target.value;
                                                        setNewPackage({ ...newPackage, total_price: newTotal });
                                                        if (newPackage.discount_percentage > 0 && newTotal) {
                                                            const price = parseFloat(newTotal) * (1 - newPackage.discount_percentage / 100);
                                                            setDiscountedPriceInput(price.toFixed(2));
                                                        }
                                                    }}
                                                    required
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.75rem', fontSize: '0.75rem' }}
                                                    onClick={() => setNewPackage({ ...newPackage, total_price: calculateSuggestedPrice().toFixed(2) })}
                                                >
                                                    Usa Suggerito: €{calculateSuggestedPrice().toFixed(2)}
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Prezzo Scontato (€ - Opzionale)</label>
                                            <input
                                                type="number" step="0.01"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                value={discountedPriceInput}
                                                placeholder="Inserisci per calcolare lo sconto"
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
                                            {newPackage.discount_percentage > 0 && (
                                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                                                    Sconto Calcolato: {newPackage.discount_percentage.toFixed(1)}%
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Descrizione</label>
                                            <textarea
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', height: '80px' }}
                                                value={newPackage.description}
                                                onChange={e => setNewPackage({ ...newPackage, description: e.target.value })}
                                                placeholder="Cosa include questo pacchetto?"
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setNewPackage({ ...newPackage, is_gluten_free: !newPackage.is_gluten_free })}>
                                                <input type="checkbox" checked={newPackage.is_gluten_free || false} readOnly style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
                                                <label style={{ fontWeight: 'bold', color: '#FF9800', cursor: 'pointer' }}>Senza Glutine!</label>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setNewPackage({ ...newPackage, is_lactose_free: !newPackage.is_lactose_free })}>
                                                <input type="checkbox" checked={newPackage.is_lactose_free || false} readOnly style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
                                                <label style={{ fontWeight: 'bold', color: '#03A9F4', cursor: 'pointer' }}>Senza Lattosio!</label>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Immagini Gallery</label>
                                            <ImageUpload
                                                images={newPackage.images}
                                                onUpload={(newImages) => setNewPackage({
                                                    ...newPackage,
                                                    images: newImages,
                                                    image_url: newImages.length > 0 ? newImages[0] : ''
                                                })}
                                            />
                                        </div>

                                        {/* Products Summary in the Package */}
                                        <div style={{ marginTop: '2rem', borderTop: '2px dashed var(--color-border)', paddingTop: '1.5rem' }}>
                                            <h5 style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                                Prodotti nel Pacchetto <span>({newPackage.items.length})</span>
                                            </h5>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {newPackage.items.length === 0 ? (
                                                    <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>Seleziona i prodotti dalla lista a sinistra.</p>
                                                ) : (
                                                    newPackage.items.map((item, index) => {
                                                        const product = products.find(p => p.id === item.product_id);
                                                        const isPieces = item.is_sold_by_piece !== undefined ? item.is_sold_by_piece : product?.is_sold_by_piece;
                                                        const unit = isPieces ? 'pz' : 'kg';
                                                        const step = isPieces ? 1 : 0.1;
                                                        
                                                        const canToggleUnit = Number(product?.price_per_kg) > 0 && Number(product?.price_per_piece) > 0;

                                                        if (editingItemId === item.tempId) {
                                                            return (
                                                                <div key={item.tempId} style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--color-primary)' }}>
                                                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                                                        <div style={{ flex: 1, minWidth: '150px' }}>
                                                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Nome Prodotto</label>
                                                                            <input type="text" value={editingItemData.name || ''} onChange={e => setEditingItemData({...editingItemData, name: e.target.value})} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }} />
                                                                        </div>
                                                                        <div style={{ flex: 1, minWidth: '150px' }}>
                                                                            <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>URL Immagine</label>
                                                                            <input type="text" value={editingItemData.image_url || ''} onChange={e => setEditingItemData({...editingItemData, image_url: e.target.value})} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }} />
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ marginBottom: '1rem' }}>
                                                                        <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Descrizione</label>
                                                                        <textarea value={editingItemData.description || ''} onChange={e => setEditingItemData({...editingItemData, description: e.target.value})} style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '50px', fontSize: '0.85rem' }} />
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#FF9800', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                                            <input type="checkbox" checked={editingItemData.is_gluten_free || false} onChange={e => setEditingItemData({...editingItemData, is_gluten_free: e.target.checked})} style={{ width: '14px', height: '14px' }} />
                                                                            Senza Glutine
                                                                        </label>
                                                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: '#03A9F4', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                                            <input type="checkbox" checked={editingItemData.is_lactose_free || false} onChange={e => setEditingItemData({...editingItemData, is_lactose_free: e.target.checked})} style={{ width: '14px', height: '14px' }} />
                                                                            Senza Lattosio
                                                                        </label>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                                        <button type="button" className="btn btn-outline" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => { setEditingItemId(null); setEditingItemData(null); }}>Annulla</button>
                                                                        <button type="button" className="btn btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => {
                                                                            const updatedItems = newPackage.items.map(it => it.tempId === editingItemId ? editingItemData : it);
                                                                            setNewPackage({ ...newPackage, items: updatedItems });
                                                                            setEditingItemId(null);
                                                                            setEditingItemData(null);
                                                                        }}>Salva Dettagli</button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }

                                                        return (
                                                            <div key={item.tempId} className="glass-panel" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--color-border)' }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                            <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{item.name || product?.name}</div>
                                                                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                                                                                {(item.is_gluten_free ?? product?.is_gluten_free) && (
                                                                                    <span style={{ color: '#FF9800', fontSize: '0.55rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>GF</span>
                                                                                )}
                                                                                {(item.is_lactose_free ?? product?.is_lactose_free) && (
                                                                                    <span style={{ color: '#03A9F4', fontSize: '0.55rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 4px', borderRadius: '3px' }}>LF</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                                                            {isPieces ? `€${Number(item.price_per_piece || product?.price_per_piece || 0).toFixed(2)}/pz` : `€${Number(item.price_per_kg || product?.price_per_kg || 0).toFixed(2)}/kg`}
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                                        <button type="button" className="btn btn-outline" style={{ padding: '0.3rem', border: 'none', color: 'var(--color-primary)' }} onClick={() => { setEditingItemId(item.tempId); setEditingItemData({ ...item, name: item.name || product?.name, description: item.description || product?.description, image_url: item.image_url || product?.image_url, is_gluten_free: item.is_gluten_free ?? product?.is_gluten_free, is_lactose_free: item.is_lactose_free ?? product?.is_lactose_free }); }}>
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button type="button" style={{ background: 'none', border: 'none', color: '#E11D48', cursor: 'pointer', padding: '0.3rem' }} onClick={() => removeItem(item.tempId)}>
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '0.4rem 0.6rem', borderRadius: '6px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'row', gap: '0.2rem', marginRight: '0.3rem' }}>
                                                                            <button 
                                                                                type="button" 
                                                                                className="btn btn-outline" 
                                                                                style={{ padding: '0.1rem', visibility: index === 0 ? 'hidden' : 'visible' }} 
                                                                                onClick={() => moveItem(index, -1)}
                                                                            >
                                                                                <ChevronUp size={14} />
                                                                            </button>
                                                                            <button 
                                                                                type="button" 
                                                                                className="btn btn-outline" 
                                                                                style={{ padding: '0.1rem', visibility: index === newPackage.items.length - 1 ? 'hidden' : 'visible' }} 
                                                                                onClick={() => moveItem(index, 1)}
                                                                            >
                                                                                <ChevronDown size={14} />
                                                                            </button>
                                                                        </div>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                                            <button type="button" className="btn btn-outline" style={{ padding: '0.2rem', borderRadius: '4px' }} onClick={() => updateItem(item.tempId, 'quantity', Math.max(step, (parseFloat(item.quantity) || 0) - step).toFixed(isPieces ? 0 : 1))}>
                                                                                <Minus size={12} />
                                                                            </button>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                                <input
                                                                                    type="number" step={step}
                                                                                    style={{ width: '40px', textAlign: 'center', border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '0.85rem' }}
                                                                                    value={item.quantity}
                                                                                    onChange={(e) => updateItem(item.tempId, 'quantity', e.target.value)}
                                                                                />
                                                                                <span style={{ fontSize: '0.75rem' }}>{unit}</span>
                                                                            </div>
                                                                            <button type="button" className="btn btn-outline" style={{ padding: '0.2rem', borderRadius: '4px' }} onClick={() => updateItem(item.tempId, 'quantity', ((parseFloat(item.quantity) || 0) + step).toFixed(isPieces ? 0 : 1))}>
                                                                                <Plus size={12} />
                                                                            </button>
                                                                            <button 
                                                                                type="button" 
                                                                                className="btn btn-outline"
                                                                                style={{ 
                                                                                    padding: '0.2rem 0.4rem', 
                                                                                    borderRadius: '4px',
                                                                                    marginLeft: '0.2rem',
                                                                                    opacity: canToggleUnit ? 1 : 0.4,
                                                                                    cursor: canToggleUnit ? 'pointer' : 'not-allowed',
                                                                                    color: 'var(--color-primary)',
                                                                                    fontSize: '0.7rem',
                                                                                    fontWeight: 'bold',
                                                                                    minWidth: '30px'
                                                                                }} 
                                                                                onClick={() => {
                                                                                    if (canToggleUnit) {
                                                                                        setNewPackage({
                                                                                            ...newPackage,
                                                                                            items: newPackage.items.map(it => 
                                                                                                it.tempId === item.tempId 
                                                                                                    ? { ...it, is_sold_by_piece: !isPieces, quantity: !isPieces ? Math.ceil(it.quantity) : it.quantity } 
                                                                                                    : it
                                                                                            )
                                                                                        });
                                                                                    }
                                                                                }}
                                                                                title={canToggleUnit ? "Cambia tra Kg e Pezzi" : "Singolo prezzo disponibile"}
                                                                            >
                                                                                {isPieces ? 'pz' : 'kg'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
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
                            gap: '1rem',
                            zIndex: 10
                        }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsCreating(false)}>Annulla</button>
                            <button type="submit" form="package-form" className="btn btn-primary" style={{ flex: 1 }}>
                                <Save size={18} style={{ marginRight: '8px' }} />
                                {editingId ? 'Aggiorna Pacchetto' : 'Salva Pacchetto'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid-responsive" style={{ gap: '1.5rem' }}>
                {packages.map((pkg, index) => {
                    const isExpired = pkg.hide_at && new Date(pkg.hide_at) < new Date();
                    const isHidden = pkg.is_visible === false || isExpired;

                    return (
                        <div key={pkg.id} className="premium-card" style={{
                            padding: '0', overflow: 'hidden', position: 'relative',
                            opacity: isHidden ? 0.7 : 1, transition: 'all 0.3s ease'
                        }}>
                            <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '0.4rem', zIndex: 10 }}>
                                <button
                                    className="btn"
                                    style={{
                                        padding: '0.4rem', width: '32px', height: '32px', background: 'white', boxShadow: 'var(--shadow-sm)',
                                        opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? 'default' : 'pointer'
                                    }}
                                    onClick={() => handleMovePackageUp(index)}
                                    disabled={index === 0}
                                >
                                    <ChevronUp size={16} />
                                </button>
                                <button
                                    className="btn"
                                    style={{
                                        padding: '0.4rem', width: '32px', height: '32px', background: 'white', boxShadow: 'var(--shadow-sm)',
                                        opacity: index === packages.length - 1 ? 0.3 : 1, cursor: index === packages.length - 1 ? 'default' : 'pointer'
                                    }}
                                    onClick={() => handleMovePackageDown(index)}
                                    disabled={index === packages.length - 1}
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>
                            
                            <div style={{ height: '180px', overflow: 'hidden' }}>
                                <img src={pkg.image_url || 'https://placehold.co/600x400?text=Muse+Catering'} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>

                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>
                                    {pkg.name}
                                    {isHidden && <span style={{ fontSize: '0.75rem', color: '#E11D48', marginLeft: '0.5rem', verticalAlign: 'middle' }}>({isExpired ? 'Scaduto' : 'Nascosto'})</span>}
                                </h3>
                                
                                <div className="dietary-badges" style={{ marginBottom: '0.75rem' }}>
                                    {pkg.is_gluten_free && <span className="badge-elegant badge-elegant-gf" style={{ fontSize: '0.65rem' }}>Senza Glutine</span>}
                                    {pkg.is_lactose_free && <span className="badge-elegant badge-elegant-lf" style={{ fontSize: '0.65rem' }}>Senza Lattosio</span>}
                                </div>
                                
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.2rem', fontSize: '0.9rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {pkg.description}
                                </p>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    {pkg.discount_percentage > 0 ? (
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                                                € {(pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)}
                                            </span>
                                            <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                € {pkg.total_price}
                                            </span>
                                        </div>
                                    ) : (
                                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)' }}>€ {pkg.total_price}</div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn btn-outline" style={{ padding: '0.75rem', minWidth: '44px' }} onClick={() => toggleVisibility(pkg)}>
                                        {!isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                                    </button>
                                    <button className="btn btn-outline" style={{ flex: 1, gap: '0.5rem' }} onClick={() => handleEdit(pkg)}>
                                        <Pencil size={16} /> Modifica
                                    </button>
                                    <button className="btn btn-outline" style={{ padding: '0.75rem', color: '#E11D48', borderColor: '#E11D48' }} onClick={() => handleDelete(pkg.id)}>
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <HideModal 
                isOpen={isHideModalOpen}
                onClose={() => { setIsHideModalOpen(false); setPackageToHide(null); }}
                onConfirm={confirmHide}
                initialDate={packageToHide?.hide_at}
                isVisible={packageToHide?.is_visible !== false && !(packageToHide?.hide_at && new Date(packageToHide.hide_at) < new Date())}
            />
        </div>
    );
};

export default PackageBuilder;
