import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

const ScrollToTopFab = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isCartVisible, setIsCartVisible] = useState(false);
    const location = useLocation();
    const isQuotePage = location.pathname === '/quote';
    const isAdminPage = location.pathname.startsWith('/admin');

    // Show button when page is scrolled down
    const toggleVisibility = () => {
        if (isAdminPage) {
            setIsVisible(false);
            return;
        }

        if (window.pageYOffset > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }

        // Check if mobile cart FAB is present and visible in the DOM
        if (isQuotePage) {
            const cartFab = document.getElementById('mobile-cart-fab');
            if (cartFab) {
                const style = window.getComputedStyle(cartFab);
                const isPresent = style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
                setIsCartVisible(isPresent);
            } else {
                setIsCartVisible(false);
            }
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
        // Also check on mount/location change
        toggleVisibility();
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, [location.pathname]);

    return (
        <div 
            className={`scroll-to-top ${isVisible ? 'visible' : ''}`}
            style={{
                position: 'fixed',
                bottom: (isQuotePage && isCartVisible) ? '8.5rem' : '2rem',
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
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    boxShadow: '0 4px 15px rgba(155, 57, 61, 0.4)',
                    border: 'none',
                    cursor: 'pointer'
                }}
                aria-label="Torna in alto"
            >
                <ArrowUp size={32} />
            </button>
        </div>
    );
};

export default ScrollToTopFab;
