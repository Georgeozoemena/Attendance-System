import { useState, useEffect, useCallback } from 'react';
import { API_BASE, getAuthHeaders } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  pending:     { bg: 'var(--amber-lt)',   color: 'var(--amber)',   border: 'var(--amber-border)' },
  in_progress: { bg: 'var(--dc-blue-lt)', color: 'var(--dc-blue)', border: 'var(--dc-blue-border)' },
  resolved:    { bg: 'var(--green-lt)',   color: 'var(--green)',   border: 'var(--green-border)' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  const label = status ? status.replace('_', ' ') : 'pending';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: '100px', fontSize: '11px', fontWeight: '600',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize',
    }}>
      {label}
    </span>
  );
}

const EMPTY_FORM = { member_id: '', action_type: 'called', note: '', status: 'pending' };

export default function FollowUpLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date_from: '', date_to: '', status: 'all', action_type: 'all' });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date_from)   params.set('date_from', filters.date_from);
      if (filters.date_to)     params.set('date_to', filters.date_to);
      if (filters.status !== 'all')      params.set('status', filters.status);
      if (filters.action_type !== 'all') params.set('action_type', filters.action_type);
      const res = await fetch(`${API_BASE}/api/followup-logs?${params}`, {
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) setLogs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.member_id.trim()) { setError('Member ID is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/followup-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowModal(false);
        setForm(EMPTY_FORM);
        fetchLogs();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    const res = await fetch(`${API_BASE}/api/followup-logs/export`, {
      headers: { ...getAuthHeaders() },
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'followup-log.pdf';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  function setFilter(key, val) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Follow-Up Log</h1>
          <p className="subtitle">Track pastoral follow-up actions</p>
        </div>
        <div className="top-bar-actions">
          <button className="action-btn" onClick={handleExport}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export PDF
          </button>
          <button className="action-btn primary" onClick={() => { setShowModal(true); setError(''); setForm(EMPTY_FORM); }}>
            + Log Action
          </button>
        </div>
      </header>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="date" className="input" style={{ width: 'auto' }}
          value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)}
          placeholder="From"
        />
        <input
          type="date" className="input" style={{ width: 'auto' }}
          value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)}
          placeholder="To"
        />
        <select className="input" style={{ width: 'auto' }} value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
        <select className="input" style={{ width: 'auto' }} value={filters.action_type} onChange={e => setFilter('action_type', e.target.value)}>
          <option value="all">All Actions</option>
          <option value="called">Called</option>
          <option value="visited">Visited</option>
          <option value="note">Note</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading follow-up logs...</div>
      ) : (
        <div className="data-table-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Action Taken</th>
                  <th>Note</th>
                  <th>Done By</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? logs.map(log => (
                  <tr key={log.id}>
                    <td className="name-cell">{log.member_name || log.member_id}</td>
                    <td style={{ textTransform: 'capitalize' }}>{log.action_type}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.note || '—'}
                    </td>
                    <td>{log.done_by_name || log.done_by || '—'}</td>
                    <td>{log.created_at ? new Date(log.created_at).toLocaleDateString() : '—'}</td>
                    <td><StatusBadge status={log.status} /></td>
                  </tr>
                )) : (
                  <tr><td colSpan="6" className="empty-state">No follow-up logs found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Log Action Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: '480px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Log Follow-Up Action</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Member ID</label>
                <input
                  className="input" type="text" placeholder="Enter member ID"
                  value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Action Type</label>
                <select className="input" value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))}>
                  <option value="called">Called</option>
                  <option value="visited">Visited</option>
                  <option value="note">Note</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Note</label>
                <textarea
                  className="input" rows={3} placeholder="Add a note..."
                  value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save Log'}</button>
                <button type="button" className="modal-btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
