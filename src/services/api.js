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

    // Quotes
    saveQuote: async (items, total_price) => {
        const res = await fetch(`${API_URL}/quotes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, total_price })
        });
        if (!res.ok) throw new Error('Failed to save quote');
        return res.json();
    },

    getQuote: async (id) => {
        const res = await fetch(`${API_URL}/quotes/${id}`);
        if (!res.ok) throw new Error('Quote not found');
        return res.json();
    },

    updateQuote: async (id, items, total_price) => {
        const res = await fetch(`${API_URL}/quotes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, total_price })
        });
        if (!res.ok) throw new Error('Failed to update quote');
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
    }
};
