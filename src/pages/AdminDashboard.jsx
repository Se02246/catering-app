import React, { useState } from 'react';
import ProductManager from '../components/Admin/ProductManager';
import PackageBuilder from '../components/Admin/PackageBuilder';
import SettingsManager from '../components/Admin/SettingsManager';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('products');

    return (
        <div className="container admin-dashboard" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        window.location.href = '/login';
                    }}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-primary)', color: 'var(--color-primary)' }}
                >
                    Logout
                </button>
                <button
                    onClick={() => window.location.href = '/'}
                    className="btn btn-outline"
                    style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', color: 'var(--color-primary-dark)' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>
            <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', overflowX: 'auto' }}>
                <button
                    className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('products')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    Prodotti
                </button>
                <button
                    className={`btn ${activeTab === 'packages' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('packages')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    Pacchetti Catering
                </button>
                <button
                    className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('settings')}
                    style={{ whiteSpace: 'nowrap' }}
                >
                    Impostazioni
                </button>
            </div>

            {activeTab === 'products' && <ProductManager />}
            {activeTab === 'packages' && <PackageBuilder />}
            {activeTab === 'settings' && <SettingsManager />}

        </div>
    );
};

export default AdminDashboard;
