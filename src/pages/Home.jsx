import React from 'react';
import { api } from '../services/api';

const Home = () => {
    const [packages, setPackages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [selectedPackage, setSelectedPackage] = React.useState(null);

    React.useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await api.getCaterings();
                setPackages(data);
            } catch (err) {
                console.error('Error fetching packages:', err);
                setError('Impossibile caricare i pacchetti. Riprova più tardi.');
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    return (
        <div className="container">
            <header style={{ textAlign: 'center', marginBottom: '4rem', paddingTop: '2rem' }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', textShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>Muse Catering</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-white-transparent)', maxWidth: '600px', margin: '0 auto' }}>
                    Catering dolci e salati preparati con passione. Esperienze culinarie uniche per i tuoi eventi speciali.
                </p>
            </header>

            <section>
                <h2 style={{ marginBottom: '2rem', display: 'inline-block', paddingBottom: '0.5rem', borderBottom: '2px solid rgba(255,255,255,0.3)' }}>
                    I Nostri Pacchetti
                </h2>

                {loading && <p style={{ color: 'white' }}>Caricamento pacchetti...</p>}
                {error && <p style={{ color: '#ffcccb' }}>{error}</p>}

                {!loading && !error && (
                    <div className="grid-responsive">
                        {packages.length === 0 ? (
                            <p style={{ color: 'white' }}>Nessun pacchetto disponibile al momento.</p>
                        ) : (
                            packages.map((pkg) => (
                                <div key={pkg.id} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease' }}>
                                    {pkg.image_url && (
                                        <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '1.5rem', boxShadow: '0 8px 16px rgba(0,0,0,0.1)' }}>
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
                                        <p style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--color-primary-dark)' }}>€ {pkg.total_price}</p>
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

                        {selectedPackage.image_url && (
                            <img
                                src={selectedPackage.image_url}
                                alt={selectedPackage.name}
                                style={{ width: '100%', height: '300px', objectFit: 'cover', borderRadius: '16px', marginBottom: '2rem', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                            />
                        )}

                        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.8', color: 'var(--color-text)' }}>{selectedPackage.description}</p>

                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', color: 'var(--color-primary)' }}>Cosa include</h3>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2.5rem' }}>
                            {selectedPackage.items && selectedPackage.items.map((item, idx) => (
                                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                                    <span style={{ color: 'var(--color-text)' }}>{item.name}</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>{item.quantity} kg</span>
                                </li>
                            ))}
                        </ul>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                            <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>€ {selectedPackage.total_price}</span>
                            <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => {
                                const phoneNumber = "393495416637";
                                let message = `Ciao Barbara, sarei interessat a questo pacchetto, e\` possibile avere maggiori informazioni?\n\n*${selectedPackage.name}*\n${selectedPackage.description}\n\n*Prodotti inclusi:*\n`;

                                selectedPackage.items?.forEach(item => {
                                    message += `• ${item.name}: ${item.quantity} kg\n`;
                                });

                                message += `\n*Prezzo: € ${selectedPackage.total_price}*`;

                                const encodedMessage = encodeURIComponent(message);
                                window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
                            }}>Prenota su WhatsApp</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
