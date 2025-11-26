import React from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Header from '../components/Layout/Header';
import ProductDetailsModal from '../components/Common/ProductDetailsModal';

const Home = () => {
    const navigate = useNavigate();
    const [packages, setPackages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [selectedPackage, setSelectedPackage] = React.useState(null);
    const [selectedProduct, setSelectedProduct] = React.useState(null);

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
                            packages.map((pkg) => (
                                <div key={pkg.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease' }}>
                                    {pkg.image_url && (
                                        <div
                                            style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)', cursor: 'pointer' }}
                                            onClick={() => setSelectedPackage(pkg)}
                                        >
                                            <img
                                                src={pkg.image_url}
                                                alt={pkg.name}
                                                style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block', transition: 'transform 0.5s ease' }}
                                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                                            />
                                        </div>
                                    )}
                                    <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-text)' }}>{pkg.name}</h3>
                                    <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)', flexGrow: 1, lineHeight: '1.6' }}>{pkg.description}</p>
                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            {pkg.discount_percentage > 0 ? (
                                                <>
                                                    <span style={{ textDecoration: 'line-through', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                                                        €&nbsp;{pkg.total_price}
                                                    </span>
                                                    <span style={{ fontWeight: '800', fontSize: '1.5rem', color: '#e63946' }}>
                                                        €&nbsp;{(pkg.total_price * (1 - pkg.discount_percentage / 100)).toFixed(2)}
                                                    </span>
                                                </>
                                            ) : (
                                                <p style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--color-primary-dark)', margin: 0 }}>€&nbsp;{pkg.total_price}</p>
                                            )}
                                        </div>
                                        <button className="btn btn-primary" onClick={() => setSelectedPackage(pkg)}>Dettagli</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            {selectedPackage && (
                <div className="modal-overlay" onClick={() => setSelectedPackage(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>{selectedPackage.name}</h2>
                            <button className="btn btn-outline" style={{ borderColor: 'var(--color-text-muted)', color: 'var(--color-text-muted)', padding: '0.5rem 1rem' }} onClick={() => setSelectedPackage(null)}>Chiudi</button>
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
                                            setSelectedProduct(item);
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
                                            <div style={{ fontWeight: '600', fontSize: '1rem', color: 'var(--color-text)', marginBottom: '0.1rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>{item.quantity} kg</div>
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
                                }

                                let message = `Ciao Barbara, sarei interessat a questo pacchetto, e\` possibile avere maggiori informazioni?\n\n*${selectedPackage.name}*\n${selectedPackage.description}\n\n*Prodotti inclusi:*\n`;

                                selectedPackage.items?.forEach(item => {
                                    message += `• ${item.name}: ${item.quantity} kg\n`;
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
                    onClose={() => setSelectedProduct(null)}
                // No onAddToCart here as we are in Home, not QuoteBuilder
                />
            )}
        </div>
    );
};

export default Home;
