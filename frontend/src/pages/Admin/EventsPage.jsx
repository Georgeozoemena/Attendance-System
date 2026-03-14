import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { API_BASE } from '../../services/api';

const EventsPage = () => {
    const { fetchByEvent, setEventFilter } = useOutletContext();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ 
        name: '', 
        type: 'Sunday Service', 
        date: new Date().toISOString().split('T')[0],
        expiry_duration: 60 // Default 60 minutes
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const adminKey = localStorage.getItem('adminKey');
            const res = await fetch(`${API_BASE}/api/events`, {
                headers: { 'Authorization': adminKey }
            });
            if (res.status === 401) {
                localStorage.removeItem('adminKey');
                window.location.href = '/admin/login';
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setEvents(data);
            } else {
                setEvents([]);
            }
        } catch (err) {
            console.error('Failed to fetch events', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvent = async (e) => {
        e.preventDefault();
        try {
            const adminKey = localStorage.getItem('adminKey');
            const res = await fetch(`${API_BASE}/api/events`, {
                method: 'POST',
                headers: {
                    'Authorization': adminKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newEvent)
            });
            if (res.ok) {
                fetchEvents();
                setShowAddModal(false);
                setNewEvent({ 
                    name: '', 
                    type: 'Sunday Service', 
                    date: new Date().toISOString().split('T')[0],
                    expiry_duration: 60 
                });
            }
        } catch (err) {
            console.error('Failed to create event', err);
        }
    };

    const handleDeleteEvent = async (id) => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;
        try {
            const adminKey = localStorage.getItem('adminKey');
            const res = await fetch(`${API_BASE}/api/events/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': adminKey }
            });
            if (res.ok) fetchEvents();
        } catch (err) {
            console.error('Failed to delete event', err);
        }
    };

    const handleToggleFreeze = async (id) => {
        try {
            const adminKey = localStorage.getItem('adminKey');
            const res = await fetch(`${API_BASE}/api/events/${id}/freeze`, {
                method: 'PATCH',
                headers: { 'Authorization': adminKey }
            });
            if (res.ok) fetchEvents();
        } catch (err) {
            console.error('Failed to toggle freeze', err);
        }
    };

    const handleViewAttendance = (eventId) => {
        setEventFilter(eventId);
        fetchByEvent(eventId);
        navigate('/admin/live');
    };

    const copyEventLink = (id) => {
        const link = `${window.location.origin}/attend?eventId=${id}`;
        navigator.clipboard.writeText(link);
        alert('Event link copied to clipboard!');
    };

    if (loading) {
        return <div className="loading-state">Loading events...</div>;
    }

    return (
        <div className="admin-page-container">
            <header className="page-header">
                <div className="header-content">
                    <h1>Events Management</h1>
                    <p className="subtitle">Create and manage church services and programs</p>
                </div>
                <button className="action-btn primary" onClick={() => setShowAddModal(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    New Event
                </button>
            </header>

            <div className="data-table-card" style={{ marginTop: '24px' }}>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Event Name</th>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.length > 0 ? (
                            events.map(event => (
                                <tr key={event.id}>
                                    <td>{new Date(event.date).toLocaleDateString()}</td>
                                    <td className="name-cell">{event.name}</td>
                                    <td>
                                        <span className={`badge ${event.type.toLowerCase().replace(/\s+/g, '-')}`}>
                                            {event.type}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-pill ${event.status} ${event.is_frozen ? 'frozen' : ''}`}>
                                            {event.is_frozen ? 'FROZEN' : event.status}
                                        </span>
                                    </td>
                                    <td style={{ display: 'flex', gap: '8px' }}>
                                        <button 
                                            className={`small-btn text ${event.is_frozen ? 'warning' : ''}`} 
                                            onClick={() => handleToggleFreeze(event.id)}
                                            style={{ color: event.is_frozen ? '#f59e0b' : 'var(--primary)' }}
                                        >
                                            {event.is_frozen ? 'Resume' : 'Freeze'}
                                        </button>
                                        <button className="small-btn text" onClick={() => handleViewAttendance(event.id)} style={{ color: 'var(--primary)' }}>View Data</button>
                                        <button className="small-btn text" onClick={() => copyEventLink(event.id)}>Copy Link</button>
                                        <button className="small-btn danger text" onClick={() => handleDeleteEvent(event.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="empty-state">No events found. Create your first event to get started.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Create New Event</h3>
                        <form onSubmit={handleAddEvent}>
                            <div className="form-group">
                                <label>Event Name</label>
                                <input
                                    type="text"
                                    required
                                    className="input"
                                    placeholder="e.g. Sunday Celebration Service"
                                    value={newEvent.name}
                                    onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Event Type</label>
                                <select
                                    className="input"
                                    value={newEvent.type}
                                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                >
                                    <option value="Sunday Service">Sunday Service</option>
                                    <option value="Mid-week Service">Mid-week Service</option>
                                    <option value="Special Program">Special Program</option>
                                    <option value="Worker Meeting">Worker Meeting</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    required
                                    className="input"
                                    value={newEvent.date}
                                    onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Expiry Duration (Minutes)</label>
                                <select
                                    className="input"
                                    value={newEvent.expiry_duration}
                                    onChange={e => setNewEvent({ ...newEvent, expiry_duration: parseInt(e.target.value) })}
                                >
                                    <option value="15">15 Minutes</option>
                                    <option value="30">30 Minutes</option>
                                    <option value="60">1 Hour (60m)</option>
                                    <option value="120">2 Hours (120m)</option>
                                    <option value="240">4 Hours (240m)</option>
                                    <option value="480">8 Hours (480m)</option>
                                    <option value="1440">24 Hours (Max)</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="submit" className="modal-btn primary">Create Event</button>
                                <button type="button" className="modal-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventsPage;
