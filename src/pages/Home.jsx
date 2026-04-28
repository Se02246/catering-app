import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaterings, useSetting, useReviews, useProducts } from '../hooks/useData';
import Header from '../components/Layout/Header';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';
import ReviewCard from '../components/Common/ReviewCard';
import { formatCustomText } from '../utils/textFormatting';
import { ChevronRight, ChevronLeft, Calendar, Info, ArrowRight, FileText, MessageSquare, Star, MapPin, Send, Sparkles, Instagram, MessageCircle } from 'lucide-react';

const PackageCard = ({ pkg, index, openPackage }) => {
    const cardRef = React.useRef(null);
    const [isInView, setIsInView] = React.useState(false);
    const [isHovered, setIsHovered] = React.useState(false);
    const [currentImgIndex, setCurrentImgIndex] = React.useState(0);
    const [prevImgIndex, setPrevImgIndex] = React.useState(null);
    const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        if (!isMobile) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            { threshold: 0.6 }
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => {
            if (cardRef.current) observer.unobserve(cardRef.current);
        };
    }, [isMobile]);

    React.useEffect(() => {
        let timer;
        let interval;
        const shouldAnimate = (isMobile && isInView) || (!isMobile && isHovered);

        if (shouldAnimate && pkg.images && pkg.images.length > 1) {
            timer = setTimeout(() => {
                interval = setInterval(() => {
                    setCurrentImgIndex(prev => {
                        setPrevImgIndex(prev);
                        return (prev + 1) % pkg.images.length;
                    });
                }, 2000);
            }, 2000);
        } else {
            setPrevImgIndex(null);
            setCurrentImgIndex(0);
        }
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [isMobile, isInView, isHovered, pkg.images]);

    const imagesToUse = pkg.images && pkg.images.length > 0 ? pkg.images : [pkg.image_url || 'https://placehold.co/600x400?text=Muse+Catering'];

    return (
        <div
            ref={cardRef}
            className="premium-card fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {pkg.hide_at && (
                <div className="package-badge">
                    <Calendar size={14} /> Disponibile fino al {new Date(pkg.hide_at).toLocaleDateString('it-IT')}
                </div>
            )}

            <div className="image-wrapper" onClick={() => openPackage(pkg)} style={{ cursor: 'pointer', position: 'relative' }}>
                {imagesToUse.map((img, i) => (
                    <img
                        key={i}
                        src={img}
                        alt={pkg.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: currentImgIndex === i ? 'opacity 1s ease-in-out, transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)' : 'none',
                            opacity: (currentImgIndex === i || prevImgIndex === i) ? 1 : 0,
                            position: i === 0 ? 'relative' : 'absolute',
                            top: 0,
                            left: 0,
                            zIndex: currentImgIndex === i ? 2 : (prevImgIndex === i ? 1 : 0)
                        }}
                        className="card-hover-img"
                    />
                ))}
            </div>

            <div className="card-body">
                <div className="dietary-badges" style={{ marginBottom: '1rem' }}>
                    {pkg.is_gluten_free && <span className="badge-elegant badge-elegant-gf">Senza Glutine</span>}
                    {pkg.is_lactose_free && <span className="badge-elegant badge-elegant-lf">Senza Lattosio</span>}
                </div>

                <h3 className="card-title">{pkg.name}</h3>

                <div
                    className="card-text"
                    dangerouslySetInnerHTML={{ __html: formatCustomText(pkg.description) }}
                />

                <div className="card-footer">
                    <div className="price-container">
                        {pkg.discount_percentage > 0 ? (
                            <>
                                <span className="price-old">€ {pkg.total_price}</span>
                                <span className="price-main price-discount">
                                    € {(pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)}
                                </span>
                            </>
                        ) : (
                            <span className="price-main">€ {pkg.total_price}</span>
                        )}
                    </div>
                    <button className="btn btn-primary" onClick={() => openPackage(pkg)}>
                        Scopri di più <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfiniteReviewsCarousel = ({ reviews }) => {
    const [isPaused, setIsPaused] = React.useState(false);
    const carouselRef = React.useRef(null);
    const pauseTimeoutRef = React.useRef(null);
    const isScrollingRef = React.useRef(false);
    const scrollEndTimeoutRef = React.useRef(null);

    const displayReviews = reviews.slice(0, 20);

    // Use 7 sets to create huge buffers. Sets are 0, 1, 2, 3, 4, 5, 6.
    // We will keep the user looping between Sets 2, 3, and 4.
    // They will never see Set 0 (left padding) or Set 6 (right padding).
    const MULTIPLIER = 7;
    const CENTER_SET_INDEX = 3;
    const repeatedReviews = Array(MULTIPLIER).fill(displayReviews).flat();

    const getSetWidth = () => {
        if (!carouselRef.current) return 0;
        const container = carouselRef.current;
        const firstCard = container.children[0];
        if (!firstCard) return 0;
        const cardWidth = firstCard.offsetWidth;
        const gap = parseFloat(window.getComputedStyle(container).gap) || 24;
        return (cardWidth + gap) * displayReviews.length;
    };

    React.useEffect(() => {
        if (carouselRef.current && displayReviews.length > 0) {
            const initScroll = () => {
                const singleSetWidth = getSetWidth();
                if (singleSetWidth > 0) {
                    const container = carouselRef.current;
                    container.style.scrollSnapType = 'none';
                    // Start exactly at the beginning of the center set (Set 3)
                    container.scrollLeft = singleSetWidth * CENTER_SET_INDEX;
                    void container.offsetWidth;
                    container.style.scrollSnapType = 'x mandatory';
                    return true;
                }
                return false;
            };

            // Try to initialize scroll. If elements aren't rendered with width yet, wait a bit.
            if (!initScroll()) {
                const intervalId = setInterval(() => {
                    if (initScroll()) clearInterval(intervalId);
                }, 100);
                setTimeout(() => clearInterval(intervalId), 2000); // Stop trying after 2s
            }
        }
    }, [displayReviews.length]);

    const handleInteraction = () => {
        setIsPaused(true);
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => {
            setIsPaused(false);
        }, 8000);
    };

    React.useEffect(() => {
        if (isPaused || displayReviews.length === 0) return;

        const interval = setInterval(() => {
            if (carouselRef.current && !isScrollingRef.current) {
                const container = carouselRef.current;
                const firstCard = container.children[0];
                const cardWidth = firstCard?.offsetWidth || 300;
                const gap = parseFloat(window.getComputedStyle(container).gap) || 24;

                container.scrollBy({ left: cardWidth + gap, behavior: 'smooth' });
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isPaused, displayReviews.length]);

    const handleScroll = () => {
        if (!carouselRef.current || displayReviews.length === 0) return;

        isScrollingRef.current = true;
        const container = carouselRef.current;
        const singleSetWidth = getSetWidth();
        if (singleSetWidth === 0) return;

        if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);

        scrollEndTimeoutRef.current = setTimeout(() => {
            isScrollingRef.current = false;

            const currentScroll = container.scrollLeft;

            // If user scrolled left into Set 1 (or earlier)
            if (currentScroll < singleSetWidth * 2) {
                container.style.scrollSnapType = 'none';
                // Jump forward 2 sets back into the safe zone
                container.scrollLeft += singleSetWidth * 2;
                void container.offsetWidth;
                container.style.scrollSnapType = 'x mandatory';
            }
            // If user scrolled right into Set 5 (or later)
            else if (currentScroll > singleSetWidth * 5) {
                container.style.scrollSnapType = 'none';
                // Jump backward 2 sets back into the safe zone
                container.scrollLeft -= singleSetWidth * 2;
                void container.offsetWidth;
                container.style.scrollSnapType = 'x mandatory';
            }
        }, 150);
    };

    return (
        <div
            ref={carouselRef}
            onScroll={handleScroll}
            onTouchStart={handleInteraction}
            onMouseDown={handleInteraction}
            onWheel={handleInteraction}
            style={{
                display: 'flex',
                gap: '1.5rem',
                overflowX: 'auto',
                scrollSnapType: 'x mandatory',
                paddingBottom: '1rem',
                paddingLeft: 'calc(50% - 160px)',
                paddingRight: 'calc(50% - 160px)',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch',
                alignItems: 'stretch'
            }}
            className="no-scrollbar"
        >
            {repeatedReviews.map((review, index) => (
                <div key={`${review.id}-${index}`} style={{ scrollSnapAlign: 'center', scrollSnapStop: 'always', flexShrink: 0, display: 'flex' }}>
                    <ReviewCard review={review} layout="carousel" />
                </div>
            ))}
        </div>
    );
};

const InfiniteProductCarousel = ({ products, openProduct }) => {
    const carouselRef = React.useRef(null);
    const [isPaused, setIsPaused] = React.useState(false);
    const animationRef = React.useRef(null);
    const isInteractingRef = React.useRef(false);
    const pauseTimeoutRef = React.useRef(null);
    const fractionalScrollRef = React.useRef(0);

    const displayProducts = React.useMemo(() => {
        if (!products) return [];
        return products.filter(p => p.image_url && !p.hidden_in_menu && !p.hide_in_menu);
    }, [products]);

    // Use 20 sets to create a huge buffer.
    const MULTIPLIER = 20;
    const repeatedProducts = React.useMemo(() => {
        if (displayProducts.length === 0) return [];
        return Array(MULTIPLIER).fill(displayProducts).flat();
    }, [displayProducts]);

    const getSetWidth = React.useCallback(() => {
        if (!carouselRef.current || displayProducts.length === 0) return 0;
        const container = carouselRef.current;
        const firstItemSet0 = container.children[0];
        const firstItemSet1 = container.children[displayProducts.length];

        if (firstItemSet0 && firstItemSet1) {
            return firstItemSet1.offsetLeft - firstItemSet0.offsetLeft;
        }
        return 0;
    }, [displayProducts.length]);

    React.useEffect(() => {
        if (!carouselRef.current || displayProducts.length === 0) return;

        const initScroll = () => {
            const setWidth = getSetWidth();
            if (setWidth > 0) {
                // Jump to the 10th set (middle of 20 sets)
                carouselRef.current.scrollLeft = setWidth * 10;
                return true;
            }
            return false;
        };

        if (!initScroll()) {
            const interval = setInterval(() => {
                if (initScroll()) clearInterval(interval);
            }, 100);
            setTimeout(() => clearInterval(interval), 2000);
        }
    }, [displayProducts.length, getSetWidth]);

    React.useEffect(() => {
        if (!carouselRef.current || displayProducts.length === 0) return;

        let lastTime = performance.now();
        const pixelsPerSecond = 40; // Auto-scroll speed

        const animateScroll = (time) => {
            const deltaTime = time - lastTime;
            lastTime = time;

            if (!isPaused && !isInteractingRef.current && carouselRef.current) {
                const container = carouselRef.current;

                fractionalScrollRef.current += (pixelsPerSecond * deltaTime) / 1000;

                if (fractionalScrollRef.current >= 1) {
                    const pixelsToScroll = Math.floor(fractionalScrollRef.current);
                    container.scrollLeft += pixelsToScroll;
                    fractionalScrollRef.current -= pixelsToScroll;
                }
            }

            // 3D Depth Effect
            if (carouselRef.current) {
                const container = carouselRef.current;
                const containerRect = container.getBoundingClientRect();
                const centerOfViewport = containerRect.left + containerRect.width / 2;
                const scrollLeft = container.scrollLeft;
                const containerOffsetLeft = containerRect.left - scrollLeft;

                const children = container.children;
                const transforms = [];
                const zIndices = [];

                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    const childCenter = containerOffsetLeft + child.offsetLeft + child.offsetWidth / 2;

                    const dist = childCenter - centerOfViewport;
                    const M = window.innerWidth / 2 + 150;
                    const nd = Math.max(-1, Math.min(1, dist / M));

                    const scaleFactor = Math.cos(nd * Math.PI / 2);
                    const scale = 0.65 + 0.65 * scaleFactor;

                    const maxPush = 120;
                    const translateX = Math.sin(nd * Math.PI / 2) * maxPush;

                    const baseRotate = child.dataset.rotate || 0;
                    const baseTranslateY = parseFloat(child.dataset.translatey || 0);
                    const baseZIndex = parseInt(child.dataset.zindex || 0);

                    const zIndex = baseZIndex + Math.round(100 * scaleFactor);

                    // Floating effect
                    const floatSpeed = 0.002;
                    const floatAmplitude = 12; // pixels up and down
                    const floatOffset = Math.sin(time * floatSpeed + i * 0.5) * floatAmplitude;
                    const finalTranslateY = baseTranslateY + floatOffset;

                    transforms.push(`translateX(${translateX}px) scale(${scale}) rotate(${baseRotate}deg) translateY(${finalTranslateY}px)`);
                    zIndices.push(zIndex);
                }

                for (let i = 0; i < children.length; i++) {
                    children[i].style.transform = transforms[i];
                    children[i].style.zIndex = zIndices[i];
                }
            }

            animationRef.current = requestAnimationFrame(animateScroll);
        };

        animationRef.current = requestAnimationFrame(animateScroll);

        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [isPaused, displayProducts.length]);

    const handleScroll = () => {
        if (!carouselRef.current || displayProducts.length === 0) return;

        const container = carouselRef.current;
        const setWidth = getSetWidth();
        if (setWidth === 0) return;

        const currentScroll = container.scrollLeft;

        // Seamless loop jump
        // If scrolled before set 5, jump forward by 10 sets
        if (currentScroll < setWidth * 5) {
            container.scrollLeft += setWidth * 10;
        }
        // If scrolled past set 15, jump backward by 10 sets
        else if (currentScroll > setWidth * 15) {
            container.scrollLeft -= setWidth * 10;
        }
    };

    const handleInteractionStart = () => {
        isInteractingRef.current = true;
        setIsPaused(true);
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };

    const handleInteractionEnd = () => {
        isInteractingRef.current = false;
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => {
            setIsPaused(false);
        }, 2000);
    };

    if (!displayProducts || displayProducts.length === 0) return null;

    return (
        <div style={{
            marginTop: '3.5rem',
            marginBottom: '-1rem',
            marginRight: '-3rem',
            marginLeft: '-3rem',
            padding: '1rem 0'
        }}>
            <style>{`
                .product-marquee-container {
                    display: flex;
                    position: relative;
                    overflow-x: auto;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                    padding: 40px 0; /* Increased padding to prevent clipping when scaled up */
                    align-items: center;
                    /* For smooth touch scrolling on iOS */
                    -webkit-overflow-scrolling: touch;
                }
                .product-marquee-container::-webkit-scrollbar {
                    display: none;
                }
                .product-marquee-item {
                    flex-shrink: 0;
                    margin: 0 5px;
                    cursor: pointer;
                    position: relative;
                }
                .product-marquee-item:hover {
                    z-index: 1000 !important;
                }
                .product-marquee-item img {
                    width: 160px;
                    height: 160px;
                    border-radius: 20px;
                    object-fit: cover;
                    box-shadow: 0 6px 16px rgba(0,0,0,0.2);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .product-marquee-item:hover img {
                    transform: scale(1.15);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.4);
                }
                @media (max-width: 768px) {
                    .product-marquee-item img {
                        width: 120px;
                        height: 120px;
                    }
                }
            `}</style>

            <div
                ref={carouselRef}
                className="product-marquee-container"
                onScroll={handleScroll}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onWheel={() => {
                    handleInteractionStart();
                    handleInteractionEnd();
                }}
            >
                {repeatedProducts.map((prod, index) => {
                    const rotation = (index % 5 === 0) ? -12 :
                        (index % 5 === 1) ? 8 :
                            (index % 5 === 2) ? -6 :
                                (index % 5 === 3) ? 14 : -8;

                    const topOffset = (index % 3 === 0) ? -10 :
                        (index % 3 === 1) ? 10 : 0;

                    const baseZIndex = index % 5;

                    return (
                        <div
                            key={`${prod.id}-${index}`}
                            className="product-marquee-item"
                            data-rotate={rotation}
                            data-translatey={topOffset}
                            data-zindex={baseZIndex}
                            onClick={() => openProduct(prod)}
                        >
                            <img src={prod.image_url} alt={prod.name} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const Home = () => {
    const navigate = useNavigate();
    const { caterings, isLoading, isError } = useCaterings();
    const { setting: showQuoteSetting, isLoading: isQuoteSettingLoading } = useSetting('show_quote_builder');
    const { reviews, isLoading: isReviewsLoading } = useReviews();
    const { products } = useProducts();

    const [homeAiPrompt, setHomeAiPrompt] = useState('');

    const showQuoteBuilder = !isQuoteSettingLoading && showQuoteSetting?.value !== 'false';

    // Statistics for Reviews Summary
    const stats = React.useMemo(() => {
        if (!reviews || reviews.length === 0) return null;

        const total = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = (sum / total).toFixed(1);

        const recommendedCount = reviews.filter(r => r.rating >= 4).length;
        const rate = Math.round((recommendedCount / total) * 100);

        return {
            averageRating: avg,
            totalReviews: total,
            recommendationRate: rate
        };
    }, [reviews]);

    const getRatingLabel = (rating) => {
        const r = parseFloat(rating);
        if (r >= 4.5) return 'Eccellente';
        if (r >= 4.0) return 'Molto buono';
        if (r >= 3.0) return 'Buono';
        return 'Sufficiente';
    };

    const [selectedPackage, setSelectedPackage] = React.useState(null);
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [isPackageClosing, setIsPackageClosing] = React.useState(false);
    const [isProductClosing, setIsProductClosing] = React.useState(false);

    // Swipe to close logic for Package Modal
    const [packageDragY, setPackageDragY] = React.useState(0);
    const [isPackageDragging, setIsPackageDragging] = React.useState(false);
    const [isPackageSwipingOut, setIsPackageSwipingOut] = React.useState(false);
    const packageTouchStartY = React.useRef(0);
    const packageTouchStartX = React.useRef(0);
    const packageScrollAreaRef = React.useRef(null);

    const handlePackageTouchStart = (e) => {
        if (packageScrollAreaRef.current && packageScrollAreaRef.current.scrollTop <= 0) {
            packageTouchStartY.current = e.touches[0].clientY;
            packageTouchStartX.current = e.touches[0].clientX;
        }
    };

    const handlePackageTouchMove = (e) => {
        const currentY = e.touches[0].clientY;
        const currentX = e.touches[0].clientX;
        const deltaY = currentY - packageTouchStartY.current;
        const deltaX = Math.abs(currentX - packageTouchStartX.current);

        if (!isPackageDragging) {
            // Only start dragging if moving DOWN, at top, and movement is more VERTICAL than horizontal
            if (deltaY > 10 && deltaY > deltaX && packageScrollAreaRef.current && packageScrollAreaRef.current.scrollTop <= 0) {
                setIsPackageDragging(true);
            }
            return;
        }

        if (deltaY > 0) {
            setPackageDragY(deltaY);
            if (e.cancelable) e.preventDefault();
        } else {
            setPackageDragY(0);
            setIsPackageDragging(false);
        }
    };

    const handlePackageTouchEnd = () => {
        if (!isPackageDragging) return;
        if (packageDragY > 150) {
            // "Throw" it down
            setIsPackageSwipingOut(true);
            setPackageDragY(window.innerHeight);
            setTimeout(closePackage, 300);
        } else {
            setPackageDragY(0);
        }
        setIsPackageDragging(false);
    };

    const processedCaterings = React.useMemo(() => {
        const now = new Date();
        return caterings
            .filter(pkg => {
                const isVisible = pkg.is_visible !== false;
                const isNotExpired = !pkg.hide_at || new Date(pkg.hide_at) > now;
                return isVisible && isNotExpired;
            })
            .map(pkg => ({
                ...pkg,
                images: pkg.images || (pkg.image_url ? [pkg.image_url] : [])
            }));
    }, [caterings]);

    React.useEffect(() => {
        if (selectedPackage || selectedProduct) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedPackage, selectedProduct]);

    React.useEffect(() => {
        const handlePopState = () => {
            if (selectedProduct) {
                setIsProductClosing(true);
                setTimeout(() => {
                    setSelectedProduct(null);
                    setIsProductClosing(false);
                }, 500);
            } else if (selectedPackage) {
                setIsPackageClosing(true);
                setTimeout(() => {
                    setSelectedPackage(null);
                    setIsPackageClosing(false);
                    setIsPackageSwipingOut(false);
                }, 500);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedPackage, selectedProduct]);

    const [activeImageIndex, setActiveImageIndex] = React.useState(0);

    const handleGalleryScroll = (e) => {
        const scrollPosition = e.target.scrollLeft;
        const width = e.target.offsetWidth;
        const newIndex = Math.round(scrollPosition / width);
        if (newIndex !== activeImageIndex) {
            setActiveImageIndex(newIndex);
        }
    };

    // Reset index when opening/closing
    React.useEffect(() => {
        if (!selectedPackage) setActiveImageIndex(0);
    }, [selectedPackage]);

    const openPackage = (pkg) => {
        setPackageDragY(0);
        setIsPackageDragging(false);
        setIsPackageSwipingOut(false);
        window.history.pushState({ modal: 'package' }, '');
        setSelectedPackage(pkg);
    };

    const closePackage = () => {
        window.history.back();
    };

    const openProduct = (prod) => {
        setPackageDragY(0); // Reset also here just in case
        window.history.pushState({ modal: 'product' }, '');
        setSelectedProduct(prod);
    };

    const closeProduct = () => {
        window.history.back();
    };

    const handleBookPackage = async (pkg) => {
        const url = `${window.location.origin}/package/${pkg.id}`;
        const phoneNumber = "393495416637";
        const message = `Ciao Barbara, sono interessato al pacchetto "${pkg.name}". Puoi vedere i dettagli qui:\n\n${url}`;
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const contactWhatsApp = () => {
        const phoneNumber = "393495416637";
        const message = "Ciao Barbara, vorrei avere maggiori informazioni sui vostri servizi di catering.";
        window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleHomeAiSubmit = () => {
        if (!homeAiPrompt.trim()) return;
        navigate('/quote', { state: { initialAiPrompt: homeAiPrompt } });
        window.scrollTo(0, 0);
    };

    return (
        <div className="container fade-in" style={{ paddingBottom: '5rem' }}>
            <Header />

            <section id="packages">
                <div className="section-header">
                    <h2>I Nostri Pacchetti</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        Selezioni curate per rendere ogni tuo evento indimenticabile.
                    </p>
                </div>

                {isLoading && (
                    <div style={{ textAlign: 'center', padding: '5rem 0' }}>
                        <div className="animate-float" style={{ fontSize: '1.1rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                            Curando i dettagli per te...
                        </div>
                    </div>
                )}

                {isError && (
                    <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', margin: '2rem auto', maxWidth: '500px' }}>
                        <Info size={40} color="var(--color-primary)" style={{ marginBottom: '1rem' }} />
                        <p style={{ color: 'var(--color-text)', fontWeight: 600 }}>Non siamo riusciti a caricare le proposte.</p>
                        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => window.location.reload()}>Riprova</button>
                    </div>
                )}

                {!isLoading && !isError && (
                    <div className="grid-responsive">
                        {processedCaterings.length === 0 ? (
                            <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '4rem' }}>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>
                                    Al momento non ci sono pacchetti disponibili. Torna a trovarci presto!
                                </p>
                            </div>
                        ) : (
                            processedCaterings.map((pkg, index) => (
                                <PackageCard key={pkg.id} pkg={pkg} index={index} openPackage={openPackage} />
                            ))
                        )}
                    </div>
                )}
            </section>

            {showQuoteBuilder && (
                <section id="quote-section" style={{ marginTop: '3rem' }}>
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,245,245,0.8) 100%)' }}>
                        <h2 style={{ color: 'var(--color-primary-dark)', marginBottom: '0.5rem', fontSize: '1.5rem' }}>Non trovi quello che cerchi?</h2>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
                            Crea il tuo preventivo personalizzato scegliendo i singoli prodotti dal nostro catalogo.
                        </p>
                        <button
                            className="btn btn-primary"
                            style={{ padding: '0.8rem 2rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}
                            onClick={() => {
                                navigate('/quote');
                                window.scrollTo(0, 0);
                            }}
                        >
                            Crealo!
                        </button>

                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
                                <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(155, 57, 61, 0.2)' }}></div>
                                <h3 style={{ margin: 0, color: 'var(--color-primary-dark)', fontSize: '1.1rem' }}>oppure crealo con l'IA</h3>
                                <div style={{ height: '1px', flex: 1, backgroundColor: 'rgba(155, 57, 61, 0.2)' }}></div>
                            </div>

                            <div style={{ position: 'relative', width: '100%', textAlign: 'left' }}>
                                <textarea
                                    value={homeAiPrompt}
                                    onChange={(e) => setHomeAiPrompt(e.target.value)}
                                    placeholder="Descrivi qui l'evento e cosa desideri (es. 'Festa per 20 persone con opzioni senza glutine')..."
                                    style={{
                                        width: '100%',
                                        padding: '1.5rem 4.5rem 1.5rem 1.5rem',
                                        borderRadius: '24px',
                                        border: '2px solid rgba(155, 57, 61, 0.1)',
                                        background: 'var(--color-bg)',
                                        fontSize: '1rem',
                                        minHeight: '120px',
                                        resize: 'vertical',
                                        fontFamily: 'inherit',
                                        outline: 'none',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
                                        transition: 'border-color 0.3s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(155, 57, 61, 0.1)'}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleHomeAiSubmit}
                                    disabled={!homeAiPrompt.trim()}
                                    style={{
                                        position: 'absolute',
                                        bottom: '1rem',
                                        right: '1rem',
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: 0,
                                        boxShadow: 'var(--shadow-md)',
                                        transition: 'all 0.3s'
                                    }}
                                    title="Genera Preventivo"
                                >
                                    <Send size={20} style={{ marginLeft: '-2px', marginTop: '2px' }} />
                                </button>
                            </div>
                        </div>

                        <InfiniteProductCarousel products={products} openProduct={openProduct} />
                    </div>
                </section>
            )}

            {/* Reviews Section */}
            <section id="reviews" style={{ marginTop: '5rem' }}>
                <div className="section-header">
                    <h2>Dicono di noi</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        Le esperienze di chi ha già scelto i nostri servizi.
                    </p>

                    {!isReviewsLoading && stats && (
                        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <Star size={24} fill="#FFD700" color="#FFD700" />
                                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text)' }}>{stats.averageRating}</span>
                                </div>
                                <div style={{ fontSize: '1rem', color: 'var(--color-text)' }}>
                                    <span style={{ fontWeight: '600' }}>{getRatingLabel(stats.averageRating)}</span>
                                    <span style={{ margin: '0 0.4rem', color: 'var(--color-text-muted)' }}>·</span>
                                    <span style={{ color: 'var(--color-text-muted)' }}>{stats.totalReviews} Recensioni</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isReviewsLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <div className="animate-pulse" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Caricamento recensioni...</div>
                    </div>
                ) : (
                    <>
                        {reviews && reviews.length > 0 ? (
                            <InfiniteReviewsCarousel reviews={reviews} />
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                <p>Non ci sono ancora recensioni. Torna a trovarci presto!</p>
                            </div>
                        )}

                        <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                            <button
                                className="btn btn-outline"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', width: 'fit-content' }}
                                onClick={() => navigate('/recensioni')}
                            >
                                <Star size={18} /> Leggi tutte le recensioni
                            </button>
                        </div>
                    </>
                )}
            </section>

            {/* Chi Siamo Section */}
            <section id="chi-siamo" style={{ marginTop: '5rem', marginBottom: '3rem' }}>
                <div className="section-header">
                    <h2>Chi e Dove siamo</h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                        La nostra storia e dove trovarci per rendere speciale il tuo evento.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                    {/* Card 1: La mia storia */}
                    <div className="premium-card fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary-dark)' }}>
                            <Info size={28} />
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>La Mia Storia</h3>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                            Mi chiamo Barbara, e la cucina è sempre stata parte della mia vita. Crescendo in una famiglia che adorava riunirsi attorno ai fornelli, ho imparato che il cibo non è solo nutrimento, ma un modo per creare legami e regalare emozioni. Negli anni, ho trasformato questa passione in una vera e propria arte, dedicandomi alla preparazione di torte per compleanni, catering di dolci e salati, e tante altre creazioni su misura. Oggi, con grande entusiasmo, ho deciso di aprire le porte della mia cucina al pubblico, offrendo le mie specialità a chi ama scoprire il sapore genuino delle cose fatte in casa.
                        </p>
                    </div>

                    {/* Card 2: Dove siamo */}
                    <div className="premium-card fade-in" style={{ display: 'flex', flexDirection: 'column', animationDelay: '0.1s', overflow: 'hidden' }}>
                        <a
                            href="https://www.google.com/maps/place/08020+Irgoli+NU/@40.4106048,9.6310529,15z/data=!3m1!4b1!4m6!3m5!1s0x12deede3d3e26b93:0x7986762e93de8660!8m2!3d40.4088282!4d9.6302764!16zL20vMGdxdm1j!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDQyMi4wIKXMDSoASAFQAw%3D%3D"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'block', height: '350px' }}
                        >
                            <img
                                src="/where.jpeg"
                                alt="Dove Siamo - Servizio a domicilio"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', flexShrink: 0, transition: 'transform 0.3s ease' }}
                                className="card-hover-img"
                            />
                        </a>
                        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary-dark)' }}>
                                <MapPin size={28} />
                                <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Dove Siamo</h3>
                            </div>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                                Al momento non disponiamo di una sede fisica aperta al pubblico, in quanto siamo specializzati esclusivamente in <strong>catering a domicilio</strong>. Non devi preoccuparti di nulla: portiamo noi la nostra cucina <strong>direttamente a casa tua</strong> o nella location che hai scelto per il tuo evento.<br /><br />
                                <strong>Consegnamo in tutta la provincia di nuoro e anche oltre!</strong>
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Contatti */}
                    <div id="contatti-box" className="premium-card fade-in" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', animationDelay: '0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--color-primary-dark)' }}>
                            <MessageSquare size={28} />
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Contatti</h3>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', lineHeight: '1.6' }}>
                            Siamo a tua disposizione per qualsiasi richiesta o per organizzare il tuo prossimo evento perfetto.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                onClick={contactWhatsApp}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    borderRadius: '50px',
                                    fontSize: '1rem'
                                }}
                            >
                                <MessageCircle size={20} />
                                WhatsApp
                            </button>

                            <button
                                onClick={() => window.open('https://www.instagram.com/muse_catering_?igsh=amNwajZrcW5kczAx', '_blank')}
                                className="btn btn-outline"
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.75rem',
                                    borderRadius: '50px',
                                    fontSize: '1rem',
                                    border: '1px solid var(--color-primary)',
                                    color: 'var(--color-primary)',
                                    background: 'transparent'
                                }}
                            >
                                <Instagram size={20} />
                                Instagram
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {selectedPackage && (
                <div
                    className={`modal-overlay ${isPackageClosing ? 'closing' : ''}`}
                    onClick={closePackage}
                    style={{ zIndex: 3000 }}
                >
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            maxWidth: '800px',
                            margin: 'auto',
                            touchAction: 'none'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Package Badge outside modal-content to prevent clipping */}
                        {selectedPackage.hide_at && (
                            <div
                                className={`package-badge ${isPackageClosing ? 'closing' : ''}`}
                                style={{
                                    top: '-12px',
                                    right: '-5px',
                                    zIndex: 3010,
                                    position: 'absolute',
                                    opacity: isPackageDragging ? 1 - (packageDragY / 200) : (isPackageClosing ? 0 : 1),
                                    transform: packageDragY > 0 ? `translate3d(0, ${packageDragY}px, 0)` : 'none'
                                }}
                            >
                                <Calendar size={14} /> Disponibile fino al {new Date(selectedPackage.hide_at).toLocaleDateString('it-IT')}
                            </div>
                        )}

                        <div
                            className={`modal-content ${isPackageClosing && !isPackageSwipingOut ? 'closing' : ''}`}
                            style={{
                                width: '100%',
                                maxWidth: '800px',
                                padding: '0',
                                overflow: 'hidden',
                                transform: packageDragY > 0 ? `translate3d(0, ${packageDragY}px, 0)` : '',
                                transition: isPackageDragging ? 'none' : 'transform 0.4s cubic-bezier(0.165, 0.84, 0.44, 1), opacity 0.3s ease',
                                animation: isPackageDragging || packageDragY > 0 || isPackageSwipingOut ? 'none' : undefined,
                                opacity: isPackageSwipingOut ? 0 : 1
                            }}
                            onTouchStart={handlePackageTouchStart}
                            onTouchMove={handlePackageTouchMove}
                            onTouchEnd={handlePackageTouchEnd}
                        >
                            {/* Floating Back Button */}
                            <button
                                onClick={closePackage}
                                style={{
                                    position: 'absolute', top: '1rem', left: '1rem',
                                    background: 'rgba(255,255,255,0.9)', border: 'none',
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', zIndex: 100, boxShadow: 'var(--shadow-md)',
                                    backdropFilter: 'blur(4px)',
                                    opacity: isPackageDragging ? 1 - (packageDragY / 200) : 1
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>

                            <div
                                ref={packageScrollAreaRef}
                                className="modal-scroll-area"
                            >
                                {/* Left Side: Image Gallery */}
                                <div className="package-modal-image-side" style={{ width: '100%', position: 'relative' }}>
                                    <div
                                        onScroll={handleGalleryScroll}
                                        style={{
                                            display: 'flex',
                                            overflowX: 'auto',
                                            scrollSnapType: 'x mandatory',
                                            width: '100%',
                                            height: '100%',
                                            scrollbarWidth: 'none',
                                            WebkitOverflowScrolling: 'touch'
                                        }}
                                    >
                                        {selectedPackage.images && selectedPackage.images.length > 0 ? (
                                            selectedPackage.images.map((img, idx) => (
                                                <div key={idx} style={{
                                                    minWidth: '100%',
                                                    height: '100%',
                                                    scrollSnapAlign: 'start',
                                                    scrollSnapStop: 'always'
                                                }}>
                                                    <img
                                                        src={img}
                                                        alt={`${selectedPackage.name} ${idx + 1}`}
                                                        style={{
                                                            width: '100%',
                                                            height: '100%',
                                                            objectFit: 'cover',
                                                            display: 'block'
                                                        }}
                                                    />
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ width: '100%', height: '100%' }}>
                                                <img
                                                    src={selectedPackage.image_url || 'https://placehold.co/600x400?text=Muse+Catering'}
                                                    alt={selectedPackage.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Pagination Dots */}
                                    {selectedPackage.images?.length > 1 && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '1rem',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            display: 'flex',
                                            gap: '6px',
                                            zIndex: 5,
                                            padding: '6px 10px',
                                            background: 'rgba(0,0,0,0.3)',
                                            borderRadius: '20px',
                                            backdropFilter: 'blur(4px)'
                                        }}>
                                            {selectedPackage.images.map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        width: activeImageIndex === idx ? '8px' : '6px',
                                                        height: activeImageIndex === idx ? '8px' : '6px',
                                                        borderRadius: '50%',
                                                        background: activeImageIndex === idx ? 'white' : 'rgba(255,255,255,0.5)',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Right Side: Content */}
                                <div className="package-modal-content-side" style={{ width: '100%', background: 'var(--color-bg)' }}>
                                    <div style={{ padding: window.innerWidth > 768 ? '2.5rem' : '1.5rem' }}>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <div className="dietary-badges" style={{ marginBottom: '0.75rem' }}>
                                                {selectedPackage.is_gluten_free && <span className="badge-elegant badge-elegant-gf">Senza Glutine</span>}
                                                {selectedPackage.is_lactose_free && <span className="badge-elegant badge-elegant-lf">Senza Lattosio</span>}
                                            </div>
                                            <h2 style={{ fontSize: window.innerWidth > 768 ? '2.2rem' : '1.8rem', color: 'var(--color-primary-dark)', marginBottom: '1.2rem', lineHeight: '1.1' }}>
                                                {selectedPackage.name}
                                            </h2>
                                            <div
                                                style={{ fontSize: '1.05rem', lineHeight: '1.7', color: 'var(--color-text-muted)' }}
                                                dangerouslySetInnerHTML={{ __html: formatCustomText(selectedPackage.description) }}
                                            />
                                        </div>

                                        <h3 style={{ fontSize: '1.3rem', marginBottom: '1.2rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ width: '25px', height: '2px', background: 'var(--color-accent)' }}></div>
                                            Incluso nel pacchetto
                                        </h3>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '2.5rem' }}>
                                            {selectedPackage.items && selectedPackage.items.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="glass-panel"
                                                    style={{
                                                        padding: '1.2rem',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '1.2rem',
                                                        cursor: 'pointer',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid rgba(155, 57, 61, 0.05)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openProduct(item);
                                                    }}
                                                >
                                                    <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                                                        <img
                                                            src={item.image_url || item.images?.[0] || 'https://placehold.co/100x100?text=Food'}
                                                            alt={item.name}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--color-text)' }}>{item.name}</div>
                                                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                                                                {item.is_gluten_free && !selectedPackage.is_gluten_free && (
                                                                    <span style={{ color: '#FF9800', fontSize: '0.6rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        Senza Glutine
                                                                    </span>
                                                                )}
                                                                {item.is_lactose_free && !selectedPackage.is_lactose_free && (
                                                                    <span style={{ color: '#03A9F4', fontSize: '0.6rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>
                                                                        Senza Lattosio
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 800, marginTop: '0.2rem' }}>
                                                            {item.is_sold_by_piece
                                                                ? `${parseFloat(item.quantity)} pz`
                                                                : `${parseFloat(item.quantity)} kg`
                                                            }
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={20} color="var(--color-accent-light)" />
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{
                                            padding: '2rem 0 0.5rem',
                                            borderTop: '1px solid rgba(155, 57, 61, 0.1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '1.2rem'
                                        }}>
                                            <div className="price-container" style={{ textAlign: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Totale Esperienza</span>
                                                {selectedPackage.discount_percentage > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '1.2rem' }}>€ {selectedPackage.total_price}</span>
                                                        <span className="price-main price-discount" style={{ fontSize: '2.4rem' }}>
                                                            € {(selectedPackage.total_price * (1 - selectedPackage.discount_percentage / 100)).toFixed(2)}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="price-main" style={{ fontSize: '2.4rem' }}>€ {selectedPackage.total_price}</span>
                                                )}
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '1.2rem', fontSize: '1.1rem' }}
                                                onClick={() => handleBookPackage(selectedPackage)}
                                            >
                                                Prenota Ora
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={closeProduct}
                    isClosing={isProductClosing}
                />
            )}
        </div>
    );
};

export default Home;
