import React from 'react';

const Home = () => {
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {/* Placeholder for Catering Packages */}
                    <div style={{ padding: '2rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Aperitivo Classico</h3>
                        <p style={{ marginBottom: '1rem', color: 'var(--color-text-muted)' }}>Una selezione dei migliori salumi e formaggi.</p>
                        <button className="btn btn-primary">Dettagli</button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
