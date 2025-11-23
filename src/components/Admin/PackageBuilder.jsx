import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Trash2, Plus, Save } from 'lucide-react';

const PackageBuilder = () => {
    const [packages, setPackages] = useState([]);
    const [products, setProducts] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // New Package State
    const [newPackage, setNewPackage] = useState({
        name: '',
        description: '',
        image_url: '',
        total_price: 0,
        items: [] // { product_id, quantity, tempId }
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [pkgs, prods] = await Promise.all([
                api.getCaterings(),
                api.getProducts()
            ]);
            setPackages(pkgs);
            setProducts(prods);
        } catch (err) {
            console.error('Failed to load data', err);
        }
    };

    const handleAddItem = () => {
        if (products.length === 0) return;
        setNewPackage({
            ...newPackage,
            items: [
                ...newPackage.items,
                { product_id: products[0].id, quantity: 1, tempId: Date.now() }
            ]
        });
    };

    const updateItem = (tempId, field, value) => {
        setNewPackage({
            ...newPackage,
            items: newPackage.items.map(item =>
                item.tempId === tempId ? { ...item, [field]: value } : item
            )
        });
    };

    const removeItem = (tempId) => {
        setNewPackage({
            ...newPackage,
            items: newPackage.items.filter(item => item.tempId !== tempId)
        });
    };

    const calculateSuggestedPrice = () => {
        return newPackage.items.reduce((sum, item) => {
            const prod = products.find(p => p.id == item.product_id);
            return sum + (prod ? prod.price_per_kg * item.quantity : 0);
        }, 0);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await api.createCatering(newPackage);
            setIsCreating(false);
            setNewPackage({ name: '', description: '', image_url: '', total_price: 0, items: [] });
            loadData();
        } catch (err) {
            alert('Error creating package');
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>Gestione Pacchetti Catering</h2>
                <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuovo Pacchetto
                </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {packages.map(pkg => (
                    <div key={pkg.id} style={{
                        padding: '1.5rem', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)',
                        display: 'flex', flexDirection: 'column'
                    }}>
                        {pkg.image_url && <img src={pkg.image_url} alt={pkg.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '1rem' }} />}
                        <h3 style={{ marginBottom: '0.5rem' }}>{pkg.name}</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', flex: 1 }}>{pkg.description}</p>
                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--color-primary)' }}>
                            € {pkg.total_price}
                        </div>
                        <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                            <strong>Include:</strong>
                            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem' }}>
                                {pkg.items && pkg.items.map((item, idx) => (
                                    <li key={idx}>{item.quantity}kg {item.name}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PackageBuilder;
