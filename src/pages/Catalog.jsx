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

    const showProductPrices = !isPricesLoading && showPricesSetting?.value !== 'false';
    const isLoading = isProductsLoading || isPricesLoading;

    const visibleProducts = products?.filter(p => !p.hidden_in_menu && !p.hide_in_menu) || [];
    
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
                top: '0', 
                zIndex: 100, 
                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(10px)',
                padding: '1rem 0',
                marginBottom: '2rem',
                borderBottom: '1px solid rgba(0,0,0,0.05)'
            }}>
                <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={20} />
                    <input
                        type="text"
                        placeholder="Cerca un prodotto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '1rem 1rem 1rem 3rem',
                            borderRadius: '50px',
                            border: '1px solid var(--color-border)',
                            fontSize: '1rem',
                            outline: 'none',
                            boxShadow: 'var(--shadow-sm)',
                            backgroundColor: 'white'
                        }}
                    />
                </div>
            </div>

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '5rem' }}>Caricamento catalogo...</div>
            ) : (
                <div className="grid-responsive">
                    {filteredProducts.map((product) => (
                        <div 
                            key={product.id} 
                            className="premium-card fade-in" 
                            onClick={() => openProduct(product)}
                            style={{ cursor: 'pointer', overflow: 'hidden' }}
                        >
                            <div style={{ height: '200px', overflow: 'hidden' }}>
                                <img 
                                    src={product.image_url} 
                                    alt={product.name} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ margin: '0 0 0.5rem 0' }}>{product.name}</h3>
                                {showProductPrices && (
                                    <div style={{ color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        € {product.is_sold_by_piece ? product.price_per_piece : product.price_per_kg} 
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                            /{product.is_sold_by_piece ? 'pz' : 'kg'}
                                        </span>
                                    </div>
                                )}
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
