import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { X, MapPin, Navigation, Car, Fuel, Loader2, Check, RotateCcw, Clock, ShieldCheck, Plus, Minus } from 'lucide-react';

const DEFAULT_ORIGIN = 'Piazza san giuseppe, Irgoli 08020 Sardegna, Italia';
const DEFAULT_CONSUMPTION = 18.0; // Valore di default standard richiesto: 18 km/l

const DeliveryCalculatorModal = ({ isOpen, onClose, onApply, initialDestination = '' }) => {
    const [destination, setDestination] = useState(initialDestination);
    const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
    const [roundTrip, setRoundTrip] = useState(true);
    
    // Veicoli
    const [vehiclesCount, setVehiclesCount] = useState(1);
    const [vehicleModel, setVehicleModel] = useState('');
    
    // Consumo carburante
    const [useAiConsumption, setUseAiConsumption] = useState(true);
    const [manualConsumption, setManualConsumption] = useState(DEFAULT_CONSUMPTION);
    
    // Prezzo carburante
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
                vehicles_count: Math.max(1, parseInt(vehiclesCount) || 1),
                vehicle_model: vehicleModel.trim()
            };

            // Se l'utente imposta manualmente il consumo
            if (!useAiConsumption && manualConsumption && !isNaN(parseFloat(manualConsumption))) {
                payload.consumption_km_l = parseFloat(manualConsumption);
            }

            // Se l'utente ha impostato manualmente il prezzo benzina
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
                    maxWidth: '620px',
                    maxHeight: '92vh',
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
                    background: 'linear-gradient(135deg, rgba(155, 57, 61, 0.08), rgba(155, 57, 61, 0.02))',
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
                                Flotta • Ricerca IA Consumi e Benzina • 13€/h tempo • +12% imprevisti
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
                                placeholder="Es: Nuoro, Olbia, Siniscola, Dorgali, Orosei..."
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
                            <Navigation size={14} /> Sede di Partenza
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

                    {/* Opzioni di Viaggio: A/R vs Solo Andata */}
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

                    {/* Sezione Macchine & Veicoli */}
                    <div style={{
                        backgroundColor: 'rgba(155, 57, 61, 0.03)',
                        borderRadius: '14px',
                        border: '1px solid rgba(155, 57, 61, 0.15)',
                        padding: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                            <Car size={16} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                Veicoli Impiegati per la Consegna
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem' }}>
                            {/* N. Veicoli */}
                            <div>
                                <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                                    N. Macchine
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setVehiclesCount(prev => Math.max(1, (parseInt(prev) || 1) - 1))}
                                        className="btn btn-outline"
                                        style={{ padding: '0.5rem 0.55rem', borderRadius: '8px' }}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={vehiclesCount}
                                        onChange={e => setVehiclesCount(Math.max(1, parseInt(e.target.value) || 1))}
                                        style={{
                                            width: '46px',
                                            textAlign: 'center',
                                            padding: '0.5rem 0.2rem',
                                            borderRadius: '8px',
                                            border: '1px solid var(--color-border)',
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setVehiclesCount(prev => (parseInt(prev) || 1) + 1)}
                                        className="btn btn-outline"
                                        style={{ padding: '0.5rem 0.55rem', borderRadius: '8px' }}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Modello Veicolo */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-text-muted)', margin: 0 }}>
                                        Modello Auto / Furgone
                                    </label>
                                    {useAiConsumption ? (
                                        <button
                                            type="button"
                                            onClick={() => setUseAiConsumption(false)}
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
                                            ✏️ Forza km/l
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setUseAiConsumption(true)}
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
                                            🤖 Stima IA / Default
                                        </button>
                                    )}
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Es. Kia Sportage 2026, Fiat Doblò, Van refrigerato..."
                                    value={vehicleModel}
                                    onChange={e => setVehicleModel(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.55rem 0.75rem',
                                        borderRadius: '8px',
                                        border: '1px solid var(--color-border)',
                                        fontSize: '0.88rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Indicatore Consumo (IA o Manuale) */}
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                            {useAiConsumption ? (
                                <span>
                                    {vehicleModel.trim() 
                                        ? `🤖 L'IA ricercherà sul web il consumo medio di "${vehicleModel.trim()}"`
                                        : `ℹ️ Nessun modello indicato: verrà applicato il consumo di default di 18.0 km/l`}
                                </span>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--color-primary-dark)' }}>Consumo manuale:</span>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        min="3"
                                        max="50"
                                        value={manualConsumption}
                                        onChange={e => setManualConsumption(e.target.value)}
                                        style={{
                                            width: '75px',
                                            padding: '0.2rem 0.4rem',
                                            borderRadius: '6px',
                                            border: '1px solid var(--color-border)',
                                            fontWeight: 'bold',
                                            textAlign: 'center'
                                        }}
                                    />
                                    <span>km/l</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prezzo Carburante */}
                    <div style={{
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        padding: '0.85rem 1rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
                                <Fuel size={15} style={{ color: '#e63946' }} /> Prezzo Benzina al Litro
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
                                    🤖 Rileva con Ricerca IA
                                </button>
                            )}
                        </div>

                        {useAiFuel ? (
                            <div style={{
                                padding: '0.55rem 0.75rem',
                                borderRadius: '8px',
                                border: '1px solid #c8e6c9',
                                backgroundColor: '#f1f8e9',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                                    {calculationResult?.fuel_price_per_liter 
                                        ? `€ ${Number(calculationResult.fuel_price_per_liter).toFixed(2)} / L` 
                                        : '🤖 Ricerca Google in tempo reale'}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.12)', padding: '2px 6px', borderRadius: '6px', fontWeight: '600' }}>
                                    {calculationResult?.fuel_price_per_liter ? 'Prezzo Rilevato' : 'Quotazione Media Italia'}
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
                    </div>

                    {/* Parametri di Sovrapprezzo (Trasparenza) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        backgroundColor: '#fafafa',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '10px',
                        border: '1px dashed var(--color-border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock size={13} style={{ color: '#0288d1' }} />
                            <span><strong>Tempo di viaggio:</strong> 13 €/h per macchina</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <ShieldCheck size={13} style={{ color: '#B45309' }} />
                            <span><strong>Imprevisti:</strong> +12% sul carburante</span>
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
                                <Loader2 size={18} className="animate-spin" /> Calcolo percorso, consumi e benzina in corso...
                            </>
                        ) : (
                            <>
                                <Navigation size={18} /> Calcola Percorso e Preventivo Consegna
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
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.12)', padding: '3px 10px', borderRadius: '12px' }}>
                                    ✓ Percorso Calcolato ({calculationResult.routing_source})
                                </span>
                                {calculationResult.duration_text && (
                                    <span style={{ fontSize: '0.82rem', color: 'var(--color-primary-dark)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Clock size={14} /> {calculationResult.duration_text}
                                    </span>
                                )}
                            </div>

                            {/* Dettagli Metrici */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Distanza totale:</span>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                                        {calculationResult.total_km} km / auto
                                    </strong>
                                    {calculationResult.vehicles_count > 1 && (
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                                            (Flotta totale: {calculationResult.total_km_all_vehicles} km)
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Veicoli impiegati:</span>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
                                        {calculationResult.vehicles_count}x {calculationResult.vehicle_model}
                                    </strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                                        Consumo: {calculationResult.consumption_km_l} km/l {calculationResult.consumption_detected ? '(🤖 IA)' : '(default)'}
                                    </span>
                                </div>

                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Carburante stimato:</span>
                                    <strong>{calculationResult.liters_needed} L</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                                        @ € {Number(calculationResult.fuel_price_per_liter).toFixed(2)}/L {calculationResult.fuel_price_detected ? '(🤖 IA)' : '(manuale)'}
                                    </span>
                                </div>

                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Costo carburante base:</span>
                                    <strong>€ {Number(calculationResult.base_fuel_cost).toFixed(2)}</strong>
                                </div>

                                <div style={{ backgroundColor: 'rgba(2, 136, 209, 0.08)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                                    <span style={{ color: '#0277bd', display: 'block', fontWeight: '600' }}>⏱️ Tempo viaggio (13€/h):</span>
                                    <strong style={{ color: '#01579b', fontSize: '0.95rem' }}>+ € {Number(calculationResult.time_cost).toFixed(2)}</strong>
                                    <span style={{ fontSize: '0.7rem', color: '#0277bd', display: 'block' }}>
                                        ({calculationResult.duration_hours}h × 13€ × {calculationResult.vehicles_count} {calculationResult.vehicles_count === 1 ? 'auto' : 'auto'})
                                    </span>
                                </div>

                                <div style={{ backgroundColor: 'rgba(180, 83, 9, 0.08)', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                                    <span style={{ color: '#92400e', display: 'block', fontWeight: '600' }}>🛡️ Imprevisti (+12%):</span>
                                    <strong style={{ color: '#B45309', fontSize: '0.95rem' }}>+ € {Number(calculationResult.contingency_cost).toFixed(2)}</strong>
                                    <span style={{ fontSize: '0.7rem', color: '#92400e', display: 'block' }}>
                                        (12% sul carburante)
                                    </span>
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
                                    <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>
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
