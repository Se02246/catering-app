// In production (Vercel), use relative path /api to leverage rewrites.
// In development, use localhost:3000.
const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '');
const API_URL = `${BASE_URL}/api`;

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

export const api = {
    // Auth
    login: async (username, password) => {

        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Login failed' }));
            throw new Error(error.error || 'Login failed');
        }
        return res.json();
    },

    // Products
    getProducts: async () => {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    addProduct: async (product) => {
        const res = await fetch(`${API_URL}/products`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(product)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to add product' }));
            throw new Error(error.error || 'Failed to add product');
        }
        return res.json();
    },

    updateProduct: async (id, product) => {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(product)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to update product' }));
            throw new Error(error.error || 'Failed to update product');
        }
        return res.json();
    },

    deleteProduct: async (id) => {
        const res = await fetch(`${API_URL}/products/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to delete product' }));
            throw new Error(error.error || 'Failed to delete product');
        }
        return res.json();
    },

    // Caterings
    getCaterings: async () => {
        const res = await fetch(`${API_URL}/caterings`);
        if (!res.ok) throw new Error('Failed to fetch caterings');
        return res.json();
    },

    createCatering: async (catering) => {
        const res = await fetch(`${API_URL}/caterings`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(catering)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to create catering' }));
            throw new Error(error.error || 'Failed to create catering');
        }
        return res.json();
    },

    updateCatering: async (id, catering) => {
        const res = await fetch(`${API_URL}/caterings/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(catering)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to update catering' }));
            throw new Error(error.error || 'Failed to update catering');
        }
        return res.json();
    },

    deleteCatering: async (id) => {
        const res = await fetch(`${API_URL}/caterings/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to delete catering' }));
            throw new Error(error.error || 'Failed to delete catering');
        }
        return res.json();
    },

    reorderCaterings: async (packages) => {
        const res = await fetch(`${API_URL}/caterings/reorder`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ packages })
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to reorder caterings' }));
            throw new Error(error.error || 'Failed to reorder caterings');
        }
        return res.json();
    },

    // Settings
    getSetting: async (key) => {
        const res = await fetch(`${API_URL}/settings/${key}`);
        if (!res.ok) throw new Error('Failed to fetch setting');
        return res.json();
    },

    updateSetting: async (key, value) => {
        const res = await fetch(`${API_URL}/settings/${key}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ value })
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to update setting' }));
            throw new Error(error.error || 'Failed to update setting');
        }
        return res.json();
    },

    // Reviews
    getReviews: async () => {
        const res = await fetch(`${API_URL}/reviews`);
        if (!res.ok) throw new Error('Failed to fetch reviews');
        return res.json();
    },

    createReview: async (review) => {
        const res = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(review)
        });
        if (!res.ok) throw new Error('Failed to create review');
        return res.json();
    },

    deleteReview: async (id) => {
        const res = await fetch(`${API_URL}/reviews/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete review');
        return res.json();
    },

    updateReview: async (id, reviewData) => {
        const res = await fetch(`${API_URL}/reviews/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(reviewData)
        });
        if (!res.ok) throw new Error('Failed to update review');
        return res.json();
    },

    voteReview: async (id, type, action) => {
        const res = await fetch(`${API_URL}/reviews/${id}/vote`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, action })
        });
        if (!res.ok) throw new Error('Failed to vote on review');
        return res.json();
    },

    // Quotes
    getAiThoughts: async (prompt) => {
        const res = await fetch(`${API_URL}/quotes/ai-thoughts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        if (!res.ok) return [];
        return res.json();
    },

    generateAiQuote: async (prompt, source = 'client') => {
        const res = await fetch(`${API_URL}/quotes/ai-generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, source })
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to generate AI quote' }));
            throw new Error(error.error || 'Failed to generate AI quote');
        }
        return res.json();
    },

    createQuote: async (quote) => {
        const res = await fetch(`${API_URL}/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(quote)
        });
        if (!res.ok) throw new Error('Failed to save quote');
        return res.json();
    },

    getQuotes: async () => {
        const res = await fetch(`${API_URL}/quotes`);
        if (!res.ok) throw new Error('Failed to fetch quotes');
        return res.json();
    },

    getQuote: async (id) => {
        const res = await fetch(`${API_URL}/quotes/${id}`);
        if (!res.ok) throw new Error('Quote not found');
        return res.json();
    },

    deleteQuote: async (id) => {
        const res = await fetch(`${API_URL}/quotes/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete quote');
        return res.json();
    },

    getQuoteByMenuId: async (menuId) => {
        const res = await fetch(`${API_URL}/quotes/menu/${menuId}`);
        if (!res.ok) throw new Error('Menu not found');
        return res.json();
    },

    updateQuote: async (id, quoteData, total_price) => {
        // Support both old (id, items, total_price) and new (id, quoteData object) signature
        const body = (quoteData && typeof quoteData === 'object' && !Array.isArray(quoteData)) 
            ? quoteData 
            : { items: quoteData, total_price };

        const res = await fetch(`${API_URL}/quotes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!res.ok) throw new Error('Failed to update quote');
        return res.json();
    },

    markQuoteSynced: async (id) => {
        const res = await fetch(`${API_URL}/quotes/${id}/mark-synced`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error('Failed to mark quote as synced');
        return res.json();
    },

    calculateDelivery: async (data) => {
        const res = await fetch(`${API_URL}/quotes/calculate-delivery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Errore nel calcolo del percorso di consegna' }));
            throw new Error(error.error || 'Errore nel calcolo del percorso di consegna');
        }
        return res.json();
    },

    recalculateProductsPrices: async (percentage) => {
        const res = await fetch(`${API_URL}/products/recalculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ percentage })
        });
        if (!res.ok) throw new Error('Failed to recalculate product prices');
        return res.json();
    },

    recalculateCateringsPrices: async (percentage) => {
        const res = await fetch(`${API_URL}/caterings/recalculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ percentage })
        });
        if (!res.ok) throw new Error('Failed to recalculate catering prices');
        return res.json();
    },

    batchUpdateProducts: async (updates) => {
        const res = await fetch(`${API_URL}/products/batch-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
        });
        if (!res.ok) throw new Error('Failed to batch update products');
        return res.json();
    },

    batchUpdateCaterings: async (updates) => {
        const res = await fetch(`${API_URL}/caterings/batch-update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updates })
        });
        if (!res.ok) throw new Error('Failed to batch update caterings');
        return res.json();
    },

    // Events
    getEvents: async () => {
        const res = await fetch(`${API_URL}/events`);
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
    },

    getEventBySlug: async (slug) => {
        const res = await fetch(`${API_URL}/events/slug/${slug}`);
        if (!res.ok) throw new Error('Failed to fetch event');
        return res.json();
    },

    createEvent: async (event) => {
        const res = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(event)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to create event' }));
            throw new Error(error.error || 'Failed to create event');
        }
        return res.json();
    },

    updateEvent: async (id, event) => {
        const res = await fetch(`${API_URL}/events/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(event)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to update event' }));
            throw new Error(error.error || 'Failed to update event');
        }
        return res.json();
    },

    deleteEvent: async (id) => {
        const res = await fetch(`${API_URL}/events/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to delete event' }));
            throw new Error(error.error || 'Failed to delete event');
        }
        return res.json();
    },

    reorderEvents: async (events) => {
        const res = await fetch(`${API_URL}/events/reorder`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ events })
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Failed to reorder events' }));
            throw new Error(error.error || 'Failed to reorder events');
        }
        return res.json();
    },

    // Garage Vehicles
    getVehicles: async () => {
        const res = await fetch(`${API_URL}/vehicles`);
        if (!res.ok) throw new Error('Errore nel recupero dei veicoli dal garage');
        return res.json();
    },

    analyzeVehicle: async (prompt) => {
        const res = await fetch(`${API_URL}/vehicles/ai-analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Errore nell\'analisi del veicolo con IA' }));
            throw new Error(error.error || 'Errore nell\'analisi del veicolo con IA');
        }
        return res.json();
    },

    createVehicle: async (data) => {
        const res = await fetch(`${API_URL}/vehicles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Errore nel salvataggio del veicolo' }));
            throw new Error(error.error || 'Errore nel salvataggio del veicolo');
        }
        return res.json();
    },

    setDefaultVehicle: async (id) => {
        const res = await fetch(`${API_URL}/vehicles/${id}/set-default`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Errore nell\'impostazione del veicolo predefinito' }));
            throw new Error(error.error || 'Errore nell\'impostazione del veicolo predefinito');
        }
        return res.json();
    },

    deleteVehicle: async (id) => {
        const res = await fetch(`${API_URL}/vehicles/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            const error = await res.json().catch(() => ({ error: 'Errore nell\'eliminazione del veicolo' }));
            throw new Error(error.error || 'Errore nell\'eliminazione del veicolo');
        }
        return res.json();
    }
};
