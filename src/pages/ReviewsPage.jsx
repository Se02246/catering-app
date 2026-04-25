import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Plus, X, Star, Save, Loader } from 'lucide-react';
import { useReviews } from '../hooks/useData';
import ReviewCard from '../components/Common/ReviewCard';
import Header from '../components/Layout/Header';
import { api } from '../services/api';
import ImageUpload from '../components/Common/ImageUpload';

const ReviewsPage = () => {
    const navigate = useNavigate();
    const { reviews, isLoading, isError, mutate } = useReviews();
    
    // Filters state
    const [ratingFilter, setRatingFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newReview, setNewReview] = useState({
        author_name: '',
        rating: 5,
        comment: '',
        images: []
    });
    const [message, setMessage] = useState(null);

    // Extract unique years for the filter dropdown
    const availableYears = useMemo(() => {
        if (!reviews) return [];
        const years = reviews.map(r => new Date(r.created_at).getFullYear());
        return ['All', ...Array.from(new Set(years)).sort((a, b) => b - a)];
    }, [reviews]);

    // Apply filters
    const filteredReviews = useMemo(() => {
        if (!reviews) return [];
        
        return reviews.filter(review => {
            const reviewYear = new Date(review.created_at).getFullYear().toString();
            
            const matchesRating = ratingFilter === 'All' || review.rating.toString() === ratingFilter;
            const matchesYear = yearFilter === 'All' || reviewYear === yearFilter;
            
            return matchesRating && matchesYear;
        });
    }, [reviews, ratingFilter, yearFilter]);

    const handleSaveReview = async (e) => {
        e.preventDefault();
        if (!newReview.author_name || !newReview.comment) {
            setMessage({ type: 'error', text: 'Per favore, compila tutti i campi obbligatori.' });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        try {
            await api.createReview(newReview);
            await mutate(); // Refresh list
            setMessage({ type: 'success', text: 'Grazie! La tua recensione è stata pubblicata.' });
            setTimeout(() => {
                setIsModalOpen(false);
                setNewReview({ author_name: '', rating: 5, comment: '', images: [] });
                setMessage(null);
            }, 2000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Errore durante il salvataggio. Riprova.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '5rem' }}>
            <Header isReviewsPage={true} />

            <div id="reviews-top" className="section-header" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <button 
                        onClick={() => navigate(-1)} 
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--color-primary)', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            padding: '0.5rem',
                            borderRadius: '50%',
                            transition: 'background-color 0.2s'
                        }}
                        className="hover-bg-primary-light"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h2 style={{ margin: 0 }}>Dicono di noi</h2>
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                    Leggi le esperienze di chi ha già scelto il nostro servizio catering per i propri eventi speciali.
                </p>
            </div>

            {/* Filters Section */}
            <div className="glass-panel" style={{ 
                padding: '1.5rem', 
                marginBottom: '3rem', 
                display: 'flex', 
                gap: '2rem', 
                flexWrap: 'wrap', 
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 'var(--radius-lg)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <label style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>Valutazione:</label>
                    <select 
                        value={ratingFilter} 
                        onChange={(e) => setRatingFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg)',
                            color: 'var(--color-text)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="All">Tutte</option>
                        <option value="5">5 Stelle</option>
                        <option value="4">4 Stelle</option>
                        <option value="3">3 Stelle</option>
                        <option value="2">2 Stelle</option>
                        <option value="1">1 Stella</option>
                    </select>
                </div>

                {availableYears.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <label style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>Anno:</label>
                        <select 
                            value={yearFilter} 
                            onChange={(e) => setYearFilter(e.target.value)}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                backgroundColor: 'var(--color-bg)',
                                color: 'var(--color-text)',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year === 'All' ? 'Tutti' : year}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Content Section */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <div className="animate-pulse" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Caricamento recensioni...</div>
                </div>
            ) : isError ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#E11D48' }}>
                    Si è verificato un errore nel caricamento delle recensioni. Riprova più tardi.
                </div>
            ) : filteredReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <MessageSquare size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem', opacity: 0.5 }} />
                    <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Nessuna recensione trovata.</h3>
                    <p style={{ color: 'var(--color-text-muted)', opacity: 0.7 }}>Prova a modificare i filtri di ricerca.</p>
                    {(ratingFilter !== 'All' || yearFilter !== 'All') && (
                        <button 
                            className="btn btn-outline" 
                            style={{ marginTop: '1rem' }}
                            onClick={() => { setRatingFilter('All'); setYearFilter('All'); }}
                        >
                            Resetta Filtri
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
                    gap: '2rem' 
                }}>
                    {filteredReviews.map((review, index) => (
                        <div key={review.id} style={{ animationDelay: `${index * 0.05}s` }} className="fade-in">
                            <ReviewCard review={review} layout="vertical" />
                        </div>
                    ))}
                </div>
            )}

            {/* FAB - Leave a Review */}
            <button
                className="btn btn-primary"
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    borderRadius: '50px',
                    padding: '1rem 1.5rem',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    zIndex: 100
                }}
                onClick={() => setIsModalOpen(true)}
            >
                <Plus size={24} /> Lascia una recensione
            </button>

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => !isSaving && setIsModalOpen(false)} style={{ zIndex: 2000 }}>
                    <div 
                        className="modal-content fade-in" 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            maxWidth: '600px', 
                            width: '95%', 
                            maxHeight: '90vh', 
                            display: 'flex', 
                            flexDirection: 'column',
                            padding: '0' // Remove padding to handle scroll area better
                        }}
                    >
                        {/* Modal Header */}
                        <div style={{ 
                            padding: '1.5rem', 
                            borderBottom: '1px solid var(--color-border)', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.3rem' }}>La tua opinione conta</h3>
                            <button 
                                onClick={() => !isSaving && setIsModalOpen(false)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            {message && (
                                <div className={`message-banner ${message.type}`} style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                                    {message.text}
                                </div>
                            )}

                            <form id="review-form" onSubmit={handleSaveReview}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Nome e Cognome *</label>
                                    <input
                                        type="text"
                                        value={newReview.author_name}
                                        onChange={e => setNewReview({ ...newReview, author_name: e.target.value })}
                                        placeholder="Esempio: Mario Rossi"
                                        required
                                        className="input-elegant"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Valutazione *</label>
                                    <div style={{ display: 'flex', gap: '0.6rem', padding: '0.5rem 0' }}>
                                        {[1, 2, 3, 4, 5].map(star => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewReview({ ...newReview, rating: star })}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, transition: 'transform 0.2s' }}
                                                className="star-hover"
                                            >
                                                <Star 
                                                    size={36} 
                                                    fill={star <= newReview.rating ? '#FFD700' : 'transparent'} 
                                                    color={star <= newReview.rating ? '#FFD700' : 'var(--color-border)'} 
                                                    strokeWidth={1.5}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                                        Seleziona da 1 a 5 stelle
                                    </p>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Recensione *</label>
                                    <textarea
                                        value={newReview.comment}
                                        onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                        placeholder="Descrivi la tua esperienza con Muse Catering..."
                                        required
                                        rows={5}
                                        className="input-elegant"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', resize: 'none', fontSize: '1rem', lineHeight: '1.5' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Foto del servizio (consigliate)</label>
                                    <ImageUpload 
                                        images={newReview.images}
                                        onUpload={urls => setNewReview({ ...newReview, images: urls })}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                        Carica foto del cibo o dell'allestimento per mostrare la qualità del servizio.
                                    </p>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ 
                            padding: '1.5rem', 
                            borderTop: '1px solid var(--color-border)', 
                            background: 'rgba(255,255,255,0.5)',
                            display: 'flex',
                            gap: '1rem',
                            flexShrink: 0
                        }}>
                            <button 
                                type="button" 
                                className="btn btn-outline" 
                                onClick={() => !isSaving && setIsModalOpen(false)}
                                style={{ flex: 1 }}
                                disabled={isSaving}
                            >
                                Annulla
                            </button>
                            <button 
                                type="submit" 
                                form="review-form"
                                className="btn btn-primary" 
                                disabled={isSaving}
                                style={{ flex: 2, padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 'bold' }}
                            >
                                {isSaving ? <Loader className="animate-spin" size={22} /> : <Save size={22} />}
                                {isSaving ? 'Invio in corso...' : 'Invia Recensione'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsPage;

