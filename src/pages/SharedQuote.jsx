import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShoppingBag, Calendar, ArrowLeft, Send } from 'lucide-react';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';

const SharedQuote = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const fetchQuote = async (isFirstLoad = false) => {
            if (isFirstLoad) setLoading(true);
            try {
                const data = await api.getQuote(id);
                setQuote(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching quote:', err);
                if (isFirstLoad) setError('Preventivo non trovato o scaduto.');
            } finally {
                if (isFirstLoad) setLoading(false);
            }
        };

        fetchQuote(true);
        const interval = setInterval(() => fetchQuote(false), 5000);
        return () => clearInterval(interval);
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            <p>Caricamento preventivo...</p>
        </div>
    );

    if (error) return (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h2 style={{ color: 'var(--color-primary-dark)' }}>Oops!</h2>
            <p>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: '2rem' }} onClick={() => navigate('/')}>Torna alla Home</button>
        </div>
    );

    const sendToWhatsApp = () => {
        const phoneNumber = "393495416637";
        const url = window.location.href;
        const message = `Ciao Barbara, ho visualizzato questo preventivo sul tuo sito e vorrei maggiori informazioni:\n\n${url}\n\nTotale: € ${quote.total_price}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const isQuoteGlutenFree = quote.items.length > 0 && quote.items.every(item => item.is_gluten_free);
    const isQuoteLactoseFree = quote.items.length > 0 && quote.items.every(item => item.is_lactose_free);

    const suggestedTotal = quote.items.reduce((sum, item) => {
        const price = item.is_sold_by_piece 
            ? item.price_per_piece 
            : (item.pieces_per_kg ? (item.price_per_kg / item.pieces_per_kg) : item.price_per_kg);
        return sum + (price * item.quantity);
    }, 0);

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem 1rem' }}>
            <button 
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginBottom: '2rem', fontSize: '1rem', fontWeight: 'bold' }}
            >
                <ArrowLeft size={20} /> Torna al sito
            </button>

            <div className="glass-panel" style={{ padding: '2.5rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '5px', background: 'var(--color-primary)' }}></div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                            <h1 style={{ color: 'var(--color-primary-dark)', margin: 0 }}>Riepilogo Preventivo</h1>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {isQuoteGlutenFree && (
                                    <span style={{ color: '#FF9800', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                        Senza Glutine
                                    </span>
                                )}
                                {isQuoteLactoseFree && (
                                    <span style={{ color: '#03A9F4', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                        Senza Lattosio
                                    </span>
                                )}
                            </div>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} /> Creato il {new Date(quote.created_at).toLocaleDateString('it-IT')}
                        </p>
                    </div>
                    <div 
                        style={{ textAlign: 'right', cursor: 'pointer' }} 
                        onClick={() => {
                            const token = localStorage.getItem('token');
                            if (token) {
                                navigate(`/admin?tab=quotes&searchId=${id}`);
                            } else {
                                navigate(`/login?redirect=/admin?tab=quotes&searchId=${id}`);
                            }
                        }}
                        title="Gestisci questo preventivo (Amministratore)"
                    >
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>ID Preventivo</p>
                        <p style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--color-primary)', textDecoration: 'underline' }}>{id.substring(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingBag size={20} /> Prodotti Selezionati
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {quote.items.map((item, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setSelectedProduct(item)}
                                style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    padding: '1rem', 
                                    backgroundColor: 'rgba(255,255,255,0.5)', 
                                    borderRadius: '12px', 
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    ':hover': {
                                        backgroundColor: 'rgba(255,255,255,0.8)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                    }
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.5)';
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {item.image_url && (
                                        <img src={item.image_url} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                                    )}
                                    <div>
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>
                                            {item.name}
                                            <span style={{ marginLeft: '0.5rem', display: 'inline-flex', gap: '0.25rem' }}>
                                                {item.is_gluten_free && (
                                                    <span style={{ color: '#FF9800', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        Senza Glutine
                                                    </span>
                                                )}
                                                {item.is_lactose_free && (
                                                    <span style={{ color: '#03A9F4', fontSize: '0.7rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        Senza Lattosio
                                                    </span>
                                                )}
                                            </span>
                                        </p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                            {!item.hide_quantity && (
                                                <span style={{ marginRight: '0.4rem' }}>
                                                    {parseFloat(item.quantity)} {item.is_sold_by_piece ? 'pz' : (item.pieces_per_kg ? 'pz' : 'kg')}
                                                </span>
                                            )}
                                            <span>
                                                {item.hide_quantity ? '' : '('}
                                                {!item.hide_unit_price ? (
                                                    <>€ {(Number(item.is_sold_by_piece ? item.price_per_piece : (item.pieces_per_kg ? (item.price_per_kg / item.pieces_per_kg) : item.price_per_kg)) || 0).toFixed(2)} /{item.is_sold_by_piece ? 'pz' : 'kg'}</>
                                                ) : null}
                                                {item.hide_quantity ? '' : ')'}
                                            </span>
                                            {item.show_servings && item.servings_per_unit && !item.hide_quantity && (
                                                <span style={{ color: 'var(--color-primary)', marginLeft: '0.5rem' }}>
                                                    ({(Number(item.servings_per_unit) * Number(item.quantity)).toFixed(0)} persone)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <p style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                    € {(Number(item.is_sold_by_piece ? item.price_per_piece : (item.pieces_per_kg ? (item.price_per_kg / item.pieces_per_kg) : item.price_per_kg)) * (Number(item.quantity) || 0)).toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                    {/* ... rest of the content ... */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Totale Preventivo</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>(prezzo indicativo)</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            {suggestedTotal > parseFloat(quote.total_price) && (
                                <span style={{ 
                                    fontSize: '1.2rem', 
                                    color: 'var(--color-text-muted)', 
                                    textDecoration: 'line-through',
                                    marginRight: '0.75rem',
                                    fontWeight: '500'
                                }}>
                                    € {suggestedTotal.toFixed(2)}
                                </span>
                            )}
                            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>
                                € {parseFloat(quote.total_price).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'rgba(175, 68, 72, 0.05)', padding: '1.5rem', borderRadius: '16px', border: '1px dashed var(--color-primary)', marginBottom: '2rem', textAlign: 'center' }}>
                        <p style={{ marginBottom: '1rem', fontWeight: '500' }}>Ti piace questo preventivo? Contattaci per confermare la disponibilità!</p>
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}
                            onClick={sendToWhatsApp}
                        >
                            <Send size={20} /> Richiedi Informazioni su WhatsApp
                        </button>
                    </div>

                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        Muse Catering - Qualità e Passione per i tuoi eventi
                    </p>
                </div>
            </div>

            {selectedProduct && (
                <ProductDetailsModal 
                    product={selectedProduct} 
                    onClose={() => {
                        setIsClosing(true);
                        setTimeout(() => {
                            setSelectedProduct(null);
                            setIsClosing(false);
                        }, 300);
                    }}
                    isClosing={isClosing}
                />
            )}
        </div>
    );
};

export default SharedQuote;
