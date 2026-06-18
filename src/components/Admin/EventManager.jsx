import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useProducts, useEvents } from '../../hooks/useData';
import { Trash2, Plus, Save, Pencil, Eye, EyeOff, X, Search, ChevronUp, ChevronDown } from 'lucide-react';
import ImageUpload from '../Common/ImageUpload';

const EventManager = () => {
    const { events, mutate: mutateEvents } = useEvents();
    const { products } = useProducts();
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);

    // New Event State
    const [newEvent, setNewEvent] = useState({
        name: '',
        date_text: '',
        is_visible: true,
        hide_at: '',
        where_title: 'Dove saremo',
        where_image_url: '',
        where_link: '',
        where_description: '',
        products_title: 'I prodotti che porteremo',
        products_description: '',
        info_title: 'Altre informazioni',
        info_description: '',
        product_ids: [] // Array of product IDs associated with the event
    });

    useEffect(() => {
        if (isCreating) {
            document.body.classList.add('modal-open');
        } else {
            document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
    }, [isCreating]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.updateEvent(editingId, newEvent);
            } else {
                await api.createEvent(newEvent);
            }
            setIsCreating(false);
            setEditingId(null);
            setNewEvent({
                name: '',
                date_text: '',
                is_visible: true,
                hide_at: '',
                where_title: 'Dove saremo',
                where_image_url: '',
                where_link: '',
                where_description: '',
                products_title: 'I prodotti che porteremo',
                products_description: '',
                info_title: 'Altre informazioni',
                info_description: '',
                product_ids: []
            });
            mutateEvents();
        } catch (err) {
            console.error(err);
            alert('Errore durante il salvataggio dell\'evento');
        }
    };

    const formatDateForInput = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        } catch (e) {
            return '';
        }
    };

    const handleEdit = (event) => {
        setEditingId(event.id);
        setNewEvent({
            name: event.name,
            date_text: event.date_text,
            is_visible: event.is_visible !== undefined ? event.is_visible : true,
            hide_at: event.hide_at ? formatDateForInput(event.hide_at) : '',
            where_title: event.where_title || 'Dove saremo',
            where_image_url: event.where_image_url || '',
            where_link: event.where_link || '',
            where_description: event.where_description || '',
            products_title: event.products_title || 'I prodotti che porteremo',
            products_description: event.products_description || '',
            info_title: event.info_title || 'Altre informazioni',
            info_description: event.info_description || '',
            product_ids: event.products ? event.products.map(p => p.id) : []
        });
        setIsCreating(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Sei sicuro di voler eliminare questo evento?')) return;
        try {
            await api.deleteEvent(id);
            mutateEvents();
        } catch (err) {
            console.error(err);
            alert('Errore durante l\'eliminazione');
        }
    };

    const toggleVisibility = async (event) => {
        try {
            await api.updateEvent(event.id, {
                ...event,
                is_visible: !event.is_visible,
                product_ids: event.products ? event.products.map(p => p.id) : []
            });
            mutateEvents();
        } catch (err) {
            console.error('Failed to update visibility', err);
            alert('Errore durante l\'aggiornamento della visibilità');
        }
    };

    const handleMoveEventUp = async (index) => {
        if (index === 0) return;
        const newEvents = [...events];
        const temp = newEvents[index];
        newEvents[index] = newEvents[index - 1];
        newEvents[index - 1] = temp;
        const updates = newEvents.map((ev, idx) => ({ id: ev.id, sort_order: idx }));
        mutateEvents(newEvents, false);
        try {
            await api.reorderEvents(updates);
            mutateEvents();
        } catch (err) {
            mutateEvents();
        }
    };

    const handleMoveEventDown = async (index) => {
        if (index === events.length - 1) return;
        const newEvents = [...events];
        const temp = newEvents[index];
        newEvents[index] = newEvents[index + 1];
        newEvents[index + 1] = temp;
        const updates = newEvents.map((ev, idx) => ({ id: ev.id, sort_order: idx }));
        mutateEvents(newEvents, false);
        try {
            await api.reorderEvents(updates);
            mutateEvents();
        } catch (err) {
            mutateEvents();
        }
    };

    const toggleProductSelection = (prodId) => {
        const selected = [...newEvent.product_ids];
        if (selected.includes(prodId)) {
            setNewEvent({
                ...newEvent,
                product_ids: selected.filter(id => id !== prodId)
            });
        } else {
            setNewEvent({
                ...newEvent,
                product_ids: [...selected, prodId]
            });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2>Gestione Eventi</h2>
                <button className="btn btn-primary" onClick={() => {
                    setIsCreating(true);
                    setEditingId(null);
                    setNewEvent({
                        name: '',
                        date_text: '',
                        is_visible: true,
                        hide_at: '',
                        where_title: 'Dove saremo',
                        where_image_url: '',
                        where_link: '',
                        where_description: '',
                        products_title: 'I prodotti che porteremo',
                        products_description: '',
                        info_title: 'Altre informazioni',
                        info_description: '',
                        product_ids: []
                    });
                }}>
                    <Plus size={18} style={{ marginRight: '8px' }} />
                    Nuovo Evento
                </button>
            </div>

            {/* Event List */}
            <div className="glass-panel" style={{ padding: '0', overflowX: 'auto' }}>
                {events.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        Nessun evento configurato. Creane uno per iniziare!
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                                <th style={{ padding: '1rem 1.5rem' }}>Ordinamento</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Nome Evento</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Data</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Prodotti Associati</th>
                                <th style={{ padding: '1rem 1.5rem' }}>Visibilità</th>
                                <th style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.map((ev, index) => (
                                <tr key={ev.id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }} className="table-row-hover">
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                                            <button 
                                                className="btn btn-outline" 
                                                style={{ padding: '0.1rem', visibility: index === 0 ? 'hidden' : 'visible' }}
                                                onClick={() => handleMoveEventUp(index)}
                                                title="Sposta Su"
                                            >
                                                <ChevronUp size={16} />
                                            </button>
                                            <button 
                                                className="btn btn-outline" 
                                                style={{ padding: '0.1rem', visibility: index === events.length - 1 ? 'hidden' : 'visible' }}
                                                onClick={() => handleMoveEventDown(index)}
                                                title="Sposta Giù"
                                            >
                                                <ChevronDown size={16} />
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 'bold' }}>{ev.name}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>{ev.date_text}</td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <span className="badge-elegant" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--color-text)' }}>
                                            {ev.products ? ev.products.length : 0} prodotti
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem' }}>
                                        <button 
                                            onClick={() => toggleVisibility(ev)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: ev.is_visible ? 'green' : 'var(--color-text-muted)' }}
                                            title={ev.is_visible ? "Visibile sulla Home" : "Nascosto"}
                                        >
                                            {ev.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                                            <span style={{ fontSize: '0.85rem' }}>{ev.is_visible ? 'Visibile' : 'Nascosto'}</span>
                                        </button>
                                    </td>
                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button className="btn btn-outline" style={{ padding: '0.5rem' }} onClick={() => handleEdit(ev)} title="Modifica">
                                                <Pencil size={16} />
                                            </button>
                                            <button className="btn btn-outline" style={{ padding: '0.5rem', borderColor: '#E11D48', color: '#E11D48' }} onClick={() => handleDelete(ev.id)} title="Elimina">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create/Edit Modal */}
            {isCreating && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000
                }} onClick={() => setIsCreating(false)}>
                    <div className="modal-content bounce-in" style={{ 
                        width: '95vw', 
                        maxWidth: '1200px', 
                        maxHeight: '90vh', 
                        padding: '0', 
                        backgroundColor: 'var(--color-bg)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }} onClick={e => e.stopPropagation()}>
                        
                        {/* Modal Header */}
                        <div style={{ 
                            padding: '1.5rem', 
                            borderBottom: '1px solid var(--color-border)', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            backgroundColor: 'white',
                            zIndex: 10
                        }}>
                            <h3 style={{ margin: 0 }}>{editingId ? 'Modifica Evento' : 'Nuovo Evento'}</h3>
                            <button 
                                className="btn btn-outline" 
                                style={{ padding: '0.5rem', borderRadius: '50%', width: '40px', height: '40px' }}
                                onClick={() => setIsCreating(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                            <form id="event-form" onSubmit={handleSave} style={{ 
                                display: 'grid', 
                                gridTemplateColumns: window.innerWidth > 992 ? '1.2fr 1fr' : '1fr', 
                                gap: '2rem' 
                            }}>
                                
                                {/* Left Side: Configuration Fields */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Base Fields */}
                                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                                        <h4 style={{ marginBottom: '1.2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem', color: 'var(--color-primary-dark)' }}>Info Evento</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', marginBottom: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Nome Evento</label>
                                                <input
                                                    className="form-control"
                                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                    value={newEvent.name}
                                                    onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                                    required
                                                    placeholder="Es. Festa della Birra"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Data</label>
                                                <input
                                                    className="form-control"
                                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                    value={newEvent.date_text}
                                                    onChange={e => setNewEvent({ ...newEvent, date_text: e.target.value })}
                                                    required
                                                    placeholder="Es. Sabato 25 Giugno"
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setNewEvent({ ...newEvent, is_visible: !newEvent.is_visible })}>
                                                <input type="checkbox" checked={newEvent.is_visible} readOnly style={{ marginRight: '0.5rem', width: '18px', height: '18px' }} />
                                                <label style={{ fontWeight: 'bold', cursor: 'pointer', margin: 0 }}>Attivo / Visibile</label>
                                            </div>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <label style={{ fontWeight: 'bold', fontSize: '0.9rem', margin: 0 }}>nascondi il...</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    style={{ padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '0.9rem', cursor: 'pointer' }}
                                                    value={newEvent.hide_at || ''}
                                                    onChange={e => setNewEvent({ ...newEvent, hide_at: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 1: Dove saremo */}
                                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                                        <h4 style={{ marginBottom: '1.2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem', color: 'var(--color-primary-dark)' }}>Card 1: Dove saremo</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Titolo Card</label>
                                                <input
                                                    className="form-control"
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                    value={newEvent.where_title}
                                                    onChange={e => setNewEvent({ ...newEvent, where_title: e.target.value })}
                                                    placeholder="Es. Dove saremo"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Link Mappa o Esterno</label>
                                                <input
                                                    className="form-control"
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                    value={newEvent.where_link}
                                                    onChange={e => setNewEvent({ ...newEvent, where_link: e.target.value })}
                                                    placeholder="Es. https://maps.google.com/..."
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Descrizione</label>
                                                <textarea
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', height: '70px', resize: 'vertical' }}
                                                    value={newEvent.where_description}
                                                    onChange={e => setNewEvent({ ...newEvent, where_description: e.target.value })}
                                                    placeholder="Dettagli logistici o di orario per il pubblico..."
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Immagine Location</label>
                                                <ImageUpload
                                                    images={newEvent.where_image_url ? [newEvent.where_image_url] : []}
                                                    onUpload={(newImages) => setNewEvent({
                                                        ...newEvent,
                                                        where_image_url: newImages.length > 0 ? newImages[0] : ''
                                                    })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 2: I prodotti che porteremo */}
                                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                                        <h4 style={{ marginBottom: '1.2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem', color: 'var(--color-primary-dark)' }}>Card 2: I prodotti che porteremo</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Titolo Card</label>
                                                <input
                                                    className="form-control"
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                    value={newEvent.products_title}
                                                    onChange={e => setNewEvent({ ...newEvent, products_title: e.target.value })}
                                                    placeholder="Es. I prodotti che porteremo"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Descrizione</label>
                                                <textarea
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', height: '70px', resize: 'vertical' }}
                                                    value={newEvent.products_description}
                                                    onChange={e => setNewEvent({ ...newEvent, products_description: e.target.value })}
                                                    placeholder="Breve testo sui prodotti proposti..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 3: Altre informazioni */}
                                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>
                                        <h4 style={{ marginBottom: '1.2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.4rem', color: 'var(--color-primary-dark)' }}>Card 3: Altre informazioni</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Titolo Card</label>
                                                <input
                                                    className="form-control"
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
                                                    value={newEvent.info_title}
                                                    onChange={e => setNewEvent({ ...newEvent, info_title: e.target.value })}
                                                    placeholder="Es. Altre informazioni"
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>Contenuto di Testo</label>
                                                <textarea
                                                    style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', height: '100px', resize: 'vertical' }}
                                                    value={newEvent.info_description}
                                                    onChange={e => setNewEvent({ ...newEvent, info_description: e.target.value })}
                                                    placeholder="Scrivi qui ulteriori dettagli sull'evento..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Associated Products Picker */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: 0 }}>
                                    <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary-dark)' }}>Seleziona Prodotti per l'Evento</h4>
                                        
                                        <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                            <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                                            <input
                                                type="text"
                                                placeholder="Cerca prodotto nel catalogo..."
                                                style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 2.5rem', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>

                                        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '550px', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
                                            {products.filter(p => p.name.toLowerCase().includes((searchTerm || '').toLowerCase())).map(p => {
                                                const isSelected = newEvent.product_ids.includes(p.id);
                                                return (
                                                    <div 
                                                        key={p.id} 
                                                        onClick={() => toggleProductSelection(p.id)}
                                                        style={{
                                                            padding: '0.75rem', 
                                                            borderRadius: '8px',
                                                            border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                                            backgroundColor: isSelected ? 'rgba(155, 57, 61, 0.03)' : 'white',
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: '1rem',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isSelected} 
                                                            readOnly 
                                                            style={{ width: '16px', height: '16px', cursor: 'pointer' }} 
                                                        />
                                                        {p.image_url && (
                                                            <img
                                                                src={p.image_url}
                                                                alt={p.name}
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                                                            />
                                                        )}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <h5 style={{ margin: 0, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h5>
                                                            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                                                {p.is_sold_by_piece ? `€${p.price_per_piece}/pz` : `€${p.price_per_kg}/kg`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                {newEvent.product_ids.length} prodotti selezionati
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', italic: 'true' }}>
                                                Le immagini di questi prodotti scorreranno nella Card 2
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div style={{ 
                            padding: '1.5rem', 
                            borderTop: '1px solid var(--color-border)', 
                            display: 'flex', 
                            justifyContent: 'flex-end', 
                            gap: '1rem',
                            backgroundColor: 'white'
                        }}>
                            <button type="button" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }} onClick={() => setIsCreating(false)}>
                                Annulla
                            </button>
                            <button type="submit" form="event-form" className="btn btn-primary" style={{ padding: '0.75rem 2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Save size={18} />
                                Salva Evento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventManager;
