import React, { useState, useEffect } from 'react';
import { Save, Loader } from 'lucide-react';
import { useSetting } from '../../hooks/useData';
import { api } from '../../services/api';

const SettingsManager = () => {
    const { setting, isLoading, mutate } = useSetting('header_text');
    const [headerText, setHeaderText] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (setting) {
            setHeaderText(setting.value);
        }
    }, [setting]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.updateSetting('header_text', headerText);
            mutate();
            setMessage({ type: 'success', text: 'Impostazioni salvate con successo' });
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' });
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
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

                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}>
                    <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text)' }}>Legenda Formattazione:</h4>
                    <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                        <li><code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>*frase*</code> → <strong>Grassetto</strong></li>
                        <li><code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>~frase~</code> → <em>Corsivo</em></li>
                        <li><code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>$frase$</code> → <span style={{ color: 'var(--color-primary)' }}>Rosso</span></li>
                        <li><code style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px' }}>#frase#</code> → <span style={{ fontSize: '1.2em' }}>Grande</span></li>
                    </ul>
                </div>
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
