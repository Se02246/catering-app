
import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

const ReviewCard = ({ review, layout = 'vertical' }) => {
    const { author_name, rating, comment, images = [], created_at } = review;
    const [activeImg, setActiveImg] = useState(0);

    const formattedDate = new Date(created_at).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const isCarousel = layout === 'carousel';

    const nextImg = (e) => {
        e.stopPropagation();
        setActiveImg((prev) => (prev + 1) % images.length);
    };

    const prevImg = (e) => {
        e.stopPropagation();
        setActiveImg((prev) => (prev - 1 + images.length) % images.length);
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
                boxShadow: 'var(--shadow-sm)',
                height: '100%'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>{author_name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formattedDate}</span>
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
                flexGrow: 1
            }}>
                "{comment}"
            </p>

            {images && images.length > 0 && (
                <div style={{ position: 'relative', marginTop: '0.5rem', borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3' }}>
                    <img 
                        src={images[activeImg]} 
                        alt={`Servizio Muse Catering ${activeImg + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {images.length > 1 && (
                        <>
                            <button 
                                onClick={prevImg}
                                style={{ position: 'absolute', left: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={nextImg}
                                style={{ position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.7)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <ChevronRight size={16} />
                            </button>
                            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.3)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem' }}>
                                {activeImg + 1} / {images.length}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReviewCard;
