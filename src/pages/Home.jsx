import React from 'react';
import { api } from '../services/api';

const Home = () => {
    const [packages, setPackages] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

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
                                        <button className="btn btn-primary" style={{ width: '100%' }}>Dettagli</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Home;
