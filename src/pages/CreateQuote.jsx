import React from 'react';
import QuoteBuilder from '../components/Quote/QuoteBuilder';

const CreateQuote = () => {
    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>Crea il tuo Preventivo</h1>
            <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>
                Scegli i prodotti dal nostro catalogo e componi il tuo menu ideale.
            </p>
            <QuoteBuilder />
        </div>
    );
};

export default CreateQuote;
