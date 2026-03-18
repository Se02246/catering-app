import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCaterings, useSetting } from '../hooks/useData';
import Header from '../components/Layout/Header';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';
import { formatCustomText } from '../utils/textFormatting';
import { ChevronRight, Calendar, Info, ArrowRight } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const { caterings, isLoading, isError } = useCaterings();
    const [selectedPackage, setSelectedPackage] = React.useState(null);
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [isPackageClosing, setIsPackageClosing] = React.useState(false);
    const [isProductClosing, setIsProductClosing] = React.useState(false);

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
        if (selectedPackage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedPackage]);

    React.useEffect(() => {
        const handlePopState = (event) => {
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
                }, 500);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [selectedPackage, selectedProduct]);

    const openPackage = (pkg) => {
        window.history.pushState({ modal: 'package' }, '');
        setSelectedPackage(pkg);
    };

    const closePackage = () => {
        window.history.back();
    };

    const openProduct = (prod) => {
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

    return (
        <div className="container fade-in" style={{ paddingBottom: '5rem' }}>
            <Header />

            <section id="packages">
                <div className="section-header">
                    <span className="subtitle">Esperienze Gastronomiche</span>
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
                                <div
                                    key={pkg.id}
                                    className="premium-card fade-in"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="image-wrapper" onClick={() => openPackage(pkg)} style={{ cursor: 'pointer' }}>
                                        {pkg.hide_at && (
                                            <div className="package-badge" style={{ background: 'var(--color-primary-dark)', backdropFilter: 'blur(10px)' }}>
                                                <Calendar size={14} style={{ marginRight: '0.4rem' }} />
                                                Disponibile fino al {new Date(pkg.hide_at).toLocaleDateString('it-IT')}
                                            </div>
                                        )}
                                        <img
                                            src={pkg.image_url || 'https://placehold.co/600x400?text=Muse+Catering'}
                                            alt={pkg.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.8s cubic-bezier(0.165, 0.84, 0.44, 1)' }}
                                            className="card-hover-img"
                                        />
                                    </div>

                                    <div className="card-body">
                                        <div className="dietary-badges" style={{ marginBottom: '1rem' }}>
                                            {pkg.is_gluten_free && <span className="badge-elegant badge-elegant-gf">Senza Glutine</span>}
                                            {pkg.is_lactose_free && <span className="badge-elegant badge-elegant-lf">Senza Lattosio</span>}
                                        </div>

                                        <h3 className="card-title">{pkg.name}</h3>
                                        
                                        <div 
                                            className="card-text"
                                            style={{ 
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}
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
                            ))
                        )}
                    </div>
                )}
            </section>

            {selectedPackage && (
                <div className="modal-overlay" onClick={closePackage}>
                    <div
                        className={`modal-content ${isPackageClosing ? 'bounce-out' : 'bounce-in'}`}
                        onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '900px', padding: '0', overflow: 'hidden', background: 'var(--color-bg)' }}
                    >
                        <div style={{ display: 'flex', flexDirection: window.innerWidth > 768 ? 'row' : 'column' }}>
                            {/* Left Side: Image Gallery */}
                            <div style={{ 
                                width: window.innerWidth > 768 ? '45%' : '100%', 
                                height: window.innerWidth > 768 ? 'auto' : '300px',
                                position: 'relative',
                                background: '#000'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    overflowX: 'auto',
                                    scrollSnapType: 'x mandatory',
                                    height: '100%',
                                    scrollbarWidth: 'none',
                                    WebkitOverflowScrolling: 'touch'
                                }}>
                                    {selectedPackage.images && selectedPackage.images.length > 0 ? (
                                        selectedPackage.images.map((img, idx) => (
                                            <img
                                                key={idx}
                                                src={img}
                                                alt={`${selectedPackage.name} ${idx + 1}`}
                                                style={{ width: '100%', height: '100%', flexShrink: 0, objectFit: 'cover', scrollSnapAlign: 'start' }}
                                            />
                                        ))
                                    ) : (
                                        <img
                                            src={selectedPackage.image_url || 'https://placehold.co/600x400?text=Muse+Catering'}
                                            alt={selectedPackage.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                </div>
                                <button 
                                    onClick={closePackage}
                                    style={{
                                        position: 'absolute', top: '1.5rem', left: '1.5rem',
                                        background: 'rgba(255,255,255,0.9)', border: 'none',
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', zIndex: 10, boxShadow: 'var(--shadow-md)'
                                    }}
                                >
                                    <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                                </button>
                                {selectedPackage.images?.length > 1 && (
                                    <div style={{ 
                                        position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
                                        background: 'rgba(0,0,0,0.5)', padding: '0.4rem 0.8rem', borderRadius: '20px',
                                        color: 'white', fontSize: '0.75rem', fontWeight: 'bold', backdropFilter: 'blur(4px)'
                                    }}>
                                        Scorri per altre foto
                                    </div>
                                )}
                            </div>

                            {/* Right Side: Content */}
                            <div style={{ 
                                width: window.innerWidth > 768 ? '55%' : '100%', 
                                padding: '3.5rem',
                                maxHeight: window.innerWidth > 768 ? '90vh' : 'auto',
                                overflowY: 'auto'
                            }}>
                                <div style={{ marginBottom: '2.5rem' }}>
                                    <div className="dietary-badges" style={{ marginBottom: '0.75rem' }}>
                                        {selectedPackage.is_gluten_free && <span className="badge-elegant badge-elegant-gf">Senza Glutine</span>}
                                        {selectedPackage.is_lactose_free && <span className="badge-elegant badge-elegant-lf">Senza Lattosio</span>}
                                    </div>
                                    <h2 style={{ fontSize: '2.8rem', color: 'var(--color-primary-dark)', marginBottom: '1.5rem', lineHeight: '1.1' }}>
                                        {selectedPackage.name}
                                    </h2>
                                    <div 
                                        style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--color-text-muted)' }}
                                        dangerouslySetInnerHTML={{ __html: formatCustomText(selectedPackage.description) }}
                                    />
                                </div>

                                <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '30px', height: '2px', background: 'var(--color-accent)' }}></div>
                                    Incluso nel pacchetto
                                </h3>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '3rem' }}>
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
                                            onMouseOver={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
                                            onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(155, 57, 61, 0.05)'}
                                        >
                                            <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                                                <img
                                                    src={item.image_url || item.images?.[0] || 'https://placehold.co/100x100?text=Food'}
                                                    alt={item.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--color-text)' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.9rem', color: 'var(--color-accent)', fontWeight: 800, marginTop: '0.2rem' }}>
                                                    {item.is_sold_by_piece ? `${item.quantity} pezzi` : `${item.quantity} kg`}
                                                </div>
                                            </div>
                                            <ChevronRight size={20} color="var(--color-accent-light)" />
                                        </div>
                                    ))}
                                </div>

                                <div style={{ 
                                    position: 'sticky', bottom: '-3.5rem', margin: '0 -3.5rem', padding: '2.5rem 3.5rem',
                                    background: 'rgba(252, 250, 247, 0.95)', backdropFilter: 'blur(10px)',
                                    borderTop: '1px solid rgba(155, 57, 61, 0.1)',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div className="price-container">
                                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Totale Esperienza</span>
                                        {selectedPackage.discount_percentage > 0 ? (
                                            <span className="price-main price-discount" style={{ fontSize: '2.4rem' }}>
                                                € {(selectedPackage.total_price * (1 - selectedPackage.discount_percentage / 100)).toFixed(2)}
                                            </span>
                                        ) : (
                                            <span className="price-main" style={{ fontSize: '2.4rem' }}>€ {selectedPackage.total_price}</span>
                                        )}
                                    </div>
                                    <button 
                                        className="btn btn-primary" 
                                        style={{ padding: '1.2rem 2.5rem', fontSize: '1.1rem' }} 
                                        onClick={() => handleBookPackage(selectedPackage)}
                                    >
                                        Prenota Ora
                                    </button>
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
