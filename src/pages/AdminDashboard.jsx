import React, { useState } from 'react';
import ProductManager from '../components/Admin/ProductManager';
import PackageBuilder from '../components/Admin/PackageBuilder';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('products');

    return (
        <div className="container">
            <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                <button
                    className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('products')}
                >
                    Prodotti
                </button>
                <button
                    className={`btn ${activeTab === 'packages' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('packages')}
                >
                    Pacchetti Catering
                </button>
            </div>

            {activeTab === 'products' ? (
                <ProductManager />
            ) : (
                <PackageBuilder />
            )}
        </div>
    );
};

export default AdminDashboard;
