import React from 'react';
import QuoteBuilder from '../components/Quote/QuoteBuilder';
import Header from '../components/Layout/Header';

const CreateQuote = () => {
    return (
        <div className="container fade-in" style={{ paddingBottom: '5rem' }}>
            <Header />
            <div className="section-header">
                <h2>Crea il tuo Preventivo</h2>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem' }}>
                    Scegli i prodotti dal catalogo e componi il tuo menu ideale. 
                    Ti invieremo un link pronto da condividere.
                </p>
            </div>
            <QuoteBuilder />
        </div>
    );
};

export default CreateQuote;
