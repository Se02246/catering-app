import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Plus, X, Star, Save, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { useReviews } from '../hooks/useData';
import ReviewCard from '../components/Common/ReviewCard';
import Header from '../components/Layout/Header';
import { api } from '../services/api';
import ImageUpload from '../components/Common/ImageUpload';

const ReviewsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { reviews, isLoading, isError, mutate } = useReviews();
    
    // Force scroll to top on mount and check for direct review link
    useEffect(() => {
        window.scrollTo(0, 0);
        
        if (location.pathname === '/lascia_una_recensione') {
            setIsModalOpen(true);
        }
    }, [location.pathname]);
    
    // Filters state
    const [ratingFilter, setRatingFilter] = useState('All');
    const [yearFilter, setYearFilter] = useState('All');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const galleryScrollRef = React.useRef(null);
    const [isSaving, setIsSaving] = useState(false);

    // Effect to scroll to correct image when gallery opens
    React.useEffect(() => {
        const handlePopState = () => {
            setIsGalleryOpen(false);
        };

        if (isGalleryOpen && galleryScrollRef.current) {
            const container = galleryScrollRef.current;
            const width = container.offsetWidth;
            container.scrollLeft = currentPhotoIndex * width;
        }

        if (isGalleryOpen) {
            document.body.style.overflow = 'hidden';
            window.history.pushState({ lightbox: 'gallery' }, '');
            window.addEventListener('popstate', handlePopState);
        } else {
            document.body.style.overflow = 'unset';
            window.removeEventListener('popstate', handlePopState);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isGalleryOpen]);

    const handleCloseGallery = (e) => {
        if (e) e.stopPropagation();
        setIsGalleryOpen(false);
        if (window.history.state && window.history.state.lightbox === 'gallery') {
            window.history.back();
        }
    };

    const [newReview, setNewReview] = useState({
        title: '',
        author_name: '',
        author_email: '',
        rating: 5,
        comment: '',
        images: []
    });
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Extract unique years for the filter dropdown
    const availableYears = useMemo(() => {
        if (!reviews) return [];
        const years = reviews.map(r => new Date(r.created_at).getFullYear());
        return ['All', ...Array.from(new Set(years)).sort((a, b) => b - a)];
    }, [reviews]);

    // Applying filters
    const filteredReviews = useMemo(() => {
        if (!reviews) return [];
        
        return reviews.filter(review => {
            const reviewYear = new Date(review.created_at).getFullYear().toString();
            
            const matchesRating = ratingFilter === 'All' || review.rating.toString() === ratingFilter;
            const matchesYear = yearFilter === 'All' || reviewYear === yearFilter;
            
            return matchesRating && matchesYear;
        });
    }, [reviews, ratingFilter, yearFilter]);

    // Statistics & Photos for Summary Header
    const stats = useMemo(() => {
        if (!reviews || reviews.length === 0) return {
            averageRating: 0,
            totalReviews: 0,
            recommendationRate: 100,
            allImages: []
        };

        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = (sum / total).toFixed(1);
        
        const recommendedCount = reviews.filter(r => r.rating >= 4).length;
        const rate = Math.round((recommendedCount / total) * 100);

        // Collect all images from reviews
        const images = [];
        reviews.forEach(r => {
            if (r.images && Array.isArray(r.images)) {
                images.push(...r.images);
            }
        });

        return {
            averageRating: avg,
            totalReviews: total,
            recommendationRate: rate,
            allImages: images.slice(0, 20) // Limit to top 20 photos
        };
    }, [reviews]);

    const getRatingLabel = (rating) => {
        const r = parseFloat(rating);
        if (r >= 4.5) return 'Eccellente';
        if (r >= 4.0) return 'Molto buono';
        if (r >= 3.0) return 'Buono';
        return 'Sufficiente';
    };

    const handleSaveReview = async (e) => {
        e.preventDefault();
        if (!newReview.title) {
            showToast('Per favore, compila il titolo della recensione.', 'error');
            return;
        }

        // Validate privacy acceptance if email is provided
        if (newReview.author_email && !privacyAccepted) {
            showToast('Devi accettare i termini e le condizioni per procedere.', 'error');
            return;
        }

        setIsSaving(true);

        try {
            await api.createReview(newReview);
            await mutate(); // Refresh list
            
            // Chiudi il modale immediatamente
            setIsModalOpen(false);
            setNewReview({ title: '', author_name: '', author_email: '', rating: 5, comment: '', images: [] });
            setPrivacyAccepted(false);
            
            // Mostra toast di successo
            showToast('Recensione aggiunta correttamente', 'success');
        } catch (err) {
            console.error(err);
            showToast('Qualcosa non ha funzionato, riprova', 'error');
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <div className="container fade-in" style={{ paddingBottom: '5rem' }}>
            <Header isReviewsPage={true} />

            <div id="reviews-top" className="section-header" style={{ marginBottom: '3rem', textAlign: 'center', maxWidth: 'none' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', color: 'var(--color-primary-dark)' }}>
                    Recensioni
                </h1>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star size={32} fill="#FFD700" color="#FFD700" />
                        <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{stats.averageRating}</span>
                    </div>
                    <div style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>
                        <span style={{ fontWeight: '600' }}>{getRatingLabel(stats.averageRating)}</span>
                        <span style={{ margin: '0 0.5rem', color: 'var(--color-text-muted)' }}>·</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{stats.totalReviews} Recensioni</span>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
                    <button 
                        className="btn" 
                        onClick={() => setIsModalOpen(true)}
                        style={{ 
                            padding: '1.2rem 2.5rem', 
                            fontSize: '1.1rem', 
                            width: '100%',
                            maxWidth: '400px',
                            backgroundColor: 'var(--color-accent)',
                            color: 'white',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 15px rgba(197, 160, 89, 0.4)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.75rem'
                        }}
                    >
                        <Star size={22} fill="white" /> Lascia una recensione
                    </button>
                </div>

                {stats.allImages.length > 0 && (
                    <div style={{ 
                        marginBottom: '4rem',
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.2fr 1fr',
                        gridTemplateRows: 'repeat(2, 180px)',
                        gap: '8px',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden'
                    }}>
                        {/* Image 1 (Large Left) */}
                        <div 
                            style={{ gridColumn: '1', gridRow: '1 / 3', cursor: 'pointer' }}
                            onClick={() => { setCurrentPhotoIndex(0); setIsGalleryOpen(true); }}
                        >
                            <img src={stats.allImages[0]} alt="Review Gallery 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        
                        {/* Image 2 (Large Middle) */}
                        {stats.allImages.length > 1 && (
                            <div 
                                style={{ gridColumn: '2', gridRow: '1 / 3', cursor: 'pointer' }}
                                onClick={() => { setCurrentPhotoIndex(1); setIsGalleryOpen(true); }}
                            >
                                <img src={stats.allImages[1]} alt="Review Gallery 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}

                        {/* Image 3 (Small Top Right) */}
                        {stats.allImages.length > 2 && (
                            <div 
                                style={{ gridColumn: '3', gridRow: '1', cursor: 'pointer' }}
                                onClick={() => { setCurrentPhotoIndex(2); setIsGalleryOpen(true); }}
                            >
                                <img src={stats.allImages[2]} alt="Review Gallery 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        )}

                        {/* Image 4 (Small Bottom Right + Overlay) */}
                        {stats.allImages.length > 3 && (
                            <div 
                                style={{ gridColumn: '3', gridRow: '2', position: 'relative', cursor: 'pointer' }}
                                onClick={() => { setCurrentPhotoIndex(3); setIsGalleryOpen(true); }}
                            >
                                <img src={stats.allImages[3]} alt="Review Gallery 4" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {stats.allImages.length > 4 && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        inset: 0, 
                                        backgroundColor: 'rgba(0,0,0,0.4)', 
                                        color: 'white', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold'
                                    }}>
                                        +{stats.allImages.length - 3}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
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
                            <form id="review-form" onSubmit={handleSaveReview}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Riassunto recensione *</label>
                                    <input
                                        type="text"
                                        value={newReview.title}
                                        onChange={e => setNewReview({ ...newReview, title: e.target.value })}
                                        placeholder="Esempio: Servizio eccezionale!"
                                        required
                                        className="input-elegant"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Nome (Opzionale)</label>
                                    <input
                                        type="text"
                                        value={newReview.author_name}
                                        onChange={e => setNewReview({ ...newReview, author_name: e.target.value })}
                                        placeholder="Esempio: Marco"
                                        className="input-elegant"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
                                    />
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Email (Privata - per ricevere la risposta)</label>
                                    <input
                                        type="email"
                                        value={newReview.author_email}
                                        onChange={e => setNewReview({ ...newReview, author_email: e.target.value })}
                                        placeholder="latua@email.it"
                                        className="input-elegant"
                                        style={{ width: '100%', padding: '0.8rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', fontSize: '1rem' }}
                                    />
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.4rem' }}>
                                        L'email non verrà mai mostrata pubblicamente.
                                    </p>
                                </div>

                                {newReview.author_email && (
                                    <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem', background: 'rgba(var(--color-primary-rgb), 0.03)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                                        <input
                                            type="checkbox"
                                            id="privacy-check"
                                            checked={privacyAccepted}
                                            onChange={e => setPrivacyAccepted(e.target.checked)}
                                            style={{ marginTop: '0.2rem', cursor: 'pointer', width: '18px', height: '18px' }}
                                        />
                                        <label htmlFor="privacy-check" style={{ fontSize: '0.9rem', color: 'var(--color-text)', cursor: 'pointer', lineHeight: '1.4' }}>
                                            Accetto i <button type="button" onClick={() => setIsPrivacyModalOpen(true)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-primary)', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', fontSize: 'inherit' }}>termini e le condizioni</button> sul trattamento dei dati.
                                        </label>
                                    </div>
                                )}

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
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--color-text)' }}>Recensione (Opzionale)</label>
                                    <textarea
                                        value={newReview.comment}
                                        onChange={e => setNewReview({ ...newReview, comment: e.target.value })}
                                        placeholder="Descrivi la tua esperienza con Muse Catering..."
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
            {/* Gallery Modal */}
            {isGalleryOpen && (
                <div className="modal-overlay" onClick={handleCloseGallery} style={{ zIndex: 3000, backgroundColor: 'rgba(0,0,0,0.9)' }}>
                    <button 
                        onClick={handleCloseGallery}
                        style={{ position: 'absolute', top: '2rem', right: '2rem', background: 'none', border: 'none', color: 'white', cursor: 'pointer', zIndex: 3100 }}
                    >
                        <X size={40} />
                    </button>

                    <div 
                        className="modal-content fade-in" 
                        onClick={e => e.stopPropagation()} 
                        style={{ 
                            background: 'none', 
                            boxShadow: 'none', 
                            maxWidth: '95vw', 
                            width: '100%',
                            maxHeight: '90vh', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            position: 'relative'
                        }}
                    >
                        <div 
                            ref={galleryScrollRef}
                            onScroll={(e) => {
                                const scrollPosition = e.target.scrollLeft;
                                const width = e.target.offsetWidth;
                                const newIndex = Math.round(scrollPosition / width);
                                if (newIndex !== currentPhotoIndex) {
                                    setCurrentPhotoIndex(newIndex);
                                }
                            }}
                            style={{
                                display: 'flex',
                                overflowX: 'auto',
                                scrollSnapType: 'x mandatory',
                                width: '100%',
                                height: '100%',
                                scrollbarWidth: 'none',
                                WebkitOverflowScrolling: 'touch',
                                alignItems: 'center'
                            }}
                            className="no-scrollbar"
                        >
                            {stats.allImages.map((img, idx) => (
                                <div key={idx} style={{ minWidth: '100%', height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
                                    <img 
                                        src={img} 
                                        alt={`Gallery image ${idx + 1}`}
                                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div style={{ position: 'absolute', bottom: '-40px', color: 'white', fontSize: '1rem', fontWeight: 'bold' }}>
                            {currentPhotoIndex + 1} / {stats.allImages.length}
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: toast.type === 'success' ? 'rgba(74, 222, 128, 0.9)' : 'rgba(248, 113, 113, 0.9)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '50px',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    zIndex: 9999,
                    fontWeight: 'bold',
                    animation: 'fadeInUp 0.3s ease-out',
                    textAlign: 'center',
                    minWidth: '300px'
                }}>
                    {toast.message}
                </div>
            )}

            {/* Privacy Policy Modal */}
            {isPrivacyModalOpen && (
                <div className="modal-overlay" onClick={() => setIsPrivacyModalOpen(false)} style={{ zIndex: 3000 }}>
                    <div 
                        className="modal-content fade-in" 
                        onClick={e => e.stopPropagation()} 
                        style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Informativa Privacy</h3>
                            <button onClick={() => setIsPrivacyModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ color: 'var(--color-text)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                            <p>Gentile utente, inserendo la tua email acconsenti al trattamento dei dati personali per le seguenti finalità:</p>
                            <ul style={{ paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                                <li>Ricevere una notifica automatica quando un amministratore risponde alla tua recensione.</li>
                                <li>Il tuo indirizzo email verrà archiviato in modo sicuro nel nostro database.</li>
                                <li><strong>L'indirizzo email non sarà mai reso pubblico</strong> né ceduto a terze parti.</li>
                                <li>Verrà utilizzato esclusivamente per questa specifica comunicazione.</li>
                            </ul>
                            <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Puoi richiedere la cancellazione dei tuoi dati in qualsiasi momento contattando il supporto di Muse Catering.
                            </p>
                        </div>
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', marginTop: '2rem' }}
                            onClick={() => setIsPrivacyModalOpen(false)}
                        >
                            Ho capito
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReviewsPage;
