import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { useProducts } from '../../hooks/useData';
import { Search, Save, Trash2, Plus, Minus, ExternalLink, RefreshCw, Edit, X, Scale, Hash, ChevronUp, ChevronDown, CheckCircle2, Loader2, Share2, Send, MessageCircle } from 'lucide-react';


const QuoteManager = ({ initialSearchId = '', autoOpenNewModal = false, onModalOpened }) => {
    const { products } = useProducts();
    const [searchId, setSearchId] = useState(initialSearchId);
    const [currentQuote, setCurrentQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItemData, setEditingItemData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isBottomButtonVisible, setIsBottomButtonVisible] = useState(false);
    const bottomButtonRef = useRef(null);
    const bottomSentinelRef = useRef(null);

    const [isModeSelectionOpen, setIsModeSelectionOpen] = useState(false);
    const [isAiPromptOpen, setIsAiPromptOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    // Intersection Observer to detect when we are at the bottom of the page
    useEffect(() => {
        if (!currentQuote || !currentQuote.needs_sync) {
            setIsBottomButtonVisible(false);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Hide FAB if either the bottom button OR the sentinel is visible
                setIsBottomButtonVisible(entry.isIntersecting);
            },
            { threshold: 0 }
        );

        if (bottomSentinelRef.current) {
            observer.observe(bottomSentinelRef.current);
        }

        return () => {
            if (bottomSentinelRef.current) {
                observer.unobserve(bottomSentinelRef.current);
            }
        };
    }, [currentQuote]);

    // Auto-open modal if requested
    useEffect(() => {
        if (autoOpenNewModal) {
            setIsModeSelectionOpen(true);
            if (onModalOpened) onModalOpened();
        }
    }, [autoOpenNewModal, onModalOpened]);

    // Centralized auto-save function
    const autoSave = async (updatedQuote) => {
        setSaving(true);
        try {
            await api.updateQuote(updatedQuote.id, {
                items: updatedQuote.items,
                total_price: updatedQuote.total_price,
                is_gluten_free: updatedQuote.is_gluten_free,
                is_lactose_free: updatedQuote.is_lactose_free,
                is_vegetarian: updatedQuote.is_vegetarian,
                is_vegan: updatedQuote.is_vegan,
                notes: updatedQuote.notes,
                menu_notes: updatedQuote.menu_notes,
                client_name: updatedQuote.client_name,
                event_date: updatedQuote.event_date
            });
            
            // The backend sets needs_sync to true on every update
            setCurrentQuote(prev => ({ ...prev, needs_sync: true }));

            // Show a brief success indicator
            setMessage({ type: 'success', text: 'Modifiche salvate automaticamente' });
            setTimeout(() => setMessage(null), 2000);
        } catch (err) {
            console.error('Auto-save failed:', err);
            setMessage({ type: 'error', text: 'Errore nel salvataggio automatico' });
        } finally {
            setSaving(false);
        }
    };

    const handleShareQuote = async () => {
        let text = `Riepilogo preventivo\n`;
        if (currentQuote && currentQuote.client_name) {
            text += `Nome: ${currentQuote.client_name}\n`;
        }
        text += `Prodotti:\n`;
        if (currentQuote && currentQuote.items) {
            currentQuote.items.forEach(item => {
                const qty = !item.hide_quantity ? `${parseFloat(item.quantity)} ${item.is_sold_by_piece ? 'pz' : 'kg'}` : "";
                text += `- ${item.name}${qty ? ` (${qty})` : ''}\n`;
            });
        }
        
        if (currentQuote?.total_price) {
            text += `\nTotale: € ${Number(currentQuote.total_price).toFixed(2)}\n`;
        }

        if (currentQuote.notes) {
            text += `\nNote sul preventivo:\n${currentQuote.notes}\n`;
        }

        text += `\nLink della pagina share: ${window.location.origin}/quote/${currentQuote.id}`;
        
        // Add marker for Android app interception
        text += `\n\n[MC-ID: ${currentQuote.id}]`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Riepilogo Preventivo Muse Catering',
                    text: text,
                    // Omitting 'url' here to avoid duplicate links in the shared message
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Errore durante la condivisione:', err);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Errore durante la copia:', err);
            }
        }
    };

    const shareToOrderMaster = async () => {
        if (!currentQuote) return;

        let textToShare = `Riepilogo preventivo\n`;
        if (currentQuote.client_name) {
            textToShare += `Nome: ${currentQuote.client_name}\n`;
        }
        textToShare += `Prodotti:\n`;
        if (currentQuote.items) {
            currentQuote.items.forEach(item => {
                const qty = !item.hide_quantity ? `${parseFloat(item.quantity)} ${item.is_sold_by_piece ? 'pz' : 'kg'}` : "";
                textToShare += `- ${item.name}${qty ? ` (${qty})` : ''}\n`;
            });
        }
        
        if (currentQuote.total_price) {
            textToShare += `\nTotale: € ${Number(currentQuote.total_price).toFixed(2)}\n`;
        }

        if (currentQuote.notes) {
            textToShare += `\nNote sul preventivo:\n${currentQuote.notes}\n`;
        }

        textToShare += `\nLink della pagina share: ${window.location.origin}/quote/${currentQuote.id}`;

        // Add marker for Android app interception
        textToShare += `\n\n[MC-ID: ${currentQuote.id}]`;

        const encodedText = encodeURIComponent(textToShare);
        const appPackage = "com.ordermaster.app";
        const fallbackUrl = encodeURIComponent(`https://play.google.com/store/apps/details?id=${appPackage}`);

        const intentUri = `intent:#Intent;` +
            `action=android.intent.action.SEND;` +
            `type=text/plain;` +
            `package=${appPackage};` +
            `S.android.intent.extra.TEXT=${encodedText};` +
            `S.browser_fallback_url=${fallbackUrl};` +
            `end`;

        window.location.href = intentUri;

        // Mark as synced
        try {
            await api.markQuoteSynced(currentQuote.id);
            setCurrentQuote(prev => ({ ...prev, needs_sync: false }));
        } catch (err) {
            console.error('Failed to mark quote as synced:', err);
        }
    };

    const shareToWhatsApp = () => {
        if (!currentQuote) return;

        let textToShare = `Riepilogo preventivo\n`;
        if (currentQuote.client_name) {
            textToShare += `Nome: ${currentQuote.client_name}\n`;
        }
        textToShare += `Prodotti:\n`;
        if (currentQuote.items) {
            currentQuote.items.forEach(item => {
                const qty = !item.hide_quantity ? `${parseFloat(item.quantity)} ${item.is_sold_by_piece ? 'pz' : 'kg'}` : "";
                textToShare += `- ${item.name}${qty ? ` (${qty})` : ''}\n`;
            });
        }
        
        if (currentQuote.total_price) {
            textToShare += `\nTotale: € ${Number(currentQuote.total_price).toFixed(2)}\n`;
        }

        if (currentQuote.notes) {
            textToShare += `\nNote sul preventivo:\n${currentQuote.notes}\n`;
        }

        textToShare += `\nLink della pagina share: ${window.location.origin}/quote/${currentQuote.id}`;
        
        // Add marker for Android app interception
        textToShare += `\n\n[MC-ID: ${currentQuote.id}]`;

        const encodedText = encodeURIComponent(textToShare);
        window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    };

    const handleGenerateAiQuote = async () => {
        if (!aiPrompt.trim()) return;
        setAiLoading(true);
        setMessage(null);
        try {
            const aiData = await api.generateAiQuote(aiPrompt, 'admin');
            
            const newQuote = await api.createQuote({ items: [], total_price: 0 });
            
            const itemsWithIds = (aiData.items || []).map(item => {
                const catalogProduct = products.find(p => p.id === item.id);
                return {
                    ...catalogProduct, // Start with full catalog data (images, etc.)
                    ...item, // Overwrite with AI-specific values (quantity, unit choice)
                    instanceId: `${Date.now()}-${Math.random()}`,
                    quantity: Number(item.quantity) || 1,
                    // Ensure image fields are correctly set if missing in 'item' but present in 'catalogProduct'
                    images: catalogProduct?.images || (catalogProduct?.image_url ? [catalogProduct.image_url] : [])
                };
            });

            const finalQuote = {
                ...newQuote,
                items: itemsWithIds,
                total_price: aiData.total_price || 0,
                is_gluten_free: aiData.is_gluten_free || false,
                is_lactose_free: aiData.is_lactose_free || false
            };

            setSearchId(newQuote.id);
            setCurrentQuote(finalQuote);
            
            await api.updateQuote(newQuote.id, finalQuote, finalQuote.total_price);

            setMessage({ type: 'success', text: 'Preventivo generato con l\'IA! Controlla i dati e applica eventuali correzioni.' });
            setIsAiPromptOpen(false);
            setAiPrompt('');
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: err.message || 'Errore durante la generazione con IA.' });
        } finally {
            setAiLoading(false);
        }
    };

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

        if (idToSearch.includes('/quote/')) {
            const parts = idToSearch.split('/quote/');
            idToSearch = parts[parts.length - 1];
        }

        setLoading(true);
        setMessage(null);
        try {
            const data = await api.getQuote(idToSearch);
            const itemsWithIds = (data.items || []).map(item => ({
                ...item,
                instanceId: item.instanceId || `${Date.now()}-${Math.random()}`
            }));
            setCurrentQuote({ ...data, items: itemsWithIds });
            setSearchId(data.id);
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
            const qty = Number(item.quantity) || 0;

            const price = item.is_sold_by_piece ? pPc : pKg;
            return sum + (price * qty);
        }, 0);
    };

    const updateQuantity = (instanceId, delta) => {
        const updatedItems = currentQuote.items.map(item => {
            if (item.instanceId === instanceId) {
                const currentQty = Number(item.quantity) || 0;
                const increment = Number(item.order_increment) || 1;
                const newQty = Math.max(0, currentQty + (delta * increment));
                // Se la nuova quantità è 0, rimuoviamo l'elemento, altrimenti aggiorniamo
                return newQty <= 0 ? null : { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean);

        const updatedQuote = { 
            ...currentQuote, 
            items: updatedItems
        };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };

    const removeItem = (instanceId) => {
        const updatedItems = currentQuote.items.filter(item => item.instanceId !== instanceId);
        const updatedQuote = { 
            ...currentQuote, 
            items: updatedItems
        };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };

    const moveItem = (index, direction) => {
        const newItems = [...currentQuote.items];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= newItems.length) return;
        
        const temp = newItems[index];
        newItems[index] = newItems[targetIndex];
        newItems[targetIndex] = temp;
        
        const updatedQuote = { ...currentQuote, items: newItems };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };

    const addProductToQuote = (prod) => {
        const newItem = {
            ...prod,
            quantity: prod.min_order_quantity || 1,
            instanceId: Date.now() + Math.random(),
            original_description: prod.description,
            original_menu_description: prod.menu_description
        };
        const updatedItems = [...currentQuote.items, newItem];
        const updatedQuote = { 
            ...currentQuote, 
            items: updatedItems
        };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };

    const refreshProductsFromCatalog = () => {
        const updatedItems = currentQuote.items.map(item => {
            let liveProduct = products.find(p => p.id === item.id);
            if (!liveProduct) {
                liveProduct = products.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase());
            }
            if (!liveProduct) return item;
            
            return {
                ...liveProduct,
                quantity: item.quantity,
                instanceId: item.instanceId,
                is_sold_by_piece: item.is_sold_by_piece, // Preserve user selection
                original_description: liveProduct.description,
                original_menu_description: liveProduct.menu_description
            };
        });

        const updatedQuote = { 
            ...currentQuote, 
            items: updatedItems
        };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
        setMessage({ type: 'success', text: 'Prodotti sincronizzati e salvati!' });
    };

    const handleCreateNewQuote = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const newQuote = await api.createQuote({ items: [], total_price: 0 });
            setSearchId(newQuote.id);
            setCurrentQuote({ ...newQuote, items: [], total_price: 0 });
            setMessage({ type: 'success', text: 'Nuovo preventivo creato!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Errore durante la creazione del preventivo.' });
        } finally {
            setLoading(false);
        }
    };

    const toggleGlobalFlag = (field, value) => {
        const updatedQuote = { ...currentQuote, [field]: value };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };

    const updateItemDetails = () => {
        const updatedItems = currentQuote.items.map(it => it.instanceId === editingItemId ? editingItemData : it);
        const updatedQuote = { ...currentQuote, items: updatedItems };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
        setEditingItemId(null);
        setEditingItemData(null);
    };

    const toggleItemUnit = (item) => {
        const canToggleUnit = Number(item.price_per_kg) > 0 && Number(item.price_per_piece) > 0;
        if (!canToggleUnit) return;

        const updatedItems = currentQuote.items.map(it => {
            if (it.instanceId === item.instanceId) {
                const newIsPieces = !it.is_sold_by_piece;
                return { 
                    ...it, 
                    is_sold_by_piece: newIsPieces,
                    quantity: !newIsPieces ? Math.ceil(it.quantity) : it.quantity
                };
            }
            return it;
        });
        const updatedQuote = { ...currentQuote, items: updatedItems };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };

    const handleManualPriceChange = (val) => {
        const updatedQuote = { ...currentQuote, total_price: parseFloat(val) || 0 };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };

    const applySuggestedTotal = () => {
        const suggested = calculateSuggestedTotal(currentQuote.items);
        handleManualPriceChange(suggested);
    };

    const isQuoteGlutenFree = currentQuote && (currentQuote.is_gluten_free || (currentQuote.items.length > 0 && currentQuote.items.every(item => item.is_gluten_free)));
    const isQuoteLactoseFree = currentQuote && (currentQuote.is_lactose_free || (currentQuote.items.length > 0 && currentQuote.items.every(item => item.is_lactose_free)));

    return (
        <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Gestione Preventivi</h2>
                {saving && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        <Loader2 size={16} className="animate-spin" /> Salvataggio in corso...
                    </div>
                )}
                {message?.type === 'success' && !saving && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2e7d32', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        <CheckCircle2 size={16} /> Modifiche salvate
                    </div>
                )}
            </div>
            
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <input 
                    type="text" 
                    placeholder="Inserisci ID Preventivo (es: UUID)" 
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                />
                <button type="submit" className="btn btn-primary" disabled={loading} title="Cerca">
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </button>
                <button type="button" className="btn btn-outline" disabled={loading} onClick={() => setIsModeSelectionOpen(true)}>
                    Nuovo
                </button>
            </form>

            {message && message.type === 'error' && (
                <div style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    marginBottom: '1.5rem',
                    backgroundColor: '#ffebee',
                    color: '#c62828',
                    border: `1px solid #ef9a9a`
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
                                    {(currentQuote.is_vegetarian || (currentQuote.items.length > 0 && currentQuote.items.every(i => i.is_vegetarian))) && (
                                        <span style={{ color: '#8BC34A', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(139, 195, 74, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                            Vegetariano
                                        </span>
                                    )}
                                    {(currentQuote.is_vegan || (currentQuote.items.length > 0 && currentQuote.items.every(i => i.is_vegan))) && (
                                        <span style={{ color: '#388E3C', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(56, 142, 60, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                            Vegano
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button
                                onClick={handleShareQuote}
                                title="Condividi o copia preventivo"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: copied ? '#4CAF50' : 'var(--color-primary)',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '8px',
                                    backgroundColor: copied ? 'rgba(76, 175, 80, 0.1)' : 'rgba(175, 68, 72, 0.05)'
                                }}
                            >
                                {copied ? <CheckCircle2 size={20} /> : <Share2 size={20} />}
                            </button>
                            <a href={`/quote/${currentQuote.id}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 'bold' }}>
                                Vedi Pagina Pubblica <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Opzioni Dietetiche Globali</h4>
                        <div style={{ display: 'flex', gap: '2rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#FF9800', fontWeight: 'bold' }}>
                                <input 
                                    type="checkbox" 
                                    checked={currentQuote.is_gluten_free || false} 
                                    onChange={e => toggleGlobalFlag('is_gluten_free', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Tutto Senza Glutine
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#03A9F4', fontWeight: 'bold' }}>
                                <input 
                                    type="checkbox" 
                                    checked={currentQuote.is_lactose_free || false} 
                                    onChange={e => toggleGlobalFlag('is_lactose_free', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Tutto Senza Lattosio
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#8BC34A', fontWeight: 'bold' }}>
                                <input 
                                    type="checkbox" 
                                    checked={currentQuote.is_vegetarian || false} 
                                    onChange={e => toggleGlobalFlag('is_vegetarian', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Tutto Vegetariano
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#388E3C', fontWeight: 'bold' }}>
                                <input 
                                    type="checkbox" 
                                    checked={currentQuote.is_vegan || false} 
                                    onChange={e => toggleGlobalFlag('is_vegan', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Tutto Vegano
                            </label>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Prodotti nel preventivo</h4>
                            <button 
                                className="btn btn-outline" 
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }} 
                                onClick={refreshProductsFromCatalog}
                                title="Aggiorna le versioni dei prodotti (immagini, prezzi, descrizioni) con la versione attuale caricata nel catalogo"
                            >
                                <RefreshCw size={16} /> Aggiorna prodotti dal catalogo
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {currentQuote.items.map((item, index) => {
                                const canToggleUnit = Number(item.price_per_kg) > 0 && Number(item.price_per_piece) > 0;
                                if (editingItemId === item.instanceId) {
                                    return (
                                        <div key={item.instanceId} style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--color-primary)' }}>
                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 1, minWidth: '200px' }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Nome Prodotto</label>
                                                    <input type="text" value={editingItemData.name || ''} onChange={e => setEditingItemData({...editingItemData, name: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Descrizione Preventivo</label>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0.4rem' }}>Se vuota, userà la descrizione standard del catalogo.</p>
                                                <textarea value={editingItemData.description || ''} onChange={e => setEditingItemData({...editingItemData, description: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '60px' }} />
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Descrizione Menù Digitale e PDF (Sovrascrittura)</label>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0.4rem' }}>Se compilata, <strong>sostituirà</strong> la descrizione menù del catalogo solo in questo preventivo.</p>
                                                <textarea value={editingItemData.menu_description || ''} onChange={e => setEditingItemData({...editingItemData, menu_description: e.target.value})} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '60px' }} placeholder="Descrizione specifica per il menù..." />
                                            </div>
                                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#FF9800', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.is_gluten_free || false} onChange={e => setEditingItemData({...editingItemData, is_gluten_free: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                                                    Senza Glutine
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#03A9F4', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.is_lactose_free || false} onChange={e => setEditingItemData({...editingItemData, is_lactose_free: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                                                    Senza Lattosio
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#8BC34A', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.is_vegetarian || false} onChange={e => setEditingItemData({...editingItemData, is_vegetarian: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                                                    Vegetariano
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#388E3C', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.is_vegan || false} onChange={e => setEditingItemData({...editingItemData, is_vegan: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                                                    Vegano
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.hide_in_menu || false} onChange={e => setEditingItemData({...editingItemData, hide_in_menu: e.target.checked})} style={{ width: '16px', height: '16px' }} />
                                                    Nascondi nel menù
                                                </label>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                <button className="btn btn-outline" style={{ padding: '0.4rem 1rem' }} onClick={() => { setEditingItemId(null); setEditingItemData(null); }}>Annulla</button>
                                                <button className="btn btn-primary" style={{ padding: '0.4rem 1rem' }} onClick={updateItemDetails}>Salva Dettagli</button>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                <div key={item.instanceId} style={{ display: 'flex', flexDirection: 'column', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', border: '1px solid var(--color-border)', gap: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 'bold', margin: 0, fontSize: '1rem' }}>
                                                {item.name}
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                                                {(currentQuote.is_gluten_free || item.is_gluten_free) && (
                                                    <span style={{ color: '#FF9800', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Senza Glutine
                                                    </span>
                                                )}
                                                {(currentQuote.is_lactose_free || item.is_lactose_free) && (
                                                    <span style={{ color: '#03A9F4', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Senza Lattosio
                                                    </span>
                                                )}
                                                {(currentQuote.is_vegetarian || item.is_vegetarian) && (
                                                    <span style={{ color: '#8BC34A', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(139, 195, 74, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Vegetariano
                                                    </span>
                                                )}
                                                {(currentQuote.is_vegan || item.is_vegan) && (
                                                    <span style={{ color: '#388E3C', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(56, 142, 60, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        Vegano
                                                    </span>
                                                )}
                                            </div>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
                                                Unitario: € {(Number(item.is_sold_by_piece ? item.price_per_piece : item.price_per_kg) || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="btn btn-outline" style={{ padding: '0.4rem', border: 'none', color: 'var(--color-primary)' }} onClick={() => { setEditingItemId(item.instanceId); setEditingItemData({ ...item }); }}>
                                                <Edit size={18} />
                                            </button>
                                            <button style={{ color: '#e63946', background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem' }} onClick={() => removeItem(item.instanceId)}>
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '6px', flexWrap: 'wrap', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', flexDirection: 'row', gap: '0.25rem', marginRight: '0.5rem' }}>
                                                <button 
                                                    className="btn btn-outline" 
                                                    style={{ padding: '0.2rem', visibility: index === 0 ? 'hidden' : 'visible' }} 
                                                    onClick={() => moveItem(index, -1)}
                                                >
                                                    <ChevronUp size={16} />
                                                </button>
                                                <button 
                                                    className="btn btn-outline" 
                                                    style={{ padding: '0.2rem', visibility: index === currentQuote.items.length - 1 ? 'hidden' : 'visible' }} 
                                                    onClick={() => moveItem(index, 1)}
                                                >
                                                    <ChevronDown size={16} />
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <button className="btn btn-outline" style={{ padding: '0.2rem' }} onClick={() => updateQuantity(item.instanceId, -1)}><Minus size={14} /></button>
                                                <input 
                                                    type="number" 
                                                    value={item.quantity} 
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        const updatedItems = currentQuote.items.map(it => it.instanceId === item.instanceId ? { ...it, quantity: val } : it);
                                                        const updatedQuote = { ...currentQuote, items: updatedItems };
                                                        setCurrentQuote(updatedQuote);
                                                        autoSave(updatedQuote);
                                                    }}
                                                    style={{ width: '60px', textAlign: 'center', padding: '0.3rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                />
                                                <button className="btn btn-outline" style={{ padding: '0.2rem' }} onClick={() => updateQuantity(item.instanceId, 1)}><Plus size={14} /></button>
                                                <button 
                                                    type="button" 
                                                    className="btn btn-outline"
                                                    style={{ 
                                                        padding: '0.2rem 0.5rem', 
                                                        borderRadius: '4px',
                                                        marginLeft: '0.25rem',
                                                        opacity: canToggleUnit ? 1 : 0.4,
                                                        cursor: canToggleUnit ? 'pointer' : 'not-allowed',
                                                        color: 'var(--color-primary)',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold',
                                                        minWidth: '35px'
                                                    }} 
                                                    onClick={() => toggleItemUnit(item)}
                                                    title={canToggleUnit ? "Cambia tra Kg e Pezzi" : "Singolo prezzo disponibile"}
                                                >
                                                    {item.is_sold_by_piece ? 'pz' : 'kg'}
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--color-primary-dark)', fontSize: '1.1rem' }}>
                                            Tot: € {( (item.is_sold_by_piece ? (Number(item.price_per_piece) || 0) : (Number(item.price_per_kg) || 0)) * (Number(item.quantity) || 0) ).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
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
                                    {p.is_vegetarian && ' [V]'}
                                    {p.is_vegan && ' [VG]'}
                                    {` (€ ${(Number(p.is_sold_by_piece ? p.price_per_piece : p.price_per_kg) || 0).toFixed(2)})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Nome Cliente *</h4>
                        <input
                            type="text"
                            placeholder="Inserisci il nome del cliente..."
                            value={currentQuote.client_name || ''}
                            onChange={e => {
                                const updatedQuote = { ...currentQuote, client_name: e.target.value || null };
                                setCurrentQuote(updatedQuote);
                                autoSave(updatedQuote);
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Data Evento (Opzionale)</h4>
                        <input
                            type="date"
                            value={currentQuote.event_date ? new Date(currentQuote.event_date).toISOString().split('T')[0] : ''}
                            onChange={e => {
                                const updatedQuote = { ...currentQuote, event_date: e.target.value || null };
                                setCurrentQuote(updatedQuote);
                                autoSave(updatedQuote);
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '8px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Note sul preventivo</h4>
                        <textarea
                            value={currentQuote.notes || ''}
                            onChange={e => {
                                const updatedQuote = { ...currentQuote, notes: e.target.value };
                                setCurrentQuote(updatedQuote);
                                autoSave(updatedQuote);
                            }}
                            placeholder="Inserisci qui eventuali note o messaggi personalizzati per il cliente..."
                            style={{ 
                                width: '100%', 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--color-border)', 
                                minHeight: '100px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Note menù</h4>
                        <textarea
                            value={currentQuote.menu_notes || ''}
                            onChange={e => {
                                const updatedQuote = { ...currentQuote, menu_notes: e.target.value };
                                setCurrentQuote(updatedQuote);
                                autoSave(updatedQuote);
                            }}
                            placeholder="Inserisci qui eventuali note che appariranno solo nel menù digitale e nel PDF..."
                            style={{ 
                                width: '100%', 
                                padding: '1rem', 
                                borderRadius: '8px', 
                                border: '1px solid var(--color-border)', 
                                minHeight: '100px',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <label style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                Prezzo Totale Preventivo (€)
                            </label>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <input 
                                    type="number" 
                                    value={currentQuote.total_price}
                                    onChange={(e) => handleManualPriceChange(e.target.value)}
                                    style={{ 
                                        padding: '1rem', 
                                        borderRadius: '12px', 
                                        border: '2px solid var(--color-primary)', 
                                        fontSize: '1.5rem', 
                                        fontWeight: '800',
                                        width: '200px',
                                        textAlign: 'center',
                                        color: 'var(--color-primary-dark)',
                                        backgroundColor: 'white'
                                    }}
                                />
                                <button 
                                    className="btn btn-outline"
                                    onClick={applySuggestedTotal}
                                    style={{ 
                                        padding: '0.8rem 1.5rem', 
                                        borderRadius: '12px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.2rem',
                                        backgroundColor: 'rgba(175, 68, 72, 0.05)',
                                        border: '1px dashed var(--color-primary)',
                                        minWidth: '150px'
                                    }}
                                >
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 'normal' }}>Applica suggerito:</span>
                                    <span>€ {calculateSuggestedTotal(currentQuote.items).toFixed(2)}</span>
                                </button>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>
                                Il prezzo totale non viene aggiornato automaticamente. Usa il tasto a fianco per applicare il valore calcolato.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {currentQuote && (
                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <button
                        onClick={shareToWhatsApp}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '1.2rem',
                            fontSize: '1.1rem',
                            borderRadius: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            backgroundColor: '#25D366',
                            border: 'none',
                            color: 'white',
                            boxShadow: '0 4px 15px rgba(37, 211, 102, 0.4)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <MessageCircle size={24} /> Condividi su WhatsApp
                    </button>

                    <button
                        ref={bottomButtonRef}
                        onClick={shareToOrderMaster}
                        className={`btn btn-primary ${currentQuote.needs_sync ? 'animate-pulse-strong' : ''}`}
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '1.2rem',
                            fontSize: '1.1rem',
                            borderRadius: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            backgroundColor: '#0052cc',
                            border: 'none',
                            color: 'white',
                            boxShadow: '0 4px 15px rgba(0, 82, 204, 0.4)',
                            transition: 'none' // Disabilita transizioni che bloccano l'animazione
                        }}
                    >
                        <Send size={24} /> Salva su Ordermaster
                    </button>
                </div>
            )}

            {isModeSelectionOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Nuovo</h3>
                            <button onClick={() => setIsModeSelectionOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <p style={{ marginBottom: '2rem', color: 'var(--color-text-muted)' }}>Scegli come vuoi creare il nuovo preventivo:</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '1rem', fontSize: '1.1rem' }} 
                                onClick={() => { setIsModeSelectionOpen(false); handleCreateNewQuote(); }}
                            >
                                Creazione Manuale
                            </button>
                            <button 
                                className="btn btn-primary" 
                                style={{ padding: '1rem', fontSize: '1.1rem', background: 'linear-gradient(45deg, var(--color-primary), #9c27b0)', border: 'none' }} 
                                onClick={() => { setIsModeSelectionOpen(false); setIsAiPromptOpen(true); }}
                            >
                                Intelligenza Artificiale
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAiPromptOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Genera con IA</h3>
                            <button onClick={() => setIsAiPromptOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} disabled={aiLoading}><X size={24} /></button>
                        </div>
                        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Descrivi il catering (es. "Preventivo per un matrimonio di 50 persone, tutto senza glutine, includi 2 tipi di pasta e 1 dolce").</p>
                        <textarea
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            style={{ width: '100%', height: '150px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1rem', resize: 'none' }}
                            placeholder="Scrivi qui il tuo prompt..."
                            disabled={aiLoading}
                        />
                        <button 
                            className="btn btn-primary" 
                            style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }} 
                            onClick={handleGenerateAiQuote}
                            disabled={aiLoading || !aiPrompt.trim()}
                        >
                            {aiLoading ? 'Generazione in corso...' : 'Invia e Genera'}
                        </button>
                    </div>
                </div>
            )}

            {/* OrderMaster FAB - Visible only when currentQuote needs sync and bottom button is NOT visible */}
            {currentQuote && currentQuote.needs_sync && !isBottomButtonVisible && (
                <div 
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        right: '2rem',
                        zIndex: 2000,
                        pointerEvents: 'none' // Allow clicking through the div but not the button
                    }}
                >
                    <button
                        onClick={shareToOrderMaster}
                        className="btn btn-primary animate-pulse-strong"
                        style={{
                            pointerEvents: 'auto', // Re-enable clicks for the button
                            padding: '1rem 1.5rem',
                            borderRadius: '50px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            backgroundColor: '#0052cc',
                            boxShadow: '0 4px 20px rgba(0, 82, 204, 0.6)',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}
                    >
                        <Send size={24} /> Salva su Ordermaster
                    </button>
                </div>
            )}

            {/* Sentinel at the very bottom to hide FAB when user scrolls to the end */}
            <div ref={bottomSentinelRef} style={{ height: '10px', width: '100%' }}></div>
        </div>
    );
};

export default QuoteManager;
