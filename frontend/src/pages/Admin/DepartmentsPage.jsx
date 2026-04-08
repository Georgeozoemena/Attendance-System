import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../../services/api';

const MEETING_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function Avatar({ photo, name, size = 56 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  if (photo) {
    return <img src={photo} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border-2)' }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--dc-blue-lt)', border: '2px solid var(--dc-blue-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: '700', color: 'var(--dc-blue)', flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function DeptModal({ dept, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    name: dept?.name || '', description: dept?.description || '',
    leaderName: dept?.leaderName || '', leaderPhone: dept?.leaderPhone || '',
    meetingDay: dept?.meetingDay || '', meetingTime: dept?.meetingTime || '',
    leaderPhoto: dept?.leaderPhoto || ''
  });
  const [saving, setSaving] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef();

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500000) { setPhotoError('Image must be under 500KB'); return; }
    setPhotoError('');
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({ ...f, leaderPhoto: ev.target.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    await onSave(dept?.id, form);
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>{dept ? 'Edit Department' : 'New Department'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Department Name *</label>
            <input className="input" placeholder="e.g. Media, Choir, Ushering" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label>Description <span style={{ fontSize: '11px', color: 'var(--text-3)' }}>(optional)</span></label>
            <textarea className="input" placeholder="What does this department do?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Meeting Day</label>
              <select className="input" value={form.meetingDay} onChange={e => setForm(f => ({ ...f, meetingDay: e.target.value }))}>
                <option value="">Select day...</option>
                {MEETING_DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Meeting Time</label>
              <input className="input" type="time" value={form.meetingTime} onChange={e => setForm(f => ({ ...f, meetingTime: e.target.value }))} />
            </div>
          </div>
          <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Department Leader</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
              <Avatar photo={form.leaderPhoto} name={form.leaderName} size={64} />
              <div>
                <button type="button" className="action-btn" onClick={() => fileRef.current.click()} style={{ fontSize: '12px', padding: '6px 12px' }}>
                  {form.leaderPhoto ? 'Change Photo' : 'Upload Photo'}
                </button>
                {form.leaderPhoto && (
                  <button type="button" className="small-btn" onClick={() => setForm(f => ({ ...f, leaderPhoto: '' }))} style={{ marginLeft: '8px', fontSize: '11px' }}>Remove</button>
                )}
                <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>JPG, PNG · Max 500KB</div>
                {photoError && <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '2px' }}>{photoError}</div>}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoChange} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Leader Name</label>
                <input className="input" placeholder="Full name" value={form.leaderName} onChange={e => setForm(f => ({ ...f, leaderName: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Leader Phone</label>
                <input className="input" type="tel" placeholder="08012345678" value={form.leaderPhone} onChange={e => setForm(f => ({ ...f, leaderPhone: e.target.value }))} />
              </div>
            </div>
          </div>
          <div className="modal-actions">
            <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Saving...' : dept ? 'Save Changes' : 'Create Department'}</button>
            {dept && <button type="button" className="modal-btn" style={{ borderColor: 'var(--red-border)', color: 'var(--red)' }} onClick={() => { onDelete(dept.id); onClose(); }}>Delete</button>}
            <button type="button" className="modal-btn" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DepartmentsPage() {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
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

  async function handleSave(id, form) {
    if (id) {
      await fetch(`${API_BASE}/api/departments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify(form) });
    } else {
      await fetch(`${API_BASE}/api/departments`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey }, body: JSON.stringify(form) });
    }
    fetchDepts();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this department?')) return;
    await fetch(`${API_BASE}/api/departments/${id}`, { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
    setDepts(prev => prev.filter(d => d.id !== id));
  }

  const totalMembers = depts.reduce((s, d) => s + (d.memberCount || 0), 0);

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Departments</h1>
          <p className="subtitle">{depts.length} departments · {totalMembers} workers total</p>
        </div>
        <button className="action-btn primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Department
        </button>
      </header>

      {loading ? <div className="loading-state">Loading...</div> : depts.length === 0 ? (
        <div className="empty-state">No departments yet. Create your first one.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {depts.map(d => (
            <div key={d.id} className="stat-card" style={{ padding: '20px', cursor: 'pointer' }}
              onClick={() => { setEditing(d); setShowForm(true); }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--text-1)', marginBottom: '4px' }}>{d.name}</div>
                  {d.description && <div style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: '1.4' }}>{d.description}</div>}
                </div>
                <div style={{ background: 'var(--dc-blue-lt)', color: 'var(--dc-blue)', border: '1px solid var(--dc-blue-border)', borderRadius: '100px', fontSize: '12px', fontWeight: '700', padding: '3px 10px', flexShrink: 0, marginLeft: '12px' }}>
                  {d.memberCount || 0} workers
                </div>
              </div>
              {(d.leaderName || d.leaderPhoto) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', marginBottom: '12px' }}>
                  <Avatar photo={d.leaderPhoto} name={d.leaderName} size={44} />
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Leader</div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-1)', marginTop: '2px' }}>{d.leaderName || '—'}</div>
                    {d.leaderPhone && <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{d.leaderPhone}</div>}
                  </div>
                </div>
              )}
              {(d.meetingDay || d.meetingTime) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-3)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  {[d.meetingDay, d.meetingTime || null].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <DeptModal dept={editing} onClose={() => { setShowForm(false); setEditing(null); }} onSave={handleSave} onDelete={handleDelete} />
      )}
    </div>
  );
}
