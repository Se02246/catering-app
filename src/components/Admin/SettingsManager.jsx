import React, { useState, useEffect } from 'react';
import { Save, Loader, RefreshCw, X, Check, TrendingUp, Sparkles, Copy } from 'lucide-react';
import { useSetting, useProducts, useCaterings } from '../../hooks/useData';
import { api } from '../../services/api';

const generateAIPrompt = (products, caterings) => {
    let prompt = `Sei un consulente aziendale esperto di finanza e di prezzi nel settore della ristorazione, del catering e del banqueting in Italia.
Il gestore di una piattaforma di catering ti fornisce i dati di tutti i prodotti a catalogo e i pacchetti di offerta definiti.

L'obiettivo è adeguare i prezzi all'inflazione e all'andamento attuale del costo del carrello della spesa in Italia.

ANALIZZA I DATI DI SEGUITO ED ELABORA LE SEGUENTI RICHIESTE:
1. Analizza brevemente lo scenario dell'inflazione alimentare e dei costi operativi in Italia (materie prime, energia, trasporti).
2. Proponi la percentuale globale ottimale di aumento da applicare ai PRODOTTI (per la funzione "Ricalcola prezzi prodotti" del pannello amministratore).
3. Proponi la percentuale globale ottimale di aumento da applicare ai PACCHETTI (per la funzione "Ricalcola prezzi pacchetti" del pannello amministratore).
4. Fornisci l'elenco dei singoli prezzi modificati consigliati per OGNI PRODOTTO e OGNI PACCHETTO. Fai un arrotondamento intelligente (ad es. per i prodotti a step di 0.10€ o 0.50€, per i pacchetti all'euro intero) e spiega brevemente il motivo per i rincari maggiori (es. prodotti che contengono ingredienti sensibili ad alta inflazione, o prodotti per intolleranze alimentari come senza glutine/senza lattosio che hanno costi di produzione più elevati).

DATI PRODOTTI CORRENTI:
=========================================
`;

    products.forEach((p, index) => {
        const allergeni = [];
        if (p.is_gluten_free) allergeni.push("Senza Glutine");
        if (p.is_lactose_free) allergeni.push("Senza Lattosio");
        if (p.is_vegetarian) allergeni.push("Vegetariano");
        if (p.is_vegan) allergeni.push("Vegano");
        if (p.is_traditional) allergeni.push("Tradizionale");
        if (p.is_savory) allergeni.push("Salato");
        if (p.is_sweet) allergeni.push("Dolce");

        const tags = allergeni.length > 0 ? allergeni.join(", ") : "Nessuno";

        prompt += `Prodotto #${index + 1}:
- Nome: ${p.name}
- Descrizione/Ingredienti: ${p.description || "Non specificata"}
- Descrizione Menu: ${p.menu_description || "Non specificata"}
- Modalità di vendita: ${p.is_sold_by_piece ? "Venduto al Pezzo" : "Venduto al Kg"}
- Prezzo al Kg: € ${p.price_per_kg ? parseFloat(p.price_per_kg).toFixed(2) : "0.00"}
- Pezzi per Kg: ${p.pieces_per_kg || "N/A"}
- Prezzo al Pezzo: € ${p.price_per_piece ? parseFloat(p.price_per_piece).toFixed(2) : "N/A"}
- Caratteristiche: ${tags}
- Stato visibilità: ${p.is_visible !== false ? "Visibile" : "Nascosto"}
-----------------------------------------
`;
    });

    prompt += `\nDATI PACCHETTI CORRENTI:
=========================================
`;

    caterings.forEach((c, index) => {
        const allergeni = [];
        if (c.is_gluten_free) allergeni.push("Senza Glutine");
        if (c.is_lactose_free) allergeni.push("Senza Lattosio");
        if (c.is_vegetarian) allergeni.push("Vegetariano");
        if (c.is_vegan) allergeni.push("Vegano");
        if (c.is_traditional) allergeni.push("Tradizionale");

        const tags = allergeni.length > 0 ? allergeni.join(", ") : "Nessuno";
        const price = parseFloat(c.total_price || 0);
        const discount = parseFloat(c.discount_percentage || 0);
        const discountedPrice = discount > 0 ? (price * (1 - discount / 100)) : price;

        prompt += `Pacchetto #${index + 1}:
- Nome: ${c.name}
- Descrizione: ${c.description || "Non specificata"}
- Prezzo Base: € ${price.toFixed(2)}
- Sconto: ${discount}% ${discount > 0 ? `(Prezzo scontato corrente: € ${discountedPrice.toFixed(2)})` : ""}
- Caratteristiche: ${tags}
- Elementi inclusi nel pacchetto:
`;

        if (c.items && c.items.length > 0) {
            c.items.forEach(item => {
                const p = products.find(prod => prod.id === item.product_id);
                const itemName = item.name || p?.name || "Prodotto sconosciuto";
                const isPiece = item.is_sold_by_piece !== undefined ? item.is_sold_by_piece : p?.is_sold_by_piece;
                const itemPrice = isPiece
                    ? (item.price_per_piece || p?.price_per_piece || 0)
                    : (item.price_per_kg || p?.price_per_kg || 0);

                prompt += `  * Quantità: ${item.quantity} ${isPiece ? "pz" : "kg"} | Prodotto: ${itemName} | Prezzo unitario nel pacchetto: € ${parseFloat(itemPrice).toFixed(2)} / ${isPiece ? "pz" : "kg"}\n`;
            });
        } else {
            prompt += `  * Nessun prodotto incluso\n`;
        }

        prompt += `-----------------------------------------
`;
    });

    prompt += `\nGenera la risposta strutturando in modo ordinato e in lingua italiana, fornendo tabelle leggibili per il confronto dei prezzi prima/dopo per agevolare la copia e l'inserimento dei valori nel sistema.`;

    return prompt;
};

const SettingsManager = () => {
    const { setting: headerSetting, isLoading: isHeaderLoading, mutate: mutateHeader } = useSetting('header_text');
    const { setting: showQuoteSetting, isLoading: isQuoteSettingLoading, mutate: mutateQuoteSetting } = useSetting('show_quote_builder');
    const { setting: showPricesSetting, isLoading: isPricesSettingLoading, mutate: mutatePricesSetting } = useSetting('show_product_prices');
    const { setting: hideEventHomeSetting, isLoading: isHideEventHomeLoading, mutate: mutateHideEventHome } = useSetting('hide_event_home_button');
    const { products, isLoading: isProductsLoading, mutate: mutateProducts } = useProducts();
    const { caterings, isLoading: isCateringsLoading, mutate: mutateCaterings } = useCaterings();
    
    const [headerText, setHeaderText] = useState('');
    const [showQuoteBuilder, setShowQuoteBuilder] = useState(true);
    const [showProductPrices, setShowProductPrices] = useState(true);
    const [hideEventHomeButton, setHideEventHomeButton] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Recalculation states
    const [productInflation, setProductInflation] = useState('');
    const [packageInflation, setPackageInflation] = useState('');
    const [previewType, setPreviewType] = useState(null); // 'products' or 'packages'
    const [previewData, setPreviewData] = useState([]);
    const [isRecalculating, setIsRecalculating] = useState(false);

    // Prompt states
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (headerSetting) {
            setHeaderText(headerSetting.value);
        }
    }, [headerSetting?.value]);

    useEffect(() => {
        if (showQuoteSetting) {
            setShowQuoteBuilder(showQuoteSetting.value !== 'false');
        }
    }, [showQuoteSetting?.value]);

    useEffect(() => {
        if (showPricesSetting) {
            setShowProductPrices(showPricesSetting.value !== 'false');
        }
    }, [showPricesSetting?.value]);

    useEffect(() => {
        if (hideEventHomeSetting) {
            setHideEventHomeButton(hideEventHomeSetting.value === 'true');
        }
    }, [hideEventHomeSetting?.value]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await Promise.all([
                api.updateSetting('header_text', headerText),
                api.updateSetting('show_quote_builder', (showProductPrices ? showQuoteBuilder : false).toString()),
                api.updateSetting('show_product_prices', showProductPrices.toString()),
                api.updateSetting('hide_event_home_button', hideEventHomeButton.toString())
            ]);
            mutateHeader();
            mutateQuoteSetting();
            mutatePricesSetting();
            mutateHideEventHome();
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

    const handleGeneratePrompt = () => {
        const promptText = generateAIPrompt(products, caterings);
        setGeneratedPrompt(promptText);
        setCopied(false);
    };

    const handleCopyPrompt = () => {
        try {
            navigator.clipboard.writeText(generatedPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    if (isHeaderLoading || isQuoteSettingLoading || isPricesSettingLoading || isHideEventHomeLoading) {
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
                    {/* Main Toggle: Show Product Prices */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showProductPrices ? '1.5rem' : 0, paddingBottom: showProductPrices ? '1.5rem' : 0, borderBottom: showProductPrices ? '1px solid rgba(175, 68, 72, 0.1)' : 'none' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                Mostra i prezzi dei prodotti
                            </label>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Se disattivato, i prezzi non saranno visibili in tutta l'app (dettagli prodotto, etc.) e la sezione "Crea Preventivo" verrà automaticamente nascosta.
                            </p>
                        </div>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                            <input 
                                type="checkbox" 
                                checked={showProductPrices}
                                onChange={(e) => {
                                    setShowProductPrices(e.target.checked);
                                    if (!e.target.checked) {
                                        setShowQuoteBuilder(false);
                                    }
                                }}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: showProductPrices ? 'var(--color-primary)' : '#ccc',
                                transition: '.4s', borderRadius: '24px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '18px', width: '18px', left: showProductPrices ? '28px' : '4px', bottom: '3px',
                                    backgroundColor: 'white', transition: '.4s', borderRadius: '50%'
                                }}></span>
                            </span>
                        </label>
                    </div>

                    {/* Sub Toggle: Show Quote Builder (only visible/interactable if showProductPrices is true) */}
                    {showProductPrices && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '1.5rem', borderLeft: '3px solid var(--color-primary)' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                    Visibilità Sezione "Crea Preventivo"
                                </label>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    Se attivo, mostra la sezione per comporre preventivi personalizzati nella Home.
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
                    )}
                </div>

                <div className="form-group" style={{ marginTop: '1.5rem', padding: '1.5rem', backgroundColor: 'rgba(175, 68, 72, 0.05)', borderRadius: '12px', border: '1px solid rgba(175, 68, 72, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                                Nascondi tasto "Torna alla Home" negli Eventi
                            </label>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                Se attivato, il pulsante per tornare alla Home Page sarà nascosto nella pagina di condivisione pubblica degli eventi.
                            </p>
                        </div>
                        <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                            <input 
                                type="checkbox" 
                                checked={hideEventHomeButton}
                                onChange={(e) => setHideEventHomeButton(e.target.checked)}
                                style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                backgroundColor: hideEventHomeButton ? 'var(--color-primary)' : '#ccc',
                                transition: '.4s', borderRadius: '24px'
                            }}>
                                <span style={{
                                    position: 'absolute', content: '""', height: '18px', width: '18px', left: hideEventHomeButton ? '28px' : '4px', bottom: '3px',
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

            {/* AI Price Optimization Prompt Generator */}
            <div className="card" style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(245, 247, 250, 0.9))',
                border: '1px solid rgba(156, 39, 176, 0.2)',
                boxShadow: '0 8px 32px 0 rgba(156, 39, 176, 0.08)'
            }}>
                <h2 style={{ marginBottom: '1rem', color: '#9c27b0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={24} className="animate-sparkle" style={{ color: '#9c27b0' }} />
                    Consulente Prezzi con Intelligenza Artificiale
                </h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Genera un prompt personalizzato contenente tutti i dettagli di prodotti e pacchetti (prezzi attuali, ingredienti, pesi, opzioni alimentari) da dare in pasto a una IA esterna (es. ChatGPT, Claude o Gemini).
                    L'IA analizzerà l'inflazione e l'andamento del carrello della spesa in Italia per suggerire i ricarichi ideali e i nuovi prezzi per ogni singolo elemento.
                </p>

                <button
                    onClick={handleGeneratePrompt}
                    disabled={isProductsLoading || isCateringsLoading}
                    className="btn btn-primary"
                    style={{
                        background: 'linear-gradient(45deg, #9c27b0, var(--color-primary))',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        fontWeight: 'bold',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(156, 39, 176, 0.3)',
                        opacity: (isProductsLoading || isCateringsLoading) ? 0.7 : 1,
                        cursor: (isProductsLoading || isCateringsLoading) ? 'not-allowed' : 'pointer'
                    }}
                >
                    {(isProductsLoading || isCateringsLoading) ? (
                        <>
                            <Loader className="animate-spin" size={18} />
                            Caricamento dati...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Genera Prompt per IA
                        </>
                    )}
                </button>

                {generatedPrompt && (
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="bounce-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-text)' }}>Prompt Generato:</span>
                            <button
                                onClick={handleCopyPrompt}
                                className="btn btn-outline"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.4rem 0.8rem',
                                    fontSize: '0.85rem',
                                    borderColor: copied ? '#4CAF50' : 'var(--color-border)',
                                    color: copied ? '#4CAF50' : 'var(--color-text)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copiato!' : 'Copia Prompt'}
                            </button>
                        </div>
                        <textarea
                            readOnly
                            value={generatedPrompt}
                            onClick={(e) => e.target.select()}
                            style={{
                                width: '100%',
                                height: '250px',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontFamily: 'monospace',
                                fontSize: '0.85rem',
                                backgroundColor: '#f9f9f9',
                                color: '#333',
                                resize: 'vertical',
                                whiteSpace: 'pre-wrap'
                            }}
                        />
                    </div>
                )}
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
