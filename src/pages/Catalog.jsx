import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useSetting } from '../hooks/useData';
import Header from '../components/Layout/Header';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';
import { Search, ChevronLeft, X } from 'lucide-react';

const Catalog = () => {
    const navigate = useNavigate();
    const { products, isLoading: isProductsLoading } = useProducts();
    const { setting: showPricesSetting, isLoading: isPricesLoading } = useSetting('show_product_prices');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDietaryFilters, setSelectedDietaryFilters] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isProductClosing, setIsProductClosing] = useState(false);
    
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const showProductPrices = !isPricesLoading && showPricesSetting?.value !== 'false';
    const isLoading = isProductsLoading || isPricesLoading;

    const toggleDietaryFilter = (key) => {
        setSelectedDietaryFilters(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedDietaryFilters([]);
    };

    const filterPills = [
        { key: 'gluten_free', label: 'Senza Glutine', badge: 'GF', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.12)' },
        { key: 'lactose_free', label: 'Senza Lattosio', badge: 'LF', color: '#03A9F4', bg: 'rgba(3, 169, 244, 0.12)' },
        { key: 'vegetarian', label: 'Vegetariano', badge: 'VGT', color: '#8BC34A', bg: 'rgba(139, 195, 74, 0.12)' },
        { key: 'vegan', label: 'Vegano', badge: 'VEG', color: '#388E3C', bg: 'rgba(56, 142, 60, 0.12)' },
        { key: 'traditional', label: 'Tradizionale', badge: 'TRAD', color: '#B45309', bg: 'rgba(180, 83, 9, 0.12)' },
        { key: 'salato', label: 'Salato', color: '#0D9488', bg: 'rgba(13, 148, 136, 0.12)' },
        { key: 'dolce', label: 'Dolce', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' },
    ];

    const hasActiveFilters = searchTerm.trim() !== '' || selectedDietaryFilters.length > 0;

    const visibleProducts = products?.filter(p => {
        const isExpired = p.hide_at && new Date(p.hide_at) < new Date();
        return p.is_visible !== false && !isExpired && !p.hide_in_menu;
    }) || [];
    
    const filteredProducts = visibleProducts.filter(p => {
        // Combinable dietary filters
        if (selectedDietaryFilters.includes('gluten_free') && !p.is_gluten_free) return false;
        if (selectedDietaryFilters.includes('lactose_free') && !p.is_lactose_free) return false;
        if (selectedDietaryFilters.includes('vegetarian') && (!p.is_vegetarian && !p.is_vegan)) return false;
        if (selectedDietaryFilters.includes('vegan') && !p.is_vegan) return false;
        if (selectedDietaryFilters.includes('traditional') && !p.is_traditional) return false;
        if (selectedDietaryFilters.includes('salato') && !p.is_savory) return false;
        if (selectedDietaryFilters.includes('dolce') && !p.is_sweet) return false;

        // Search query
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchName = (p.name || '').toLowerCase().includes(term);
            const matchDesc = (p.description || '').toLowerCase().includes(term);
            const matchMenuDesc = (p.menu_description || '').toLowerCase().includes(term);
            if (!matchName && !matchDesc && !matchMenuDesc) return false;
        }

        return true;
    });

    const openProduct = (prod) => {
        window.history.pushState({ modal: 'product' }, '');
        setSelectedProduct(prod);
    };

    const closeProduct = () => {
        setIsProductClosing(true);
        setTimeout(() => {
            setSelectedProduct(null);
            setIsProductClosing(false);
        }, 300);
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '5rem' }}>
            <Header />
            
            <div className="section-header" style={{ marginBottom: '3rem', textAlign: 'center', maxWidth: 'none' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-primary-dark)' }}>
                    Catalogo Prodotti
                </h1>
            </div>

            <div style={{ 
                position: 'sticky', 
                top: '10px', 
                zIndex: 500, 
                backgroundColor: 'transparent',
                padding: '0.5rem 0 1rem',
                margin: '0 0 2rem'
            }}>
                <div style={{ 
                    position: 'relative',
                    maxWidth: '800px',
                    margin: '0 auto',
                    backdropFilter: 'blur(10px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.75)',
                    borderRadius: '24px',
                    boxShadow: 'var(--shadow-md)',
                    border: '1px solid rgba(155, 57, 61, 0.1)',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                }}>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} size={20} />
                        <input 
                            type="text" 
                            placeholder="Cerca un prodotto nel catalogo..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={(e) => {
                                const container = e.target.closest('div[style*="position: sticky"]');
                                if (container) {
                                    setTimeout(() => {
                                        const topOffset = container.getBoundingClientRect().top + window.scrollY - 10;
                                        window.scrollTo({ top: topOffset, behavior: 'smooth' });
                                    }, 150);
                                }
                            }}
                            style={{
                                width: '100%', padding: '0.75rem 2.5rem 0.75rem 3rem', borderRadius: '50px',
                                border: '1px solid var(--color-border)', background: 'white',
                                fontSize: '0.95rem', outline: 'none',
                                transition: 'all 0.3s ease',
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

                    {/* Filter Pills */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                        {filterPills.map(chip => {
                            const isSelected = selectedDietaryFilters.includes(chip.key);
                            return (
                                <button
                                    key={chip.key}
                                    type="button"
                                    onClick={() => toggleDietaryFilter(chip.key)}
                                    style={{
                                        padding: '0.35rem 0.75rem',
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
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.35rem',
                                        transition: 'all 0.15s ease',
                                        boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.06)' : 'none'
                                    }}
                                >
                                    <span style={{ 
                                        fontSize: '0.65rem', 
                                        fontWeight: 'bold', 
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.8)' : (chip.bg || 'rgba(0,0,0,0.05)'), 
                                        color: chip.color, 
                                        padding: '1px 5px', 
                                        borderRadius: '6px' 
                                    }}>
                                        {chip.badge}
                                    </span>
                                    {chip.label}
                                </button>
                            );
                        })}

                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                style={{
                                    padding: '0.35rem 0.65rem',
                                    borderRadius: '20px',
                                    border: 'none',
                                    backgroundColor: 'rgba(0,0,0,0.06)',
                                    color: 'var(--color-text-muted)',
                                    fontWeight: '600',
                                    fontSize: '0.78rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                                title="Azzera tutti i filtri"
                            >
                                <X size={13} /> Azzera
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}>Caricamento catalogo...</div>
            ) : (
                <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                    {filteredProducts.map((product) => (
                        <div 
                            key={product.id} 
                            className="premium-card fade-in" 
                            onClick={() => openProduct(product)}
                            style={{ 
                                cursor: 'pointer', 
                                overflow: 'hidden', 
                                flexDirection: 'row', 
                                alignItems: 'center',
                                padding: '1rem',
                                gap: '1.25rem',
                                minHeight: '140px'
                            }}
                        >
                            <div style={{ 
                                width: '100px', 
                                height: '100px', 
                                borderRadius: '15px', 
                                overflow: 'hidden', 
                                flexShrink: 0,
                                boxShadow: 'var(--shadow-sm)',
                                border: '1px solid rgba(155, 57, 61, 0.05)'
                            }}>
                                <img 
                                    src={product.image_url} 
                                    alt={product.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                <div className="dietary-badges" style={{ marginBottom: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    {product.is_gluten_free && (
                                        <span className="badge-elegant badge-elegant-gf" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>GF</span>
                                    )}
                                    {product.is_lactose_free && (
                                        <span className="badge-elegant badge-elegant-lf" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>LF</span>
                                    )}
                                    {product.is_vegetarian && (
                                        <span className="badge-elegant badge-elegant-v" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>VGT</span>
                                    )}
                                    {product.is_vegan && (
                                        <span className="badge-elegant badge-elegant-vg" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>VEG</span>
                                    )}
                                    {product.is_traditional && (
                                        <span className="badge-elegant badge-elegant-trad" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>TRAD</span>
                                    )}
                                </div>
                                <h3 style={{ 
                                    margin: '0 0 0.4rem 0', 
                                    fontSize: '1.15rem', 
                                    lineHeight: '1.2',
                                    color: 'var(--color-primary-dark)'
                                }}>
                                    {product.name}
                                </h3>
                                {showProductPrices && (
                                    <div style={{ 
                                        color: 'var(--color-primary)', 
                                        fontWeight: '800', 
                                        fontSize: '1.1rem',
                                        display: 'flex',
                                        alignItems: 'baseline',
                                        gap: '0.2rem'
                                    }}>
                                        € {Number(product.is_sold_by_piece ? product.price_per_piece : product.price_per_kg).toFixed(2)} 
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                                            /{product.is_sold_by_piece ? 'pz' : 'kg'}
                                        </span>
                                    </div>
                                )}
                                {product.show_servings && product.servings_per_unit && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                                        Sazia circa {product.servings_per_unit} persone
                                    </div>
                                )}
                            </div>
                            <div style={{ color: 'var(--color-accent-light)', display: 'flex', alignItems: 'center' }}>
                                <ChevronLeft style={{ transform: 'rotate(180deg)' }} size={20} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredProducts.length === 0 && !isLoading && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                    <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600' }}>Nessun prodotto trovato per questa ricerca o filtro.</p>
                    {hasActiveFilters && (
                        <button className="btn btn-outline" onClick={resetFilters} style={{ marginTop: '1rem' }}>
                            Azzera filtri
                        </button>
                    )}
                </div>
            )}

            {selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={closeProduct}
                    isClosing={isProductClosing}
                />
            )}
        </div>
    );
};

export default Catalog;
