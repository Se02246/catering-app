import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { useReviews } from '../hooks/useData';
import ReviewCard from '../components/Common/ReviewCard';
import Header from '../components/Layout/Header';

const ReviewsPage = () => {
    const navigate = useNavigate();
    const { reviews, isLoading, isError } = useReviews();
    
    // Filters state
    const [ratingFilter, setRatingFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');

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

    return (
        <div className="container fade-in" style={{ paddingBottom: '5rem' }}>
            <Header />

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
        </div>
    );
};

export default ReviewsPage;
