import React, { useState } from 'react';
import { api } from '../../services/api';
import { useProducts } from '../../hooks/useData';
import { Search, Save, Trash2, Plus, Minus, ExternalLink } from 'lucide-react';

const QuoteManager = ({ initialSearchId = '' }) => {
    const { products } = useProducts();
    const [searchId, setSearchId] = useState(initialSearchId);
    const [currentQuote, setCurrentQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [saving, setSaving] = useState(false);

    // Auto-search if initialSearchId is provided
    React.useEffect(() => {
        if (initialSearchId) {
            handleSearch(new Event('submit'));
        }
    }, [initialSearchId]);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        let idToSearch = searchId.trim();
        if (!idToSearch) return;

        // If the user pasted a full URL, extract the last part (the UUID)
        if (idToSearch.includes('/quote/')) {
            const parts = idToSearch.split('/quote/');
            idToSearch = parts[parts.length - 1];
        }

        setLoading(true);
        setMessage(null);
        try {
            const data = await api.getQuote(idToSearch);
            setCurrentQuote(data);
            setSearchId(data.id); // Update input field with the full UUID
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Preventivo non trovato.' });
            setCurrentQuote(null);
        } finally {
            setLoading(false);
        }
    };

    const calculateSuggestedTotal = (items) => {
        return items.reduce((sum, item) => {
            const pKg = Number(item.price_per_kg) || 0;
            const pPc = Number(item.price_per_piece) || 0;
            const pcsKg = Number(item.pieces_per_kg) || 0;
            const qty = Number(item.quantity) || 0;

            const price = item.is_sold_by_piece ? pPc : (pcsKg > 0 ? (pKg / pcsKg) : pKg);
            return sum + (price * qty);
        }, 0);
    };

    const updateQuantity = (instanceId, delta) => {
        const updatedItems = currentQuote.items.map(item => {
            if (item.instanceId === instanceId) {
                const increment = item.order_increment || 1;
                const newQty = Math.max(0, item.quantity + (delta * increment));
                return newQty === 0 ? null : { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean);

        const newSuggestedTotal = calculateSuggestedTotal(updatedItems);
        setCurrentQuote({ 
            ...currentQuote, 
            items: updatedItems, 
            total_price: newSuggestedTotal
        });
    };

    const removeItem = (instanceId) => {
        const updatedItems = currentQuote.items.filter(item => item.instanceId !== instanceId);
        const newSuggestedTotal = calculateSuggestedTotal(updatedItems);
        setCurrentQuote({ 
            ...currentQuote, 
            items: updatedItems, 
            total_price: newSuggestedTotal
        });
    };

    const addProductToQuote = (prod) => {
        const newItem = {
            ...prod,
            quantity: prod.min_order_quantity || 1,
            instanceId: Date.now() + Math.random()
        };
        const updatedItems = [...currentQuote.items, newItem];
        const newSuggestedTotal = calculateSuggestedTotal(updatedItems);
        setCurrentQuote({ 
            ...currentQuote, 
            items: updatedItems, 
            total_price: newSuggestedTotal
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.updateQuote(currentQuote.id, currentQuote.items, currentQuote.total_price);
            setMessage({ type: 'success', text: 'Preventivo aggiornato con successo!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Errore durante il salvataggio.' });
        } finally {
            setSaving(false);
        }
    };

    const isQuoteGlutenFree = currentQuote && currentQuote.items.length > 0 && currentQuote.items.every(item => item.is_gluten_free);
    const isQuoteLactoseFree = currentQuote && currentQuote.items.length > 0 && currentQuote.items.every(item => item.is_lactose_free);

    return (
        <div className="admin-card">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-primary-dark)' }}>Gestione Preventivi Clienti</h2>
            
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input 
                    type="text" 
                    placeholder="Inserisci ID Preventivo (es: UUID)" 
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    <Search size={20} style={{ marginRight: '8px' }} />
                    {loading ? 'Ricerca...' : 'Cerca'}
                </button>
            </form>

            {message && (
                <div style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    marginBottom: '1.5rem',
                    backgroundColor: message.type === 'success' ? '#e8f5e9' : '#ffebee',
                    color: message.type === 'success' ? '#2e7d32' : '#c62828',
                    border: `1px solid ${message.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
                }}>
                    {message.text}
                </div>
            )}

            {currentQuote && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Modifica Preventivo</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <h3 style={{ margin: 0 }}>ID: {currentQuote.id.substring(0, 8)}...</h3>
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    {isQuoteGlutenFree && (
                                        <span style={{ color: '#FF9800', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                            Senza Glutine
                                        </span>
                                    )}
                                    {isQuoteLactoseFree && (
                                        <span style={{ color: '#03A9F4', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                            Senza Lattosio
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <a href={`/quote/${currentQuote.id}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                            Vedi Pagina Pubblica <ExternalLink size={16} />
                        </a>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Prodotti nel preventivo</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {currentQuote.items.map((item) => (
                                <div key={item.instanceId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 'bold', margin: 0 }}>
                                            {item.name}
                                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                {item.is_gluten_free && (
                                                    <span style={{ color: '#FF9800', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Senza Glutine
                                                    </span>
                                                )}
                                                {item.is_lactose_free && (
                                                    <span style={{ color: '#03A9F4', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Senza Lattosio
                                                    </span>
                                                )}
                                            </div>
                                        </p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                            Prezzo unitario applicato: € {(Number(item.is_sold_by_piece ? item.price_per_piece : (item.pieces_per_kg ? (item.price_per_kg / item.pieces_per_kg) : item.price_per_kg)) || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <button className="btn btn-outline" style={{ padding: '0.2rem' }} onClick={() => updateQuantity(item.instanceId, -1)}><Minus size={14} /></button>
                                            <input 
                                                type="number" 
                                                value={item.quantity} 
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    const updatedItems = currentQuote.items.map(it => it.instanceId === item.instanceId ? { ...it, quantity: val } : it);
                                                    const newTotal = updatedItems.reduce((sum, it) => {
                                                        const pKg = Number(it.price_per_kg) || 0;
                                                        const pPc = Number(it.price_per_piece) || 0;
                                                        const pcsKg = Number(it.pieces_per_kg) || 0;
                                                        const price = it.is_sold_by_piece ? pPc : (pcsKg > 0 ? (pKg / pcsKg) : pKg);
                                                        return sum + (price * (Number(it.quantity) || 0));
                                                    }, 0);
                                                    setCurrentQuote({ ...currentQuote, items: updatedItems, total_price: newTotal });
                                                }}
                                                style={{ width: '60px', textAlign: 'center', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                            />
                                            <button className="btn btn-outline" style={{ padding: '0.2rem' }} onClick={() => updateQuantity(item.instanceId, 1)}><Plus size={14} /></button>
                                        </div>
                                        <button style={{ color: '#e63946', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => removeItem(item.instanceId)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Aggiungi Prodotto</h4>
                        <select 
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                            onChange={(e) => {
                                const prod = products.find(p => p.id === parseInt(e.target.value));
                                if (prod) addProductToQuote(prod);
                                e.target.value = "";
                            }}
                        >
                            <option value="">-- Seleziona un prodotto da aggiungere --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} 
                                    {p.is_gluten_free && ' [SG]'}
                                    {p.is_lactose_free && ' [SL]'}
                                    {` (€ ${(Number(p.is_sold_by_piece ? p.price_per_piece : p.price_per_kg) || 0).toFixed(2)})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Totale ricalcolato: </span>
                            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>€ {(Number(currentQuote.total_price) || 0).toFixed(2)}</span>
                            <div style={{ marginTop: '0.5rem' }}>
                                <label style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Sovrascrivi prezzo totale manualmente:</label>
                                <input 
                                    type="number" 
                                    value={currentQuote.total_price}
                                    onChange={(e) => setCurrentQuote({ ...currentQuote, total_price: parseFloat(e.target.value) || 0 })}
                                    style={{ marginLeft: '1rem', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--color-border)', width: '120px' }}
                                />
                            </div>
                        </div>
                        <button className="btn btn-primary" style={{ padding: '1rem 2rem' }} onClick={handleSave} disabled={saving}>
                            <Save size={20} style={{ marginRight: '8px' }} />
                            {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuoteManager;
