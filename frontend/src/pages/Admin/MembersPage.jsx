import { useState, useEffect, useCallback } from 'react';
import { API_BASE } from '../../services/api';

const FOLLOW_UP_STAGES = [
  { value: 'new', label: 'New Visitor', color: 'var(--amber)', bg: 'var(--amber-lt)', border: 'var(--amber-border)' },
  { value: 'contacted', label: 'Contacted', color: 'var(--dc-blue)', bg: 'var(--dc-blue-lt)', border: 'var(--dc-blue-border)' },
  { value: 'connected', label: 'Connected', color: 'var(--purple)', bg: 'var(--purple-lt)', border: 'rgba(168,85,247,0.25)' },
  { value: 'converted', label: 'Member', color: 'var(--green)', bg: 'var(--green-lt)', border: 'var(--green-border)' },
  { value: 'none', label: 'Regular', color: 'var(--text-3)', bg: 'var(--surface-2)', border: 'var(--border)' },
];

function stageStyle(val) {
  return FOLLOW_UP_STAGES.find(s => s.value === val) || FOLLOW_UP_STAGES[4];
}

function MemberModal({ member, onClose, onSave }) {
  const [notes, setNotes] = useState(member.notes || '');
  const [followUpStatus, setFollowUpStatus] = useState(member.followUpStatus || 'none');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await onSave(member.id, { notes, followUpStatus });
    setSaving(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '520px', width: '100%' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px' }}>{member.name}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-3)' }}>
              {member.phone} {member.email ? `· ${member.email}` : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '13px' }}>
          {[
            ['Department', member.department || '—'],
            ['Type', member.type || 'member'],
            ['Gender', member.gender || '—'],
            ['Nationality', member.nationality || '—'],
            ['Birthday', member.birthday ? new Date(member.birthday).toLocaleDateString() : '—'],
            ['Joined', member.joinDate ? new Date(member.joinDate).toLocaleDateString() : '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-4)', marginBottom: '4px' }}>{label}</div>
              <div style={{ color: 'var(--text-1)', fontWeight: '500' }}>{val}</div>
            </div>
          ))}
        </div>

        <div className="form-group" style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '8px' }}>Follow-up Status</label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {FOLLOW_UP_STAGES.map(s => (
              <button key={s.value} type="button"
                onClick={() => setFollowUpStatus(s.value)}
                style={{
                  padding: '5px 12px', borderRadius: '100px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', border: `1px solid ${followUpStatus === s.value ? s.border : 'var(--border)'}`,
                  background: followUpStatus === s.value ? s.bg : 'transparent',
                  color: followUpStatus === s.value ? s.color : 'var(--text-3)',
                  transition: 'all 0.12s'
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Pastoral Notes</label>
          <textarea className="input" value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Add notes about this member..." rows={3} style={{ resize: 'vertical' }} />
        </div>

        <div className="modal-actions">
          <button className="modal-btn primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          <button className="modal-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState(null);
  const [activeView, setActiveView] = useState('directory'); // 'directory' | 'pipeline'

  const fetchMembers = useCallback(async () => {
    try {
      const adminKey = localStorage.getItem('adminKey');
      const res = await fetch(`${API_BASE}/api/members/profiles`, { headers: { 'x-admin-key': adminKey } });
      if (res.ok) setMembers(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleSync() {
    setSyncing(true);
    try {
      const adminKey = localStorage.getItem('adminKey');
      const res = await fetch(`${API_BASE}/api/members/profiles/sync`, { method: 'POST', headers: { 'x-admin-key': adminKey } });
      if (res.ok) { await fetchMembers(); }
    } catch (err) { console.error(err); }
    finally { setSyncing(false); }
  }

  async function handleSave(id, updates) {
    const adminKey = localStorage.getItem('adminKey');
    await fetch(`${API_BASE}/api/members/profiles/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify(updates)
    });
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  }

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.name?.toLowerCase().includes(q) || m.phone?.includes(q) || m.email?.toLowerCase().includes(q);
    const matchStage = filterStage === 'all' || m.followUpStatus === filterStage;
    const matchType = filterType === 'all' || m.type === filterType;
    return matchSearch && matchStage && matchType;
  });

  // Pipeline view — group by follow-up stage
  const pipeline = FOLLOW_UP_STAGES.filter(s => s.value !== 'none').map(stage => ({
    ...stage,
    members: members.filter(m => m.followUpStatus === stage.value)
  }));

  const pipelineCounts = {
    new: members.filter(m => m.followUpStatus === 'new').length,
    contacted: members.filter(m => m.followUpStatus === 'contacted').length,
    connected: members.filter(m => m.followUpStatus === 'connected').length,
    converted: members.filter(m => m.followUpStatus === 'converted').length,
  };

  if (loading) return <div className="loading-state">Loading members...</div>;

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Members</h1>
          <p className="subtitle">{members.length} total · {pipelineCounts.new} new visitors need follow-up</p>
        </div>
        <div className="top-bar-actions">
          <button className="action-btn" onClick={handleSync} disabled={syncing}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            {syncing ? 'Syncing...' : 'Sync from Attendance'}
          </button>
        </div>
      </header>

      {/* View toggle */}
      <div className="admin-tabs-btns" style={{ marginBottom: '20px' }}>
        <button className={`tab-btn ${activeView === 'directory' ? 'active' : ''}`} onClick={() => setActiveView('directory')}>Directory</button>
        <button className={`tab-btn ${activeView === 'pipeline' ? 'active' : ''}`} onClick={() => setActiveView('pipeline')}>
          Follow-up Pipeline
          {pipelineCounts.new > 0 && <span style={{ marginLeft: '6px', background: 'var(--amber-lt)', color: 'var(--amber)', border: '1px solid var(--amber-border)', borderRadius: '100px', fontSize: '10px', fontWeight: '700', padding: '1px 6px' }}>{pipelineCounts.new}</span>}
        </button>
      </div>

      {activeView === 'directory' && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: '200px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '10px', color: 'var(--text-4)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input style={{ width: '100%', padding: '8px 12px 8px 32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-1)', outline: 'none' }}
                placeholder="Search by name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="input" style={{ width: 'auto' }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
              <option value="all">All Stages</option>
              {FOLLOW_UP_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <select className="input" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="member">Members</option>
              <option value="worker">Workers</option>
            </select>
          </div>

          <div className="data-table-card">
            <div className="table-responsive">
              <table className="admin-table">
                <thead><tr><th>Name</th><th>Phone</th><th>Type</th><th>Department</th><th>Status</th><th>Last Seen</th><th></th></tr></thead>
                <tbody>
                  {filtered.length > 0 ? filtered.map(m => {
                    const stage = stageStyle(m.followUpStatus);
                    return (
                      <tr key={m.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(m)}>
                        <td className="name-cell">{m.name}</td>
                        <td>{m.phone || '—'}</td>
                        <td><span className={`badge-pill ${m.type}`}>{m.type}</span></td>
                        <td>{m.department || '—'}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', background: stage.bg, color: stage.color, border: `1px solid ${stage.border}` }}>
                            {stage.label}
                          </span>
                        </td>
                        <td>{m.updatedAt ? new Date(m.updatedAt).toLocaleDateString() : '—'}</td>
                        <td><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-4)' }}><polyline points="9 18 15 12 9 6"/></svg></td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="7" className="empty-state">No members found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {pipeline.map(stage => (
            <div key={stage.value} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: stage.color }}>{stage.label}</span>
                <span style={{ fontSize: '12px', fontWeight: '700', background: stage.bg, color: stage.color, border: `1px solid ${stage.border}`, borderRadius: '100px', padding: '1px 8px' }}>{stage.members.length}</span>
              </div>
              <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
                {stage.members.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-4)', textAlign: 'center', padding: '16px 0' }}>None</p>
                ) : stage.members.map(m => (
                  <div key={m.id} onClick={() => setSelected(m)}
                    style={{ padding: '10px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.12s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-1)' }}>{m.name}</div>
                    {m.phone && <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>{m.phone}</div>}
                    {m.notes && <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.notes}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && <MemberModal member={selected} onClose={() => setSelected(null)} onSave={handleSave} />}
    </div>
  );
}
