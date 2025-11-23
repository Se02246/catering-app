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
            <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Muse Catering</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>
                    Catering dolci e salati preparati con passione.
                </p>
            </header>

            <section>
                <h2 style={{ marginBottom: '2rem', borderBottom: '2px solid var(--color-accent)', display: 'inline-block', paddingBottom: '0.5rem' }}>
                    I Nostri Pacchetti
                </h2>

                {loading && <p>Caricamento pacchetti...</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                {!loading && !error && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                        {packages.length === 0 ? (
                            <p>Nessun pacchetto disponibile al momento.</p>
                        ) : (
                            packages.map((pkg) => (
                                <div key={pkg.id} style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
                                    {pkg.image_url && (
                                        <img
                                            src={pkg.image_url}
                                            alt={pkg.name}
                                            style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }}
                                        />
                                    )}
                                    <h3 style={{ marginBottom: '0.5rem' }}>{pkg.name}</h3>
                                    <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)', flexGrow: 1 }}>{pkg.description}</p>
                                    <div style={{ marginTop: 'auto' }}>
                                        <p style={{ fontWeight: 'bold', marginBottom: '1rem', fontSize: '1.2rem' }}>€ {pkg.total_price}</p>
                                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setSelectedPackage(pkg)}>Dettagli</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>

            {selectedPackage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }} onClick={() => setSelectedPackage(null)}>
                    <div style={{
                        backgroundColor: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '600px', width: '90%', maxHeight: '90vh', overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ margin: 0 }}>{selectedPackage.name}</h2>
                            <button className="btn btn-outline" onClick={() => setSelectedPackage(null)}>Chiudi</button>
                        </div>

                        {selectedPackage.image_url && (
                            <img
                                src={selectedPackage.image_url}
                                alt={selectedPackage.name}
                                style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '8px', marginBottom: '1.5rem' }}
                            />
                        )}

                        <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', lineHeight: '1.6' }}>{selectedPackage.description}</p>

                        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Cosa include</h3>
                        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                            {selectedPackage.items && selectedPackage.items.map((item, idx) => (
                                <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                    <span>{item.name}</span>
                                    <span style={{ fontWeight: 'bold' }}>{item.quantity} kg</span>
                                </li>
                            ))}
                        </ul>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>€ {selectedPackage.total_price}</span>
                            <button className="btn btn-primary" onClick={() => {
                                const phoneNumber = "393495416637";
                                let message = `Ciao Barbara, sarei interessat a questo pacchetto, e\` possibile avere maggiori informazioni?\n\n*${selectedPackage.name}*\n${selectedPackage.description}\n\n*Prodotti inclusi:*\n`;

                                selectedPackage.items?.forEach(item => {
                                    message += `• ${item.name}: ${item.quantity} kg\n`;
                                });

                                message += `\n*Prezzo: € ${selectedPackage.total_price}*`;

                                const encodedMessage = encodeURIComponent(message);
                                window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
                            }}>Prenota Ora</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
