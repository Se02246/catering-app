import React, { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';

const SettingsManager = () => {
    const [headerText, setHeaderText] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings/header_text');
            if (response.ok) {
                const data = await response.json();
                setHeaderText(data.value);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Errore nel caricamento delle impostazioni' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const response = await fetch('/api/settings/header_text', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ value: headerText })
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Impostazioni salvate con successo' });
            } else {
                throw new Error('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                <Loader className="animate-spin" />
            </div>
        );
    }

    return (
        <div className="card">
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-primary-dark)' }}>Impostazioni Generali</h2>

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
                        minHeight: '150px',
                        lineHeight: '1.5'
                    }}
                />
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Questo testo apparirà sotto il titolo "Muse Catering" nella home page.
                </p>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                    Salva Modifiche
                </button>
            </div>
        </div>
    );
};

export default SettingsManager;
