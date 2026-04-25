import React from 'react';
import { Star, User } from 'lucide-react';

const ReviewCard = ({ review, layout = 'vertical' }) => {
    const { author_name, rating, comment, image_url, created_at } = review;
    
    // Fallback initials for the avatar if no image is provided
    const initials = author_name
        ? author_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    const formattedDate = new Date(created_at).toLocaleDateString('it-IT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const isCarousel = layout === 'carousel';

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
                height: '100%' // Ensure equal height in flex containers
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {image_url ? (
                    <img 
                        src={image_url} 
                        alt={`Foto di ${author_name}`} 
                        style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '50%', 
                            objectFit: 'cover' 
                        }} 
                    />
                ) : (
                    <div 
                        style={{ 
                            width: '50px', 
                            height: '50px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--color-primary-light)', 
                            color: 'var(--color-primary-dark)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                        }}
                    >
                        {initials}
                    </div>
                )}
                <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-text)' }}>{author_name}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{formattedDate}</span>
                </div>
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

            <p style={{ 
                margin: 0, 
                color: 'var(--color-text)', 
                fontSize: '0.95rem', 
                lineHeight: '1.6',
                fontStyle: 'italic',
                flexGrow: 1 // Push everything else up if content is small
            }}>
                "{comment}"
            </p>
        </div>
    );
};

export default ReviewCard;
