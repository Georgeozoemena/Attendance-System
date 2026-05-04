import { useState, useEffect } from 'react';
import { API_BASE, getAuthHeaders } from '../../services/api';

const STATUS_TABS = ['pending', 'approved', 'rejected'];

function TestimonyModal({ testimony: t, onClose, onAction, onDelete, activeTab, readOnly }) {
    if (!t) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                style={{ maxWidth: '560px', width: '100%' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-1)' }}>
                                {t.name}
                            </span>
                            <span className="badge-pill" style={{
                                background: 'var(--dc-blue-lt)', color: 'var(--dc-blue)',
                                border: '1px solid var(--dc-blue-border)', textTransform: 'capitalize'
                            }}>
                                {t.category}
                            </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                            {t.phone && <span style={{ marginRight: '12px' }}>{t.phone}</span>}
                            {new Date(t.createdAt).toLocaleString()}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div style={{
                    background: 'var(--surface-2)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)', padding: '16px', marginBottom: '20px',
                    maxHeight: '320px', overflowY: 'auto'
                }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-1)', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>
                        {t.content}
                    </p>
                </div>

                {/* Actions */}
                <div className="modal-actions">
                    {!readOnly && activeTab === 'pending' && (
                        <>
                            <button className="modal-btn primary" onClick={() => onAction(t.id, 'approved')}>
                                Approve
                            </button>
                            <button className="modal-btn primary danger" onClick={() => onAction(t.id, 'rejected')}>
                                Reject
                            </button>
                        </>
                    )}
                    {!readOnly && activeTab === 'approved' && (
                        <button className="modal-btn primary danger" onClick={() => onAction(t.id, 'rejected')}>
                            Revoke Approval
                        </button>
                    )}
                    {!readOnly && activeTab === 'rejected' && (
                        <button className="modal-btn primary" onClick={() => onAction(t.id, 'approved')}>
                            Approve
                        </button>
                    )}
                    {!readOnly && (
                        <button className="modal-btn" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => onDelete(t.id)}>
                            Delete
                        </button>
                    )}
                    <button className="modal-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

export default function TestimoniesPage({ readOnly }) {
    const [testimonies, setTestimonies] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        fetchTestimonies(activeTab);
    }, [activeTab]);

    const fetchTestimonies = async (status) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/testimonies?status=${status}`, {
                headers: { ...getAuthHeaders() }
            });
            if (res.ok) setTestimonies(await res.json());
        } catch (err) {
            console.error('Failed to fetch testimonies', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (id, action) => {
        try {
            const res = await fetch(`${API_BASE}/api/testimonies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ status: action })
            });
            if (res.ok) {
                setTestimonies(prev => prev.filter(t => t.id !== id));
                setSelected(null);
            }
        } catch (err) {
            console.error('Action failed', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this testimony permanently?')) return;
        try {
            await fetch(`${API_BASE}/api/testimonies/${id}`, {
                method: 'DELETE',
                headers: { ...getAuthHeaders() }
            });
            setTestimonies(prev => prev.filter(t => t.id !== id));
            setSelected(null);
        } catch (err) {
            console.error('Delete failed', err);
        }
    };

    const copyShareLink = () => {
        const link = `${window.location.origin}/testimony`;
        navigator.clipboard.writeText(link);
        alert('Testimony link copied to clipboard!');
    };

    return (
        <div className="admin-page-container">
            <header className="page-header">
                <div className="header-content">
                    <h1>Testimonies</h1>
                    <p className="subtitle">Review and manage member testimonies</p>
                </div>
                <button className="action-btn primary" onClick={copyShareLink}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Copy Share Link
                </button>
            </header>

            <div className="admin-tabs-btns">
                {STATUS_TABS.map(tab => (
                    <button
                        key={tab}
                        className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ textTransform: 'capitalize' }}
                    >
                        {tab}
                        {tab === activeTab && testimonies.length > 0 && (
                            <span style={{
                                marginLeft: '6px', background: 'var(--amber-lt)', color: 'var(--amber)',
                                border: '1px solid var(--amber-border)', borderRadius: '100px',
                                fontSize: '10px', fontWeight: '700', padding: '1px 6px'
                            }}>
                                {testimonies.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-state">Loading...</div>
            ) : testimonies.length === 0 ? (
                <div className="empty-state">No {activeTab} testimonies yet.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {testimonies.map(t => (
                        <div
                            key={t.id}
                            className="data-table-card"
                            style={{ padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                            onClick={() => setSelected(t)}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                        >
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-1)', fontSize: '13px' }}>
                                            {t.name}
                                        </span>
                                        <span className="badge-pill" style={{
                                            background: 'var(--dc-blue-lt)', color: 'var(--dc-blue)',
                                            border: '1px solid var(--dc-blue-border)', textTransform: 'capitalize', fontSize: '10px'
                                        }}>
                                            {t.category}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-4)', marginLeft: 'auto' }}>
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.5',
                                        overflow: 'hidden', display: '-webkit-box',
                                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                                        margin: 0
                                    }}>
                                        {t.content}
                                    </p>
                                </div>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-4)', flexShrink: 0, marginTop: '2px' }}>
                                    <polyline points="9 18 15 12 9 6" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <TestimonyModal
                testimony={selected}
                activeTab={activeTab}
                onClose={() => setSelected(null)}
                onAction={handleAction}
                onDelete={handleDelete}
                readOnly={readOnly}
            />
        </div>
    );
}
