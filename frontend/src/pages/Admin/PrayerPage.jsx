import { useState, useEffect } from 'react';
import { API_BASE, getAuthHeaders } from '../../services/api';

export default function PrayerPage({ readOnly }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selected, setSelected] = useState(null);

  useEffect(() => { fetchRequests(activeTab); }, [activeTab]);

  async function fetchRequests(status) {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/prayer?status=${status}`, { headers: { ...getAuthHeaders() } });
      if (res.ok) setRequests(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleAction(id, status) {
    await fetch(`${API_BASE}/api/prayer/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ status })
    });
    setRequests(prev => prev.filter(r => r.id !== id));
    setSelected(null);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this prayer request?')) return;
    await fetch(`${API_BASE}/api/prayer/${id}`, { method: 'DELETE', headers: { ...getAuthHeaders() } });
    setRequests(prev => prev.filter(r => r.id !== id));
    setSelected(null);
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/prayer`);
    alert('Prayer request link copied!');
  };

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Prayer Requests</h1>
          <p className="subtitle">Intercede for your congregation</p>
        </div>
        <button className="action-btn primary" onClick={copyLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Copy Share Link
        </button>
      </header>

      <div className="admin-tabs-btns">
        {['pending', 'prayed'].map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
            {tab === 'pending' ? 'Needs Prayer' : 'Prayed For'}
            {tab === activeTab && requests.length > 0 && (
              <span style={{ marginLeft: '6px', background: 'var(--dc-blue-lt)', color: 'var(--dc-blue)', border: '1px solid var(--dc-blue-border)', borderRadius: '100px', fontSize: '10px', fontWeight: '700', padding: '1px 6px' }}>{requests.length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-state">Loading...</div> :
        requests.length === 0 ? <div className="empty-state">No {activeTab === 'pending' ? 'pending' : 'prayed'} requests.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {requests.map(r => (
              <div key={r.id} className="data-table-card" style={{ padding: '16px 20px', cursor: 'pointer' }}
                onClick={() => setSelected(r)}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: '600', color: 'var(--text-1)', fontSize: '13px' }}>{r.name}</span>
                      <span className="badge-pill" style={{ background: 'var(--dc-blue-lt)', color: 'var(--dc-blue)', border: '1px solid var(--dc-blue-border)', textTransform: 'capitalize', fontSize: '10px' }}>{r.category}</span>
                      <span style={{ fontSize: '11px', color: 'var(--text-4)', marginLeft: 'auto' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: '1.5', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', margin: 0 }}>{r.request}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-4)', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '700', fontSize: '16px' }}>{selected.name}</span>
                  <span className="badge-pill" style={{ background: 'var(--dc-blue-lt)', color: 'var(--dc-blue)', border: '1px solid var(--dc-blue-border)', textTransform: 'capitalize' }}>{selected.category}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '4px' }}>
                  {selected.phone && <span style={{ marginRight: '12px' }}>{selected.phone}</span>}
                  {new Date(selected.createdAt).toLocaleString()}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: '20px', maxHeight: '280px', overflowY: 'auto' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-1)', lineHeight: '1.7', whiteSpace: 'pre-wrap', margin: 0 }}>{selected.request}</p>
            </div>
            <div className="modal-actions">
              {!readOnly && activeTab === 'pending' && (
                <button className="modal-btn primary" onClick={() => handleAction(selected.id, 'prayed')}>
                  🙏 Mark as Prayed
                </button>
              )}
              {!readOnly && activeTab === 'prayed' && (
                <button className="modal-btn" onClick={() => handleAction(selected.id, 'pending')}>Move to Pending</button>
              )}
              {!readOnly && (
                <button className="modal-btn" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => handleDelete(selected.id)}>Delete</button>
              )}
              <button className="modal-btn" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
