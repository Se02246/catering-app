import React, { useState, useEffect, useRef } from 'react';
import { Star, ThumbsUp, ThumbsDown, Share2, Loader } from 'lucide-react';
import { api } from '../../services/api';
import { toBlob } from 'html-to-image';

const ReviewCard = ({ review, layout = 'vertical' }) => {
    const { id, title, author_name, rating, comment, images = [], created_at } = review;
    const [activeImg, setActiveImg] = useState(0);
    const [helpfulCount, setHelpfulCount] = useState(review.helpful_count || 0);
    const [unhelpfulCount, setUnhelpfulCount] = useState(review.unhelpful_count || 0);
    const [userVote, setUserVote] = useState(null); // 'helpful', 'unhelpful', or null
    const [isVoting, setIsVoting] = useState(false);
    
    // Admin Share States
    const [isAdmin, setIsAdmin] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const [showShareTemplate, setShowShareTemplate] = useState(false);
    const shareTemplateRef = useRef(null);

    useEffect(() => {
        // Check for admin token
        const token = localStorage.getItem('token');
        setIsAdmin(!!token);

        // Check local storage for existing vote
        const storedVotes = JSON.parse(localStorage.getItem('reviewVotes') || '{}');
        if (storedVotes[id]) {
            setUserVote(storedVotes[id]);
        }
    }, [id]);

    const formattedDate = new Date(created_at).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const isCarousel = layout === 'carousel';

    const handleScroll = (e) => {
        const scrollPosition = e.target.scrollLeft;
        const width = e.target.offsetWidth;
        const newIndex = Math.round(scrollPosition / width);
        if (newIndex !== activeImg) {
            setActiveImg(newIndex);
        }
    };

    const getSharedDynamicFontSize = (reviewText, responseText, hasImages) => {
        const totalLength = (reviewText?.length || 0) + (responseText?.length || 0);
        
        // Reverting to the "perfect" balanced sizes for short reviews
        if (totalLength < 150) return hasImages ? '54px' : '60px';
        if (totalLength < 300) return '50px';
        if (totalLength < 500) return '40px';
        if (totalLength < 800) return '32px';
        return '26px';
    };

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);
        setShowShareTemplate(true);
        
        // Wait for template to render
        setTimeout(async () => {
            if (!shareTemplateRef.current) {
                setIsSharing(false);
                setShowShareTemplate(false);
                return;
            }

            try {
                if (document.fonts && document.fonts.ready) {
                    await document.fonts.ready;
                }

                const blob = await toBlob(shareTemplateRef.current, {
                    width: 1080,
                    height: 1920,
                    pixelRatio: 2, // quality Retina
                    cacheBust: true,
                });

                if (!blob) throw new Error('Failed to generate image blob');

                const file = new File([blob], `recensione-muse-${id}.png`, { type: 'image/png' });

                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'Recensione Muse Catering',
                        text: `Guarda cosa dicono di noi! #MuseCatering`
                    });
                } else {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `recensione-muse-${id}.png`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            } catch (err) {
                console.error('Error sharing review:', err);
                alert('Errore nella generazione dell\'immagine.');
            } finally {
                setIsSharing(false);
                setShowShareTemplate(false);
            }
        }, 600);
    };

    const handleVote = async (type) => {
        if (isVoting) return;
        
        let action = 'add';
        let previousVote = userVote;

        if (userVote === type) {
            action = 'remove';
            setUserVote(null);
            if (type === 'helpful') setHelpfulCount(prev => Math.max(0, prev - 1));
            else setUnhelpfulCount(prev => Math.max(0, prev - 1));
        } else {
            action = 'add';
            setUserVote(type);
            if (type === 'helpful') {
                setHelpfulCount(prev => prev + 1);
                if (previousVote === 'unhelpful') setUnhelpfulCount(prev => Math.max(0, prev - 1));
            } else {
                setUnhelpfulCount(prev => prev + 1);
                if (previousVote === 'helpful') setHelpfulCount(prev => Math.max(0, prev - 1));
            }
        }

        const storedVotes = JSON.parse(localStorage.getItem('reviewVotes') || '{}');
        if (action === 'remove') {
            delete storedVotes[id];
        } else {
            storedVotes[id] = type;
        }
        localStorage.setItem('reviewVotes', JSON.stringify(storedVotes));

        setIsVoting(true);
        try {
            if (previousVote && action === 'add') {
                 await api.voteReview(id, previousVote, 'remove');
            }
            await api.voteReview(id, type, action);
        } catch (error) {
            console.error('Error voting on review:', error);
            setUserVote(previousVote);
            if (action === 'add') {
                if (type === 'helpful') setHelpfulCount(prev => Math.max(0, prev - 1));
                else setUnhelpfulCount(prev => Math.max(0, prev - 1));
                if (previousVote === 'unhelpful') setUnhelpfulCount(prev => prev + 1);
                if (previousVote === 'helpful') setHelpfulCount(prev => prev + 1);
            } else {
                if (type === 'helpful') setHelpfulCount(prev => prev + 1);
                else setUnhelpfulCount(prev => prev + 1);
            }
            if (previousVote) storedVotes[id] = previousVote;
            else delete storedVotes[id];
            localStorage.setItem('reviewVotes', JSON.stringify(storedVotes));
        } finally {
            setIsVoting(false);
        }
    };

    const unifiedFontSize = getSharedDynamicFontSize(comment, review.response, images?.length > 0);

    return (
        <div 
            className="glass-panel" 
            style={{ 
                padding: '1.5rem', 
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                minWidth: isCarousel ? '300px' : '100%',
                maxWidth: isCarousel ? '350px' : '100%',
                scrollSnapAlign: isCarousel ? 'center' : 'none',
                flexShrink: isCarousel ? 0 : 1,
                boxShadow: isCarousel ? 'var(--shadow-sm)' : 'var(--glass-shadow)',
                height: '100%',
                position: 'relative'
            }}
        >
            {/* Share Template (Hidden) */}
            {showShareTemplate && (
                <div style={{ position: 'fixed', left: '-2000px', top: '0', width: '1080px', height: '1920px', overflow: 'hidden', zIndex: -1 }}>
                    <div ref={shareTemplateRef} style={{ width: '1080px', height: '1920px', background: '#FCFAF7', backgroundImage: 'linear-gradient(135deg, #FCFAF7 0%, #F5E6E0 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', boxSizing: 'border-box', position: 'relative' }}>
                        <div style={{ textAlign: 'center', width: '100%', zIndex: 10, position: 'relative', marginBottom: '40px' }}>
                            <h1 style={{ fontFamily: "'Brittany Signature', cursive", fontSize: '180px', color: '#9B393D', margin: 0, fontWeight: 'normal', lineHeight: '1', textShadow: '0 10px 20px rgba(155, 57, 61, 0.1)' }}>MuseCatering</h1>
                        </div>
                        <div style={{ background: 'white', borderRadius: '60px', padding: '60px 50px', width: '95%', maxHeight: '1750px', boxShadow: '0 40px 100px rgba(155, 57, 61, 0.15)', border: '1px solid rgba(155, 57, 61, 0.1)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '40px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', color: '#FFD700', justifyContent: 'center' }}>
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={50} fill={i < rating ? '#FFD700' : 'transparent'} strokeWidth={1.5} />
                                    ))}
                                </div>
                                <h2 style={{ fontSize: '64px', margin: '0 0 10px 0', color: '#7A2D30', fontFamily: 'Outfit, sans-serif', fontWeight: 800, lineHeight: '1.1' }}>{title}</h2>
                                <p style={{ fontSize: '40px', margin: 0, color: '#6B5E5E', fontFamily: 'Nunito, sans-serif', fontWeight: 600 }}>{author_name || 'Utente Anonimo'}</p>
                            </div>
                            <p style={{ fontSize: unifiedFontSize, lineHeight: '1.4', color: '#2D2424', fontStyle: 'italic', margin: 0, fontFamily: 'Nunito, sans-serif', whiteSpace: 'pre-line', textAlign: 'center' }}>{comment}</p>
                            {images && images.length > 0 && (
                                <div style={{ height: '280px', width: '100%', position: 'relative', margin: '30px 0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    {images.slice(0, 4).map((img, idx, arr) => {
                                        const rotations = [-5, 3, -4, 4];
                                        const totalWidth = 880; 
                                        const imgSize = 234; 
                                        const step = arr.length > 1 ? (totalWidth - imgSize) / (arr.length - 1) : 0;
                                        const startX = -(totalWidth - imgSize) / 2;
                                        const xPos = startX + (idx * step);
                                        return (
                                            <div key={idx} style={{ position: 'absolute', width: `${imgSize}px`, height: `${imgSize}px`, borderRadius: '22px', padding: '5px', background: 'white', transform: `translateX(${xPos}px) rotate(${rotations[idx % 4]}deg)`, zIndex: idx + 1, overflow: 'hidden', boxShadow: '0 12px 35px rgba(0,0,0,0.16)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                <img src={img} crossOrigin="anonymous" alt="Review detail" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            {review.response && (
                                <div style={{ marginTop: '10px', padding: '40px 35px', background: 'rgba(155, 57, 61, 0.04)', borderRadius: '40px', borderLeft: '12px solid #9B393D' }}>
                                    <span style={{ display: 'block', fontSize: '32px', fontWeight: 800, color: '#9B393D', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '4px', fontFamily: 'Outfit, sans-serif' }}>La nostra risposta:</span>
                                    <p style={{ fontSize: unifiedFontSize, lineHeight: '1.4', color: '#2D2424', margin: 0, fontFamily: 'Nunito, sans-serif', whiteSpace: 'pre-line' }}>{review.response}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>{title}</h4>
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text)', display: 'block', marginTop: '4px', fontWeight: '500' }}>{author_name || 'Utente Anonimo'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>{formattedDate}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '2px', color: '#FFD700' }}>
                        {[...Array(5)].map((_, i) => (
                            <Star 
                                key={i} 
                                size={16} 
                                fill={i < rating ? '#FFD700' : 'transparent'} 
                                color={i < rating ? '#FFD700' : 'var(--color-border)'} 
                            />
                        ))}
                    </div>
                    {isAdmin && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleShare(); }}
                            disabled={isSharing}
                            style={{
                                background: 'rgba(var(--color-accent-rgb, 197, 160, 89), 0.1)',
                                color: 'var(--color-accent, #C5A059)',
                                border: 'none',
                                padding: '6px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            title="Condividi recensione"
                        >
                            {isSharing ? <Loader className="animate-spin" size={16} /> : <Share2 size={16} />}
                        </button>
                    )}
                </div>
            </div>

            {comment && (
                <p style={{ 
                    margin: 0, 
                    color: 'var(--color-text)', 
                    fontSize: '0.95rem', 
                    lineHeight: '1.6',
                    fontStyle: 'italic',
                    flexGrow: 1,
                    whiteSpace: 'pre-line'
                }}>
                    {comment}
                </p>
            )}

            {images && images.length > 0 && (
                <div style={{ position: 'relative', marginTop: '0.5rem', borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/5' }}>
                    <div 
                        onScroll={handleScroll}
                        style={{
                            display: 'flex',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            scrollSnapType: 'x mandatory',
                            width: '100%',
                            height: '100%',
                            scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}
                        className="no-scrollbar"
                    >
                        {images.map((img, idx) => (
                            <div key={idx} style={{ minWidth: '100%', height: '100%', scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
                                <img 
                                    src={img} 
                                    alt={`Servizio Muse Catering ${idx + 1}`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </div>
                        ))}
                    </div>

                    {images.length > 1 && (
                        <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.3)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', pointerEvents: 'none' }}>
                            {activeImg + 1} / {images.length}
                        </div>
                    )}
                </div>
            )}
            {review.response && (
                <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                    <h5 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                        Risposta di Muse Catering:
                    </h5>
                    <p style={{ 
                        margin: 0, 
                        color: 'var(--color-text)', 
                        fontSize: '0.9rem', 
                        lineHeight: '1.5',
                        fontStyle: 'italic',
                        whiteSpace: 'pre-line'
                    }}>
                        {review.response}
                    </p>
                </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid rgba(155, 57, 61, 0.05)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>Questa recensione è stata utile?</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                        onClick={() => handleVote('helpful')}
                        disabled={isVoting}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '4px', 
                            background: userVote === 'helpful' ? 'rgba(155, 57, 61, 0.1)' : 'transparent',
                            color: userVote === 'helpful' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            border: '1px solid',
                            borderColor: userVote === 'helpful' ? 'var(--color-primary)' : 'transparent',
                            borderRadius: '16px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ThumbsUp size={14} fill={userVote === 'helpful' ? 'var(--color-primary)' : 'transparent'} />
                        {helpfulCount > 0 && <span>{helpfulCount}</span>}
                    </button>
                    <button 
                        onClick={() => handleVote('unhelpful')}
                        disabled={isVoting}
                        style={{ 
                            display: 'flex', alignItems: 'center', gap: '4px', 
                            background: userVote === 'unhelpful' ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                            color: userVote === 'unhelpful' ? '#666' : 'var(--color-text-muted)',
                            border: '1px solid',
                            borderColor: userVote === 'unhelpful' ? '#666' : 'transparent',
                            borderRadius: '16px', padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <ThumbsDown size={14} fill={userVote === 'unhelpful' ? '#666' : 'transparent'} />
                        {unhelpfulCount > 0 && <span>{unhelpfulCount}</span>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewCard;
