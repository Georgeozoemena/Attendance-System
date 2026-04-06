import { useState, useEffect } from 'react';
import { API_BASE } from '../../services/api';

const STATUS_TABS = ['pending', 'approved', 'rejected'];

export default function TestimoniesPage() {
    const [testimonies, setTestimonies] = useState([]);
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);

    useEffect(() => {
        fetchTestimonies(activeTab);
    }, [activeTab]);

    const fetchTestimonies = async (status) => {
        setLoading(true);
        try {
            const adminKey = localStorage.getItem('adminKey');
            const res = await fetch(`${API_BASE}/api/testimonies?status=${status}`, {
                headers: { 'x-admin-key': adminKey }
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
            const adminKey = localStorage.getItem('adminKey');
            const res = await fetch(`${API_BASE}/api/testimonies/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
                body: JSON.stringify({ status: action })
            });
            if (res.ok) {
                setTestimonies(prev => prev.filter(t => t.id !== id));
                setExpanded(null);
            }
        } catch (err) {
            console.error('Action failed', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this testimony permanently?')) return;
        try {
            const adminKey = localStorage.getItem('adminKey');
            await fetch(`${API_BASE}/api/testimonies/${id}`, {
                method: 'DELETE',
                headers: { 'x-admin-key': adminKey }
            });
            setTestimonies(prev => prev.filter(t => t.id !== id));
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
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-state">Loading...</div>
            ) : testimonies.length === 0 ? (
                <div className="empty-state">
                    No {activeTab} testimonies yet.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {testimonies.map(t => (
                        <div key={t.id} className="data-table-card" style={{ padding: '18px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: '600', color: 'var(--text-1)', fontSize: '14px' }}>{t.name}</span>
                                        <span className="badge-pill" style={{ background: 'var(--dc-blue-lt)', color: 'var(--dc-blue)', border: '1px solid var(--dc-blue-border)', textTransform: 'capitalize' }}>
                                            {t.category}
                                        </span>
                                        {t.phone && <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{t.phone}</span>}
                                        <span style={{ fontSize: '11px', color: 'var(--text-4)', marginLeft: 'auto' }}>
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p style={{
                                        fontSize: '13px',
                                        color: 'var(--text-2)',
                                        lineHeight: '1.6',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: expanded === t.id ? 'unset' : 3,
                                        WebkitBoxOrient: 'vertical',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {t.content}
                                    </p>
                                    {t.content.length > 200 && (
                                        <button
                                            onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                                            style={{ background: 'none', border: 'none', color: 'var(--dc-blue)', fontSize: '12px', padding: '4px 0', cursor: 'pointer' }}
                                        >
                                            {expanded === t.id ? 'Show less' : 'Read more'}
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                                    {activeTab === 'pending' && (
                                        <>
                                            <button className="action-btn primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleAction(t.id, 'approved')}>
                                                Approve
                                            </button>
                                            <button className="small-btn danger" onClick={() => handleAction(t.id, 'rejected')}>
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    {activeTab === 'approved' && (
                                        <button className="small-btn danger" onClick={() => handleAction(t.id, 'rejected')}>
                                            Revoke
                                        </button>
                                    )}
                                    {activeTab === 'rejected' && (
                                        <button className="action-btn" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleAction(t.id, 'approved')}>
                                            Approve
                                        </button>
                                    )}
                                    <button className="small-btn danger" onClick={() => handleDelete(t.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
