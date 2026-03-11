import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ShoppingBag, ArrowLeft, Send, CheckCircle } from 'lucide-react';
import { formatCustomText } from '../utils/textFormatting';

const SharedPackage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [pkg, setPkg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPackage = async (isFirstLoad = false) => {
            if (isFirstLoad) setLoading(true);
            try {
                const caterings = await api.getCaterings();
                const found = caterings.find(c => c.id === parseInt(id));
                if (found) {
                    setPkg(found);
                    setError(null);
                } else {
                    if (isFirstLoad) setError('Pacchetto non trovato.');
                }
            } catch (err) {
                console.error('Error fetching package:', err);
                if (isFirstLoad) setError('Errore nel caricamento del pacchetto.');
            } finally {
                if (isFirstLoad) setLoading(false);
            }
        };

        fetchPackage(true);
        const interval = setInterval(() => fetchPackage(false), 5000);
        return () => clearInterval(interval);
    }, [id]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
            <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
            <p>Caricamento pacchetto...</p>
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
        const finalPrice = pkg.discount_percentage > 0 
            ? (pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)
            : parseFloat(pkg.total_price).toFixed(2);
            
        const message = `Ciao Barbara, sono interessato al pacchetto "${pkg.name}" che ho visto sul sito:\n\n${url}\n\nPrezzo: € ${finalPrice}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const finalPrice = pkg.discount_percentage > 0 
        ? (pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)
        : parseFloat(pkg.total_price).toFixed(2);

    return (
        <div className="container" style={{ maxWidth: '800px', padding: '2rem 1rem' }}>
            <button 
                onClick={() => navigate('/')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginBottom: '2rem', fontSize: '1rem', fontWeight: 'bold' }}
            >
                <ArrowLeft size={20} /> Torna ai pacchetti
            </button>

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', position: 'relative' }}>
                {pkg.image_url && (
                    <div style={{ width: '100%', height: '300px', overflow: 'hidden' }}>
                        <img src={pkg.image_url} alt={pkg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                )}
                
                <div style={{ padding: '2.5rem' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem' }}>
                            {pkg.name}
                            <span style={{ marginLeft: '1rem', display: 'inline-flex', gap: '0.5rem', verticalAlign: 'middle' }}>
                                {pkg.is_gluten_free && (
                                    <span style={{ color: '#FF9800', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                        Senza Glutine
                                    </span>
                                )}
                                {pkg.is_lactose_free && (
                                    <span style={{ color: '#03A9F4', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                        Senza Lattosio
                                    </span>
                                )}
                            </span>
                        </h1>
                        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>{formatCustomText(pkg.description)}</p>
                    </div>

                    <div style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <ShoppingBag size={20} /> Cosa include questo pacchetto
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="grid-responsive">
                            {pkg.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                    <CheckCircle size={18} color="var(--color-primary)" />
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <p style={{ fontWeight: 'bold', margin: 0, fontSize: '0.95rem' }}>{item.name}</p>
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {item.is_gluten_free && !pkg.is_gluten_free && (
                                                    <span style={{ color: '#FF9800', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Senza Glutine
                                                    </span>
                                                )}
                                                {item.is_lactose_free && !pkg.is_lactose_free && (
                                                    <span style={{ color: '#03A9F4', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Senza Lattosio
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                            {parseFloat(item.quantity)} {item.is_sold_by_piece ? 'pz' : (item.pieces_per_kg ? 'pz' : 'kg')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', display: 'block' }}>Prezzo del pacchetto</span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                                    <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>€ {finalPrice}</span>
                                    {pkg.discount_percentage > 0 && (
                                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>€ {pkg.total_price}</span>
                                    )}
                                </div>
                            </div>
                            
                            <button 
                                className="btn btn-primary" 
                                style={{ padding: '1.2rem 2.5rem', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                                onClick={sendToWhatsApp}
                            >
                                <Send size={22} /> Prenota ora
                            </button>
                        </div>

                        <div style={{ backgroundColor: '#fff9f9', padding: '1.5rem', borderRadius: '12px', border: '1px solid #ffecec', textAlign: 'center', fontSize: '0.9rem' }}>
                            <p style={{ margin: 0 }}>Il prezzo indicato è bloccato per i prodotti elencati. Eventuali modifiche o aggiunte verranno calcolate separatamente.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharedPackage;
