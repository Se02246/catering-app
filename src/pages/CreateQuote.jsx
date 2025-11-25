import React from 'react';
import QuoteBuilder from '../components/Quote/QuoteBuilder';
import Header from '../components/Layout/Header';

const CreateQuote = () => {
    return (
        <div className="container">
            <Header />
            <h2 style={{ marginBottom: '2rem', marginTop: '2rem', display: 'inline-block', paddingBottom: '0.5rem', borderBottom: '2px solid var(--color-primary)' }}>Crea il tuo Preventivo</h2>
            <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
                Scegli i prodotti dal catalogo e componi il tuo menu.
            </p>
            <QuoteBuilder />
        </div>
    );
};

export default CreateQuote;
