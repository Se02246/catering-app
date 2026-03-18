import React, { useState, useEffect } from 'react';
import { X, EyeOff, Eye } from 'lucide-react';

const HideModal = ({ isOpen, onClose, onConfirm, initialDate, isVisible = true }) => {
    const [mode, setMode] = useState('now'); // 'now', 'schedule' or 'unhide'
    const [date, setDate] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        if (initialDate) {
            setMode('schedule');
            const d = new Date(initialDate);
            if (!isNaN(d.getTime())) {
                const tzOffset = d.getTimezoneOffset() * 60000;
                const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
                setDate(localISOTime);
            }
        } else if (isVisible === false) {
            setMode('now');
            setDate('');
        } else {
            setMode('now');
            setDate('');
        }
    }, [initialDate, isOpen, isVisible]);

    if (!isOpen) return null;

    const isConfirmDisabled = mode === 'schedule' && !date;
    const showUnhideOption = !isVisible || initialDate;

    return (
        <div className="modal-overlay" style={{ zIndex: 3000 }} onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <EyeOff size={20} /> Visibilità elemento
                    </h3>
                    <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {showUnhideOption && (
                        <label style={{ 
                            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', 
                            borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer',
                            backgroundColor: mode === 'unhide' ? 'rgba(34, 197, 94, 0.05)' : 'transparent',
                            borderColor: mode === 'unhide' ? '#22c55e' : 'var(--color-border)'
                        }}>
                            <input 
                                type="radio" 
                                name="hideMode" 
                                checked={mode === 'unhide'} 
                                onChange={() => setMode('unhide')} 
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Eye size={16} color="#22c55e" /> Non nascondere
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Rendi l'elemento sempre visibile</div>
                            </div>
                        </label>
                    )}

                    <label style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', 
                        borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer',
                        backgroundColor: mode === 'now' ? 'rgba(155, 57, 61, 0.05)' : 'transparent',
                        borderColor: mode === 'now' ? 'var(--color-primary)' : 'var(--color-border)'
                    }}>
                        <input 
                            type="radio" 
                            name="hideMode" 
                            checked={mode === 'now'} 
                            onChange={() => setMode('now')} 
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>Nascondi ora</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>L'elemento non sarà più visibile immediatamente</div>
                        </div>
                    </label>

                    <label style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', 
                        borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer',
                        backgroundColor: mode === 'schedule' ? 'rgba(155, 57, 61, 0.05)' : 'transparent',
                        borderColor: mode === 'schedule' ? 'var(--color-primary)' : 'var(--color-border)'
                    }}>
                        <input 
                            type="radio" 
                            name="hideMode" 
                            checked={mode === 'schedule'} 
                            onChange={() => setMode('schedule')} 
                        />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold' }}>Nascondi il...</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Programma l'occultamento automatico</div>
                        </div>
                    </label>

                    {mode === 'schedule' && (
                        <div className="bounce-in" style={{ padding: '0 0.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Seleziona data e ora:</label>
                            <input 
                                type="datetime-local" 
                                className="form-control"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>Annulla</button>
                    <button 
                        className="btn btn-primary" 
                        style={{ flex: 1 }} 
                        disabled={isConfirmDisabled}
                        onClick={() => {
                            if (mode === 'unhide') onConfirm('unhide');
                            else onConfirm(mode === 'now' ? null : date);
                        }}
                    >
                        Conferma
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HideModal;
