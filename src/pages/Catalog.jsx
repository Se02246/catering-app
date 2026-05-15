import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useSetting } from '../hooks/useData';
import Header from '../components/Layout/Header';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';
import { Search, ChevronLeft } from 'lucide-react';

const Catalog = () => {
    const navigate = useNavigate();
    const { products, isLoading: isProductsLoading } = useProducts();
    const { setting: showPricesSetting, isLoading: isPricesLoading } = useSetting('show_product_prices');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isProductClosing, setIsProductClosing] = useState(false);
    
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const showProductPrices = !isPricesLoading && showPricesSetting?.value !== 'false';
    const isLoading = isProductsLoading || isPricesLoading;

    const visibleProducts = products?.filter(p => {
        const isExpired = p.hide_at && new Date(p.hide_at) < new Date();
        return p.is_visible !== false && !isExpired && !p.hide_in_menu;
    }) || [];
    
    const filteredProducts = visibleProducts.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                    backgroundColor: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '50px',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid rgba(155, 57, 61, 0.05)'
                }}>
                    <Search style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} size={20} />
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
                            width: '100%', padding: '1.2rem 1.2rem 1.2rem 3.5rem', borderRadius: '50px',
                            border: 'none', background: 'transparent',
                            fontSize: '1rem', outline: 'none',
                            transition: 'all 0.3s ease'
                        }}
                    />
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
                                        <span className="badge-elegant badge-elegant-v" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>V</span>
                                    )}
                                    {product.is_vegan && (
                                        <span className="badge-elegant badge-elegant-vg" style={{ fontSize: '0.6rem', padding: '0.2rem 0.5rem' }}>VG</span>
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
                    Nessun prodotto trovato per questa ricerca.
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
