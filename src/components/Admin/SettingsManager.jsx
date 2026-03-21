import React, { useState, useEffect } from 'react';
import { Save, Loader, RefreshCw, X, Check, TrendingUp } from 'lucide-react';
import { useSetting, useProducts, useCaterings } from '../../hooks/useData';
import { api } from '../../services/api';

const SettingsManager = () => {
    const { setting: headerSetting, isLoading: isHeaderLoading, mutate: mutateHeader } = useSetting('header_text');
    const { setting: showQuoteSetting, isLoading: isQuoteSettingLoading, mutate: mutateQuoteSetting } = useSetting('show_quote_builder');
    const { products, mutate: mutateProducts } = useProducts();
    const { caterings, mutate: mutateCaterings } = useCaterings();
    
    const [headerText, setHeaderText] = useState('');
    const [showQuoteBuilder, setShowQuoteBuilder] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Recalculation states
    const [productInflation, setProductInflation] = useState('');
    const [packageInflation, setPackageInflation] = useState('');
    const [previewType, setPreviewType] = useState(null); // 'products' or 'packages'
    const [previewData, setPreviewData] = useState([]);
    const [isRecalculating, setIsRecalculating] = useState(false);

    useEffect(() => {
        if (headerSetting) {
            setHeaderText(headerSetting.value);
        }
    }, [headerSetting]);

    useEffect(() => {
        if (showQuoteSetting) {
            setShowQuoteBuilder(showQuoteSetting.value !== 'false');
        }
    }, [showQuoteSetting]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await Promise.all([
                api.updateSetting('header_text', headerText),
                api.updateSetting('show_quote_builder', showQuoteBuilder.toString())
            ]);
            mutateHeader();
            mutateQuoteSetting();
            setMessage({ type: 'success', text: 'Impostazioni salvate con successo' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' });
        } finally {
            setSaving(false);
        }
    };

    const handleRecalculatePreview = (type) => {
        const percentage = type === 'products' ? parseFloat(productInflation) : parseFloat(packageInflation);
        if (isNaN(percentage)) return;

        const factor = 1 + (percentage / 100);
        
        if (type === 'products') {
            const preview = products.map(p => {
                let newPriceKg = p.price_per_kg;
                let newPricePiece = p.price_per_piece;

                if (p.is_sold_by_piece && p.price_per_piece) {
                    // Update price per piece and then calculate kg
                    newPricePiece = Math.ceil((p.price_per_piece * factor) * 10) / 10;
                    if (p.pieces_per_kg) {
                        newPriceKg = (newPricePiece * p.pieces_per_kg).toFixed(2);
                    }
                } else {
                    // Update price per kg and then calculate piece
                    newPriceKg = Math.ceil((p.price_per_kg * factor) * 10) / 10;
                    if (p.pieces_per_kg) {
                        newPricePiece = (newPriceKg / p.pieces_per_kg).toFixed(2);
                    }
                }
                
                return {
                    id: p.id,
                    name: p.name,
                    oldPriceKg: p.price_per_kg,
                    newPriceKg: newPriceKg,
                    oldPricePiece: p.price_per_piece,
                    newPricePiece: newPricePiece,
                    isSoldByPiece: p.is_sold_by_piece,
                    piecesPerKg: p.pieces_per_kg
                };
            });
            setPreviewData(preview);
            setPreviewType('products');
        } else {
            const preview = caterings.map(c => {
                // Round up to nearest Euro: Math.ceil(value)
                const newPrice = Math.ceil(c.total_price * factor);
                
                return {
                    id: c.id,
                    name: c.name,
                    oldPrice: c.total_price,
                    newPrice: newPrice
                };
            });
            setPreviewData(preview);
            setPreviewType('packages');
        }
    };

    const handlePreviewPriceChange = (id, field, value) => {
        setPreviewData(prev => prev.map(item => {
            if (item.id !== id) return item;

            const val = parseFloat(value) || 0;
            const newItem = { ...item, [field]: val };

            // Automatic recalculation between kg and piece prices
            if (item.piecesPerKg && item.piecesPerKg > 0) {
                if (field === 'newPriceKg') {
                    newItem.newPricePiece = (val / item.piecesPerKg).toFixed(2);
                } else if (field === 'newPricePiece') {
                    newItem.newPriceKg = (val * item.piecesPerKg).toFixed(2);
                }
            }

            return newItem;
        }));
    };

    const confirmRecalculation = async () => {
        setIsRecalculating(true);
        try {
            if (previewType === 'products') {
                const updates = previewData.map(item => ({
                    id: item.id,
                    price_per_kg: item.newPriceKg,
                    price_per_piece: item.newPricePiece
                }));
                await api.batchUpdateProducts(updates);
                mutateProducts();
                setProductInflation('');
            } else {
                const updates = previewData.map(item => ({
                    id: item.id,
                    total_price: item.newPrice
                }));
                await api.batchUpdateCaterings(updates);
                mutateCaterings();
                setPackageInflation('');
            }
            setMessage({ type: 'success', text: `Prezzi ${previewType === 'products' ? 'prodotti' : 'pacchetti'} aggiornati con successo` });
            setPreviewType(null);
        } catch (error) {
            console.error('Error recalculating prices:', error);
            setMessage({ type: 'error', text: 'Errore durante il ricalcolo dei prezzi' });
        } finally {
            setIsRecalculating(false);
        }
    };

    if (isHeaderLoading || isQuoteSettingLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader className="animate-spin" />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* General Settings */}
            <div className="card">
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Impostazioni Generali
                </h2>

                {message && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                        color: message.type === 'success' ? '#166534' : '#991b1b',
                        border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                    }}>
                        {message.text}
                    </div>
                )}

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                        Testo Intestazione Home Page
                    </label>
                    <textarea
                        value={headerText}
                        onChange={(e) => setHeaderText(e.target.value)}
                        rows={6}
                        className="input"
                        style={{
                            width: '100%',
                            resize: 'vertical',
                            minHeight: '120px',
                            lineHeight: '1.5'
                        }}
                    />
                    
                    <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                        <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>Legenda Formattazione:</h4>
                        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.4rem' }}>
                            <li><code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>*frase*</code> → <strong>Grassetto</strong></li>
                            <li><code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>~frase~</code> → <em>Corsivo</em></li>
                            <li><code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>$frase$</code> → <span style={{ color: 'var(--color-primary)' }}>Rosso</span></li>
                            <li><code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>#frase#</code> → <span style={{ fontSize: '1.1em' }}>Grande</span></li>
                        </ul>
                    </div>
                </div>

                <div className="form-group" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(175, 68, 72, 0.05)', borderRadius: '12px', border: '1px solid rgba(175, 68, 72, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                Visibilità Sezione "Crea Preventivo"
                            </label>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Se disattivato, gli utenti potranno vedere solo i pacchetti predefiniti nella Home.
                            </p>
                        </div>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                            <input 
                                type="checkbox" 
                                checked={showQuoteBuilder}
                                onChange={(e) => setShowQuoteBuilder(e.target.checked)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: showQuoteBuilder ? 'var(--color-primary)' : '#ccc',
                                transition: '.4s', borderRadius: '24px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '18px', width: '18px', left: showQuoteBuilder ? '28px' : '4px', bottom: '3px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                        Salva Impostazioni
                    </button>
                </div>
            </div>

            {/* Recalculation Tools */}
            <div className="card">
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={24} /> Strumenti di Ricalcolo Prezzi
                </h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Utilizza questi strumenti per aggiornare massivamente i prezzi in base all'inflazione o a variazioni di listino.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="grid-responsive">
                    {/* Products Recalculation */}
                    <div style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Ricalcola Prezzi Prodotti</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <input 
                                    type="number"
                                    value={productInflation}
                                    onChange={(e) => setProductInflation(e.target.value)}
                                    placeholder="inserisci valore inflazione"
                                    className="input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            {productInflation !== '' && (
                                <button 
                                    className="btn btn-primary"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    onClick={() => handleRecalculatePreview('products')}
                                >
                                    <RefreshCw size={18} /> Ricalcola
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Packages Recalculation */}
                    <div style={{ padding: '1.5rem', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Ricalcola Prezzi Pacchetti</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <input 
                                    type="number"
                                    value={packageInflation}
                                    onChange={(e) => setPackageInflation(e.target.value)}
                                    placeholder="inserisci valore inflazione"
                                    className="input"
                                    style={{ width: '100%' }}
                                />
                            </div>
                            {packageInflation !== '' && (
                                <button 
                                    className="btn btn-primary"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    onClick={() => handleRecalculatePreview('packages')}
                                >
                                    <RefreshCw size={18} /> Ricalcola
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Modal */}
            {previewType && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2000,
                    padding: '2rem'
                }}>
                    <div className="glass-panel" style={{
                        maxWidth: '800px',
                        width: '100%',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        backgroundColor: 'white',
                        overflow: 'hidden'
                    }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Anteprima Ricalcolo {previewType === 'products' ? 'Prodotti' : 'Pacchetti'} ({previewType === 'products' ? productInflation : packageInflation}%)</h3>
                            <button onClick={() => setPreviewType(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
                        </div>
                        
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border)' }}>
                                        <th style={{ padding: '0.5rem' }}>Nome</th>
                                        <th style={{ padding: '0.5rem' }}>Prezzo Attuale</th>
                                        <th style={{ padding: '0.5rem' }}>Nuovo Prezzo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map(item => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                    {item.isSoldByPiece ? 'Vendita al pezzo' : 'Vendita al kg'}
                                                    {item.piecesPerKg ? ` (${item.piecesPerKg} pz/kg)` : ''}
                                                </div>
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                {previewType === 'products' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                        <div>Kg: € {parseFloat(item.oldPriceKg).toFixed(2)}</div>
                                                        {item.oldPricePiece && <div>Pz: € {parseFloat(item.oldPricePiece).toFixed(2)}</div>}
                                                    </div>
                                                ) : (
                                                    `€ ${parseFloat(item.oldPrice).toFixed(2)}`
                                                )}
                                            </td>
                                            <td style={{ padding: '0.75rem 0.5rem' }}>
                                                {previewType === 'products' ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span style={{ fontSize: '0.75rem', minWidth: '25px' }}>Kg:</span>
                                                            <input 
                                                                type="number"
                                                                step="0.01"
                                                                value={item.newPriceKg}
                                                                onChange={(e) => handlePreviewPriceChange(item.id, 'newPriceKg', e.target.value)}
                                                                style={{ width: '80px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontWeight: !item.isSoldByPiece ? 'bold' : 'normal' }}
                                                            />
                                                        </div>
                                                        {(item.newPricePiece || item.piecesPerKg) && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                <span style={{ fontSize: '0.75rem', minWidth: '25px' }}>Pz:</span>
                                                                <input 
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={item.newPricePiece}
                                                                    onChange={(e) => handlePreviewPriceChange(item.id, 'newPricePiece', e.target.value)}
                                                                    style={{ width: '80px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontWeight: item.isSoldByPiece ? 'bold' : 'normal' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <span>€</span>
                                                        <input 
                                                            type="number"
                                                            step="1"
                                                            value={item.newPrice}
                                                            onChange={(e) => handlePreviewPriceChange(item.id, 'newPrice', e.target.value)}
                                                            style={{ width: '100px', padding: '0.2rem 0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', fontWeight: 'bold' }}
                                                        />
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button 
                                className="btn btn-outline" 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={() => setPreviewType(null)}
                                disabled={isRecalculating}
                            >
                                <X size={18} /> Annulla
                            </button>
                            <button 
                                className="btn btn-primary" 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                onClick={confirmRecalculation}
                                disabled={isRecalculating}
                            >
                                {isRecalculating ? <Loader className="animate-spin" size={18} /> : <Check size={18} />}
                                Conferma e Applica
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsManager;
