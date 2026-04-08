import { useState, useEffect } from 'react';
import { API_BASE } from '../../services/api';

const GIVING_TYPES = ['tithe', 'offering', 'seed', 'project', 'welfare', 'other'];
const TYPE_COLORS = { tithe: 'var(--dc-blue)', offering: 'var(--green)', seed: 'var(--purple)', project: 'var(--amber)', welfare: 'var(--text-3)', other: 'var(--text-4)' };

export default function GivingPage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ memberName: '', phone: '', amount: '', type: 'tithe', notes: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  const adminKey = localStorage.getItem('adminKey');

  useEffect(() => { fetchData(); }, [filterMonth]);

  async function fetchData() {
    setLoading(true);
    try {
      const [recRes, sumRes] = await Promise.all([
        fetch(`${API_BASE}/api/giving?month=${filterMonth}`, { headers: { 'x-admin-key': adminKey } }),
        fetch(`${API_BASE}/api/giving/summary?year=${filterMonth.slice(0, 4)}`, { headers: { 'x-admin-key': adminKey } })
      ]);
      if (recRes.ok) setRecords(await recRes.json());
      if (sumRes.ok) setSummary(await sumRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function validate() {
    const errs = {};
    if (!form.memberName.trim()) errs.memberName = 'Name is required';
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid amount';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/giving`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setForm({ memberName: '', phone: '', amount: '', type: 'tithe', notes: '' });
        setShowForm(false);
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this record?')) return;
    await fetch(`${API_BASE}/api/giving/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
    setRecords(prev => prev.filter(r => r.id !== id));
  }

  // Monthly totals
  const monthSummary = summary.filter(s => s.month === filterMonth);
  const totalMonth = monthSummary.reduce((sum, s) => sum + (s.total || 0), 0);
  const byType = GIVING_TYPES.reduce((acc, t) => {
    acc[t] = monthSummary.filter(s => s.type === t).reduce((s, r) => s + (r.total || 0), 0);
    return acc;
  }, {});

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Giving Records</h1>
          <p className="subtitle">Track tithes, offerings, and donations</p>
        </div>
        <div className="top-bar-actions">
          <input type="month" className="input" style={{ width: 'auto' }} value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
          <button className="action-btn primary" onClick={() => setShowForm(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Record Giving
          </button>
        </div>
      </header>

      {/* Monthly summary cards */}
      <div className="admin-card-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card highlighted">
          <div className="stat-card-top"><span className="stat-label">Total This Month</span></div>
          <div className="stat-value">₦{totalMonth.toLocaleString()}</div>
          <div className="stat-sub">{records.length} records</div>
        </div>
        {GIVING_TYPES.slice(0, 3).map(t => (
          <div key={t} className="stat-card">
            <div className="stat-card-top"><span className="stat-label" style={{ textTransform: 'capitalize' }}>{t}</span></div>
            <div className="stat-value" style={{ fontSize: '22px', color: TYPE_COLORS[t] }}>₦{(byType[t] || 0).toLocaleString()}</div>
          </div>
        ))}
      </div>

      {loading ? <div className="loading-state">Loading...</div> : (
        <div className="data-table-card">
          <div className="table-header">
            <h3 className="msg-section-title">Records — {filterMonth}</h3>
          </div>
          <div className="table-responsive">
            <table className="admin-table">
              <thead><tr><th>Name</th><th>Phone</th><th>Type</th><th>Amount</th><th>Notes</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {records.length > 0 ? records.map(r => (
                  <tr key={r.id}>
                    <td className="name-cell">{r.memberName}</td>
                    <td>{r.phone || '—'}</td>
                    <td><span style={{ textTransform: 'capitalize', color: TYPE_COLORS[r.type], fontWeight: '600', fontSize: '12px' }}>{r.type}</span></td>
                    <td style={{ fontWeight: '700', color: 'var(--text-1)' }}>₦{parseFloat(r.amount).toLocaleString()}</td>
                    <td style={{ color: 'var(--text-3)' }}>{r.notes || '—'}</td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><button className="small-btn danger" onClick={() => handleDelete(r.id)}>Delete</button></td>
                  </tr>
                )) : <tr><td colSpan="7" className="empty-state">No records for {filterMonth}.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>Record Giving</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Member Name <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className={`input ${errors.memberName ? 'error' : ''}`} placeholder="Full name" value={form.memberName} onChange={e => setForm(f => ({ ...f, memberName: e.target.value }))} />
                {errors.memberName && <span style={{ fontSize: '11px', color: 'var(--red)' }}>{errors.memberName}</span>}
              </div>
              <div className="form-group">
                <label>Phone <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="input" type="tel" placeholder="08012345678" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {GIVING_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (₦) <span style={{ color: 'var(--red)' }}>*</span></label>
                <input className={`input ${errors.amount ? 'error' : ''}`} type="number" min="1" placeholder="0.00" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                {errors.amount && <span style={{ fontSize: '11px', color: 'var(--red)' }}>{errors.amount}</span>}
              </div>
              <div className="form-group">
                <label>Notes <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="input" placeholder="e.g. Special offering" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save Record'}</button>
                <button type="button" className="modal-btn" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
