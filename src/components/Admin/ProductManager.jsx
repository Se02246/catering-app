import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useProducts } from '../../hooks/useData';
import { Trash2, Edit, Plus, Eye, EyeOff, Clock, X, Save, FileText, Minus, Search, Send, Scale, Hash, ChevronUp, ChevronDown, FileMinus, Copy } from 'lucide-react';
import ImageUpload from '../Common/ImageUpload';
import HideModal from '../Common/HideModal';
import { useNavigate } from 'react-router-dom';


const ProductManager = ({ onCreateQuoteClick }) => {
    const { products, isLoading, mutate } = useProducts();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [isHideModalOpen, setIsHideModalOpen] = useState(false);
    const [productToHide, setProductToHide] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showHidden, setShowHidden] = useState(false);
    const [selectedDietaryFilters, setSelectedDietaryFilters] = useState([]);
    const [currentProduct, setCurrentProduct] = useState({ 
        name: '', description: '', menu_description: '', price_per_kg: '', image_url: '', images: [], 
        is_visible: true, hide_at: null, allow_multiple: false, order_increment: '', 
        max_order_quantity: '', is_sold_by_piece: false, price_per_piece: '',
        hide_quantity: false, hide_unit_price: false, hide_in_menu: false, hide_from_quotes: false
    });


    const [calcError, setCalcError] = useState('');

    useEffect(() => {
        if (isEditing) {
            document.body.classList.add('modal-open');
            setCalcError('');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isEditing]);

    const resetForm = () => {
        setCurrentProduct({
            name: '', description: '', menu_description: '', price_per_kg: '', image_url: '', images: [],
            pieces_per_kg: '', min_order_quantity: '', order_increment: '', max_order_quantity: '',
            show_servings: false, servings_per_unit: '', is_visible: true, hide_at: null, allow_multiple: false,
            is_gluten_free: false, is_lactose_free: false, is_sold_by_piece: false, price_per_piece: '',
            hide_quantity: false, hide_unit_price: false, hide_in_menu: false, hide_from_quotes: false
        });
        setCalcError('');
    };

    const handlePricePerKgChange = (val) => {
        const pricePerKg = parseFloat(val);
        const piecesPerKg = parseFloat(currentProduct.pieces_per_kg);
        
        let newPricePerPiece = currentProduct.price_per_piece;
        if (!isNaN(pricePerKg) && !isNaN(piecesPerKg) && piecesPerKg > 0) {
            newPricePerPiece = (pricePerKg / piecesPerKg).toFixed(2);
            setCalcError('');
        } else if (val && (!piecesPerKg || piecesPerKg <= 0)) {
            setCalcError('Inserisci "Pezzi per Kg" per calcolare il prezzo al pezzo');
        } else {
            setCalcError('');
        }

        setCurrentProduct({
            ...currentProduct,
            price_per_kg: val,
            price_per_piece: newPricePerPiece
        });
    };

    const handlePricePerPieceChange = (val) => {
        const pricePerPiece = parseFloat(val);
        const piecesPerKg = parseFloat(currentProduct.pieces_per_kg);
        
        let newPricePerKg = currentProduct.price_per_kg;
        if (!isNaN(pricePerPiece) && !isNaN(piecesPerKg) && piecesPerKg > 0) {
            newPricePerKg = (pricePerPiece * piecesPerKg).toFixed(2);
            setCalcError('');
        } else if (val && (!piecesPerKg || piecesPerKg <= 0)) {
            setCalcError('Inserisci "Pezzi per Kg" per calcolare il prezzo al Kg');
        } else {
            setCalcError('');
        }

        setCurrentProduct({
            ...currentProduct,
            price_per_piece: val,
            price_per_kg: newPricePerKg
        });
    };

    const handlePiecesPerKgChange = (val) => {
        const piecesPerKg = parseFloat(val);
        const pricePerKg = parseFloat(currentProduct.price_per_kg);
        
        let newPricePerPiece = currentProduct.price_per_piece;

        if (!isNaN(piecesPerKg) && piecesPerKg > 0) {
            setCalcError('');
            if (!isNaN(pricePerKg)) {
                newPricePerPiece = (pricePerKg / piecesPerKg).toFixed(2);
            }
        }

        setCurrentProduct({
            ...currentProduct,
            pieces_per_kg: val,
            price_per_piece: newPricePerPiece
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
                price_per_piece: currentProduct.price_per_piece ? parseFloat(currentProduct.price_per_piece) : null,
                hide_quantity: currentProduct.hide_quantity || false,
                hide_unit_price: currentProduct.hide_unit_price || false,
                hide_in_menu: currentProduct.hide_in_menu || false,
                hide_from_quotes: currentProduct.hide_from_quotes || false
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

    const toggleQuoteVisibility = async (product) => {
        const actionText = product.hide_from_quotes 
            ? "MOSTRARE questo prodotto nei preventivi" 
            : "NASCONDERE questo prodotto dai preventivi";
            
        if (window.confirm(`Sei sicuro di voler ${actionText}?`)) {
            try {
                await api.updateProduct(product.id, {
                    ...product,
                    hide_from_quotes: !product.hide_from_quotes
                });
                mutate();
            } catch (err) {
                console.error('Failed to update quote visibility', err);
                alert('Errore durante l\'aggiornamento della visibilità nei preventivi');
            }
        }
    };

    const handleDuplicate = async (product) => {
        try {
            const duplicatedProduct = {
                name: `${product.name} copia`,
                description: product.description || '',
                menu_description: product.menu_description || '',
                price_per_kg: (product.price_per_kg !== undefined && product.price_per_kg !== null && product.price_per_kg !== '') ? parseFloat(product.price_per_kg) : 0,
                image_url: product.image_url || '',
                images: product.images || (product.image_url ? [product.image_url] : []),
                pieces_per_kg: (product.pieces_per_kg !== '' && product.pieces_per_kg !== null && product.pieces_per_kg !== undefined) ? parseFloat(product.pieces_per_kg) : null,
                min_order_quantity: (product.min_order_quantity !== '' && product.min_order_quantity !== null && product.min_order_quantity !== undefined) ? parseFloat(product.min_order_quantity) : 1,
                order_increment: (product.order_increment !== '' && product.order_increment !== null && product.order_increment !== undefined) ? parseFloat(product.order_increment) : 1,
                show_servings: product.show_servings || false,
                servings_per_unit: (product.servings_per_unit !== '' && product.servings_per_unit !== null && product.servings_per_unit !== undefined) ? parseFloat(product.servings_per_unit) : null,
                is_visible: product.is_visible !== undefined ? product.is_visible : true,
                hide_at: product.hide_at || null,
                allow_multiple: product.allow_multiple || false,
                max_order_quantity: (product.max_order_quantity !== '' && product.max_order_quantity !== null && product.max_order_quantity !== undefined) ? parseFloat(product.max_order_quantity) : null,
                is_gluten_free: product.is_gluten_free || false,
                is_lactose_free: product.is_lactose_free || false,
                is_vegetarian: product.is_vegetarian || false,
                is_vegan: product.is_vegan || false,
                is_sold_by_piece: product.is_sold_by_piece || false,
                price_per_piece: (product.price_per_piece !== '' && product.price_per_piece !== null && product.price_per_piece !== undefined) ? parseFloat(product.price_per_piece) : null,
                hide_quantity: product.hide_quantity || false,
                hide_unit_price: product.hide_unit_price || false,
                hide_in_menu: product.hide_in_menu || false,
                hide_from_quotes: product.hide_from_quotes || false
            };

            await api.addProduct(duplicatedProduct);
            mutate();
        } catch (err) {
            console.error('Failed to duplicate product', err);
            alert(err.message || 'Errore durante la duplicazione del prodotto');
        }
    };

    const toggleDietaryFilter = (key) => {
        setSelectedDietaryFilters(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const toggleShowHidden = () => {
        setShowHidden(prev => !prev);
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedDietaryFilters([]);
        setShowHidden(false);
    };

    const hiddenCount = (products || []).filter(p => {
        const isExpired = p.hide_at && new Date(p.hide_at) < new Date();
        return p.is_visible === false || isExpired;
    }).length;

    const filterPills = [
        { key: 'gluten_free', label: 'Senza Glutine', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.12)' },
        { key: 'lactose_free', label: 'Senza Lattosio', color: '#03A9F4', bg: 'rgba(3, 169, 244, 0.12)' },
        { key: 'vegetarian', label: 'Vegetariano', color: '#8BC34A', bg: 'rgba(139, 195, 74, 0.12)' },
        { key: 'vegan', label: 'Vegano', color: '#388E3C', bg: 'rgba(56, 142, 60, 0.12)' },
        { key: 'hide_from_quotes', label: 'Nascosti nei preventivi', icon: FileMinus, color: 'var(--color-primary)', bg: 'rgba(155, 57, 61, 0.12)' },
    ];

    const hasActiveFilters = searchTerm.trim() !== '' || selectedDietaryFilters.length > 0 || showHidden;

    const filteredProducts = (products || []).filter(p => {
        const isExpired = p.hide_at && new Date(p.hide_at) < new Date();
        const isHidden = p.is_visible === false || isExpired;

        // Hidden from catalog filter (hidden by default)
        if (!showHidden && isHidden) return false;

        // Combinable filters
        if (selectedDietaryFilters.includes('gluten_free') && !p.is_gluten_free) return false;
        if (selectedDietaryFilters.includes('lactose_free') && !p.is_lactose_free) return false;
        if (selectedDietaryFilters.includes('vegetarian') && (!p.is_vegetarian && !p.is_vegan)) return false;
        if (selectedDietaryFilters.includes('vegan') && !p.is_vegan) return false;
        if (selectedDietaryFilters.includes('hide_from_quotes') && !p.hide_from_quotes) return false;

        // Search text filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchName = (p.name || '').toLowerCase().includes(term);
            const matchDesc = (p.description || '').toLowerCase().includes(term);
            const matchMenuDesc = (p.menu_description || '').toLowerCase().includes(term);
            if (!matchName && !matchDesc && !matchMenuDesc) return false;
        }

        return true;
    });

    if (isLoading) return <p>Caricamento prodotti...</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>Gestione Prodotti</h2>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        {filteredProducts.length === (products || []).length 
                            ? `${products.length} prodotti in catalogo` 
                            : `${filteredProducts.length} di ${products.length} prodotti visualizzati`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                        className="btn btn-outline" 
                        onClick={onCreateQuoteClick}
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

            {/* Search and Combinable Filters Bar */}
            <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search 
                        size={18} 
                        style={{ 
                            position: 'absolute', 
                            left: '1rem', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            color: 'var(--color-text-muted)',
                            pointerEvents: 'none'
                        }} 
                    />
                    <input
                        type="text"
                        placeholder="Cerca prodotti per nome, descrizione..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '0.75rem 2.5rem 0.75rem 2.75rem',
                            borderRadius: 'var(--radius-full)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'white',
                            fontSize: '0.95rem',
                            outline: 'none',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                padding: '0.25rem',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="Cancella ricerca"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>
                        Filtri:
                    </span>

                    {filterPills.map(chip => {
                        const isSelected = selectedDietaryFilters.includes(chip.key);
                        const ChipIcon = chip.icon;
                        return (
                            <button
                                key={chip.key}
                                type="button"
                                onClick={() => toggleDietaryFilter(chip.key)}
                                style={{
                                    padding: '0.4rem 0.85rem',
                                    borderRadius: '20px',
                                    border: isSelected 
                                        ? `2px solid ${chip.color || 'var(--color-primary)'}` 
                                        : '1px solid var(--color-border)',
                                    backgroundColor: isSelected 
                                        ? (chip.bg || 'rgba(155, 57, 61, 0.12)') 
                                        : 'white',
                                    color: isSelected 
                                        ? (chip.color || 'var(--color-primary)') 
                                        : 'var(--color-text)',
                                    fontWeight: isSelected ? '700' : '500',
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    transition: 'all 0.15s ease',
                                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
                                }}
                            >
                                {ChipIcon && <ChipIcon size={15} />}
                                {chip.label}
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={toggleShowHidden}
                        style={{
                            padding: '0.4rem 0.85rem',
                            borderRadius: '20px',
                            border: showHidden 
                                ? '2px solid #5c6bc0' 
                                : '1px dashed var(--color-border)',
                            backgroundColor: showHidden 
                                ? 'rgba(92, 107, 192, 0.12)' 
                                : 'white',
                            color: showHidden 
                                ? '#3949ab' 
                                : 'var(--color-text-muted)',
                            fontWeight: showHidden ? '700' : '500',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.15s ease',
                            boxShadow: showHidden ? '0 2px 6px rgba(92, 107, 192, 0.1)' : 'none'
                        }}
                        title={showHidden ? "Nascondi i prodotti non visibili" : "Mostra anche i prodotti nascosti"}
                    >
                        {showHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                        {showHidden ? 'Nascosti visibili' : `Mostra nascosti (${hiddenCount})`}
                    </button>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            style={{
                                padding: '0.4rem 0.75rem',
                                borderRadius: '20px',
                                border: 'none',
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                color: 'var(--color-text-muted)',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                marginLeft: 'auto'
                            }}
                            title="Azzera tutti i filtri"
                        >
                            <X size={14} /> Azzera filtri
                        </button>
                    )}
                </div>
            </div>

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
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Descrizione sul Menù (Opzionale)</label>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '-0.3rem', marginBottom: '0.5rem' }}>Verrà visualizzata solo nel formato menù, sostituendo la principale.</p>
                                    <textarea
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', height: '100px' }}
                                        value={currentProduct.menu_description || ''}
                                        onChange={e => setCurrentProduct({ ...currentProduct, menu_description: e.target.value })}
                                        placeholder="Descrizione personalizzata per il menù..."
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.1)' }}>
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

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.1)' }}>
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

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.1)' }}>
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

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.1)' }}>
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
                                    <small style={{ color: '#666', display: 'block', marginBottom: '1rem' }}>Nasconde il valore della quantità (es. "2 Kg" o "40 Pz") nelle pagine pubbliche.</small>

                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            id="hide_unit_price"
                                            checked={currentProduct.hide_unit_price || false}
                                            onChange={e => setCurrentProduct({ ...currentProduct, hide_unit_price: e.target.checked })}
                                            style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                        />
                                        <label htmlFor="hide_unit_price" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Nascondi prezzo unitario</label>
                                    </div>
                                    <small style={{ color: '#666' }}>Nasconde il prezzo al Kg o al Pezzo nelle pagine pubbliche.</small>

                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            id="hide_in_menu"
                                            checked={currentProduct.hide_in_menu || false}
                                            onChange={e => setCurrentProduct({ ...currentProduct, hide_in_menu: e.target.checked })}
                                            style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                        />
                                        <label htmlFor="hide_in_menu" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Nascondi nel menù</label>
                                    </div>
                                    <small style={{ color: '#666', display: 'block' }}>Nasconde questo prodotto dal menù digitale e dal PDF del menù.</small>

                                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '1rem', marginBottom: '0.5rem' }}>
                                        <input
                                            type="checkbox"
                                            id="hide_from_quotes"
                                            checked={currentProduct.hide_from_quotes || false}
                                            onChange={e => setCurrentProduct({ ...currentProduct, hide_from_quotes: e.target.checked })}
                                            style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                        />
                                        <label htmlFor="hide_from_quotes" style={{ fontWeight: 'bold', cursor: 'pointer' }}>Nascondi dai Preventivi</label>
                                    </div>
                                    <small style={{ color: '#666', display: 'block' }}>Rende il prodotto non selezionabile durante la creazione dei preventivi.</small>
                                </div>

                                <div style={{ marginBottom: '1.5rem', padding: '1.2rem', backgroundColor: 'rgba(155, 57, 61, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(155, 57, 61, 0.1)' }}>
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
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                id="is_vegetarian"
                                                checked={currentProduct.is_vegetarian || false}
                                                onChange={e => setCurrentProduct({ ...currentProduct, is_vegetarian: e.target.checked })}
                                                style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                            />
                                            <label htmlFor="is_vegetarian" style={{ fontWeight: 'bold', color: '#8BC34A', cursor: 'pointer' }}>Vegetariano!</label>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <input
                                                type="checkbox"
                                                id="is_vegan"
                                                checked={currentProduct.is_vegan || false}
                                                onChange={e => {
                                                    const isChecked = e.target.checked;
                                                    if (isChecked) {
                                                        setCurrentProduct({ 
                                                            ...currentProduct, 
                                                            is_vegan: true,
                                                            is_vegetarian: false,
                                                            is_lactose_free: false
                                                        });
                                                    } else {
                                                        setCurrentProduct({ ...currentProduct, is_vegan: false });
                                                    }
                                                }}
                                                style={{ marginRight: '0.75rem', width: '18px', height: '18px' }}
                                            />
                                            <label htmlFor="is_vegan" style={{ fontWeight: 'bold', color: '#388E3C', cursor: 'pointer' }}>Vegano!</label>
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

            {filteredProducts.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--color-text-muted)' }}>
                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Nessun prodotto trovato</p>
                    <p style={{ margin: '0.5rem 0 1rem', fontSize: '0.9rem' }}>
                        Nessun prodotto corrisponde ai criteri di ricerca o ai filtri selezionati.
                        {!showHidden && hiddenCount > 0 && ` (Ci sono ${hiddenCount} prodotti nascosti)`}
                    </p>
                    {hasActiveFilters && (
                        <button className="btn btn-outline" onClick={resetFilters} style={{ margin: '0 auto' }}>
                            Azzera tutti i filtri
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid-responsive" style={{ gap: '1rem' }}>
                    {filteredProducts.map(p => {
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
                                        {p.is_vegetarian && (
                                            <span style={{ color: '#8BC34A', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                Vegetariano!
                                            </span>
                                        )}
                                        {p.is_vegan && (
                                            <span style={{ color: '#388E3C', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                Vegano!
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
                                <button 
                                    className="btn btn-outline" 
                                    style={{ padding: '0.6rem', color: p.hide_from_quotes ? '#999' : 'var(--color-primary)' }} 
                                    onClick={() => toggleQuoteVisibility(p)} 
                                    title={p.hide_from_quotes ? "Mostra nei preventivi" : "Nascondi dai preventivi"}
                                >
                                    {p.hide_from_quotes ? <FileMinus size={18} /> : <FileText size={18} />}
                                </button>
                                <button 
                                    className="btn btn-outline" 
                                    style={{ padding: '0.6rem' }} 
                                    onClick={() => handleDuplicate(p)}
                                    title="Duplica prodotto"
                                >
                                    <Copy size={18} />
                                </button>
                                <button className="btn btn-outline" style={{ padding: '0.6rem' }} onClick={() => { setCurrentProduct(p); setIsEditing(true); }} title="Modifica">
                                    <Edit size={18} />
                                </button>
                                <button className="btn btn-outline" style={{ padding: '0.6rem', color: 'red', borderColor: 'red' }} onClick={() => handleDelete(p.id)} title="Elimina">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            )}

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
