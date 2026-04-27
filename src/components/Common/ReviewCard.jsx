import React, { useState } from 'react';
import { Star } from 'lucide-react';

const ReviewCard = ({ review, layout = 'vertical' }) => {
    const { title, rating, comment, images = [], created_at } = review;
    const [activeImg, setActiveImg] = useState(0);

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
                height: '100%'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>{title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Cliente Anonimo • {formattedDate}</span>
                </div>
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
            </div>

            <p style={{ 
                margin: 0, 
                color: 'var(--color-text)', 
                fontSize: '0.95rem', 
                lineHeight: '1.6',
                fontStyle: 'italic',
                flexGrow: 1,
                whiteSpace: 'pre-line'
            }}>
                "{comment}"
            </p>

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
        </div>
    );
};

export default ReviewCard;
