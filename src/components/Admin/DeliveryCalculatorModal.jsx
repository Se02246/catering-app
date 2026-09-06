import React, { useState } from 'react';
import { api } from '../../services/api';
import { X, MapPin, Navigation, Car, Fuel, ShieldAlert, ArrowRight, Loader2, Check, RotateCcw, Sliders } from 'lucide-react';

const DEFAULT_ORIGIN = 'Piazza san giuseppe, Irgoli 08020 Sardegna, Italia';
const DEFAULT_CONSUMPTION = 15.5; // Kia Sportage 2026: ~15.5 km/l

const DeliveryCalculatorModal = ({ isOpen, onClose, onApply, initialDestination = '' }) => {
    const [destination, setDestination] = useState(initialDestination);
    const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
    const [roundTrip, setRoundTrip] = useState(true);
    const [consumptionKmL, setConsumptionKmL] = useState(DEFAULT_CONSUMPTION);
    const [customFuelPrice, setCustomFuelPrice] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);

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
            const data = await api.calculateDelivery({
                destination: destination.trim(),
                origin: origin.trim(),
                round_trip: roundTrip,
                consumption_km_l: parseFloat(consumptionKmL) || DEFAULT_CONSUMPTION,
                custom_fuel_price: customFuelPrice ? parseFloat(customFuelPrice) : undefined
            });

            setCalculationResult(data);
            if (data.fuel_price_per_liter && !customFuelPrice) {
                setCustomFuelPrice(String(data.fuel_price_per_liter));
            }
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
            className="modal-overlay"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3500,
                padding: '1rem'
            }}
            onClick={onClose}
        >
            <div 
                className="modal-content bounce-in"
                style={{
                    backgroundColor: 'white',
                    borderRadius: '20px',
                    width: '100%',
                    maxWidth: '560px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: 'var(--shadow-xl)',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(155, 57, 61, 0.05), rgba(155, 57, 61, 0.01))'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(155, 57, 61, 0.1)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Navigation size={22} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--color-primary-dark)' }}>
                                Calcola Costo Consegna
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Distanza stradale, consumo Kia Sportage 2026 e +3% imprevisti
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--color-text-muted)',
                            padding: '0.4rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleCalculate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Destinazione */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', marginBottom: '0.4rem' }}>
                            <MapPin size={16} style={{ color: '#e63946' }} /> Destinazione Consegna *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                type="text"
                                placeholder="Es: Nuoro, Olbia, Via Roma 25 Siniscola..."
                                value={destination}
                                onChange={e => setDestination(e.target.value)}
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '0.75rem 2.2rem 0.75rem 0.9rem',
                                    borderRadius: '10px',
                                    border: '1.5px solid var(--color-border)',
                                    fontSize: '0.95rem'
                                }}
                            />
                            {destination && (
                                <button
                                    type="button"
                                    onClick={() => setDestination('')}
                                    style={{
                                        position: 'absolute',
                                        right: '0.6rem',
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
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: '12px' }}>
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

                    {/* Toggle Parametri Avanzati */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                padding: 0
                            }}
                        >
                            <Sliders size={14} />
                            {showAdvanced ? 'Nascondi parametri veicolo' : 'Personalizza consumo e prezzo benzina'}
                        </button>

                        {showAdvanced && (
                            <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', backgroundColor: '#fafafa', padding: '0.75rem', borderRadius: '10px', border: '1px dashed var(--color-border)' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                                        Consumo Kia Sportage (km/l)
                                    </label>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        min="5"
                                        value={consumptionKmL}
                                        onChange={e => setConsumptionKmL(e.target.value)}
                                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                                        Prezzo Benzina (€/l)
                                    </label>
                                    <input 
                                        type="number"
                                        step="0.001"
                                        min="1"
                                        placeholder="Rilevato auto"
                                        value={customFuelPrice}
                                        onChange={e => setCustomFuelPrice(e.target.value)}
                                        style={{ width: '100%', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tasto Calcola */}
                    <button
                        type="submit"
                        disabled={loading || !destination.trim()}
                        className="btn btn-primary"
                        style={{
                            padding: '0.85rem',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            boxShadow: 'var(--shadow-md)'
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
                        <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: '#ffebee', color: '#c62828', fontSize: '0.85rem', border: '1px solid #ef9a9a' }}>
                            {error}
                        </div>
                    )}

                    {/* Box Risultato del Calcolo */}
                    {calculationResult && (
                        <div style={{
                            border: '2px solid #4CAF50',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(76, 175, 80, 0.04)',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.9rem',
                            marginTop: '0.5rem'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#2e7d32', backgroundColor: 'rgba(46, 125, 50, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                                    ✓ Percorso Calcolato ({calculationResult.routing_source})
                                </span>
                                {calculationResult.duration_text && (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        ⏱️ {calculationResult.duration_text}
                                    </span>
                                )}
                            </div>

                            {/* Dettagli Metrici */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                                <div>
                                    <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Distanza totale:</span>
                                    <strong style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
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
                                    <strong>{calculationResult.liters_needed} L</strong>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>
                                        @ € {Number(calculationResult.fuel_price_per_liter).toFixed(2)}/L
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
                            <div style={{ borderTop: '1px solid rgba(76, 175, 80, 0.3)', paddingTop: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                                <div>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}>Totale consigliato:</span>
                                    <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-primary-dark)' }}>
                                        € {Number(calculationResult.total_cost).toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleApplyResult}
                                    className="btn btn-primary"
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        fontSize: '0.95rem',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        backgroundColor: '#2e7d32',
                                        borderColor: '#2e7d32'
                                    }}
                                >
                                    <Check size={18} /> Applica al Preventivo
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
