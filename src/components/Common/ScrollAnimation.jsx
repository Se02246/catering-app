import React, { useEffect, useRef, useState } from 'react';

const ScrollAnimation = ({ children, className = '', index = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px' // Trigger slightly before it comes into view
            }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, []);

    const style = {
        opacity: isVisible ? 1 : 0,
        animationDelay: isVisible ? `${(index % 5) * 0.1}s` : '0s',
        transition: 'opacity 0.3s ease-out'
    };

    return (
        <div
            ref={elementRef}
            className={`${className} ${isVisible ? 'bounce-in' : ''}`}
            style={style}
        >
            {children}
        </div>
    );
};

export default ScrollAnimation;
