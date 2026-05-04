import { useState, useEffect, useCallback } from 'react';
import { API_BASE, getAuthHeaders } from '../../services/api';
import { ROLE_LABELS, ROLE_COLORS } from '../../config/permissions';

const ALL_ROLES = ['developer', 'church_admin', 'followup_head', 'pastor', 'usher'];

function RolePill({ role }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: '100px', fontSize: '11px', fontWeight: '600',
      background: ROLE_COLORS[role] + '22',
      color: ROLE_COLORS[role],
      border: `1px solid ${ROLE_COLORS[role]}44`,
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

const EMPTY_CREATE = { name: '', email: '', role: 'church_admin', password: '' };
const EMPTY_EDIT   = { role: 'church_admin' };

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [editForm, setEditForm] = useState(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/users`, { headers: { ...getAuthHeaders() } });
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim()) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = { name: createForm.name, email: createForm.email, role: createForm.role };
      if (createForm.password) body.password = createForm.password;
      const res = await fetch(`${API_BASE}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreate(false);
        setCreateForm(EMPTY_CREATE);
        fetchUsers();
        if (data.tempPassword) setTempPassword(data.tempPassword);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/users/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role: editForm.role }),
      });
      if (res.ok) {
        setShowEdit(false);
        setEditTarget(null);
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user) {
    try {
      await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ is_active: user.is_active ? 0 : 1 }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`${API_BASE}/api/users/${user.id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  }

  function openEdit(user) {
    setEditTarget(user);
    setEditForm({ role: user.role });
    setError('');
    setShowEdit(true);
  }

  function copyTempPassword() {
    navigator.clipboard.writeText(tempPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <div className="header-content">
          <h1>User Management</h1>
          <p className="subtitle">Manage admin accounts and roles</p>
        </div>
        <div className="top-bar-actions">
          <button className="action-btn primary" onClick={() => { setShowCreate(true); setError(''); setCreateForm(EMPTY_CREATE); }}>
            + New User
          </button>
        </div>
      </header>

      {loading ? (
        <div className="loading-state">Loading users...</div>
      ) : (
        <div className="data-table-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? users.map(u => (
                  <tr key={u.id}>
                    <td className="name-cell">{u.name}</td>
                    <td style={{ fontSize: '13px', color: 'var(--text-2)' }}>{u.email}</td>
                    <td><RolePill role={u.role} /></td>
                    <td>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
                        borderRadius: '100px', fontSize: '11px', fontWeight: '600',
                        background: u.is_active ? 'var(--green-lt)' : 'var(--surface-2)',
                        color: u.is_active ? 'var(--green)' : 'var(--text-3)',
                        border: `1px solid ${u.is_active ? 'var(--green-border)' : 'var(--border)'}`,
                      }}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="small-btn" onClick={() => openEdit(u)}>Edit Role</button>
                        <button className="small-btn" onClick={() => handleToggleActive(u)}>
                          {u.is_active ? 'Deactivate' : 'Reactivate'}
                        </button>
                        <button
                          className="small-btn"
                          style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
                          onClick={() => handleDelete(u)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="empty-state">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: '460px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>New User</h3>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleCreate}>
              {[
                { label: 'Name', key: 'name', type: 'text', placeholder: 'Full name' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'email@example.com' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>{label}</label>
                  <input
                    className="input" type={type} placeholder={placeholder}
                    value={createForm[key]} onChange={e => setCreateForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Role</label>
                <select className="input" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>
                  Password <span style={{ fontWeight: '400', color: 'var(--text-4)' }}>(optional — auto-generated if blank)</span>
                </label>
                <input
                  className="input" type="password" placeholder="Leave blank to auto-generate"
                  value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                />
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Creating...' : 'Create User'}</button>
                <button type="button" className="modal-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEdit && editTarget && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" style={{ maxWidth: '400px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Edit Role — {editTarget.name}</h3>
              <button onClick={() => setShowEdit(false)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleEditSave}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '6px' }}>Role</label>
                <select className="input" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                  {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              {error && <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
              <div className="modal-actions">
                <button type="submit" className="modal-btn primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button type="button" className="modal-btn" onClick={() => setShowEdit(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temp Password Modal */}
      {tempPassword && (
        <div className="modal-overlay" onClick={() => setTempPassword(null)}>
          <div className="modal" style={{ maxWidth: '400px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Temporary Password</h3>
              <button onClick={() => setTempPassword(null)} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '16px' }}>
              Share this temporary password with the new user. It will not be shown again.
            </p>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '20px',
            }}>
              <code style={{ flex: 1, fontSize: '14px', fontFamily: 'monospace', color: 'var(--text-1)', wordBreak: 'break-all' }}>
                {tempPassword}
              </code>
              <button className="small-btn" onClick={copyTempPassword}>
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={() => setTempPassword(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
