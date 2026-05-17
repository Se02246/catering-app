import React, { useState, useRef } from 'react';
import { useReviews } from '../../hooks/useData';
import { api } from '../../services/api';
import { Trash2, Star, MessageSquare, Calendar, Loader, Share2 } from 'lucide-react';
import { toBlob } from 'html-to-image';

const ReviewManager = () => {
    const { reviews, isLoading, isError, mutate } = useReviews();
    const [isDeleting, setIsDeleting] = useState(null);
    const [isSharing, setIsSharing] = useState(null);
    const [message, setMessage] = useState(null);
    const [respondingTo, setRespondingTo] = useState(null);
    const [responseText, setResponseText] = useState('');
    const shareTemplateRef = useRef(null);
    const [reviewToShare, setReviewToShare] = useState(null);

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questa recensione?')) return;
        
        setIsDeleting(id);
        setMessage(null);
        try {
            await api.deleteReview(id);
            await mutate();
            setMessage({ type: 'success', text: 'Recensione eliminata con successo.' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Errore durante l\'eliminazione.' });
        } finally {
            setIsDeleting(null);
        }
    };

    const handleResponse = async (review) => {
        setIsDeleting(review.id); // Re-use loading state
        try {
            await api.updateReview(review.id, { response: responseText });
            await mutate();
            setMessage({ type: 'success', text: 'Risposta salvata con successo.' });
            setRespondingTo(null);
            setResponseText('');
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Errore durante il salvataggio della risposta.' });
        } finally {
            setIsDeleting(null);
        }
    };

    const getSharedDynamicFontSize = (reviewText, responseText, hasImages) => {
        const totalLength = (reviewText?.length || 0) + (responseText?.length || 0);
        
        // Reverted to original, more balanced sizes
        if (totalLength < 150) return hasImages ? '54px' : '60px';
        if (totalLength < 300) return '50px';
        if (totalLength < 500) return '40px';
        if (totalLength < 800) return '30px';
        return '26px';
    };

    const handleShare = async (review) => {
        if (isSharing) return;
        setIsSharing(review.id);
        setReviewToShare(review);
        setMessage(null);
        
        // Wait for the template to render in the DOM
        setTimeout(async () => {
            if (!shareTemplateRef.current) {
                setIsSharing(null);
                return;
            }

            try {
                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }

                const blob = await toBlob(shareTemplateRef.current, {
                    width: 1080,
                    height: 1920,
                    pixelRatio: 2, // Moltiplicatore di risoluzione (2 = qualità Retina)
                    cacheBust: true,
                });

                if (!blob) throw new Error('Failed to generate image blob');

                const file = new File([blob], `recensione-muse-${review.id}.png`, { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Recensione Muse Catering',
                        text: `Guarda cosa dicono di noi! #MuseCatering`
                    });
                } else {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `recensione-muse-${review.id}.png`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                    setMessage({ type: 'success', text: 'Immagine scaricata! Ora puoi condividerla.' });
                }
            } catch (err) {
                console.error('Error sharing review:', err);
                setMessage({ type: 'error', text: 'Errore nella generazione dell\'immagine.' });
            } finally {
                setIsSharing(null);
                setReviewToShare(null);
            }
        }, 500); 
    };

    const startResponding = (review) => {
        setRespondingTo(review.id);
        setResponseText(review.response || '');
    };

    if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Caricamento recensioni...</div>;
    if (isError) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-primary)' }}>Errore nel caricamento delle recensioni.</div>;

    const unifiedFontSize = reviewToShare ? getSharedDynamicFontSize(reviewToShare.comment, reviewToShare.response, reviewToShare.images?.length > 0) : '50px';

    return (
        <div className="admin-section fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <MessageSquare size={28} /> Gestione Recensioni
                </h2>
                <span className="badge-elegant" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>
                    {reviews.length} Recensioni totali
                </span>
            </div>

            {message && (
                <div className={`message-banner ${message.type}`} style={{ marginBottom: '1.5rem' }}>
                    {message.text}
                </div>
            )}

            {/* Hidden template for sharing */}
            {reviewToShare && (
                <div 
                    style={{
                        position: 'fixed',
                        left: '-2000px',
                        top: '0',
                        width: '1080px',
                        height: '1920px',
                        overflow: 'hidden',
                        zIndex: -1
                    }}
                >
                    <div 
                        ref={shareTemplateRef}
                        style={{
                            width: '1080px',
                            height: '1920px',
                            background: '#FCFAF7',
                            backgroundImage: 'linear-gradient(135deg, #FCFAF7 0%, #F5E6E0 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center', 
                            padding: '60px',
                            boxSizing: 'border-box',
                            position: 'relative'
                        }}
                    >
                        {/* Title - Restored to 180px */}
                        <div style={{
                            textAlign: 'center',
                            width: '100%',
                            zIndex: 10,
                            position: 'relative',
                            marginBottom: '40px'
                        }}>
                            <h1 style={{
                                fontFamily: "'Brittany Signature', cursive",
                                fontSize: '180px',
                                color: '#9B393D',
                                margin: 0,
                                fontWeight: 'normal',
                                lineHeight: '1',
                                textShadow: '0 10px 20px rgba(155, 57, 61, 0.1)'
                            }}>MuseCatering</h1>
                        </div>
                        
                        <div style={{
                            background: 'white',
                            borderRadius: '60px',
                            padding: '60px 60px',
                            width: '100%',
                            maxHeight: '1700px', // Maintain Mod 1: keep it flexible for long reviews
                            boxShadow: '0 40px 100px rgba(155, 57, 61, 0.15)',
                            border: '1px solid rgba(155, 57, 61, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            gap: '40px',
                            overflow: 'hidden',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', color: '#FFD700', justifyContent: 'center' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={50} fill={i < reviewToShare.rating ? '#FFD700' : 'transparent'} strokeWidth={1.5} />
                                    ))}
                                </div>
                                <h2 style={{ fontSize: '60px', margin: '0 0 10px 0', color: '#7A2D30', fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: '1.1' }}>
                                    {reviewToShare.title}
                                </h2>
                                <p style={{ fontSize: '36px', margin: 0, color: '#6B5E5E', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>
                                    {reviewToShare.author_name || 'Utente Anonimo'}
                                </p>
                            </div>
                            
                            <div style={{ position: 'relative' }}>
                                <p style={{ 
                                    fontSize: unifiedFontSize, 
                                    lineHeight: '1.4', 
                                    color: '#2D2424', 
                                    fontStyle: 'italic', 
                                    margin: 0,
                                    fontFamily: 'Nunito, sans-serif',
                                    whiteSpace: 'pre-line',
                                    textAlign: 'center'
                                }}>
                                    {reviewToShare.comment}
                                </p>
                            </div>

                            {/* Refined Image Gallery - Restored to 234px */}
                            {reviewToShare.images && reviewToShare.images.length > 0 && (
                                <div style={{ 
                                    height: '280px', 
                                    width: '100%', 
                                    position: 'relative', 
                                    margin: '30px 0',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    {reviewToShare.images.slice(0, 4).map((img, idx, arr) => {
                                        const rotations = [-5, 3, -4, 4];
                                        const totalWidth = 880; 
                                        const imgSize = 234; 
                                        const step = arr.length > 1 ? (totalWidth - imgSize) / (arr.length - 1) : 0;
                                        const startX = -(totalWidth - imgSize) / 2;
                                        const xPos = startX + (idx * step);

                                        return (
                                            <div 
                                                key={idx}
                                                style={{
                                                    position: 'absolute',
                                                    width: `${imgSize}px`,
                                                    height: `${imgSize}px`,
                                                    borderRadius: '22px',
                                                    padding: '5px', 
                                                    background: 'white',
                                                    transform: `translateX(${xPos}px) rotate(${rotations[idx % 4]}deg)`,
                                                    zIndex: idx + 1,
                                                    overflow: 'hidden',
                                                    boxShadow: '0 12px 35px rgba(0,0,0,0.16)',
                                                    border: '1px solid rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                <img 
                                                    src={img} 
                                                    crossOrigin="anonymous"
                                                    alt="Review detail" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {reviewToShare.response && (
                                <div style={{ 
                                    marginTop: '10px', 
                                    padding: '40px 35px', 
                                    background: 'rgba(155, 57, 61, 0.04)', 
                                    borderRadius: '40px',
                                    borderLeft: '12px solid #9B393D'
                                }}>
                                    <span style={{ 
                                        display: 'block', 
                                        fontSize: '28px', 
                                        fontWeight: 800, 
                                        color: '#9B393D', 
                                        marginBottom: '15px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '4px',
                                        fontFamily: 'Outfit, sans-serif'
                                    }}>
                                        La nostra risposta:
                                    </span>
                                    <p style={{ 
                                        fontSize: unifiedFontSize, 
                                        lineHeight: '1.4', 
                                        color: '#2D2424', 
                                        margin: 0,
                                        fontFamily: 'Nunito, sans-serif',
                                        whiteSpace: 'pre-line'
                                    }}>
                                        {reviewToShare.response}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {reviews.length === 0 ? (
                <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>Non ci sono ancora recensioni da gestire.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    {reviews.map(review => (
                        <div key={review.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>{review.title}</h4>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginTop: '0.2rem', fontWeight: 500 }}>
                                            {review.author_name || 'Utente Anonimo'}
                                        </div>
                                        {review.author_email && (
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '4px', fontWeight: 'bold' }}>
                                                📧 Email per risposta: {review.author_email}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
                                            <div style={{ display: 'flex', gap: '2px' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        size={14} 
                                                        fill={i < review.rating ? '#FFD700' : 'transparent'} 
                                                        color={i < review.rating ? '#FFD700' : 'var(--color-border)'} 
                                                    />
                                                ))}
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Calendar size={12} /> {new Date(review.created_at).toLocaleDateString('it-IT')}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleShare(review)}
                                            disabled={isSharing === review.id}
                                            style={{ 
                                                background: 'rgba(var(--color-accent-rgb, 197, 160, 89), 0.1)', 
                                                color: 'var(--color-accent, #C5A059)', 
                                                border: 'none', 
                                                padding: '0.6rem', 
                                                borderRadius: '8px', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            title="Condividi recensione"
                                        >
                                            {isSharing === review.id ? <Loader className="animate-spin" size={18} /> : <Share2 size={18} />}
                                        </button>
                                        <button
                                            onClick={() => startResponding(review)}
                                            style={{ 
                                                background: 'rgba(var(--color-primary-rgb), 0.1)', 
                                                color: 'var(--color-primary)', 
                                                border: 'none', 
                                                padding: '0.6rem 1rem', 
                                                borderRadius: '8px', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                fontSize: '0.85rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            <MessageSquare size={16} /> {review.response ? 'Modifica risposta' : 'Rispondi'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(review.id)}
                                            disabled={isDeleting === review.id}
                                            style={{ 
                                                background: 'rgba(225, 29, 72, 0.1)', 
                                                color: '#E11D48', 
                                                border: 'none', 
                                                padding: '0.6rem', 
                                                borderRadius: '8px', 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                            className="hover-danger"
                                            title="Elimina recensione"
                                        >
                                            {isDeleting === review.id && respondingTo === null ? <Loader className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <p style={{ margin: '0.5rem 0 1rem', color: 'var(--color-text)', fontSize: '0.95rem', lineHeight: '1.5', fontStyle: 'italic', whiteSpace: 'pre-line' }}>
                                    {review.comment}
                                </p>
                                
                                {review.images && review.images.length > 0 && (
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem', marginBottom: '1rem' }}>
                                        {review.images.map((img, idx) => (
                                            <img 
                                                key={idx} 
                                                src={img} 
                                                alt={`Review img ${idx}`} 
                                                style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} 
                                            />
                                        ))}
                                    </div>
                                )}

                                {respondingTo === review.id ? (
                                    <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.03)', borderRadius: '12px' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-primary-dark)' }}>
                                            La tua risposta:
                                        </label>
                                        <textarea 
                                            value={responseText}
                                            onChange={(e) => setResponseText(e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                minHeight: '100px', 
                                                padding: '0.8rem', 
                                                borderRadius: '8px', 
                                                border: '1px solid var(--color-border)',
                                                fontSize: '0.9rem',
                                                marginBottom: '1rem',
                                                resize: 'vertical'
                                            }}
                                            placeholder="Scrivi qui la tua risposta..."
                                        />
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button 
                                                className="btn btn-outline" 
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                onClick={() => setRespondingTo(null)}
                                            >
                                                Annulla
                                            </button>
                                            <button 
                                                className="btn btn-primary" 
                                                style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}
                                                onClick={() => handleResponse(review)}
                                                disabled={isDeleting === review.id}
                                            >
                                                {isDeleting === review.id ? 'Salvataggio...' : 'Salva Risposta'}
                                            </button>
                                        </div>
                                    </div>
                                ) : review.response && (
                                    <div style={{ marginTop: '1rem', padding: '1rem', borderLeft: '3px solid var(--color-primary)', background: 'rgba(var(--color-primary-rgb), 0.03)' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.25rem' }}>
                                            Tua risposta:
                                        </span>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text)', whiteSpace: 'pre-line' }}>
                                            {review.response}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReviewManager;
