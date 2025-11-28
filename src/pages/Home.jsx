import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Header from '../components/Layout/Header';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';
import ScrollAnimation from '../components/Common/ScrollAnimation';
import { Star, ArrowRight } from 'lucide-react';

const Home = () => {
    const navigate = useNavigate();
    const [packages, setPackages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [selectedPackage, setSelectedPackage] = React.useState(null);
    const [selectedProduct, setSelectedProduct] = React.useState(null);
    const [isPackageClosing, setIsPackageClosing] = React.useState(false);
    const [isProductClosing, setIsProductClosing] = React.useState(false);

    React.useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await api.getCaterings();
                const parsedData = data.map(pkg => ({
                    ...pkg,
                    images: pkg.images || (pkg.image_url ? [pkg.image_url] : [])
                }));
                setPackages(parsedData);
            } catch (err) {
                console.error('Error fetching packages:', err);
                setError('Impossibile caricare i pacchetti. Riprova più tardi.');
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

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

    // Handle browser back button for modals
    React.useEffect(() => {
        const handlePopState = (event) => {
            if (selectedProduct) {
                // Trigger close animation for product
                setIsProductClosing(true);
                setTimeout(() => {
                    setSelectedProduct(null);
                    setIsProductClosing(false);
                }, 500); // Match animation duration
            } else if (selectedPackage) {
                // Trigger close animation for package
                setIsPackageClosing(true);
                setTimeout(() => {
                    setSelectedPackage(null);
                    setIsPackageClosing(false);
                }, 500); // Match animation duration
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

    const calculateDiscountedPrice = (price, discount) => {
        return (price * (1 - discount / 100)).toFixed(2);
    };

    return (
        <div className="container">
            <Header />

            <section id="packages">
                <h2 style={{ marginBottom: '2rem', display: 'inline-block', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-primary)' }}>
                    Pacchetti
                </h2>

                {loading && <p style={{ color: 'var(--color-text)' }}>Caricamento pacchetti...</p>}
                {error && <p style={{ color: '#ffcccb' }}>{error}</p>}

                {!loading && !error && (
                    <div className="grid-responsive">
                        {packages.length === 0 ? (
                            <p style={{ color: 'var(--color-text)' }}>Nessun pacchetto disponibile al momento.</p>
                        ) : (
                            packages.map((pkg, index) => (
                                <ScrollAnimation key={pkg.id} index={index}>
                                    <div
                                        style={{
                                            backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden',
                                            boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                            display: 'flex', flexDirection: 'column', height: '100%',
                                            cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)'
                                        }}
                                        onClick={() => openPackage(pkg)}
                                        onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.12)'; }}
                                        onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)'; }}
                                    >
                                        <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
                                            <img
                                                src={pkg.image_url}
                                                alt={pkg.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                                                onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                                                onMouseOut={e => e.target.style.transform = 'scale(1)'}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400?text=No+Image'; }}
                                            />
                                            {pkg.is_popular && (
                                                <div style={{
                                                    position: 'absolute', top: '1rem', right: '1rem',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)',
                                                    padding: '0.25rem 0.75rem', borderRadius: '20px',
                                                    fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary)',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '0.25rem'
                                                }}>
                                                    <Star size={14} fill="var(--color-primary)" /> Popolare
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>{pkg.name}</h3>
                                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', flex: 1, lineHeight: '1.5' }}>
                                                {pkg.description}
                                            </p>

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                                <div>
                                                    {pkg.discount_percentage > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                                € {parseFloat(pkg.price).toFixed(2)}
                                                            </span>
                                                            <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                                                                € {calculateDiscountedPrice(pkg.price, pkg.discount_percentage)}
                                                                <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                                                                    / a persona
                                                                </span>
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-primary)' }}>
                                                            € {parseFloat(pkg.price).toFixed(2)}
                                                            <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                                                                / a persona
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                                <button className="btn btn-outline" style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}>
                                                    <ArrowRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollAnimation>
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
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{selectedPackage.name}</h2>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {selectedPackage.is_gluten_free && (
                                        <span style={{ color: '#FF9800', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            Senza Glutine!
                                        </span>
                                    )}
                                    {selectedPackage.is_lactose_free && (
                                        <span style={{ color: '#03A9F4', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                            Senza Lattosio!
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button className="btn btn-outline" style={{ borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)', padding: '0.5rem 1rem' }} onClick={closePackage}>Chiudi</button>
                        </div>

                        {selectedPackage.images && selectedPackage.images.length > 0 ? (
                            <div style={{ position: 'relative', marginBottom: '2rem' }}>
                                <div style={{
                                    display: 'flex',
                                    overflowX: 'auto',
                                    scrollSnapType: 'x mandatory',
                                    scrollSnapStop: 'always',
                                    gap: '1rem',
                                    paddingBottom: '1rem',
                                    WebkitOverflowScrolling: 'touch',
                                    scrollBehavior: 'smooth',
                                    touchAction: 'pan-x'
                                }}>
                                    {selectedPackage.images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                minWidth: '100%',
                                                scrollSnapAlign: 'center',
                                                scrollSnapStop: 'always' // Added to child as well just in case, though usually on container
                                            }}
                                        >
                                            <img
                                                src={img}
                                                alt={`${selectedPackage.name} ${idx + 1}`}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '4/5',
                                                    objectFit: 'cover',
                                                    borderRadius: '16px',
                                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                                    display: 'block'
                                                }}
                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/600x400?text=No+Img'; }}
                                            />
                                        </div>
                                    ))}
                                </div>
                                {selectedPackage.images.length > 1 && (
                                    <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                                        Scorri per vedere altre foto
                                    </div>
                                )}
                            </div>
                        ) : (
                            selectedPackage.image_url && (
                                <img
                                    src={selectedPackage.image_url}
                                    alt={selectedPackage.name}
                                    style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                />
                            )
                        )}

                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.8', color: 'var(--color-text)' }}>{selectedPackage.description}</p>

                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-primary)' }}>Cosa include</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2.5rem' }}>
                            {selectedPackage.items && selectedPackage.items.map((item, idx) => {
                                const hasImage = item.image_url || (item.images && item.images.length > 0 && item.images[0]);
                                return (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '0.75rem',
                                            border: '1px solid rgba(175, 68, 72, 0.1)',
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.6)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                            display: 'flex',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: '1rem'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openProduct(item);
                                        }}
                                        onMouseOver={e => { e.currentTarget.style.transform = 'translateX(4px)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; }}
                                        onMouseOut={e => { e.currentTarget.style.transform = 'translateX(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                    >
                                        {hasImage && (
                                            <div style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                                                <img
                                                    src={item.image_url || item.images[0]}
                                                    alt={item.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--color-text)', marginBottom: '0.1rem' }}>
                                                {item.name}
                                                <div style={{ display: 'inline-flex', gap: '0.25rem', marginLeft: '0.5rem', flexWrap: 'wrap' }}>
                                                    {item.is_gluten_free && (
                                                        <span style={{ color: '#FF9800', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                            Senza Glutine!
                                                        </span>
                                                    )}
                                                    {item.is_lactose_free && (
                                                        <span style={{ color: '#03A9F4', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                                            Senza Lattosio!
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                                                {item.is_sold_by_piece
                                                    ? `${parseFloat(item.quantity)} pz`
                                                    : (item.pieces_per_kg > 0
                                                        ? `${parseFloat(item.quantity)} pz`
                                                        : `${parseFloat(item.quantity)} kg`
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                {selectedPackage.discount_percentage > 0 ? (
                                    <>
                                        <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                                            €&nbsp;{selectedPackage.total_price}
                                        </span>
                                        <span style={{ fontSize: '2rem', fontWeight: '800', color: '#e63946' }}>
                                            €&nbsp;{(selectedPackage.total_price * (1 - selectedPackage.discount_percentage / 100)).toFixed(2)}
                                        </span>
                                    </>
                                ) : (
                                    <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>€&nbsp;{selectedPackage.total_price}</span>
                                )}
                            </div>
                            <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => {
                                const phoneNumber = "393495416637";
                                let finalPrice = selectedPackage.total_price;
                                if (selectedPackage.discount_percentage > 0) {
                                    finalPrice = (selectedPackage.total_price * (1 - selectedPackage.discount_percentage / 100)).toFixed(2);
                                } else {
                                    finalPrice = parseFloat(finalPrice).toFixed(2);
                                }

                                let message = `Ciao Barbara, sarei interessat a questo pacchetto(€ ${finalPrice}), e\` possibile avere maggiori informazioni?\n\n*${selectedPackage.name}`;
                                if (selectedPackage.is_gluten_free) message += ' (senza glutine)';
                                if (selectedPackage.is_lactose_free) message += ' (senza lattosio)';
                                message += `*\n${selectedPackage.description}\n\n*Prodotti inclusi:*\n`;

                                const items = selectedPackage.items || [];
                                const middleIndex = Math.floor(items.length / 2);

                                items.forEach((item, index) => {
                                    const isPieces = item.pieces_per_kg > 0;
                                    let quantityText = '';
                                    if (item.is_sold_by_piece) {
                                        quantityText = `${parseFloat(item.quantity)} pz`;
                                    } else if (isPieces) {
                                        quantityText = `${parseFloat(item.quantity)} pz`;
                                    } else {
                                        quantityText = `${parseFloat(item.quantity)} kg`;
                                    }

                                    const dietaryInfo = [
                                        item.is_gluten_free ? '(senza glutine)' : '',
                                        item.is_lactose_free ? '(senza lattosio)' : ''
                                    ].filter(Boolean).join(' ');

                                    message += `• *${item.name}* ${dietaryInfo}\n`;
                                    message += `  ${quantityText}\n\n`;

                                    if (index === middleIndex) {
                                        message += `• prezzo pacchetto(€ ${finalPrice})\n\n`;
                                    }
                                });

                                message += `\n*Prezzo: € ${finalPrice}*`;

                                const encodedMessage = encodeURIComponent(message);
                                window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
                            }}>Prenota su WhatsApp</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Product Details Modal (on top of Package Modal) */}
            {selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={closeProduct}
                    isClosing={isProductClosing}
                // No onAddToCart here as we are in Home, not QuoteBuilder
                />
            )}
        </div>
    );
};

export default Home;
