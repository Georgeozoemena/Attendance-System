import { useState, useEffect } from 'react';
import { API_BASE } from '../../services/api';

export default function DepartmentsPage() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', leaderName: '' });
  const [saving, setSaving] = useState(false);
  const adminKey = localStorage.getItem('adminKey');

  useEffect(() => { fetchDepts(); }, []);

  async function fetchDepts() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/departments`, { headers: { 'x-admin-key': adminKey } });
      if (res.ok) setDepts(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm({ name: '', description: '', leaderName: '' }); setShowForm(true); }
  function openEdit(d) { setEditing(d); setForm({ name: d.name, description: d.description || '', leaderName: d.leaderName || '' }); setShowForm(true); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await fetch(`${API_BASE}/api/departments/${editing.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify(form)
        });
      } else {
        await fetch(`${API_BASE}/api/departments`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify(form)
        });
      }
      setShowForm(false);
      fetchDepts();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this department?')) return;
    await fetch(`${API_BASE}/api/departments/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
    setDepts(prev => prev.filter(d => d.id !== id));
  }

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Departments</h1>
          <p className="subtitle">Manage church units and ministries</p>
        </div>
        <button className="action-btn primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Department
        </button>
      </header>

      {loading ? <div className="loading-state">Loading...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
          {depts.length === 0 && <div className="empty-state" style={{ gridColumn: '1/-1' }}>No departments yet. Create your first one.</div>}
          {depts.map(d => (
            <div key={d.id} className="stat-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-1)' }}>{d.name}</div>
                  {d.description && <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '3px' }}>{d.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="small-btn" onClick={() => openEdit(d)}>Edit</button>
                  <button className="small-btn danger" onClick={() => handleDelete(d.id)}>Delete</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <div>
                  <div style={{ color: 'var(--text-4)', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.06em' }}>Members</div>
                  <div style={{ fontWeight: '700', fontSize: '20px', color: 'var(--dc-blue)' }}>{d.memberCount || 0}</div>
                </div>
                {d.leaderName && (
                  <div>
                    <div style={{ color: 'var(--text-4)', fontWeight: '600', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.06em' }}>Leader</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-2)', marginTop: '2px' }}>{d.leaderName}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '20px' }}>{editing ? 'Edit Department' : 'New Department'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Department Name *</label>
                <input className="input" placeholder="e.g. Media, Choir, Ushering" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Description <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="input" placeholder="Brief description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Leader Name <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>(optional)</span></label>
                <input className="input" placeholder="Department leader" value={form.leaderName} onChange={e => setForm(f => ({ ...f, leaderName: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Create'}</button>
                <button type="button" className="modal-btn" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
