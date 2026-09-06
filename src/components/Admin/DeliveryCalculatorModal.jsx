import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { X, MapPin, Navigation, Car, Fuel, Loader2, Check, RotateCcw } from 'lucide-react';

const DEFAULT_ORIGIN = 'Piazza san giuseppe, Irgoli 08020 Sardegna, Italia';
const DEFAULT_CONSUMPTION = 15.5; // Kia Sportage 2026: ~15.5 km/l
const DEFAULT_FUEL_PRICE = '2.05';

const DeliveryCalculatorModal = ({ isOpen, onClose, onApply, initialDestination = '' }) => {
    const [destination, setDestination] = useState(initialDestination);
    const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
    const [roundTrip, setRoundTrip] = useState(true);
    const [consumptionKmL, setConsumptionKmL] = useState(DEFAULT_CONSUMPTION);
    const [useAiFuel, setUseAiFuel] = useState(true);
    const [manualFuelPrice, setManualFuelPrice] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const resultRef = useRef(null);

    // Scroll automatico al risultato quando viene calcolato
    useEffect(() => {
        if (calculationResult && resultRef.current) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }, [calculationResult]);

    // Sync initialDestination when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialDestination) setDestination(initialDestination);
            setError(null);
            setCalculationResult(null);
        }
    }, [isOpen, initialDestination]);

    if (!isOpen) return null;

    const handleCalculate = async (e) => {
        if (e) e.preventDefault();
        if (!destination.trim()) {
            setError('Inserisci l\'indirizzo o il comune di destinazione.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                destination: destination.trim(),
                origin: origin.trim(),
                round_trip: roundTrip,
                consumption_km_l: parseFloat(consumptionKmL) || DEFAULT_CONSUMPTION
            };

            // Se l'utente ha impostato manualmente il prezzo, invialo; altrimenti lascia interrogare l'IA
            if (!useAiFuel && manualFuelPrice && !isNaN(parseFloat(manualFuelPrice))) {
                payload.custom_fuel_price = parseFloat(manualFuelPrice);
            }

            const data = await api.calculateDelivery(payload);
            setCalculationResult(data);
        } catch (err) {
            console.error('Calculation error:', err);
            setError(err.message || 'Errore durante il calcolo del percorso. Riprova con un indirizzo più specifico.');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyResult = () => {
        if (calculationResult && calculationResult.total_cost !== undefined) {
            onApply(calculationResult.total_cost);
            onClose();
        }
    };

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 4000,
                padding: '1.5rem 1rem',
                overflowY: 'auto'
            }}
            onClick={onClose}
        >
            <div 
                className="bounce-in"
                style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '580px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    margin: 'auto'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header (Fisso in alto) */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(155, 57, 61, 0.06), rgba(155, 57, 61, 0.01))',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(155, 57, 61, 0.12)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Navigation size={22} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)' }}>
                                Calcola Costo Consegna
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Kia Sportage (2026) • OpenRouteService • +3% imprevisti
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose}
                        style={{
                            background: 'rgba(0,0,0,0.05)',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body Scrollabile */}
                <form 
                    onSubmit={handleCalculate} 
                    style={{ 
                        padding: '1.5rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '1.25rem',
                        overflowY: 'auto',
                        flex: 1,
                        minHeight: 0,
                        WebkitOverflowScrolling: 'touch'
                    }}
                >
                    {/* Destinazione */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '0.4rem' }}>
                            <MapPin size={16} style={{ color: '#e63946' }} /> Destinazione Consegna *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text"
                                placeholder="Es: Nuoro, Olbia, Siniscola, Dorgali..."
                                value={destination}
                                onChange={e => setDestination(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '0.8rem 2.4rem 0.8rem 1rem',
                                    borderRadius: '12px',
                                    border: '1.5px solid var(--color-border)',
                                    fontSize: '0.95rem',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                            />
                            {destination && (
                                <button
                                    type="button"
                                    onClick={() => setDestination('')}
                                    style={{
                                        position: 'absolute',
                                        right: '0.75rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--color-text-muted)'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Partenza */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>
                            <Navigation size={14} /> Punto di Partenza
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                                type="text"
                                value={origin}
                                onChange={e => setOrigin(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.65rem 0.9rem',
                                    borderRadius: '10px',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.85rem',
                                    backgroundColor: '#fafafa'
                                }}
                            />
                            {origin !== DEFAULT_ORIGIN && (
                                <button
                                    type="button"
                                    onClick={() => setOrigin(DEFAULT_ORIGIN)}
                                    title="Ripristina sede Irgoli"
                                    className="btn btn-outline"
                                    style={{ padding: '0.5rem 0.75rem' }}
                                >
                                    <RotateCcw size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Opzioni di Viaggio */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', flex: 1, color: roundTrip ? 'var(--color-primary-dark)' : 'var(--color-text)' }}>
                            <input 
                                type="radio" 
                                name="trip_mode"
                                checked={roundTrip} 
                                onChange={() => setRoundTrip(true)}
                                style={{ width: '16px', height: '16px' }}
                            />
                            Andata e Ritorno (A/R)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', flex: 1, color: !roundTrip ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}>
                            <input 
                                type="radio" 
                                name="trip_mode"
                                checked={!roundTrip} 
                                onChange={() => setRoundTrip(false)}
                                style={{ width: '16px', height: '16px' }}
                            />
                            Solo Andata
                        </label>
                    </div>

                    {/* Parametri Veicolo e Prezzo Carburante (Subito Visibili) */}
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr', 
                        gap: '0.75rem', 
                        backgroundColor: 'rgba(155, 57, 61, 0.03)', 
                        padding: '0.9rem 1rem', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(155, 57, 61, 0.15)' 
                    }}>
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.3rem' }}>
                                <Car size={14} /> Consumo Auto
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="number"
                                    step="0.1"
                                    min="5"
                                    value={consumptionKmL}
                                    onChange={e => setConsumptionKmL(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.55rem 2.2rem 0.55rem 0.75rem', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--color-border)', 
                                        fontSize: '0.95rem',
                                        fontWeight: '600'
                                    }}
                                />
                                <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                                    km/l
                                </span>
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
                                Kia Sportage (2026)
                            </span>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                                    <Fuel size={14} style={{ color: '#e63946' }} /> Prezzo Benzina
                                </label>
                                {useAiFuel ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUseAiFuel(false);
                                            setManualFuelPrice(calculationResult?.fuel_price_per_liter ? String(calculationResult.fuel_price_per_liter) : '2.05');
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-primary)',
                                            fontSize: '0.72rem',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            padding: 0
                                        }}
                                    >
                                        ✏️ Personalizza
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setUseAiFuel(true);
                                            setManualFuelPrice('');
                                        }}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#2e7d32',
                                            fontSize: '0.72rem',
                                            cursor: 'pointer',
                                            textDecoration: 'underline',
                                            padding: 0,
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        🤖 Rileva con IA
                                    </button>
                                )}
                            </div>

                            {useAiFuel ? (
                                <div style={{
                                    padding: '0.55rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid #c8e6c9',
                                    backgroundColor: '#f1f8e9',
                                    fontSize: '0.88rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                        {calculationResult?.fuel_price_per_liter 
                                            ? `€ ${Number(calculationResult.fuel_price_per_liter).toFixed(2)} / L` 
                                            : '🤖 Rilevamento IA'}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.12)', padding: '2px 6px', borderRadius: '6px', fontWeight: '600' }}>
                                        {calculationResult?.fuel_price_per_liter ? 'Rilevato da IA' : 'In tempo reale'}
                                    </span>
                                </div>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type="number"
                                        step="0.01"
                                        min="0.5"
                                        max="5"
                                        placeholder="Es. 2.05"
                                        value={manualFuelPrice}
                                        onChange={e => setManualFuelPrice(e.target.value)}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.55rem 2rem 0.55rem 0.75rem', 
                                            borderRadius: '8px', 
                                            border: '1px solid var(--color-border)', 
                                            fontSize: '0.95rem',
                                            fontWeight: '700',
                                            color: '#b71c1c'
                                        }}
                                    />
                                    <span style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                                        €/l
                                    </span>
                                </div>
                            )}
                            <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>
                                {useAiFuel ? 'Interroga l\'IA per il prezzo medio attuale in Italia' : 'Valore personalizzato'}
                            </span>
                        </div>
                    </div>

                    {/* Tasto Calcola */}
                    <button
                        type="submit"
                        disabled={loading || !destination.trim()}
                        className="btn btn-primary"
                        style={{
                            padding: '0.9rem',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            boxShadow: 'var(--shadow-md)',
                            cursor: loading || !destination.trim() ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Calcolo percorso in corso...
                            </>
                        ) : (
                            <>
                                <Car size={18} /> Calcola Percorso e Costo
                            </>
                        )}
                    </button>

                    {/* Messaggio Errore */}
                    {error && (
                        <div style={{ padding: '0.75rem 1rem', borderRadius: '10px', backgroundColor: '#ffebee', color: '#c62828', fontSize: '0.85rem', border: '1px solid #ef9a9a' }}>
                            {error}
                        </div>
                    )}

                    {/* Box Risultato del Calcolo */}
                    {calculationResult && (
                        <div 
                            ref={resultRef}
                            style={{
                            border: '2px solid #4CAF50',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(76, 175, 80, 0.04)',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.9rem',
                            marginTop: '0.25rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.12)', padding: '3px 10px', borderRadius: '12px' }}>
                                    ✓ Percorso Calcolato ({calculationResult.routing_source})
                                </span>
                                {calculationResult.duration_text && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                                        ⏱️ {calculationResult.duration_text}
                                    </span>
                                )}
                            </div>

                            {/* Dettagli Metrici */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Distanza totale:</span>
                                    <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                                        {calculationResult.total_km} km
                                    </strong>
                                    {calculationResult.round_trip && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                                            ({calculationResult.one_way_km} km × 2 A/R)
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Carburante stimato:</span>
                                    <strong style={{ fontSize: '1.1rem' }}>{calculationResult.liters_needed} L</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                                        @ € {Number(calculationResult.fuel_price_per_liter).toFixed(2)}/L {calculationResult.fuel_price_detected ? '(🤖 IA)' : '(manuale)'}
                                    </span>
                                </div>

                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Costo carburante base:</span>
                                    <strong>€ {Number(calculationResult.base_fuel_cost).toFixed(2)}</strong>
                                </div>

                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Imprevisti (+3%):</span>
                                    <strong style={{ color: '#B45309' }}>+ € {Number(calculationResult.contingency_cost).toFixed(2)}</strong>
                                </div>
                            </div>

                            {/* Box Totale con Tasto Applica */}
                            <div style={{ 
                                borderTop: '1px solid rgba(76, 175, 80, 0.3)', 
                                paddingTop: '1rem', 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                flexWrap: 'wrap', 
                                gap: '0.75rem' 
                            }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Totale consigliato:</span>
                                    <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>
                                        € {Number(calculationResult.total_cost).toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleApplyResult}
                                    className="btn btn-primary"
                                    style={{
                                        padding: '0.85rem 1.4rem',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        backgroundColor: '#2e7d32',
                                        borderColor: '#2e7d32',
                                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)'
                                    }}
                                >
                                    <Check size={20} /> Applica al Preventivo
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default DeliveryCalculatorModal;
