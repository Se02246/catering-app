import React, { useState, useRef, useEffect } from 'react';
import { api } from '../../services/api';
import { useProducts } from '../../hooks/useData';
import { Search, Save, Trash2, Plus, Minus, ExternalLink, RefreshCw, Edit, X, Scale, Hash, ChevronUp, ChevronDown, CheckCircle2, Loader2, Share2, Send, MessageCircle, Package, Truck, Check, Navigation, AlertTriangle, ArrowLeft, Calendar, User, Clock, Eye, Sparkles } from 'lucide-react';
import DeliveryCalculatorModal from './DeliveryCalculatorModal';
import { formatDateForInput, formatDateItalian, formatDateTimeItalian } from '../../utils/dateFormatting';

export const PACKAGING_PRODUCT = {
    id: 'imballaggio_service',
    name: 'Imballaggio',
    description: "La nostra missione è confezionare i prodotti così bene che quasi vi dispiacerà aprirli… quasi😋",
    original_description: "La nostra missione è confezionare i prodotti così bene che quasi vi dispiacerà aprirli… quasi😋",
    menu_description: "",
    original_menu_description: "",
    image_url: '/imballaggio.jpeg',
    images: ['/imballaggio.jpeg'],
    is_sold_by_piece: true,
    hide_in_menu: true,
    is_packaging: true
};

export const DELIVERY_PRODUCT = {
    id: 'consegna_service',
    name: 'Consegna',
    description: "Dalla nostra cucina alla vostra tavola, senza tappe intermedie e con l'aria condizionata al massimo 🛞💨",
    original_description: "Dalla nostra cucina alla vostra tavola, senza tappe intermedie e con l'aria condizionata al massimo 🛞💨",
    menu_description: "",
    original_menu_description: "",
    image_url: '/consegna.jpeg',
    images: ['/consegna.jpeg'],
    is_sold_by_piece: true,
    hide_in_menu: true,
    is_delivery: true
};

const createPackagingItem = (price) => ({
    ...PACKAGING_PRODUCT,
    instanceId: `pkg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    price_per_piece: parseFloat(price) || 0,
    price_per_kg: parseFloat(price) || 0,
    quantity: 1
});

const createDeliveryItem = (price) => ({
    ...DELIVERY_PRODUCT,
    instanceId: `del-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    price_per_piece: parseFloat(price) || 0,
    price_per_kg: parseFloat(price) || 0,
    quantity: 1
});

const QuoteManager = ({ initialSearchId = '', autoOpenNewModal = false, onModalOpened }) => {
    const { products } = useProducts();
    const [searchId, setSearchId] = useState(initialSearchId);
    const [currentQuote, setCurrentQuote] = useState(null);
    const [quotesList, setQuotesList] = useState([]);
    const [loadingList, setLoadingList] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItemData, setEditingItemData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isBottomButtonVisible, setIsBottomButtonVisible] = useState(false);
    const bottomButtonRef = useRef(null);
    const bottomSentinelRef = useRef(null);

    const [isAiPromptOpen, setIsAiPromptOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiPackagingCost, setAiPackagingCost] = useState('');
    const [aiDeliveryCost, setAiDeliveryCost] = useState('');
    const [aiLoading, setAiLoading] = useState(false);

    const [packagingCostInput, setPackagingCostInput] = useState('');
    const [deliveryCostInput, setDeliveryCostInput] = useState('');
    const [isDeliveryCalcOpen, setIsDeliveryCalcOpen] = useState(false);

    const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [selectedTagFilter, setSelectedTagFilter] = useState('all');
    const [recentlyAddedId, setRecentlyAddedId] = useState(null);
    const [isConfirmRefreshOpen, setIsConfirmRefreshOpen] = useState(false);

    // Fetch all quotes for the list view
    const fetchQuotes = async () => {
        setLoadingList(true);
        try {
            const data = await api.getQuotes();
            setQuotesList(data || []);
        } catch (err) {
            console.error('Error fetching quotes:', err);
        } finally {
            setLoadingList(false);
        }
    };

    useEffect(() => {
        fetchQuotes();
    }, []);

    const [quoteToDelete, setQuoteToDelete] = useState(null);
    const [quoteToSync, setQuoteToSync] = useState(null);

    // Modal scroll lock
    useEffect(() => {
        if (isAiPromptOpen || isProductPickerOpen || isDeliveryCalcOpen || isConfirmRefreshOpen || quoteToDelete || quoteToSync) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isAiPromptOpen, isProductPickerOpen, isDeliveryCalcOpen, isConfirmRefreshOpen, quoteToDelete, quoteToSync]);

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

    // Auto-open new quote if requested
    useEffect(() => {
        if (autoOpenNewModal) {
            handleCreateNewQuote();
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
                is_traditional: updatedQuote.is_traditional,
                notes: updatedQuote.notes,
                menu_notes: updatedQuote.menu_notes,
                client_name: updatedQuote.client_name,
                event_date: updatedQuote.event_date
            });

            // The backend sets needs_sync to true on every update
            setCurrentQuote(prev => ({ ...prev, needs_sync: true }));

            // Update in quotesList too so the list is always in sync with recent changes!
            setQuotesList(prev => {
                const now = new Date().toISOString();
                const filtered = prev.filter(q => q.id !== updatedQuote.id);
                return [{ ...updatedQuote, needs_sync: true, updated_at: now }, ...filtered];
            });

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
        if (currentQuote && currentQuote.event_date) {
            const itDate = formatDateItalian(currentQuote.event_date);
            if (itDate) {
                text += `Data evento: ${itDate}\n`;
            }
        }
        text += `Prodotti:\n`;
        if (currentQuote && currentQuote.items) {
            currentQuote.items.forEach(item => {
                const qty = !item.hide_quantity ? `${parseFloat(item.quantity)} ${item.is_sold_by_piece ? 'pz' : 'kg'}` : "";
                let dietary = [];
                if (item.is_gluten_free) dietary.push("SG");
                if (item.is_lactose_free) dietary.push("SL");
                if (item.is_vegetarian) dietary.push("VGT");
                if (item.is_vegan) dietary.push("VEG");
                if (item.is_traditional) dietary.push("TRAD");
                const dietaryStr = dietary.length > 0 ? ` [${dietary.join(', ')}]` : "";

                text += `- ${item.name}${dietaryStr}${qty ? ` (${qty})` : ''}\n`;
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

    const shareToOrderMaster = async (targetQuote = currentQuote) => {
        if (!targetQuote) return;

        let textToShare = `Riepilogo preventivo\n`;
        if (targetQuote.client_name) {
            textToShare += `Nome: ${targetQuote.client_name}\n`;
        }
        if (targetQuote.event_date) {
            const itDate = formatDateItalian(targetQuote.event_date);
            if (itDate) {
                textToShare += `Data evento: ${itDate}\n`;
            }
        }
        textToShare += `Prodotti:\n`;
        if (targetQuote.items) {
            targetQuote.items.forEach(item => {
                const qty = !item.hide_quantity ? `${parseFloat(item.quantity)} ${item.is_sold_by_piece ? 'pz' : 'kg'}` : "";
                textToShare += `- ${item.name}${qty ? ` (${qty})` : ''}\n`;
            });
        }

        if (targetQuote.total_price) {
            textToShare += `\nTotale: € ${Number(targetQuote.total_price).toFixed(2)}\n`;
        }

        if (targetQuote.notes) {
            textToShare += `\nNote sul preventivo:\n${targetQuote.notes}\n`;
        }

        textToShare += `\nLink della pagina share: ${window.location.origin}/quote/${targetQuote.id}`;

        // Add marker for Android app interception
        textToShare += `\n\n[MC-ID: ${targetQuote.id}]`;

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
            await api.markQuoteSynced(targetQuote.id);
            if (currentQuote && currentQuote.id === targetQuote.id) {
                setCurrentQuote(prev => ({ ...prev, needs_sync: false }));
            }
            setQuotesList(prev => prev.map(q => q.id === targetQuote.id ? { ...q, needs_sync: false } : q));
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
        if (currentQuote.event_date) {
            const itDate = formatDateItalian(currentQuote.event_date);
            if (itDate) {
                textToShare += `Data evento: ${itDate}\n`;
            }
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

            let finalItems = [...itemsWithIds];
            let extraCost = 0;

            const pkgCostNum = parseFloat(aiPackagingCost);
            if (!isNaN(pkgCostNum) && pkgCostNum > 0) {
                finalItems.push(createPackagingItem(pkgCostNum));
                extraCost += pkgCostNum;
            }

            const delCostNum = parseFloat(aiDeliveryCost);
            if (!isNaN(delCostNum) && delCostNum > 0) {
                finalItems.push(createDeliveryItem(delCostNum));
                extraCost += delCostNum;
            }

            const finalTotalPrice = (Number(aiData.total_price) || 0) + extraCost;

            const finalQuote = {
                ...newQuote,
                items: finalItems,
                total_price: finalTotalPrice,
                is_gluten_free: aiData.is_gluten_free || false,
                is_lactose_free: aiData.is_lactose_free || false,
                is_vegetarian: aiData.is_vegetarian || false,
                is_vegan: aiData.is_vegan || false,
                is_traditional: aiData.is_traditional || false
            };

            setSearchId(newQuote.id);
            setCurrentQuote(finalQuote);
            setQuotesList(prev => [finalQuote, ...prev.filter(q => q.id !== finalQuote.id)]);

            await api.updateQuote(newQuote.id, finalQuote, finalQuote.total_price);

            setMessage({ type: 'success', text: 'Preventivo generato con l\'IA! Controlla i dati e applica eventuali correzioni.' });
            setIsAiPromptOpen(false);
            setAiPrompt('');
            setAiPackagingCost('');
            setAiDeliveryCost('');
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
            handleSearch(null, initialSearchId);
        }
    }, [initialSearchId]);

    const handleSearch = async (e, idParam) => {
        if (e) e.preventDefault();
        let idToSearch = (idParam || searchId).trim();
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

    const openQuote = async (quoteOrId) => {
        const id = typeof quoteOrId === 'string' ? quoteOrId : quoteOrId.id;
        setLoading(true);
        setMessage(null);
        try {
            const data = await api.getQuote(id);
            const itemsWithIds = (data.items || []).map(item => ({
                ...item,
                instanceId: item.instanceId || `${Date.now()}-${Math.random()}`
            }));
            setCurrentQuote({ ...data, items: itemsWithIds });
            setSearchId(data.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error opening quote:', err);
            setMessage({ type: 'error', text: 'Impossibile aprire il preventivo.' });
        } finally {
            setLoading(false);
        }
    };

    const handleBackToList = () => {
        setCurrentQuote(null);
        setSearchId('');
        fetchQuotes();
    };

    const confirmDeleteQuote = async () => {
        if (!quoteToDelete) return;
        const idToDelete = quoteToDelete.id;
        try {
            await api.deleteQuote(idToDelete);
            setMessage({ type: 'success', text: 'Preventivo eliminato con successo.' });
            if (currentQuote && currentQuote.id === idToDelete) {
                setCurrentQuote(null);
            }
            setQuotesList(prev => prev.filter(q => q.id !== idToDelete));
            setQuoteToDelete(null);
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            console.error('Error deleting quote:', err);
            setMessage({ type: 'error', text: 'Errore durante l\'eliminazione del preventivo.' });
        }
    };

    const confirmSyncQuote = async () => {
        if (!quoteToSync) return;
        const target = quoteToSync;
        setQuoteToSync(null);
        await shareToOrderMaster(target);
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
            if (item.is_packaging || item.is_delivery || item.id === 'imballaggio_service' || item.id === 'consegna_service') {
                return item;
            }
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

    const packagingItem = currentQuote?.items?.find(it => it.is_packaging || it.id === 'imballaggio_service' || it.name?.trim().toLowerCase() === 'imballaggio');
    const deliveryItem = currentQuote?.items?.find(it => it.is_delivery || it.id === 'consegna_service' || it.name?.trim().toLowerCase() === 'consegna');

    useEffect(() => {
        if (currentQuote) {
            const pkg = currentQuote.items?.find(it => it.is_packaging || it.id === 'imballaggio_service' || it.name?.trim().toLowerCase() === 'imballaggio');
            const del = currentQuote.items?.find(it => it.is_delivery || it.id === 'consegna_service' || it.name?.trim().toLowerCase() === 'consegna');
            setPackagingCostInput(pkg ? (pkg.price_per_piece !== undefined && pkg.price_per_piece !== null ? String(pkg.price_per_piece) : '') : '');
            setDeliveryCostInput(del ? (del.price_per_piece !== undefined && del.price_per_piece !== null ? String(del.price_per_piece) : '') : '');
        } else {
            setPackagingCostInput('');
            setDeliveryCostInput('');
        }
    }, [currentQuote?.id, currentQuote?.items]);

    const handleApplyPackagingCost = (val) => {
        if (!currentQuote) return;
        const num = parseFloat(val);
        const existingIndex = currentQuote.items.findIndex(it => it.is_packaging || it.id === 'imballaggio_service' || it.name?.trim().toLowerCase() === 'imballaggio');

        let updatedItems;
        if (val === '' || isNaN(num) || num <= 0) {
            if (existingIndex >= 0) {
                updatedItems = currentQuote.items.filter((_, i) => i !== existingIndex);
            } else {
                return;
            }
        } else {
            if (existingIndex >= 0) {
                updatedItems = currentQuote.items.map((it, idx) => {
                    if (idx === existingIndex) {
                        return {
                            ...it,
                            price_per_piece: num,
                            price_per_kg: num,
                            quantity: it.quantity || 1
                        };
                    }
                    return it;
                });
            } else {
                const newItem = createPackagingItem(num);
                updatedItems = [...currentQuote.items, newItem];
            }
        }
        const updatedQuote = { ...currentQuote, items: updatedItems };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };

    const handleApplyDeliveryCost = (val) => {
        if (!currentQuote) return;
        const num = parseFloat(val);
        const existingIndex = currentQuote.items.findIndex(it => it.is_delivery || it.id === 'consegna_service' || it.name?.trim().toLowerCase() === 'consegna');

        let updatedItems;
        if (val === '' || isNaN(num) || num <= 0) {
            if (existingIndex >= 0) {
                updatedItems = currentQuote.items.filter((_, i) => i !== existingIndex);
            } else {
                return;
            }
        } else {
            if (existingIndex >= 0) {
                updatedItems = currentQuote.items.map((it, idx) => {
                    if (idx === existingIndex) {
                        return {
                            ...it,
                            price_per_piece: num,
                            price_per_kg: num,
                            quantity: it.quantity || 1
                        };
                    }
                    return it;
                });
            } else {
                const newItem = createDeliveryItem(num);
                updatedItems = [...currentQuote.items, newItem];
            }
        }
        const updatedQuote = { ...currentQuote, items: updatedItems };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };

    const handleRemovePackaging = () => {
        if (!currentQuote) return;
        const updatedItems = currentQuote.items.filter(it => !(it.is_packaging || it.id === 'imballaggio_service' || it.name?.trim().toLowerCase() === 'imballaggio'));
        const updatedQuote = { ...currentQuote, items: updatedItems };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
        setPackagingCostInput('');
    };

    const handleRemoveDelivery = () => {
        if (!currentQuote) return;
        const updatedItems = currentQuote.items.filter(it => !(it.is_delivery || it.id === 'consegna_service' || it.name?.trim().toLowerCase() === 'consegna'));
        const updatedQuote = { ...currentQuote, items: updatedItems };
        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
        setDeliveryCostInput('');
    };

    const handleCreateNewQuote = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const newQuote = await api.createQuote({ items: [], total_price: 0 });
            setSearchId(newQuote.id);
            const fullQuote = { ...newQuote, items: [], total_price: 0 };
            setCurrentQuote(fullQuote);
            setQuotesList(prev => [fullQuote, ...prev.filter(q => q.id !== fullQuote.id)]);
            setMessage({ type: 'success', text: 'Nuovo preventivo creato!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Errore durante la creazione del preventivo.' });
        } finally {
            setLoading(false);
        }
    };

    const toggleGlobalFlag = (flag, value) => {
        let updatedQuote = { ...currentQuote, [flag]: value };

        // Logical dependency: if Vegan is activated, deactivate Vegetarian and Lactose-Free
        if (flag === 'is_vegan' && value === true) {
            updatedQuote.is_vegetarian = false;
            updatedQuote.is_lactose_free = false;
        }

        setCurrentQuote(updatedQuote);
        autoSave(updatedQuote);
    };


    const handleEditPricePerKgChange = (val) => {
        const pricePerKg = parseFloat(val);
        const liveProduct = products.find(p => p.id === editingItemData?.id) || products.find(p => p.name?.trim().toLowerCase() === editingItemData?.name?.trim().toLowerCase());
        const piecesPerKg = parseFloat(editingItemData?.pieces_per_kg) || parseFloat(liveProduct?.pieces_per_kg) || (
            (parseFloat(editingItemData?.price_per_kg) > 0 && parseFloat(editingItemData?.price_per_piece) > 0)
                ? (parseFloat(editingItemData.price_per_kg) / parseFloat(editingItemData.price_per_piece))
                : null
        );

        let newPricePerPiece = editingItemData?.price_per_piece;
        if (!isNaN(pricePerKg) && piecesPerKg && piecesPerKg > 0) {
            newPricePerPiece = parseFloat((pricePerKg / piecesPerKg).toFixed(2));
        }

        setEditingItemData({
            ...editingItemData,
            price_per_kg: val === '' ? '' : (isNaN(pricePerKg) ? val : pricePerKg),
            price_per_piece: val === '' ? editingItemData?.price_per_piece : newPricePerPiece
        });
    };

    const handleEditPricePerPieceChange = (val) => {
        const pricePerPiece = parseFloat(val);
        const liveProduct = products.find(p => p.id === editingItemData?.id) || products.find(p => p.name?.trim().toLowerCase() === editingItemData?.name?.trim().toLowerCase());
        const piecesPerKg = parseFloat(editingItemData?.pieces_per_kg) || parseFloat(liveProduct?.pieces_per_kg) || (
            (parseFloat(editingItemData?.price_per_kg) > 0 && parseFloat(editingItemData?.price_per_piece) > 0)
                ? (parseFloat(editingItemData.price_per_kg) / parseFloat(editingItemData.price_per_piece))
                : null
        );

        let newPricePerKg = editingItemData?.price_per_kg;
        if (!isNaN(pricePerPiece) && piecesPerKg && piecesPerKg > 0) {
            newPricePerKg = parseFloat((pricePerPiece * piecesPerKg).toFixed(2));
        }

        setEditingItemData({
            ...editingItemData,
            price_per_piece: val === '' ? '' : (isNaN(pricePerPiece) ? val : pricePerPiece),
            price_per_kg: val === '' ? editingItemData?.price_per_kg : newPricePerKg
        });
    };

    const handleEditPiecesPerKgChange = (val) => {
        const piecesPerKg = parseFloat(val);
        const pricePerKg = parseFloat(editingItemData?.price_per_kg);
        const pricePerPiece = parseFloat(editingItemData?.price_per_piece);

        let newPricePerPiece = editingItemData?.price_per_piece;
        let newPricePerKg = editingItemData?.price_per_kg;

        if (!isNaN(piecesPerKg) && piecesPerKg > 0) {
            if (!isNaN(pricePerKg) && pricePerKg > 0) {
                newPricePerPiece = parseFloat((pricePerKg / piecesPerKg).toFixed(2));
            } else if (!isNaN(pricePerPiece) && pricePerPiece > 0) {
                newPricePerKg = parseFloat((pricePerPiece * piecesPerKg).toFixed(2));
            }
        }

        setEditingItemData({
            ...editingItemData,
            pieces_per_kg: val === '' ? '' : val,
            price_per_piece: newPricePerPiece,
            price_per_kg: newPricePerKg
        });
    };

    const updateItemDetails = () => {
        const sanitizedItemData = {
            ...editingItemData,
            price_per_piece: editingItemData.price_per_piece === '' || editingItemData.price_per_piece === null || editingItemData.price_per_piece === undefined ? null : parseFloat(editingItemData.price_per_piece),
            price_per_kg: editingItemData.price_per_kg === '' || editingItemData.price_per_kg === null || editingItemData.price_per_kg === undefined ? null : parseFloat(editingItemData.price_per_kg),
            pieces_per_kg: editingItemData.pieces_per_kg === '' || editingItemData.pieces_per_kg === null || editingItemData.pieces_per_kg === undefined ? null : parseFloat(editingItemData.pieces_per_kg)
        };
        const updatedItems = currentQuote.items.map(it => it.instanceId === editingItemId ? sanitizedItemData : it);
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

    const filteredQuotes = quotesList.filter(q => {
        if (!searchId.trim() || currentQuote) return true;
        const term = searchId.trim().toLowerCase();
        const client = (q.client_name || '').toLowerCase();
        const id = (q.id || '').toLowerCase();
        const notes = (q.notes || '').toLowerCase();
        const eventDateIt = formatDateItalian(q.event_date).toLowerCase();
        const eventDateRaw = (q.event_date || '').toLowerCase();
        return client.includes(term) || id.includes(term) || notes.includes(term) || eventDateIt.includes(term) || eventDateRaw.includes(term);
    });

    const isQuoteGlutenFree = currentQuote && (currentQuote.is_gluten_free || (currentQuote.items.length > 0 && currentQuote.items.every(item => item.is_gluten_free)));
    const isQuoteLactoseFree = currentQuote && (currentQuote.is_lactose_free || (currentQuote.items.length > 0 && currentQuote.items.every(item => item.is_lactose_free)));

    return (
        <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Gestione Preventivi</h2>
                    {!currentQuote && !loadingList && (
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-text-muted)', backgroundColor: '#f0f0f0', padding: '4px 12px', borderRadius: '12px' }}>
                            {quotesList.length} {quotesList.length === 1 ? 'preventivo' : 'preventivi'}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginLeft: 'auto', justifyContent: 'flex-end' }}>
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
                    {!currentQuote && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                disabled={loading}
                                onClick={() => setIsAiPromptOpen(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    borderRadius: '9999px',
                                    padding: '0.65rem 1.25rem',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #7e22ce 0%, var(--color-primary) 100%)',
                                    color: 'white',
                                    border: 'none',
                                    boxShadow: '0 4px 14px rgba(126, 34, 206, 0.35)',
                                    cursor: 'pointer'
                                }}
                                title="Crea un preventivo con l'Intelligenza Artificiale"
                            >
                                <Sparkles size={17} /> Preventivo AI
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={loading}
                                onClick={handleCreateNewQuote}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.45rem',
                                    borderRadius: '9999px',
                                    padding: '0.65rem 1.35rem',
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 14px rgba(155, 57, 61, 0.35)'
                                }}
                            >
                                <Plus size={18} /> Nuovo Preventivo
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Barra Navigazione / Ricerca per la Lista Preventivi */}
            {!currentQuote ? (
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Filtra per cliente, data, note o cerca per ID..."
                            value={searchId}
                            onChange={(e) => setSearchId(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 2.2rem 0.75rem 2.5rem',
                                borderRadius: '10px',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.95rem'
                            }}
                        />
                        {searchId && (
                            <button
                                type="button"
                                onClick={() => setSearchId('')}
                                style={{
                                    position: 'absolute',
                                    right: '0.75rem',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    padding: '2px'
                                }}
                                title="Cancella ricerca"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="btn btn-outline"
                        disabled={loading}
                        title="Cerca per ID esatto"
                        aria-label="Cerca per ID esatto"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px' }}
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                    </button>
                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={fetchQuotes}
                        title="Ricarica lista"
                        style={{ borderRadius: '10px' }}
                        disabled={loadingList}
                    >
                        <RefreshCw size={18} className={loadingList ? 'animate-spin' : ''} />
                    </button>
                </form>
            ) : (
                /* Pulsante Torna alla Lista quando si è in modalità Modifica */
                <div style={{ marginBottom: '1.25rem' }}>
                    <button
                        type="button"
                        onClick={handleBackToList}
                        className="btn btn-outline"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.6rem 1.1rem',
                            fontWeight: '600',
                            borderRadius: '10px',
                            backgroundColor: 'white',
                            boxShadow: 'var(--shadow-sm)'
                        }}
                    >
                        <ArrowLeft size={18} /> Torna alla lista dei preventivi
                    </button>
                </div>
            )}

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

            {/* LISTA DEI PREVENTIVI (quando non è aperto alcun preventivo per la modifica) */}
            {!currentQuote && (
                <div>
                    {loadingList ? (
                        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--color-text-muted)' }}>
                            <Loader2 size={36} className="animate-spin" style={{ color: 'var(--color-primary)', margin: '0 auto 1rem auto' }} />
                            <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>Caricamento preventivi...</p>
                        </div>
                    ) : quotesList.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '3rem 1.5rem',
                            backgroundColor: '#faf8f6',
                            borderRadius: '16px',
                            border: '2px dashed var(--color-border)',
                            margin: '1rem 0'
                        }}>
                            <Package size={48} style={{ color: 'var(--color-primary)', margin: '0 auto 1rem auto', opacity: 0.6 }} />
                            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary-dark)' }}>Nessun preventivo presente</h3>
                            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                Non hai ancora nessun preventivo salvato nel sistema.
                            </p>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleCreateNewQuote}
                                style={{ padding: '0.75rem 1.5rem', fontWeight: 'bold', borderRadius: '9999px' }}
                            >
                                <Plus size={18} /> Crea il primo preventivo
                            </button>
                        </div>
                    ) : filteredQuotes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                            <p style={{ fontSize: '1.05rem', marginBottom: '1rem' }}>
                                Nessun preventivo corrisponde a "<strong>{searchId}</strong>"
                            </p>
                            <button type="button" className="btn btn-outline" onClick={() => setSearchId('')}>
                                Mostra tutti ({quotesList.length})
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                            {filteredQuotes.map((q) => {
                                const itemCount = Array.isArray(q.items) ? q.items.length : 0;
                                const formattedEventDate = formatDateItalian(q.event_date);
                                const formattedUpdated = formatDateTimeItalian(q.updated_at || q.created_at);

                                return (
                                    <div
                                        key={q.id}
                                        style={{
                                            backgroundColor: 'white',
                                            border: '1px solid var(--color-border)',
                                            borderRadius: '14px',
                                            padding: '1.15rem 1.25rem',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.75rem',
                                            transition: 'all 0.2s ease',
                                            position: 'relative'
                                        }}
                                    >
                                        {/* Riga Superiore: Cliente, ID, Prezzo Totale */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                <div style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: '10px',
                                                    backgroundColor: 'rgba(155, 57, 61, 0.1)',
                                                    color: 'var(--color-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-dark)', fontWeight: '700' }}>
                                                        {q.client_name ? q.client_name : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontWeight: 'normal' }}>Cliente non specificato</span>}
                                                    </h4>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                                        ID: {q.id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                <span style={{
                                                    fontSize: '1.15rem',
                                                    fontWeight: '800',
                                                    color: 'var(--color-primary-dark)',
                                                    backgroundColor: 'rgba(155, 57, 61, 0.08)',
                                                    border: '1px solid rgba(155, 57, 61, 0.2)',
                                                    padding: '0.35rem 0.85rem',
                                                    borderRadius: '8px',
                                                    letterSpacing: '-0.3px'
                                                }}>
                                                    € {Number(q.total_price || 0).toFixed(2)}
                                                </span>

                                                {/* Icona in alto a destra nel caso di mancata sincronizzazione con OrderMaster */}
                                                {q.needs_sync && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setQuoteToSync(q);
                                                        }}
                                                        title="Mancata sincronizzazione: clicca per salvare su OrderMaster"
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: '34px',
                                                            height: '34px',
                                                            borderRadius: '50%',
                                                            backgroundColor: '#0052cc',
                                                            color: 'white',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 2px 8px rgba(0, 82, 204, 0.4)',
                                                            flexShrink: 0
                                                        }}
                                                        className="animate-pulse-strong"
                                                    >
                                                        <Send size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Riga Intermedia: Dati Evento, Modifica, Prodotti, Badge */}
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            fontSize: '0.85rem',
                                            color: 'var(--color-text-muted)',
                                            paddingTop: '0.35rem',
                                            borderTop: '1px dashed var(--color-border)'
                                        }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: q.event_date ? 'var(--color-primary-dark)' : 'inherit', fontWeight: q.event_date ? '600' : 'normal' }}>
                                                <Calendar size={15} style={{ color: 'var(--color-primary)' }} />
                                                {formattedEventDate ? `Data evento: ${formattedEventDate}` : 'Nessuna data evento'}
                                            </span>

                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Clock size={15} />
                                                {formattedUpdated ? `Modificato: ${formattedUpdated}` : 'Recente'}
                                            </span>

                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Package size={15} />
                                                {itemCount} {itemCount === 1 ? 'prodotto' : 'prodotti'}
                                            </span>

                                            {q.needs_sync ? (
                                                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#b45309', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                                                    Da sincronizzare
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#15803d', backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 8px', borderRadius: '12px' }}>
                                                    ✓ Sincronizzato
                                                </span>
                                            )}

                                            <div style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center' }}>
                                                {q.is_gluten_free && (
                                                    <span style={{ color: '#FF9800', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        SG
                                                    </span>
                                                )}
                                                {q.is_lactose_free && (
                                                    <span style={{ color: '#03A9F4', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        SL
                                                    </span>
                                                )}
                                                {q.is_vegetarian && (
                                                    <span style={{ color: '#8BC34A', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(139, 195, 74, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        VGT
                                                    </span>
                                                )}
                                                {q.is_vegan && (
                                                    <span style={{ color: '#388E3C', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(56, 142, 60, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        VEG
                                                    </span>
                                                )}
                                                {q.is_traditional && (
                                                    <span style={{ color: '#B45309', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(180, 83, 9, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                        TRAD
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Note se presenti */}
                                        {q.notes && (
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.83rem',
                                                color: 'var(--color-text-muted)',
                                                fontStyle: 'italic',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                Note: "{q.notes}"
                                            </p>
                                        )}

                                        {/* Riga Azioni: Modifica, Condividi, Elimina */}
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                                            <button
                                                type="button"
                                                className="btn btn-outline"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setQuoteToDelete(q);
                                                }}
                                                title="Elimina preventivo"
                                                style={{
                                                    padding: '0.5rem 0.65rem',
                                                    color: '#c62828',
                                                    borderColor: '#ffcdd2',
                                                    backgroundColor: 'rgba(244, 67, 54, 0.04)',
                                                    borderRadius: '8px'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <a
                                                href={`/quote/${q.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-outline"
                                                style={{
                                                    padding: '0.5rem 0.9rem',
                                                    fontSize: '0.85rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.4rem',
                                                    borderRadius: '8px',
                                                    textDecoration: 'none'
                                                }}
                                                title="Apri riepilogo pubblico cliente"
                                            >
                                                <ExternalLink size={15} /> Vedi
                                            </a>

                                            <button
                                                type="button"
                                                className="btn btn-primary"
                                                onClick={() => openQuote(q)}
                                                style={{
                                                    padding: '0.5rem 1.25rem',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.45rem',
                                                    borderRadius: '8px',
                                                    boxShadow: '0 2px 8px rgba(155, 57, 61, 0.2)'
                                                }}
                                            >
                                                <Edit size={16} /> Modifica
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
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
                                    {(currentQuote.is_traditional || (currentQuote.items.length > 0 && currentQuote.items.every(i => i.is_traditional))) && (
                                        <span style={{ color: '#B45309', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(180, 83, 9, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                            Tradizionale
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#FF9800', fontWeight: 'bold', flexWrap: 'wrap' }}>
                                <input
                                    type="checkbox"
                                    checked={currentQuote.is_gluten_free || false}
                                    onChange={e => toggleGlobalFlag('is_gluten_free', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Tutto Senza Glutine
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#03A9F4', fontWeight: 'bold', flexWrap: 'wrap' }}>
                                <input
                                    type="checkbox"
                                    checked={currentQuote.is_lactose_free || false}
                                    onChange={e => toggleGlobalFlag('is_lactose_free', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Tutto Senza Lattosio
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#8BC34A', fontWeight: 'bold', flexWrap: 'wrap' }}>
                                <input
                                    type="checkbox"
                                    checked={currentQuote.is_vegetarian || false}
                                    onChange={e => toggleGlobalFlag('is_vegetarian', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Tutto Vegetariano
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#388E3C', fontWeight: 'bold', flexWrap: 'wrap' }}>
                                <input
                                    type="checkbox"
                                    checked={currentQuote.is_vegan || false}
                                    onChange={e => toggleGlobalFlag('is_vegan', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Tutto Vegano
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#B45309', fontWeight: 'bold', flexWrap: 'wrap' }}>
                                <input
                                    type="checkbox"
                                    checked={currentQuote.is_traditional || false}
                                    onChange={e => toggleGlobalFlag('is_traditional', e.target.checked)}
                                    style={{ width: '18px', height: '18px' }}
                                />
                                Tutto Tradizionale
                            </label>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <h4 style={{ margin: 0 }}>Prodotti nel preventivo</h4>
                            <button
                                type="button"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8rem',
                                    color: 'var(--color-text-muted)',
                                    background: 'rgba(0, 0, 0, 0.02)',
                                    border: '1px solid rgba(0, 0, 0, 0.12)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    fontWeight: '500'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.color = 'var(--color-text)';
                                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.25)';
                                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.color = 'var(--color-text-muted)';
                                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.12)';
                                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                                }}
                                onClick={() => setIsConfirmRefreshOpen(true)}
                                title="Aggiorna le versioni dei prodotti (immagini, prezzi, descrizioni) con la versione attuale caricata nel catalogo"
                            >
                                <RefreshCw size={13} style={{ opacity: 0.7 }} /> Aggiorna prodotti dal catalogo
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {currentQuote.items.map((item, index) => {
                                const canToggleUnit = Number(item.price_per_kg) > 0 && Number(item.price_per_piece) > 0;
                                if (editingItemId === item.instanceId) {
                                    return (
                                        <div key={item.instanceId} style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid var(--color-primary)' }}>
                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                                <div style={{ flex: 2, minWidth: '180px' }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Nome Prodotto</label>
                                                    <input type="text" value={editingItemData.name || ''} onChange={e => setEditingItemData({ ...editingItemData, name: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }} />
                                                </div>
                                                <div style={{ flex: 1, minWidth: '100px' }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Pezzi / kg</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={editingItemData.pieces_per_kg !== null && editingItemData.pieces_per_kg !== undefined ? editingItemData.pieces_per_kg : ''}
                                                        onChange={e => handleEditPiecesPerKgChange(e.target.value)}
                                                        placeholder="es. 20"
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1, minWidth: '110px' }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Prezzo pz (€)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editingItemData.price_per_piece !== null && editingItemData.price_per_piece !== undefined ? editingItemData.price_per_piece : ''}
                                                        onChange={e => handleEditPricePerPieceChange(e.target.value)}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1, minWidth: '110px' }}>
                                                    <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Prezzo kg (€)</label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editingItemData.price_per_kg !== null && editingItemData.price_per_kg !== undefined ? editingItemData.price_per_kg : ''}
                                                        onChange={e => handleEditPricePerKgChange(e.target.value)}
                                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)' }}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Descrizione Preventivo</label>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0.4rem' }}>Se vuota, userà la descrizione standard del catalogo.</p>
                                                <textarea value={editingItemData.description || ''} onChange={e => setEditingItemData({ ...editingItemData, description: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '60px' }} />
                                            </div>
                                            <div style={{ marginBottom: '1rem' }}>
                                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Descrizione Menù Digitale e PDF (Sovrascrittura)</label>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.2rem 0 0.4rem' }}>Se compilata, <strong>sostituirà</strong> la descrizione menù del catalogo solo in questo preventivo.</p>
                                                <textarea value={editingItemData.menu_description || ''} onChange={e => setEditingItemData({ ...editingItemData, menu_description: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--color-border)', minHeight: '60px' }} placeholder="Descrizione specifica per il menù..." />
                                            </div>
                                            <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#FF9800', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.is_gluten_free || false} onChange={e => setEditingItemData({ ...editingItemData, is_gluten_free: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                                    Senza Glutine
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#03A9F4', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.is_lactose_free || false} onChange={e => setEditingItemData({ ...editingItemData, is_lactose_free: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                                    Senza Lattosio
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#8BC34A', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.is_vegetarian || false} onChange={e => setEditingItemData({ ...editingItemData, is_vegetarian: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                                    Vegetariano
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#388E3C', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.is_vegan || false} onChange={e => {
                                                        const isChecked = e.target.checked;
                                                        if (isChecked) {
                                                            setEditingItemData({
                                                                ...editingItemData,
                                                                is_vegan: true,
                                                                is_vegetarian: false,
                                                                is_lactose_free: false
                                                            });
                                                        } else {
                                                            setEditingItemData({ ...editingItemData, is_vegan: false });
                                                        }
                                                    }} style={{ width: '16px', height: '16px' }} />
                                                    Vegano
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#B45309', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.is_traditional || false} onChange={e => setEditingItemData({ ...editingItemData, is_traditional: e.target.checked })} style={{ width: '16px', height: '16px' }} />
                                                    Tradizionale
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editingItemData.is_sold_by_piece || false}
                                                        onChange={e => {
                                                            const val = e.target.checked;
                                                            setEditingItemData({
                                                                ...editingItemData,
                                                                is_sold_by_piece: val,
                                                                quantity: !val ? Math.ceil(editingItemData.quantity) : editingItemData.quantity
                                                            });
                                                        }}
                                                        style={{ width: '16px', height: '16px' }}
                                                    />
                                                    Venduto a Pezzi (pz)
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                    <input type="checkbox" checked={editingItemData.hide_in_menu || false} onChange={e => setEditingItemData({ ...editingItemData, hide_in_menu: e.target.checked })} style={{ width: '16px', height: '16px' }} />
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
                                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flex: 1 }}>
                                                {(() => {
                                                    const liveProduct = products.find(p => p.id === item.id) || products.find(p => p.name?.trim().toLowerCase() === item.name?.trim().toLowerCase());
                                                    const imgUrl = item.image_url || (item.images && item.images[0]) || liveProduct?.image_url || 'https://placehold.co/50x50?text=Food';
                                                    return (
                                                        <div style={{ width: '50px', height: '50px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                                                            <img
                                                                src={imgUrl}
                                                                alt={item.name}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/50x50?text=No+Img'; }}
                                                            />
                                                        </div>
                                                    );
                                                })()}
                                                <div>
                                                    <p style={{ fontWeight: 'bold', margin: 0, fontSize: '1rem' }}>
                                                        {item.name}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
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
                                                        {(currentQuote.is_traditional || item.is_traditional) && (
                                                            <span style={{ color: '#B45309', fontSize: '0.65rem', fontWeight: 'bold', backgroundColor: 'rgba(180, 83, 9, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                                Tradizionale
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0 0' }}>
                                                        Unitario: € {(Number(item.is_sold_by_piece ? item.price_per_piece : item.price_per_kg) || 0).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '0.4rem', border: 'none', color: 'var(--color-primary)' }}
                                                    onClick={() => {
                                                        const liveProduct = products.find(p => p.id === item.id) || products.find(p => p.name?.trim().toLowerCase() === item.name?.trim().toLowerCase());
                                                        setEditingItemId(item.instanceId);
                                                        setEditingItemData({
                                                            ...item,
                                                            pieces_per_kg: item.pieces_per_kg !== undefined && item.pieces_per_kg !== null ? item.pieces_per_kg : (liveProduct?.pieces_per_kg || '')
                                                        });
                                                    }}
                                                >
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
                                                Tot: € {((item.is_sold_by_piece ? (Number(item.price_per_piece) || 0) : (Number(item.price_per_kg) || 0)) * (Number(item.quantity) || 0)).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h4 style={{ marginBottom: '1rem' }}>Aggiungi Prodotto</h4>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => {
                                setProductSearchTerm('');
                                setSelectedTagFilter('all');
                                setIsProductPickerOpen(true);
                            }}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                borderRadius: '12px',
                                border: '2px dashed var(--color-primary)',
                                backgroundColor: 'rgba(155, 57, 61, 0.03)',
                                color: 'var(--color-primary-dark)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                fontSize: '1.05rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(155, 57, 61, 0.08)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(155, 57, 61, 0.03)'}
                        >
                            <Plus size={22} style={{ color: 'var(--color-primary)' }} />
                            <span>Cerca e Seleziona Prodotto da Aggiungere</span>
                        </button>
                    </div>

                    {/* Sezione Imballaggio e Consegna */}
                    <div style={{ marginBottom: '2.5rem', backgroundColor: 'rgba(255,255,255,0.7)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                            <Package size={22} style={{ color: 'var(--color-primary)' }} />
                            Imballaggio e Consegna
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 1.25rem 0' }}>
                            Configura i costi di imballaggio e consegna. Verranno aggiunti come normali prodotti alla fine del preventivo (non compariranno nel menù digitale né nel PDF).
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            {/* Card Imballaggio */}
                            <div style={{
                                backgroundColor: packagingItem ? 'rgba(76, 175, 80, 0.04)' : 'white',
                                border: `1.5px solid ${packagingItem ? '#4CAF50' : 'var(--color-border)'}`,
                                borderRadius: '12px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '1rem',
                                transition: 'all 0.2s ease'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                                            <img
                                                src="/imballaggio.jpeg"
                                                alt="Imballaggio"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <h5 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>Imballaggio</h5>
                                                {packagingItem ? (
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                        ✓ Incluso (€ {(Number(packagingItem.price_per_piece) || 0).toFixed(2)})
                                                    </span>
                                                ) : (
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                                                        Non incluso
                                                    </span>
                                                )}
                                            </div>
                                            <span style={{ fontSize: '0.7rem', color: '#888', display: 'inline-block', marginTop: '2px' }}>
                                                Nascosto nel menù/PDF
                                            </span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>
                                        "{PACKAGING_PRODUCT.description}"
                                    </p>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>€</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={packagingCostInput}
                                            onChange={e => setPackagingCostInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleApplyPackagingCost(packagingCostInput);
                                                }
                                            }}
                                            onBlur={() => handleApplyPackagingCost(packagingCostInput)}
                                            style={{
                                                width: '100%',
                                                padding: '0.6rem 0.6rem 0.6rem 2rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--color-border)',
                                                fontSize: '0.95rem',
                                                fontWeight: '600'
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => handleApplyPackagingCost(packagingCostInput)}
                                        style={{ padding: '0.6rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                                    >
                                        {packagingItem ? 'Aggiorna' : 'Aggiungi'}
                                    </button>
                                    {packagingItem && (
                                        <button
                                            type="button"
                                            onClick={handleRemovePackaging}
                                            title="Rimuovi imballaggio dal preventivo"
                                            style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', padding: '0.5rem' }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Card Consegna */}
                            <div style={{
                                backgroundColor: deliveryItem ? 'rgba(76, 175, 80, 0.04)' : 'white',
                                border: `1.5px solid ${deliveryItem ? '#4CAF50' : 'var(--color-border)'}`,
                                borderRadius: '12px',
                                padding: '1.25rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                gap: '1rem',
                                transition: 'all 0.2s ease'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, boxShadow: 'var(--shadow-sm)' }}>
                                                <img
                                                    src="/consegna.jpeg"
                                                    alt="Consegna"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <h5 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>Consegna</h5>
                                                    {deliveryItem ? (
                                                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                                            ✓ Incluso (€ {(Number(deliveryItem.price_per_piece) || 0).toFixed(2)})
                                                        </span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', backgroundColor: '#f0f0f0', padding: '2px 6px', borderRadius: '4px' }}>
                                                            Non incluso
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '0.7rem', color: '#888', display: 'inline-block', marginTop: '2px' }}>
                                                    Nascosto nel menù/PDF
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', margin: 0, lineHeight: '1.4' }}>
                                        "{DELIVERY_PRODUCT.description}"
                                    </p>
                                </div>

                                {/* Opzione Principale: Calcola con IA e Mappe */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setIsDeliveryCalcOpen(true)}
                                        className="btn btn-primary"
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.6rem',
                                            padding: '0.85rem 1.25rem',
                                            borderRadius: '12px',
                                            fontSize: '0.95rem',
                                            fontWeight: '700',
                                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                                            boxShadow: '0 4px 14px rgba(155, 57, 61, 0.25)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            border: 'none'
                                        }}
                                    >
                                        <Navigation size={18} /> Calcola Costo Consegna (IA)
                                    </button>
                                </div>

                                {/* Opzione Secondaria: Inserimento Manuale */}
                                <div style={{
                                    paddingTop: '0.75rem',
                                    borderTop: '1px dashed var(--color-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.4rem'
                                }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                                        oppure inserisci il prezzo manualmente:
                                    </span>
                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', flex: 1 }}>
                                            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>€</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={deliveryCostInput}
                                                onChange={e => setDeliveryCostInput(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleApplyDeliveryCost(deliveryCostInput);
                                                    }
                                                }}
                                                onBlur={() => handleApplyDeliveryCost(deliveryCostInput)}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem 0.6rem 0.5rem 2rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--color-border)',
                                                    fontSize: '0.9rem',
                                                    fontWeight: '600',
                                                    backgroundColor: '#fafafa'
                                                }}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-outline"
                                            onClick={() => handleApplyDeliveryCost(deliveryCostInput)}
                                            style={{ padding: '0.5rem 0.9rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                                        >
                                            {deliveryItem ? 'Aggiorna manuale' : 'Salva manuale'}
                                        </button>
                                        {deliveryItem && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveDelivery}
                                                title="Rimuovi consegna dal preventivo"
                                                style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', padding: '0.4rem' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
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
                            value={formatDateForInput(currentQuote.event_date)}
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



            {isAiPromptOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Genera con IA</h3>
                            <button onClick={() => setIsAiPromptOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }} disabled={aiLoading}><X size={24} /></button>
                        </div>
                        <p style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Descrivi il catering (es. "Preventivo per un matrimonio di 50 persone, tutto senza glutine, includi 2 tipi di pasta e 1 dolce").</p>
                        
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.55rem 0.85rem',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(126, 34, 206, 0.08)',
                            color: '#7e22ce',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            marginBottom: '1rem'
                        }}>
                            <Sparkles size={16} style={{ flexShrink: 0 }} />
                            <span>L'IA analizzerà gli ultimi 20 preventivi sincronizzati per apprendere abbinamenti e dosaggi ideali.</span>
                        </div>

                        <textarea
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            style={{ width: '100%', height: '120px', padding: '1rem', borderRadius: '8px', border: '1px solid var(--color-border)', marginBottom: '1rem', resize: 'none' }}
                            placeholder="Scrivi qui il tuo prompt..."
                            disabled={aiLoading}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--color-primary-dark)' }}>
                                    <Package size={16} style={{ color: 'var(--color-primary)' }} /> Imballaggio (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="es. 15.00 (opz.)"
                                    value={aiPackagingCost}
                                    onChange={e => setAiPackagingCost(e.target.value)}
                                    disabled={aiLoading}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--color-primary-dark)' }}>
                                    <Truck size={16} style={{ color: 'var(--color-primary)' }} /> Consegna (€)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="es. 25.00 (opz.)"
                                    value={aiDeliveryCost}
                                    onChange={e => setAiDeliveryCost(e.target.value)}
                                    disabled={aiLoading}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.9rem' }}
                                />
                            </div>
                        </div>

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

            {isProductPickerOpen && (
                <div
                    className="modal-overlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 3000
                    }}
                >
                    <div
                        className="modal-content bounce-in"
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '24px',
                            width: '95vw',
                            maxWidth: '780px',
                            maxHeight: '88vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: 'var(--shadow-xl)'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            backgroundColor: 'white'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
                                    Seleziona Prodotto
                                </h3>
                                <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    Scegli uno o più prodotti da aggiungere al preventivo
                                </p>
                            </div>
                            <button
                                onClick={() => setIsProductPickerOpen(false)}
                                className="btn btn-outline"
                                style={{ padding: '0.5rem', borderRadius: '50%', width: '38px', height: '38px' }}
                                title="Chiudi"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search & Tag Filter Section */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            backgroundColor: 'rgba(155, 57, 61, 0.02)',
                            borderBottom: '1px solid var(--color-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            {/* Search Input */}
                            <div style={{ position: 'relative' }}>
                                <Search
                                    size={18}
                                    style={{
                                        position: 'absolute',
                                        left: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: 'var(--color-text-muted)',
                                        pointerEvents: 'none'
                                    }}
                                />
                                <input
                                    type="text"
                                    placeholder="Cerca per nome, descrizione, tag..."
                                    value={productSearchTerm}
                                    onChange={e => setProductSearchTerm(e.target.value)}
                                    autoFocus
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem 2.5rem 0.75rem 2.75rem',
                                        borderRadius: 'var(--radius-full)',
                                        border: '1px solid var(--color-border)',
                                        backgroundColor: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none',
                                        boxShadow: 'var(--shadow-sm)'
                                    }}
                                />
                                {productSearchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setProductSearchTerm('')}
                                        style={{
                                            position: 'absolute',
                                            right: '0.75rem',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            padding: '0.25rem',
                                            cursor: 'pointer',
                                            color: 'var(--color-text-muted)',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        title="Cancella ricerca"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>

                            {/* Dietary Chips */}
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                {[
                                    { key: 'all', label: 'Tutti' },
                                    { key: 'gluten_free', label: 'Senza Glutine', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.1)' },
                                    { key: 'lactose_free', label: 'Senza Lattosio', color: '#03A9F4', bg: 'rgba(3, 169, 244, 0.1)' },
                                    { key: 'vegetarian', label: 'Vegetariano', color: '#8BC34A', bg: 'rgba(139, 195, 74, 0.1)' },
                                    { key: 'vegan', label: 'Vegano', color: '#388E3C', bg: 'rgba(56, 142, 60, 0.1)' },
                                    { key: 'traditional', label: 'Tradizionale', color: '#B45309', bg: 'rgba(180, 83, 9, 0.1)' },
                                    { key: 'salato', label: 'Salato', color: '#0D9488', bg: 'rgba(13, 148, 136, 0.1)' },
                                    { key: 'dolce', label: 'Dolce', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.1)' }
                                ].map(chip => {
                                    const isSelected = selectedTagFilter === chip.key;
                                    return (
                                        <button
                                            key={chip.key}
                                            type="button"
                                            onClick={() => setSelectedTagFilter(chip.key)}
                                            style={{
                                                padding: '0.35rem 0.75rem',
                                                borderRadius: '20px',
                                                border: isSelected
                                                    ? `1.5px solid ${chip.color || 'var(--color-primary)'}`
                                                    : '1px solid var(--color-border)',
                                                backgroundColor: isSelected
                                                    ? (chip.bg || 'var(--color-primary)')
                                                    : 'white',
                                                color: isSelected
                                                    ? (chip.color || 'white')
                                                    : 'var(--color-text)',
                                                fontWeight: isSelected ? '700' : '500',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease'
                                            }}
                                        >
                                            {chip.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Product List */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem'
                        }}>
                            {(() => {
                                const filtered = products
                                    .filter(p => !p.hide_from_quotes)
                                    .filter(p => {
                                        if (productSearchTerm.trim()) {
                                            const term = productSearchTerm.toLowerCase();
                                            const matchName = (p.name || '').toLowerCase().includes(term);
                                            const matchDesc = (p.description || '').toLowerCase().includes(term);
                                            const matchMenuDesc = (p.menu_description || '').toLowerCase().includes(term);
                                            if (!matchName && !matchDesc && !matchMenuDesc) return false;
                                        }
                                        if (selectedTagFilter === 'gluten_free' && !p.is_gluten_free) return false;
                                        if (selectedTagFilter === 'lactose_free' && !p.is_lactose_free) return false;
                                        if (selectedTagFilter === 'vegetarian' && !p.is_vegetarian && !p.is_vegan) return false;
                                        if (selectedTagFilter === 'vegan' && !p.is_vegan) return false;
                                        if (selectedTagFilter === 'traditional' && !p.is_traditional) return false;
                                        if (selectedTagFilter === 'salato' && !p.is_savory) return false;
                                        if (selectedTagFilter === 'dolce' && !p.is_sweet) return false;
                                        return true;
                                    });

                                if (filtered.length === 0) {
                                    return (
                                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                                            <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600' }}>Nessun prodotto trovato</p>
                                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>Prova a modificare il termine di ricerca o i filtri dietetici.</p>
                                        </div>
                                    );
                                }

                                return filtered.map(p => {
                                    const isAddedJustNow = recentlyAddedId === p.id;
                                    const existingCount = currentQuote.items.filter(it => it.id === p.id || it.name?.trim().toLowerCase() === p.name?.trim().toLowerCase()).length;
                                    const imgUrl = p.image_url || (p.images && p.images[0]) || 'https://placehold.co/80x80?text=Food';

                                    return (
                                        <div
                                            key={p.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '0.85rem 1rem',
                                                borderRadius: '12px',
                                                border: isAddedJustNow
                                                    ? '1.5px solid #4CAF50'
                                                    : '1px solid var(--color-border)',
                                                backgroundColor: isAddedJustNow
                                                    ? 'rgba(76, 175, 80, 0.05)'
                                                    : 'white',
                                                gap: '1rem',
                                                transition: 'all 0.2s ease',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
                                                <img
                                                    src={imgUrl}
                                                    alt={p.name}
                                                    style={{
                                                        width: '54px',
                                                        height: '54px',
                                                        objectFit: 'cover',
                                                        borderRadius: '8px',
                                                        flexShrink: 0,
                                                        border: '1px solid var(--color-border)'
                                                    }}
                                                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80?text=Food'; }}
                                                />
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                        <h5 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-text)' }}>
                                                            {p.name}
                                                        </h5>
                                                        {existingCount > 0 && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                backgroundColor: 'rgba(155, 57, 61, 0.1)',
                                                                color: 'var(--color-primary)',
                                                                fontWeight: 'bold',
                                                                padding: '1px 6px',
                                                                borderRadius: '10px'
                                                            }}>
                                                                Nel preventivo ({existingCount})
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Dietary badges */}
                                                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', margin: '0.2rem 0' }}>
                                                        {p.is_gluten_free && (
                                                            <span style={{ color: '#FF9800', fontSize: '0.68rem', fontWeight: 'bold', backgroundColor: 'rgba(255, 152, 0, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                                Senza Glutine
                                                            </span>
                                                        )}
                                                        {p.is_lactose_free && (
                                                            <span style={{ color: '#03A9F4', fontSize: '0.68rem', fontWeight: 'bold', backgroundColor: 'rgba(3, 169, 244, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                                Senza Lattosio
                                                            </span>
                                                        )}
                                                        {p.is_vegetarian && (
                                                            <span style={{ color: '#8BC34A', fontSize: '0.68rem', fontWeight: 'bold', backgroundColor: 'rgba(139, 195, 74, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                                Vegetariano
                                                            </span>
                                                        )}
                                                        {p.is_vegan && (
                                                            <span style={{ color: '#388E3C', fontSize: '0.68rem', fontWeight: 'bold', backgroundColor: 'rgba(56, 142, 60, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                                Vegano
                                                            </span>
                                                        )}
                                                        {p.is_traditional && (
                                                            <span style={{ color: '#B45309', fontSize: '0.68rem', fontWeight: 'bold', backgroundColor: 'rgba(180, 83, 9, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                                                                Tradizionale
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Price & info */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
                                                        <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                                                            {p.is_sold_by_piece ? `€ ${p.price_per_piece} / pz` : `€ ${p.price_per_kg} / kg`}
                                                        </span>
                                                        {p.description && (
                                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                                                                {p.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Add button */}
                                            <button
                                                type="button"
                                                className={isAddedJustNow ? "btn btn-primary" : "btn btn-outline"}
                                                style={{
                                                    padding: '0.5rem 0.9rem',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    flexShrink: 0,
                                                    backgroundColor: isAddedJustNow ? '#4CAF50' : undefined,
                                                    borderColor: isAddedJustNow ? '#4CAF50' : undefined,
                                                    color: isAddedJustNow ? 'white' : undefined,
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onClick={() => {
                                                    addProductToQuote(p);
                                                    setRecentlyAddedId(p.id);
                                                    setTimeout(() => setRecentlyAddedId(null), 1500);
                                                }}
                                            >
                                                {isAddedJustNow ? (
                                                    <>
                                                        <CheckCircle2 size={16} /> Aggiunto!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus size={16} /> Aggiungi
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    );
                                });
                            })()}
                        </div>

                        {/* Footer */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--color-border)',
                            backgroundColor: '#faf8f6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                {currentQuote.items.length} {currentQuote.items.length === 1 ? 'prodotto inserito' : 'prodotti inseriti'} nel preventivo
                            </span>
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ padding: '0.6rem 1.5rem', fontWeight: '600' }}
                                onClick={() => setIsProductPickerOpen(false)}
                            >
                                Fatto
                            </button>
                        </div>
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

            {/* Confirmation Modal for Refreshing Products from Catalog */}
            {isConfirmRefreshOpen && (
                <div
                    className="modal-overlay"
                    onClick={() => setIsConfirmRefreshOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 3000,
                        padding: '1rem'
                    }}
                >
                    <div
                        className="modal-content bounce-in"
                        onClick={e => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            width: '100%',
                            maxWidth: '480px',
                            padding: '1.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid rgba(0,0,0,0.08)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(217, 119, 6, 0.12)',
                                color: '#D97706',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <AlertTriangle size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                                    Aggiornare i prodotti dal catalogo?
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                    Questa operazione sincronizzerà tutti i prodotti di questo preventivo con la versione attualmente presente nel catalogo.
                                </p>
                            </div>
                            <button
                                onClick={() => setIsConfirmRefreshOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{
                            padding: '0.9rem 1rem',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(217, 119, 6, 0.08)',
                            border: '1px solid rgba(217, 119, 6, 0.25)',
                            fontSize: '0.85rem',
                            color: '#92400E',
                            lineHeight: '1.45'
                        }}>
                            <strong>Attenzione:</strong> Eventuali prezzi personalizzati, descrizioni modificate o impostazioni modificate manualmente solo per questo preventivo verranno <strong>sovrascritte</strong> con i valori correnti del catalogo.
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setIsConfirmRefreshOpen(false)}
                                style={{
                                    padding: '0.65rem 1.25rem',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => {
                                    setIsConfirmRefreshOpen(false);
                                    refreshProductsFromCatalog();
                                }}
                                style={{
                                    padding: '0.65rem 1.25rem',
                                    fontSize: '0.9rem',
                                    backgroundColor: '#D97706',
                                    borderColor: '#D97706',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <RefreshCw size={15} /> Conferma aggiornamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modale di Conferma Eliminazione Preventivo */}
            {quoteToDelete && (
                <div
                    className="modal-overlay"
                    onClick={() => setQuoteToDelete(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 3000,
                        padding: '1rem'
                    }}
                >
                    <div
                        className="modal-content bounce-in"
                        onClick={e => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            width: '100%',
                            maxWidth: '460px',
                            padding: '1.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid rgba(0,0,0,0.08)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                color: '#DC2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Trash2 size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                                    Eliminare questo preventivo?
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                    Sei sicuro di voler eliminare definitivamente il preventivo di <strong>{quoteToDelete.client_name || 'questo cliente'}</strong>?
                                </p>
                            </div>
                            <button
                                onClick={() => setQuoteToDelete(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: '#fff5f5',
                            border: '1px solid #fed7d7',
                            fontSize: '0.85rem',
                            color: '#c53030',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <span><strong>Totale:</strong> € {Number(quoteToDelete.total_price || 0).toFixed(2)}</span>
                            {quoteToDelete.event_date && (
                                <span><strong>Data evento:</strong> {formatDateItalian(quoteToDelete.event_date)}</span>
                            )}
                            <span style={{ fontSize: '0.8rem', marginTop: '0.2rem' }}>⚠️ Questa operazione non può essere annullata.</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setQuoteToDelete(null)}
                                style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={confirmDeleteQuote}
                                style={{
                                    padding: '0.65rem 1.25rem',
                                    fontSize: '0.9rem',
                                    backgroundColor: '#DC2626',
                                    borderColor: '#DC2626',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Trash2 size={15} /> Elimina definitivamente
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modale di Conferma Salvataggio su OrderMaster */}
            {quoteToSync && (
                <div
                    className="modal-overlay"
                    onClick={() => setQuoteToSync(null)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 3000,
                        padding: '1rem'
                    }}
                >
                    <div
                        className="modal-content bounce-in"
                        onClick={e => e.stopPropagation()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '20px',
                            width: '100%',
                            maxWidth: '460px',
                            padding: '1.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.25rem',
                            boxShadow: 'var(--shadow-xl)',
                            border: '1px solid rgba(0,0,0,0.08)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: '12px',
                                backgroundColor: 'rgba(0, 82, 204, 0.12)',
                                color: '#0052cc',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Send size={22} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.2rem', color: 'var(--color-primary-dark)', fontWeight: 'bold' }}>
                                    Salvare su OrderMaster?
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: '1.5' }}>
                                    Questo preventivo non è ancora sincronizzato. Vuoi inviarlo all'applicazione OrderMaster?
                                </p>
                            </div>
                            <button
                                onClick={() => setQuoteToSync(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--color-text-muted)',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{
                            padding: '0.85rem 1rem',
                            borderRadius: '10px',
                            backgroundColor: '#f0f7ff',
                            border: '1px solid #cce4ff',
                            fontSize: '0.85rem',
                            color: '#004085',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.25rem'
                        }}>
                            <span><strong>Cliente:</strong> {quoteToSync.client_name || 'Cliente non specificato'}</span>
                            <span><strong>Totale:</strong> € {Number(quoteToSync.total_price || 0).toFixed(2)}</span>
                            {quoteToSync.event_date && (
                                <span><strong>Data evento:</strong> {formatDateItalian(quoteToSync.event_date)}</span>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setQuoteToSync(null)}
                                style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem' }}
                            >
                                Annulla
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={confirmSyncQuote}
                                style={{
                                    padding: '0.65rem 1.25rem',
                                    fontSize: '0.9rem',
                                    backgroundColor: '#0052cc',
                                    borderColor: '#0052cc',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 12px rgba(0, 82, 204, 0.3)'
                                }}
                            >
                                <Send size={15} /> Salva su OrderMaster
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DeliveryCalculatorModal
                isOpen={isDeliveryCalcOpen}
                onClose={() => setIsDeliveryCalcOpen(false)}
                onApply={(totalCost) => {
                    handleApplyDeliveryCost(totalCost);
                    setDeliveryCostInput(String(totalCost));
                }}
                initialDestination=""
            />
        </div>
    );
};

export default QuoteManager;
