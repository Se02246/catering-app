import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import { 
    X, MapPin, Navigation, Car, Fuel, Loader2, Check, RotateCcw, 
    Clock, ShieldCheck, Plus, Minus, Star, Trash2, Sparkles, AlertCircle, Info 
} from 'lucide-react';

const DEFAULT_ORIGIN = 'Piazza san giuseppe, Irgoli 08020 Sardegna, Italia';
const DEFAULT_CONSUMPTION = 16.0; // Valore di default standard richiesto: 16 km/l

const DeliveryCalculatorModal = ({ isOpen, onClose, onApply, initialDestination = '' }) => {
    const [destination, setDestination] = useState(initialDestination);
    const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
    const [roundTrip, setRoundTrip] = useState(true);

    // Veicoli & Garage
    const [garageVehicles, setGarageVehicles] = useState([]);
    const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);

    // Form Veicoli Tradizionale
    const [vehiclesCount, setVehiclesCount] = useState(1);
    const [vehicleModel, setVehicleModel] = useState('');

    // Consumo carburante
    const [useAiConsumption, setUseAiConsumption] = useState(true);
    const [manualConsumption, setManualConsumption] = useState(DEFAULT_CONSUMPTION);

    // Prezzo carburante
    const [useAiFuel, setUseAiFuel] = useState(true);
    const [manualFuelPrice, setManualFuelPrice] = useState('');

    // Calcolo & Risultato
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [calculationResult, setCalculationResult] = useState(null);
    const resultRef = useRef(null);

    // Modale "Aggiungi Veicolo al Garage"
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newVehiclePrompt, setNewVehiclePrompt] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedVehicle, setAnalyzedVehicle] = useState(null);
    const [isSavingVehicle, setIsSavingVehicle] = useState(false);
    const [addVehicleError, setAddVehicleError] = useState(null);

    // Menu Contestuale / Long-press
    const [contextVehicle, setContextVehicle] = useState(null);
    const [pressingVehicleId, setPressingVehicleId] = useState(null);
    const longPressTimerRef = useRef(null);
    const isLongPressTriggeredRef = useRef(false);

    // Scroll automatico al risultato quando viene calcolato
    useEffect(() => {
        if (calculationResult && resultRef.current) {
            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 100);
        }
    }, [calculationResult]);

    // Sync initialDestination and load vehicles when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialDestination) setDestination(initialDestination);
            setError(null);
            setCalculationResult(null);
            loadGarageVehicles();
        }
    }, [isOpen, initialDestination]);

    // Carica veicoli dal database
    const loadGarageVehicles = async () => {
        setIsLoadingVehicles(true);
        try {
            const data = await api.getVehicles();
            setGarageVehicles(data);

            // Preselezione automatica del veicolo di default se nessun veicolo è selezionato
            if (selectedVehicleIds.length === 0 && data.length > 0) {
                const defaultV = data.find(v => v.is_default) || data[0];
                if (defaultV) {
                    setSelectedVehicleIds([defaultV.id]);
                    applySelectedVehicles([defaultV]);
                }
            }
        } catch (err) {
            console.error('Error loading garage vehicles:', err);
        } finally {
            setIsLoadingVehicles(false);
        }
    };

    // Helper per applicare le metriche dei veicoli selezionati
    const applySelectedVehicles = (selectedList) => {
        if (!selectedList || selectedList.length === 0) {
            setVehiclesCount(1);
            setVehicleModel('');
            setManualConsumption(DEFAULT_CONSUMPTION);
            setUseAiConsumption(true);
            return;
        }

        const count = selectedList.length;
        setVehiclesCount(count);

        // Nomi combinati della flotta (es. "Kia Sportage 2026 + Fiat Doblò Maxi")
        const modelsText = selectedList.map(v => v.name).join(' + ');
        setVehicleModel(modelsText);

        // Media dei consumi km/l per i veicoli selezionati
        const totalConsumption = selectedList.reduce((acc, v) => acc + (parseFloat(v.consumption_km_l) || DEFAULT_CONSUMPTION), 0);
        const avgConsumption = parseFloat((totalConsumption / count).toFixed(1));
        setManualConsumption(avgConsumption);
        setUseAiConsumption(false); // Abbiamo il consumo esatto dal garage!
    };

    // Selezione / Deselezione di un veicolo al click
    const handleToggleVehicle = (vehicle) => {
        // Se è appena scattata la pressione prolungata, ignora il click
        if (isLongPressTriggeredRef.current) {
            isLongPressTriggeredRef.current = false;
            return;
        }

        let newSelectedIds;
        if (selectedVehicleIds.includes(vehicle.id)) {
            // Deseleziona se già selezionato
            newSelectedIds = selectedVehicleIds.filter(id => id !== vehicle.id);
        } else {
            // Seleziona (multi-selezione abilitata)
            newSelectedIds = [...selectedVehicleIds, vehicle.id];
        }

        setSelectedVehicleIds(newSelectedIds);
        const selectedList = garageVehicles.filter(v => newSelectedIds.includes(v.id));
        applySelectedVehicles(selectedList);
    };

    // Gestione Pressione Prolungata (Long Press - 500ms)
    const handlePressStart = (vehicle) => {
        isLongPressTriggeredRef.current = false;
        setPressingVehicleId(vehicle.id);
        longPressTimerRef.current = setTimeout(() => {
            isLongPressTriggeredRef.current = true;
            setPressingVehicleId(null);
            setContextVehicle(vehicle);
        }, 500);
    };

    const handlePressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
        setPressingVehicleId(null);
    };

    // Imposta come Predefinito
    const handleSetDefault = async (vehicle, e) => {
        if (e) e.stopPropagation();
        try {
            const res = await api.setDefaultVehicle(vehicle.id);
            setGarageVehicles(res.vehicles || garageVehicles.map(v => ({ ...v, is_default: v.id === vehicle.id })));
            setContextVehicle(null);
        } catch (err) {
            console.error('Error setting default vehicle:', err);
            alert('Errore durante l\'impostazione del veicolo predefinito');
        }
    };

    // Elimina veicolo dal garage
    const handleDeleteVehicle = async (vehicle, e) => {
        if (e) e.stopPropagation();
        if (!window.confirm(`Vuoi rimuovere "${vehicle.name}" dal garage?`)) return;

        try {
            await api.deleteVehicle(vehicle.id);
            const updated = garageVehicles.filter(v => v.id !== vehicle.id);
            setGarageVehicles(updated);

            const newSelectedIds = selectedVehicleIds.filter(id => id !== vehicle.id);
            setSelectedVehicleIds(newSelectedIds);
            const selectedList = updated.filter(v => newSelectedIds.includes(v.id));
            applySelectedVehicles(selectedList);

            setContextVehicle(null);
        } catch (err) {
            console.error('Error deleting vehicle:', err);
            alert('Errore durante la cancellazione del veicolo');
        }
    };

    // Analisi IA per Nuovo Veicolo
    const handleAnalyzeNewVehicle = async (e) => {
        if (e) e.preventDefault();
        if (!newVehiclePrompt.trim()) return;

        setIsAnalyzing(true);
        setAddVehicleError(null);
        try {
            const data = await api.analyzeVehicle(newVehiclePrompt.trim());
            setAnalyzedVehicle(data);
        } catch (err) {
            console.error('Error analyzing vehicle:', err);
            setAddVehicleError(err.message || 'Errore nell\'analisi IA del veicolo');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Salvataggio Nuovo Veicolo nel Garage
    const handleSaveNewVehicle = async () => {
        if (!analyzedVehicle) return;

        setIsSavingVehicle(true);
        setAddVehicleError(null);
        try {
            const saved = await api.createVehicle({
                name: analyzedVehicle.name,
                consumption_km_l: analyzedVehicle.consumption_km_l,
                image_url: analyzedVehicle.image_url,
                is_default: analyzedVehicle.is_default || false
            });

            // Ricarica la lista aggiornata
            const updated = await api.getVehicles();
            setGarageVehicles(updated);

            // Seleziona subito il veicolo appena aggiunto
            const newSelectedIds = [...selectedVehicleIds, saved.id];
            setSelectedVehicleIds(newSelectedIds);
            const selectedList = updated.filter(v => newSelectedIds.includes(v.id));
            applySelectedVehicles(selectedList);

            // Chiudi modale aggiunta
            setIsAddModalOpen(false);
            setNewVehiclePrompt('');
            setAnalyzedVehicle(null);
        } catch (err) {
            console.error('Error saving vehicle:', err);
            setAddVehicleError(err.message || 'Errore nel salvataggio del veicolo');
        } finally {
            setIsSavingVehicle(false);
        }
    };

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

            // Se l'utente imposta manualmente il consumo o usa le auto del garage
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
        >
            <div
                className="bounce-in"
                style={{
                    backgroundColor: 'white',
                    borderRadius: '24px',
                    width: '100%',
                    maxWidth: '640px',
                    maxHeight: '92vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    margin: 'auto',
                    position: 'relative'
                }}
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
                                Garage Veicoli 3D • 13€/h tempo • +12% imprevisti
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
                                placeholder="Es: Lula, Nuoro, Olbia, Siniscola, Dorgali, Orosei..."
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

                    {/* ========================================================================= */}
                    {/* SEZIONE GARAGE VEICOLI (RENDER 3D, MULTI-SELEZIONE & LONG-PRESS) */}
                    {/* ========================================================================= */}
                    <div style={{
                        backgroundColor: 'rgba(155, 57, 61, 0.03)',
                        borderRadius: '16px',
                        border: '1.5px solid rgba(155, 57, 61, 0.18)',
                        padding: '1.1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.9rem'
                    }}>
                        {/* Garage Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Car size={18} style={{ color: 'var(--color-primary)' }} />
                                <span style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-primary-dark)' }}>
                                    Garage Veicoli
                                </span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', backgroundColor: 'white', padding: '2px 8px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                                    {selectedVehicleIds.length === 0 ? 'Nessun mezzo selezionato' : `${selectedVehicleIds.length} ${selectedVehicleIds.length === 1 ? 'selezionato' : 'selezionati'}`}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddModalOpen(true);
                                    setNewVehiclePrompt('');
                                    setAnalyzedVehicle(null);
                                    setAddVehicleError(null);
                                }}
                                className="btn btn-outline"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.78rem',
                                    fontWeight: '700',
                                    color: 'var(--color-primary)',
                                    borderColor: 'var(--color-primary)',
                                    backgroundColor: 'white',
                                    borderRadius: '8px'
                                }}
                            >
                                <Plus size={14} /> Aggiungi Veicolo
                            </button>
                        </div>

                        {/* Istruzione Long-press e Selezione Multipla */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            <Info size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                            <span>
                                Clicca per selezionare/deselezionare le auto. <strong>Tieni premuto</strong> su un'auto per impostarla come predefinita (⭐).
                            </span>
                        </div>

                        {/* Griglia Schede Veicoli Garage */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: '0.65rem'
                        }}>
                            {garageVehicles.map(v => {
                                const isSelected = selectedVehicleIds.includes(v.id);
                                const isPressing = pressingVehicleId === v.id;

                                return (
                                    <div
                                        key={v.id}
                                        onClick={() => handleToggleVehicle(v)}
                                        onMouseDown={() => handlePressStart(v)}
                                        onMouseUp={handlePressEnd}
                                        onMouseLeave={handlePressEnd}
                                        onTouchStart={() => handlePressStart(v)}
                                        onTouchEnd={handlePressEnd}
                                        onTouchCancel={handlePressEnd}
                                        style={{
                                            position: 'relative',
                                            backgroundColor: isSelected ? 'rgba(46, 125, 50, 0.08)' : 'white',
                                            border: isSelected ? '2px solid #2e7d32' : '1.5px solid var(--color-border)',
                                            borderRadius: '12px',
                                            padding: '0.5rem',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.18s ease',
                                            transform: isPressing ? 'scale(0.95)' : isSelected ? 'scale(1.02)' : 'scale(1)',
                                            boxShadow: isSelected ? '0 4px 12px rgba(46, 125, 50, 0.2)' : 'var(--shadow-sm)',
                                            userSelect: 'none',
                                            WebkitUserSelect: 'none'
                                        }}
                                        title="Clicca per selezionare • Tieni premuto per opzioni predefinite"
                                    >
                                        {/* Badge Checkmark Selezione */}
                                        {isSelected && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '6px',
                                                left: '6px',
                                                backgroundColor: '#2e7d32',
                                                color: 'white',
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                                zIndex: 2
                                            }}>
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                        )}

                                        {/* Stellina Default (Cliccabile per impostare velocemente) */}
                                        <button
                                            type="button"
                                            onClick={(e) => handleSetDefault(v, e)}
                                            title={v.is_default ? "Veicolo predefinito" : "Imposta come veicolo predefinito"}
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '3px',
                                                color: v.is_default ? '#f59e0b' : '#d1d5db',
                                                zIndex: 2
                                            }}
                                        >
                                            <Star size={16} fill={v.is_default ? '#f59e0b' : 'transparent'} />
                                        </button>

                                        {/* Render 3D dell'auto */}
                                        <div style={{
                                            width: '100%',
                                            height: '75px',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            backgroundColor: '#f5f5f5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '0.4rem'
                                        }}>
                                            <img
                                                src={v.image_url}
                                                alt={v.name}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover'
                                                }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://placehold.co/120x80?text=Auto+3D';
                                                }}
                                            />
                                        </div>

                                        {/* Nome Auto */}
                                        <span style={{
                                            fontSize: '0.78rem',
                                            fontWeight: 'bold',
                                            color: isSelected ? '#1b5e20' : 'var(--color-primary-dark)',
                                            lineHeight: 1.2,
                                            marginBottom: '2px',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {v.name}
                                        </span>

                                        {/* Consumo km/l */}
                                        <span style={{
                                            fontSize: '0.7rem',
                                            fontWeight: '600',
                                            color: isSelected ? '#2e7d32' : 'var(--color-text-muted)'
                                        }}>
                                            {v.consumption_km_l} km/l
                                        </span>

                                        {/* Badge Predefinito */}
                                        {v.is_default && (
                                            <span style={{
                                                fontSize: '0.62rem',
                                                fontWeight: 'bold',
                                                color: '#b45309',
                                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                                padding: '1px 5px',
                                                borderRadius: '4px',
                                                marginTop: '3px'
                                            }}>
                                                ⭐ Default
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Riepilogo Veicoli Selezionati & Override Manuale */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr',
                            gap: '0.75rem',
                            marginTop: '0.25rem',
                            paddingTop: '0.75rem',
                            borderTop: '1px dashed rgba(155, 57, 61, 0.15)'
                        }}>
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

                            {/* Modello Veicolo (Sintesi o personalizzazione) */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                    <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--color-text-muted)', margin: 0 }}>
                                        Modello / Flotta Selezionata
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
                                    onChange={e => {
                                        setVehicleModel(e.target.value);
                                        // Se l'utente scrive a mano, svuota la selezione del garage
                                        if (selectedVehicleIds.length > 0) setSelectedVehicleIds([]);
                                    }}
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

                        {/* Indicatore Consumo (Garage o Manuale o IA) */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {useAiConsumption ? (
                                <span>
                                    {vehicleModel.trim()
                                        ? `🤖 L'IA ricercherà sul web il consumo medio di "${vehicleModel.trim()}"`
                                        : `ℹ️ Nessun modello indicato: verrà applicato il consumo di default di 16.0 km/l`}
                                </span>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: '100%' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--color-primary-dark)' }}>
                                        Consumo applicato {selectedVehicleIds.length > 1 ? '(media flotta):' : ':'}
                                    </span>
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
                                        Consumo: {calculationResult.consumption_km_l} km/l {calculationResult.consumption_detected ? '(🤖 IA)' : '(garage/default)'}
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

                {/* ========================================================================= */}
                {/* POPUP CONTESTUALE (LONG PRESS O CLIC STELLINA) */}
                {/* ========================================================================= */}
                {contextVehicle && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(3px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10,
                            padding: '1.5rem'
                        }}
                        onClick={() => setContextVehicle(null)}
                    >
                        <div
                            className="bounce-in"
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '18px',
                                padding: '1.25rem',
                                width: '100%',
                                maxWidth: '340px',
                                boxShadow: 'var(--shadow-lg)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <img
                                    src={contextVehicle.image_url}
                                    alt={contextVehicle.name}
                                    style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                />
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                                        {contextVehicle.name}
                                    </h4>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Consumo: {contextVehicle.consumption_km_l} km/l
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => handleSetDefault(contextVehicle)}
                                    className="btn btn-primary"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        fontSize: '0.88rem',
                                        fontWeight: 'bold',
                                        backgroundColor: '#f59e0b',
                                        borderColor: '#f59e0b'
                                    }}
                                >
                                    <Star size={16} fill="white" /> Imposta come Predefinita
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleDeleteVehicle(contextVehicle)}
                                    className="btn btn-outline"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.7rem',
                                        fontSize: '0.85rem',
                                        color: '#e63946',
                                        borderColor: '#ef9a9a'
                                    }}
                                >
                                    <Trash2 size={16} /> Rimuovi dal Garage
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setContextVehicle(null)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.4rem',
                                        fontSize: '0.8rem',
                                        color: 'var(--color-text-muted)'
                                    }}
                                >
                                    Annulla
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================================= */}
                {/* MODALE AGGIUNGI VEICOLO (ANALISI IA, NOME CANONICO & RENDER 3D) */}
                {/* ========================================================================= */}
                {isAddModalOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 20,
                            padding: '1.25rem'
                        }}
                        onClick={() => setIsAddModalOpen(false)}
                    >
                        <div
                            className="bounce-in"
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '20px',
                                padding: '1.5rem',
                                width: '100%',
                                maxWidth: '440px',
                                maxHeight: '88vh',
                                overflowY: 'auto',
                                boxShadow: 'var(--shadow-xl)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '1rem'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Sparkles size={20} style={{ color: 'var(--color-primary)' }} />
                                    <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                                        Aggiungi Auto al Garage
                                    </h4>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                Scrivi il modello e le caratteristiche (anche il colore!). L'IA estrarrà il nome pulito, il consumo medio (km/l) e creerà un <strong>render 3D</strong> personalizzato.
                            </p>

                            {/* Form Ricerca / Analisi IA */}
                            <form onSubmit={handleAnalyzeNewVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--color-primary-dark)', display: 'block', marginBottom: '0.3rem' }}>
                                        Nome o Modello Veicolo
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Es. Fiat Panda 2013 nera, Kia Sportage bianca, Van Ford Transit..."
                                        value={newVehiclePrompt}
                                        onChange={e => setNewVehiclePrompt(e.target.value)}
                                        autoFocus
                                        style={{
                                            width: '100%',
                                            padding: '0.65rem 0.85rem',
                                            borderRadius: '10px',
                                            border: '1.5px solid var(--color-border)',
                                            fontSize: '0.9rem'
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isAnalyzing || !newVehiclePrompt.trim()}
                                    className="btn btn-primary"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem',
                                        padding: '0.75rem',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        borderRadius: '10px'
                                    }}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" /> Analisi e Generazione 3D in corso...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} /> Analizza con IA (Consumo + Render 3D)
                                        </>
                                    )}
                                </button>
                            </form>

                            {addVehicleError && (
                                <div style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', backgroundColor: '#ffebee', color: '#c62828', fontSize: '0.8rem' }}>
                                    {addVehicleError}
                                </div>
                            )}

                            {/* Anteprima Risultato Generato dall'IA */}
                            {analyzedVehicle && (
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '14px',
                                    border: '1.5px solid #cbd5e1',
                                    padding: '1rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.85rem'
                                }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '3px 8px', borderRadius: '6px', alignSelf: 'flex-start' }}>
                                        ✓ Dati Elaborati dall'IA
                                    </span>

                                    {/* Immagine 3D Generata */}
                                    <div style={{
                                        width: '100%',
                                        height: '140px',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        backgroundColor: 'white',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <img
                                            src={analyzedVehicle.image_url}
                                            alt={analyzedVehicle.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    </div>

                                    {/* Campi Modificabili (Nome Pulito e Consumo) */}
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                                            Nome Canonico (pulito):
                                        </label>
                                        <input
                                            type="text"
                                            value={analyzedVehicle.name}
                                            onChange={e => setAnalyzedVehicle({ ...analyzedVehicle, name: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '8px',
                                                border: '1px solid var(--color-border)',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                                                Consumo Medio (km/l):
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                min="3"
                                                max="40"
                                                value={analyzedVehicle.consumption_km_l}
                                                onChange={e => setAnalyzedVehicle({ ...analyzedVehicle, consumption_km_l: parseFloat(e.target.value) || 16.0 })}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem 0.75rem',
                                                    borderRadius: '8px',
                                                    border: '1px solid var(--color-border)',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.9rem'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.2rem' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', color: 'var(--color-primary-dark)' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={analyzedVehicle.is_default || false}
                                                    onChange={e => setAnalyzedVehicle({ ...analyzedVehicle, is_default: e.target.checked })}
                                                    style={{ width: '16px', height: '16px' }}
                                                />
                                                Imposta come predefinita (⭐)
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSaveNewVehicle}
                                        disabled={isSavingVehicle || !analyzedVehicle.name.trim()}
                                        className="btn btn-primary"
                                        style={{
                                            padding: '0.8rem',
                                            fontWeight: 'bold',
                                            fontSize: '0.95rem',
                                            borderRadius: '10px',
                                            backgroundColor: '#2e7d32',
                                            borderColor: '#2e7d32',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        {isSavingVehicle ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" /> Salvataggio in corso...
                                            </>
                                        ) : (
                                            <>
                                                <Check size={18} /> Salva nel Garage e Seleziona
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeliveryCalculatorModal;
