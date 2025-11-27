// Questa riga è la chiave: usa la variabile d'ambiente di Render se c'è, altrimenti usa localhost
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api';

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
        const res = await fetch(`${API_URL}/products?t=${Date.now()}`);
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
    }
};
