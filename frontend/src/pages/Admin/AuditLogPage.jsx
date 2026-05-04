import { useState, useEffect, useCallback } from 'react';
import { API_BASE, getAuthHeaders } from '../../services/api';
import { ROLE_LABELS, ROLE_COLORS } from '../../config/permissions';

const ACTION_STYLES = {
  create: { bg: 'var(--green-lt)',   color: 'var(--green)',   border: 'var(--green-border)' },
  update: { bg: 'var(--dc-blue-lt)', color: 'var(--dc-blue)', border: 'var(--dc-blue-border)' },
  delete: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444',      border: 'rgba(239,68,68,0.25)' },
  export: { bg: 'var(--amber-lt)',   color: 'var(--amber)',   border: 'var(--amber-border)' },
};

function ActionBadge({ action }) {
  const s = ACTION_STYLES[action] || ACTION_STYLES.update;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: '100px', fontSize: '11px', fontWeight: '600',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'capitalize',
    }}>
      {action}
    </span>
  );
}

function RolePill({ role }) {
  if (!role) return <span style={{ color: 'var(--text-4)' }}>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: '100px', fontSize: '11px', fontWeight: '600',
      background: (ROLE_COLORS[role] || '#888') + '22',
      color: ROLE_COLORS[role] || 'var(--text-2)',
      border: `1px solid ${(ROLE_COLORS[role] || '#888')}44`,
    }}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ date_from: '', date_to: '', action: 'all', module: '' });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.date_from)        params.set('date_from', filters.date_from);
      if (filters.date_to)          params.set('date_to', filters.date_to);
      if (filters.action !== 'all') params.set('action', filters.action);
      if (filters.module.trim())    params.set('module', filters.module.trim());
      const res = await fetch(`${API_BASE}/api/audit?${params}`, {
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

  function setFilter(key, val) {
    setFilters(prev => ({ ...prev, [key]: val }));
  }

  return (
    <div className="admin-page-container">
      <header className="page-header">
        <div className="header-content">
          <h1>Audit Log</h1>
          <p className="subtitle">Immutable record of all system actions</p>
        </div>
      </header>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="date" className="input" style={{ width: 'auto' }}
          value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)}
        />
        <input
          type="date" className="input" style={{ width: 'auto' }}
          value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)}
        />
        <select className="input" style={{ width: 'auto' }} value={filters.action} onChange={e => setFilter('action', e.target.value)}>
          <option value="all">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="export">Export</option>
        </select>
        <input
          className="input" type="text" placeholder="Filter by module..."
          style={{ width: '160px' }}
          value={filters.module} onChange={e => setFilter('module', e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-state">Loading audit log...</div>
      ) : (
        <div className="data-table-card">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Target ID</th>
                  <th>IP Address</th>
                  <th>Date / Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{log.user_name || '—'}</div>
                      {log.user_email && (
                        <div style={{ fontSize: '11px', color: 'var(--text-3)' }}>{log.user_email}</div>
                      )}
                    </td>
                    <td><RolePill role={log.role} /></td>
                    <td><ActionBadge action={log.action} /></td>
                    <td style={{ textTransform: 'capitalize' }}>{log.module || '—'}</td>
                    <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-3)' }}>
                      {log.target_id || '—'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-3)' }}>{log.ip_address || '—'}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="7" className="empty-state">No audit log entries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
