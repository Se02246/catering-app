import React, { useState } from 'react';
import { useReviews } from '../../hooks/useData';
import { api } from '../../services/api';
import { Trash2, Star, MessageSquare, User, Calendar, Loader } from 'lucide-react';

const ReviewManager = () => {
    const { reviews, isLoading, isError, mutate } = useReviews();
    const [isDeleting, setIsDeleting] = useState(null);
    const [message, setMessage] = useState(null);
    const [respondingTo, setRespondingTo] = useState(null);
    const [responseText, setResponseText] = useState('');

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

    const startResponding = (review) => {
        setRespondingTo(review.id);
        setResponseText(review.response || '');
    };

    if (isLoading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Caricamento recensioni...</div>;
    if (isError) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-primary)' }}>Errore nel caricamento delle recensioni.</div>;

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
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>{review.author_name}</h4>
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
                                    "{review.comment}"
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
