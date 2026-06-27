import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useProducts } from '../hooks/useData';
import { ArrowLeft, Gift, MapPin, MessageSquare, Instagram, MessageCircle, Calendar } from 'lucide-react';
import { formatCustomText } from '../utils/textFormatting';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';

const Confetti = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const numberOfPieces = 150;
        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];

        for (let i = 0; i < numberOfPieces; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                w: Math.random() * 10 + 5,
                h: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                speedY: Math.random() * 3 + 2,
                speedX: Math.random() * 2 - 1,
                rotation: Math.random() * 360,
                rotationSpeed: Math.random() * 5 - 2.5
            });
        }

        let startTime = Date.now();
        let animationFrameId;
        const render = () => {
            const elapsed = Date.now() - startTime;
            const shouldReset = elapsed < 5000;
            let activePieces = 0;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            pieces.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;
                p.rotation += p.rotationSpeed;

                if (p.y > canvas.height) {
                    if (shouldReset) {
                        p.y = -20;
                        p.x = Math.random() * canvas.width;
                    }
                }

                if (p.y <= canvas.height) {
                    activePieces++;
                    ctx.save();
                    ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                    ctx.rotate(p.rotation * Math.PI / 180);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                    ctx.restore();
                }
            });
            if (activePieces > 0) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        render();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 9999
            }}
        />
    );
};

const SharedLottery = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { products } = useProducts();
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await api.getEventBySlug(slug);
                if (!data || !data.lottery_config?.is_enabled) {
                    setError('Lotteria non trovata o disattivata per questo evento.');
                    return;
                }
                setEvent(data);
            } catch (err) {
                console.error(err);
                setError('Errore durante il caricamento della lotteria.');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [slug]);

    const config = event?.lottery_config;
    let activeStep = config?.active_step || 1;

    if (activeStep === 1 && config?.step2?.activation_date) {
        if (new Date() >= new Date(config.step2.activation_date)) {
            activeStep = 2;
        }
    }

    const prizeIds = config?.prize_product_ids || [];
    const showPrizes = activeStep > 1 || config?.show_prizes_step1;
    
    const prizeProducts = prizeIds.map(id => products?.find(p => p.id === id)).filter(Boolean);
    const prizeImages = prizeProducts.map(p => p.image_url).filter(Boolean);
        
    useEffect(() => {
        if (!showPrizes || prizeImages.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentImgIndex(prev => (prev + 1) % prizeImages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [showPrizes, prizeImages.length]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)' }}>
                <div className="animate-float" style={{ color: 'var(--color-accent)', fontWeight: 'bold', fontSize: '1.2rem' }}>Caricamento...</div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text)', minHeight: '100vh', background: 'var(--color-bg)' }}>
                <h2>Oops!</h2>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Torna alla Home</button>
            </div>
        );
    }

    const winnerNames = config.step3?.winner_names && config.step3.winner_names.length > 0 
        ? config.step3.winner_names 
        : (config.step3?.winner_name ? [config.step3.winner_name] : []);

    let currentTitle = '';
    let currentDesc = '';

    if (activeStep === 1) {
        currentTitle = config.step1?.title || 'Lotteria dell\'Evento';
        currentDesc = config.step1?.description || 'Partecipa alla nostra lotteria!';
    } else if (activeStep === 2) {
        currentTitle = config.step2?.title || 'Lotteria Attiva!';
        currentDesc = config.step2?.description || 'Scopri come partecipare.';
    } else if (activeStep === 3) {
        currentTitle = config.step3?.title || 'Abbiamo un Vincitore!';
        currentDesc = config.step3?.description || 'Grazie per aver partecipato!';
    }

    const contactWhatsApp = () => {
        const phoneNumber = "393495416637";
        const message = "Ciao Barbara, vorrei avere maggiori informazioni sulla lotteria dell'evento.";
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingBottom: '4rem', position: 'relative' }}>
            {activeStep === 3 && <Confetti />}

            {/* Navbar Pinned to Top */}
            <div style={{ 
                position: 'sticky', 
                top: 0, 
                backgroundColor: 'rgba(255, 253, 240, 0.9)', 
                backdropFilter: 'blur(8px)', 
                zIndex: 100, 
                padding: '1rem',
                borderBottom: '1px solid rgba(197, 160, 89, 0.2)',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <button 
                    onClick={() => navigate(`/event/${event.slug}`)}
                    style={{ 
                        background: 'transparent', 
                        border: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem', 
                        color: 'var(--color-primary)', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        padding: '0.5rem'
                    }}
                >
                    <ArrowLeft size={20} /> Torna all'Evento
                </button>
            </div>

            <div className="container" style={{ paddingTop: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '1.2rem', backgroundColor: 'var(--color-accent)', borderRadius: '50%', color: 'white', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(197, 160, 89, 0.4)' }}>
                        <Gift size={56} />
                    </div>
                    <h1 style={{ color: 'var(--color-primary-dark)', fontSize: '3rem', margin: '0 0 0.5rem 0', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                        LOTTERIA
                    </h1>
                    <h2 style={{ color: 'var(--color-accent)', fontSize: '1.8rem', margin: '0 0 1rem 0', fontWeight: 700 }}>{currentTitle}</h2>
                    <h3 style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', fontWeight: 500, margin: 0 }}>{event.name} - {event.date_text}</h3>
                </div>

                <div className="premium-card fade-in" style={{ border: '1px solid rgba(197, 160, 89, 0.3)', background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,253,240,1) 100%)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', marginBottom: '2rem', overflow: 'hidden' }}>
                    {showPrizes && prizeImages.length > 0 && (
                        <div style={{ position: 'relative', height: '300px', width: '100%', overflow: 'hidden' }}>
                            {prizeImages.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt="Premio Lotteria"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'opacity 1s ease-in-out',
                                        opacity: currentImgIndex === i ? 1 : 0,
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        zIndex: currentImgIndex === i ? 2 : 1
                                    }}
                                />
                            ))}
                        </div>
                    )}
                    
                    <div style={{ padding: '2.5rem' }}>
                        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', color: 'var(--color-text)', textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: formatCustomText(currentDesc) }} />
                    
                    {activeStep === 1 && config.step1?.start_date && (
                        <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem', backgroundColor: 'rgba(197, 160, 89, 0.1)', borderRadius: 'var(--radius-md)' }}>
                            <Calendar size={24} color="var(--color-accent)" />
                            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                La lotteria inizia il {new Date(config.step1.start_date).toLocaleString('it-IT', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}

                    {activeStep === 3 && winnerNames.length > 0 && (
                        <div className="animate-float" style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                            <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.3rem' }}>I vincitori:</h3>
                            
                            {winnerNames.length === 1 ? (
                                <div style={{ 
                                    display: 'inline-block',
                                    padding: '1.5rem 3rem', 
                                    background: 'linear-gradient(45deg, #FFD700, #FDB931, #FFD700)', 
                                    borderRadius: 'var(--radius-lg)', 
                                    color: '#5a4604', 
                                    fontWeight: '900', 
                                    fontSize: '2.5rem',
                                    boxShadow: '0 10px 25px rgba(253, 185, 49, 0.4)',
                                    border: '2px solid rgba(255,255,255,0.5)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px'
                                }}>
                                    {winnerNames[0]}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                                    {winnerNames.map((name, idx) => {
                                        const prizeName = prizeIds[idx] ? products?.find(p => p.id === prizeIds[idx])?.name : 'Premio';
                                        return (
                                            <div key={idx} style={{ 
                                                width: '100%',
                                                maxWidth: '500px',
                                                padding: '1.5rem', 
                                                background: 'linear-gradient(45deg, #FFD700, #FDB931, #FFD700)', 
                                                borderRadius: 'var(--radius-lg)', 
                                                color: '#5a4604', 
                                                boxShadow: '0 10px 25px rgba(253, 185, 49, 0.4)',
                                                border: '2px solid rgba(255,255,255,0.5)',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem', opacity: 0.9 }}>
                                                    {idx + 1}° Premio ({prizeName})
                                                </div>
                                                <div style={{ fontWeight: '900', fontSize: '2.2rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                    {name}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </div>

                {showPrizes && prizeProducts.length > 0 && (
                    <div style={{ marginBottom: '2rem' }}>
                        <h3 style={{ color: 'var(--color-primary-dark)', fontSize: '1.4rem', marginBottom: '1rem', marginLeft: '0.5rem' }}>I premi in palio</h3>
                        <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                            {prizeProducts.map((prod, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => setSelectedProduct(prod)}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        minWidth: '280px',
                                        backgroundColor: 'white', 
                                        borderRadius: 'var(--radius-md)', 
                                        border: '1px solid var(--color-border)',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                                        cursor: 'pointer',
                                        overflow: 'hidden',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ width: '90px', height: '90px', flexShrink: 0, backgroundColor: '#f5f5f5' }}>
                                        {prod.image_url ? (
                                            <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Gift color="#ccc" />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '1rem', flex: 1 }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 'bold', marginBottom: '0.25rem' }}>{idx + 1}° Premio</div>
                                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{prod.name}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {((activeStep === 2 && config.step2?.show_map) || (activeStep === 3 && config.step3?.show_map)) && event.where_image_url && (
                    <div className="premium-card fade-in" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                        <div style={{ height: '250px' }}>
                            <img src={event.where_image_url} alt="Location" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <MapPin size={24} color="var(--color-primary)" />
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)' }}>{event.where_title || 'Dove siamo'}</h3>
                                {event.where_link && (
                                    <a href={event.where_link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>Apri Mappa &rarr;</a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {((activeStep === 2 && config.step2?.show_contacts) || (activeStep === 3 && config.step3?.show_contacts)) && (
                    <div className="premium-card fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary-dark)' }}>
                            <MessageSquare size={28} />
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Contatti</h3>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>Per qualsiasi informazione non esitare a contattarci.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button onClick={contactWhatsApp} className="btn btn-primary" style={{ width: '100%', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '50px', fontSize: '1rem' }}>
                                <MessageCircle size={20} /> WhatsApp
                            </button>
                            <button onClick={() => window.open('https://www.instagram.com/muse_catering_?igsh=amNwajZrcW5kczAx', '_blank')} className="btn btn-outline" style={{ width: '100%', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', borderRadius: '50px', fontSize: '1rem', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', background: 'transparent' }}>
                                <Instagram size={20} /> Instagram
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {selectedProduct && (
                <ProductDetailsModal 
                    product={selectedProduct} 
                    onClose={() => setSelectedProduct(null)} 
                    alwaysShowPrices={false} 
                />
            )}
        </div>
    );
};

export default SharedLottery;
