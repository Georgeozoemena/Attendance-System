import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE, getAuthHeaders } from '../../services/api';

export default function UsherCheckInPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [headcount, setHeadcount] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const debounceRef = useRef(null);
  const headcountRef = useRef(null);

  // Fetch headcount and auto-refresh every 10s
  const fetchHeadcount = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/checkin/headcount`, {
        headers: { ...getAuthHeaders() },
      });
      if (res.ok) {
        const data = await res.json();
        setHeadcount(data.count ?? data.headcount ?? data);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchHeadcount();
    headcountRef.current = setInterval(fetchHeadcount, 10000);
    return () => clearInterval(headcountRef.current);
  }, [fetchHeadcount]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`${API_BASE}/api/checkin/search?q=${encodeURIComponent(query)}`, {
          headers: { ...getAuthHeaders() },
        });
        if (res.ok) setResults(await res.json());
        else setResults([]);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  async function handleMarkAttendance(member) {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(`${API_BASE}/api/checkin/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ uniqueCode: member.uniqueCode }),
      });
      if (res.ok) {
        setSuccessMsg(`✓ ${member.name} checked in!`);
        setQuery('');
        setResults([]);
        fetchHeadcount();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else if (res.status === 409) {
        setErrorMsg('Already checked in today');
        setTimeout(() => setErrorMsg(''), 4000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Check-in failed');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    } catch (err) {
      setErrorMsg('Network error');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-1)', margin: '0 0 4px' }}>Check-In</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-3)', margin: 0 }}>Mark attendance for today's service</p>
        </div>

        {/* Live headcount */}
        <div className="stat-card" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <div className="stat-card-top" style={{ justifyContent: 'center' }}>
            <span className="stat-label">Live Headcount</span>
          </div>
          <div className="stat-value" style={{ fontSize: '48px', lineHeight: 1.1 }}>
            {headcount !== null ? headcount : '—'}
          </div>
          <div className="stat-sub">Checked in today · refreshes every 10s</div>
        </div>

        {/* Success / error messages */}
        {successMsg && (
          <div style={{
            background: 'var(--green-lt)', color: 'var(--green)', border: '1px solid var(--green-border)',
            borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '16px',
            fontSize: '14px', fontWeight: '600', textAlign: 'center',
          }}>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '16px',
            fontSize: '14px', fontWeight: '600', textAlign: 'center',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Search input */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="input"
            placeholder="Search by name or unique code..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '38px', fontSize: '15px', height: '48px', boxSizing: 'border-box' }}
            autoComplete="off"
            autoFocus
          />
          {searching && (
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-4)' }}>
              Searching...
            </span>
          )}
        </div>

        {/* Search results */}
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {results.map(member => (
              <div
                key={member.uniqueCode || member.id}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '14px 16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-1)', marginBottom: '2px' }}>
                    {member.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                    #{member.uniqueCode}
                    {member.department ? ` · ${member.department}` : ''}
                  </div>
                </div>
                <button
                  className="action-btn primary"
                  style={{ flexShrink: 0, fontSize: '13px', padding: '8px 14px' }}
                  onClick={() => handleMarkAttendance(member)}
                >
                  Mark Attendance
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state when query has no results */}
        {query.trim() && !searching && results.length === 0 && (
          <div className="empty-state" style={{ textAlign: 'center', padding: '32px 0' }}>
            No members found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
