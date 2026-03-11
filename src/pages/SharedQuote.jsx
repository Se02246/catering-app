import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShoppingBag, Calendar, ArrowLeft, Send } from 'lucide-react';

const SharedQuote = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const data = await api.getQuote(id);
                setQuote(data);
            } catch (err) {
                console.error('Error fetching quote:', err);
                setError('Preventivo non trovato o scaduto.');
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
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
                        <h1 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>Riepilogo Preventivo</h1>
                        <p style={{ color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={16} /> Creato il {new Date(quote.created_at).toLocaleDateString('it-IT')}
                        </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>ID Preventivo</p>
                        <p style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{id.substring(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShoppingBag size={20} /> Prodotti Selezionati
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {quote.items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    {item.image_url && (
                                        <img src={item.image_url} alt={item.name} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />
                                    )}
                                    <div>
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>{item.name}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                            {parseFloat(item.quantity)} {item.is_sold_by_piece ? 'pz' : (item.pieces_per_kg ? 'pz' : 'kg')}
                                            {item.show_servings && item.servings_per_unit && (
                                                <span style={{ color: 'var(--color-primary)', marginLeft: '0.5rem' }}>
                                                    ({(item.servings_per_unit * item.quantity).toFixed(0)} persone)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <p style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                    € {((item.is_sold_by_piece ? item.price_per_piece : (item.pieces_per_kg ? (item.price_per_kg / item.pieces_per_kg) : item.price_per_kg)) * item.quantity).toFixed(2)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Totale Preventivo</span>
                        <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>€ {parseFloat(quote.total_price).toFixed(2)}</span>
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
        </div>
    );
};

export default SharedQuote;
