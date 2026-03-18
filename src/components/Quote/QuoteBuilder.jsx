import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { useProducts } from '../../hooks/useData';
import { Plus, Minus, Trash2, Send, Check, ShoppingCart, Info, Search, Calendar } from 'lucide-react';
import ProductDetailsModal from '../Common/ProductDetailsModal';
import { formatCustomText } from '../../utils/textFormatting';

const QuoteBuilder = () => {
    const { products: rawProducts, isLoading } = useProducts();
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('active_quote_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isQuoteVisible, setIsQuoteVisible] = useState(false);
    const [isProductClosing, setIsProductClosing] = useState(false);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const quoteSummaryRef = useRef(null);

    useEffect(() => {
        const handlePopState = (event) => {
            if (selectedProduct) {
                setIsProductClosing(true);
                setTimeout(() => {
                    setSelectedProduct(null);
                    setIsProductClosing(false);
                }, 500);
            }
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedProduct]);

    useEffect(() => {
        localStorage.setItem('active_quote_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsQuoteVisible(entry.isIntersecting),
            { threshold: 0.1 }
        );
        if (quoteSummaryRef.current) observer.observe(quoteSummaryRef.current);
        return () => { if (quoteSummaryRef.current) observer.unobserve(quoteSummaryRef.current); };
    }, [cart.length]);

    const products = React.useMemo(() => {
        const now = new Date();
        return rawProducts
            .filter(p => {
                const isVisible = p.is_visible !== false;
                const isNotExpired = !p.hide_at || new Date(p.hide_at) > now;
                const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
                return isVisible && isNotExpired && matchesSearch;
            })
            .map(p => ({
                ...p,
                price_per_kg: parseFloat(p.price_per_kg),
                min_order_quantity: p.min_order_quantity ? parseFloat(p.min_order_quantity) : 1,
                order_increment: p.order_increment !== undefined ? parseFloat(p.order_increment) : 1,
                images: p.images || (p.image_url ? [p.image_url] : []),
                is_sold_by_piece: Boolean(p.is_sold_by_piece),
                price_per_piece: p.price_per_piece ? parseFloat(p.price_per_piece) : null
            }));
    }, [rawProducts, searchTerm]);

    const addToCart = (product) => {
        if (product.allow_multiple) {
            const newItem = { ...product, quantity: product.min_order_quantity || 1, instanceId: Date.now() + Math.random() };
            if (product.max_order_quantity && newItem.quantity > product.max_order_quantity) return;
            setCart([...cart, newItem]);
        } else {
            const existing = cart.find(item => item.id === product.id);
            if (existing) setCart(cart.filter(item => item.id !== product.id));
            else {
                const newItem = { ...product, quantity: product.min_order_quantity || 1, instanceId: Date.now() + Math.random() };
                setCart([...cart, newItem]);
            }
        }
    };

    const removeFromCart = (instanceId) => setCart(cart.filter(item => item.instanceId !== instanceId));

    const updateQuantity = (instanceId, delta) => {
        setCart(cart.map(item => {
            if (item.instanceId === instanceId) {
                const increment = item.order_increment || 1;
                const newQty = item.quantity + (delta * increment);
                if (newQty < (item.min_order_quantity || 1)) return null;
                if (item.max_order_quantity && newQty > item.max_order_quantity) return item;
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean));
    };

    const calculateItemPrice = (item) => {
        if (item.is_sold_by_piece) return item.price_per_piece * item.quantity;
        if (item.pieces_per_kg) return (item.price_per_kg / item.pieces_per_kg) * item.quantity;
        return item.price_per_kg * item.quantity;
    };

    const calculateTotal = () => cart.reduce((sum, item) => sum + calculateItemPrice(item), 0);

    const [isSaving, setIsSaving] = useState(false);

    const handleShareQuote = async () => {
        setIsSaving(true);
        try {
            const result = await api.saveQuote(cart, calculateTotal());
            const url = `${window.location.origin}/quote/${result.id}`;
            const message = `Ciao Barbara, ho creato un preventivo sul tuo sito. Puoi visualizzarlo qui:\n\n${url}`;
            window.open(`https://wa.me/393495416637?text=${encodeURIComponent(message)}`, '_blank');
        } catch (err) {
            alert('Errore durante il salvataggio.');
        } finally {
            setIsSaving(false);
        }
    };

    const openProduct = (prod) => {
        window.history.pushState({ modal: 'product' }, '');
        setSelectedProduct(prod);
    };

    const closeProduct = () => window.history.back();

    if (isLoading) return (
        <div style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="animate-float" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>Caricamento del catalogo...</div>
        </div>
    );

    return (
        <div className="grid-quote-builder">
            {/* Catalog Section */}
            <div className="fade-in" style={{ paddingBottom: '4rem' }}>
                <div style={{ position: 'relative', marginBottom: '2rem' }}>
                    <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-accent)' }} size={20} />
                    <input 
                        type="text" 
                        placeholder="Cerca un prodotto nel catalogo..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%', padding: '1.2rem 1.2rem 1.2rem 3rem', borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgba(155, 57, 61, 0.1)', background: 'var(--color-white)',
                            fontSize: '1rem', outline: 'none', boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.3s ease'
                        }}
                        onFocus={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.boxShadow = 'var(--shadow-md)'; }}
                        onBlur={e => { e.target.style.borderColor = 'rgba(155, 57, 61, 0.1)'; e.target.style.boxShadow = 'var(--shadow-sm)'; }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {products.map((p, index) => {
                        const isInCart = cart.some(item => item.id === p.id);
                        const cartCount = cart.filter(item => item.id === p.id).length;
                        return (
                            <div key={p.id}
                                className="glass-panel fade-in"
                                style={{
                                    animationDelay: `${index * 0.05}s`,
                                    padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem',
                                    cursor: 'pointer', position: 'relative', overflow: 'visible'
                                }}
                                onClick={() => openProduct(p)}
                            >
                                {p.hide_at && (
                                    <div className="package-badge" style={{ top: '-8px', right: '-8px', padding: '0.3rem 0.8rem', fontSize: '0.65rem' }}>
                                        <Calendar size={12} /> Disponibile fino al {new Date(p.hide_at).toLocaleDateString('it-IT')}
                                    </div>
                                )}
                                <div style={{ width: '70px', height: '70px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                                    <img src={p.image_url || 'https://placehold.co/100x100?text=Food'} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.2rem' }}>{p.name}</h4>
                                    <div className="dietary-badges" style={{ marginBottom: '0.4rem', gap: '0.3rem' }}>
                                        {p.is_gluten_free && <span className="badge-elegant badge-elegant-gf" style={{ padding: '0.2rem 0.4rem', fontSize: '0.55rem' }}>No Glutine</span>}
                                        {p.is_lactose_free && <span className="badge-elegant badge-elegant-lf" style={{ padding: '0.2rem 0.4rem', fontSize: '0.55rem' }}>No Lattosio</span>}
                                    </div>
                                    <p style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.85rem' }}>
                                        {p.is_sold_by_piece ? `€ ${p.price_per_piece} / pz` : `€ ${p.price_per_kg} / kg`}
                                    </p>
                                </div>
                                <button
                                    className={`btn ${isInCart && !p.allow_multiple ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', flexShrink: 0 }}
                                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                                >
                                    {isInCart && !p.allow_multiple ? <Check size={18} /> : (p.allow_multiple && cartCount > 0 ? <span style={{fontSize:'0.8rem'}}>{cartCount}</span> : <Plus size={18} />)}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Quote Summary Section */}
            <div ref={quoteSummaryRef} id="quote-summary" className="premium-card fade-in" style={{ height: 'fit-content', position: 'sticky', top: '2rem' }}>
                <div style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>Il Tuo Preventivo</h2>
                        {cart.length > 0 && (
                            <button onClick={() => setShowClearConfirm(true)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                                <Trash2 size={20} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="card-body" style={{ padding: '2rem' }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <ShoppingCart size={40} style={{ color: 'rgba(155, 57, 61, 0.1)', marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--color-text-muted)' }}>Il tuo preventivo è ancora vuoto.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '3.5rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                {cart.map(item => (
                                    <div key={item.instanceId} style={{ marginBottom: '1.2rem', paddingBottom: '1.2rem', borderBottom: '1px dashed rgba(155, 57, 61, 0.1)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                                            <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--color-primary-dark)' }}>{item.name}</div>
                                            <div style={{ fontWeight: '800', color: 'var(--color-text)' }}>€ {calculateItemPrice(item).toFixed(2)}</div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                                {item.is_sold_by_piece ? `${item.price_per_piece.toFixed(2)}€/pz` : `${item.price_per_kg.toFixed(2)}€/kg`}
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--color-bg)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-md)' }}>
                                                {/* Minus / Remove Button */}
                                                <button 
                                                    onClick={() => updateQuantity(item.instanceId, -1)} 
                                                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', display:'flex' }}
                                                >
                                                    {item.quantity <= (item.min_order_quantity || 1) ? <Trash2 size={16} /> : <Minus size={16} />}
                                                </button>
                                                
                                                <span style={{ fontWeight: '800', minWidth: '1.5rem', textAlign: 'center' }}>
                                                    {item.quantity}
                                                    <span style={{ fontSize: '0.7rem', marginLeft: '2px', fontWeight: '400', color: 'var(--color-text-muted)' }}>
                                                        {item.is_sold_by_piece ? 'pz' : 'kg'}
                                                    </span>
                                                </span>
                                                
                                                {/* Plus Button */}
                                                <button 
                                                    onClick={() => {
                                                        const isAtMax = item.max_order_quantity && item.quantity >= item.max_order_quantity;
                                                        if (!isAtMax) updateQuantity(item.instanceId, 1);
                                                    }} 
                                                    style={{ 
                                                        background: 'none', 
                                                        border: 'none', 
                                                        color: (item.max_order_quantity && item.quantity >= item.max_order_quantity) ? '#ccc' : 'var(--color-primary)', 
                                                        cursor: (item.max_order_quantity && item.quantity >= item.max_order_quantity) ? 'not-allowed' : 'pointer', 
                                                        display:'flex' 
                                                    }}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: '2px solid var(--color-bg)', paddingTop: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text-muted)' }}>Totale Indicativo</span>
                                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>€ {calculateTotal().toFixed(2)}</span>
                                </div>
                                <button className="btn btn-primary" style={{ width: '100%', padding: '1.2rem' }} onClick={handleShareQuote} disabled={isSaving}>
                                    <Send size={18} style={{ marginRight: '0.8rem' }} /> {isSaving ? 'Invio in corso...' : 'Invia su WhatsApp'}
                                </button>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '1rem', fontStyle: 'italic' }}>
                                    Riceverai un link condivisibile del tuo preventivo.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Floating Action for Mobile */}
            {cart.length > 0 && (
                <button
                    className="animate-float"
                    onClick={() => document.getElementById('quote-summary').scrollIntoView({ behavior: 'smooth' })}
                    style={{
                        position: 'fixed', bottom: '2rem', right: '2rem', width: '64px', height: '64px',
                        borderRadius: '50%', background: 'var(--color-primary)', color: 'white',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: 'var(--shadow-lg)',
                        border: 'none', zIndex: 1000, opacity: isQuoteVisible ? 0 : 1, transition: 'all 0.4s'
                    }}
                >
                    <ShoppingCart size={28} />
                    <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--color-white)', color: 'var(--color-primary)', width: '24px', height: '24px', borderRadius: '50%', fontSize: '0.8rem', fontWeight: '800', border: '2px solid var(--color-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{cart.length}</span>
                </button>
            )}

            {selectedProduct && <ProductDetailsModal product={selectedProduct} onClose={closeProduct} onAddToCart={addToCart} isClosing={isProductClosing} />}
            
            {/* Elegant Confirmation Dialog */}
            {showClearConfirm && (
                <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
                    <div className="glass-panel bounce-in" style={{ padding: '2.5rem', maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <div style={{ background: 'rgba(225, 29, 72, 0.05)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                            <Trash2 size={32} color="#E11D48" />
                        </div>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Svuota Carrello</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Sei sicuro di voler eliminare tutti i prodotti selezionati? L'azione non è reversibile.</p>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowClearConfirm(false)}>Annulla</button>
                            <button className="btn btn-primary" style={{ flex: 1, background: '#E11D48' }} onClick={() => { setCart([]); setShowClearConfirm(false); }}>Sì, Svuota</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteBuilder;
