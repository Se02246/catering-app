import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

const ScrollToTopFab = () => {
    const [isVisible, setIsVisible] = useState(false);
    const location = useLocation();
    const isQuotePage = location.pathname === '/quote';

    // Show button when page is scrolled down
    const toggleVisibility = () => {
        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    useEffect(() => {
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    return (
        <div 
            className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
            style={{
                position: 'fixed',
                bottom: isQuotePage ? '7.5rem' : '2rem',
                right: '2rem',
                zIndex: 2000,
                opacity: isVisible ? 1 : 0,
                visibility: isVisible ? 'visible' : 'hidden',
                transition: 'all 0.3s ease-in-out',
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)'
            }}
        >
            <button
                onClick={scrollToTop}
                className="btn btn-primary"
                style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    boxShadow: '0 4px 12px rgba(155, 57, 61, 0.3)',
                    border: 'none',
                    cursor: 'pointer'
                }}
                aria-label="Torna in alto"
            >
                <ArrowUp size={24} />
            </button>
        </div>
    );
};

export default ScrollToTopFab;
