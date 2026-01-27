import React, { useEffect, useState, useMemo } from 'react';
import { connectToSSE } from '../../services/realtime.js';

/*
  Responsive Admin Dashboard with tabs:
  - Live: real-time table (or stacked cards on small screens)
  - Analysis: simple aggregated statistics and CSV export

  Notes:
  - Attempts to load historical rows from GET /api/attendance on mount (best-effort).
  - SSE still supplies live updates.
  - If your backend supports a dedicated admin/history endpoint, you can change the fetch URL below.
*/

import AdminQRGenerator from '../../components/Admin/AdminQRGenerator.jsx';
import AnalyticsDashboard from '../../components/Admin/AnalyticsDashboard.jsx';

export default function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'analysis' | 'qrcode'
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const [eventFilter, setEventFilter] = useState('');

  // ... (SSE subscription and onResize code remains the same) ... //

  // SSE subscription for live updates
  useEffect(() => {
    const es = connectToSSE('/api/admin/stream');
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setItems((s) => [data, ...s]);
      } catch (err) {
        console.error('Invalid SSE payload', err);
      }
    };
    es.onerror = (err) => {
      console.error('SSE error', err);
    };
    return () => es.close();
  }, []);

  // responsive detection
  useEffect(() => {
    function onResize() {
      setIsMobile(window.innerWidth < 640);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // initial (best-effort) load of historical rows
  useEffect(() => {
    async function loadHistory() {
      setLoadingHistory(true);
      try {
        // Best-effort: try to fetch all rows. Backend may require params.
        const resp = await fetch('/api/attendance');
        if (!resp.ok) {
          // try fallback: fetch without params may return 404 or empty
          setLoadingHistory(false);
          return;
        }
        const data = await resp.json();
        if (Array.isArray(data) && data.length) {
          // prepend historical items so newer SSE items still appear on top
          setItems((s) => [...(data.reverse ? data.reverse() : data), ...s]);
        }
      } catch (err) {
        // ignore; SSE will still provide live data
        console.warn('Failed to load history', err);
      } finally {
        setLoadingHistory(false);
      }
    }

    loadHistory();
  }, []);

  // export current items to CSV
  function downloadCsv(rows) {
    if (!rows || !rows.length) return;
    const headers = ['createdAt', 'id', 'eventId', 'name', 'email', 'phone', 'address', 'occupation', 'firstTimer', 'gender', 'nationality', 'department', 'deviceId'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const vals = headers.map((h) => {
        const v = r[h] === undefined || r[h] === null ? '' : String(r[h]);
        // escape quotes
        return `"${v.replace(/"/g, '""')}"`
      });
      lines.push(vals.join(','));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // ability to fetch rows filtered by eventId (manual)
  async function fetchByEvent() {
    if (!eventFilter) return;
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      params.set('eventId', eventFilter);
      const resp = await fetch(`/api/attendance?${params.toString()}`);
      if (!resp.ok) throw new Error('Failed to fetch');
      const data = await resp.json();
      if (Array.isArray(data)) {
        setItems((s) => [...data.reverse(), ...s]);
      }
    } catch (err) {
      console.warn('Failed to fetch by event', err);
      alert('Failed to load event history. Check backend support for the endpoint.');
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <div className='admin-dashboard'>
      <div className="form-header admin-header" style={{ marginBottom: 16 }}>
        <h1><span>Admin</span><br />Live Overview</h1>
        <p className="helper">New submissions appear here in real time. Use the tabs to view analysis and tools.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className={`tab-btn ${activeTab === 'live' ? '' : 'inactive'}`}
            onClick={() => setActiveTab('live')}
          >
            Live Data
          </button>
          <button
            className={`tab-btn ${activeTab === 'analysis' ? '' : 'inactive'}`}
            onClick={() => setActiveTab('analysis')}
          >
            Analytics
          </button>
          <button
            className={`tab-btn ${activeTab === 'qrcode' ? '' : 'inactive'}`}
            onClick={() => setActiveTab('qrcode')}
          >
            QR Generator
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Filter by eventId (optional)"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            style={{ width: 220 }}
          />
          <button className="btn-ghost" onClick={fetchByEvent} disabled={loadingHistory || !eventFilter}>
            {loadingHistory ? 'Loading...' : 'Load event'}
          </button>
          <button className="btn-ghost" onClick={() => downloadCsv(items)} title="Export visible rows">
            Export CSV
          </button>
        </div>
      </div>

      <div className="attendance-form" style={{ marginTop: 8, background: activeTab === 'qrcode' ? 'transparent' : 'var(--card)' }}>
        {activeTab === 'live' && <LiveTable items={items} isMobile={isMobile} />}
        {activeTab === 'analysis' && <AnalyticsDashboard attendanceData={items} />}
        {activeTab === 'qrcode' && (
          <div className="animate-fade-in">
            <AdminQRGenerator eventId={eventFilter || 'default-event'} />
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponents moved outside or kept inline, simplified for the edit


function LiveTable({ items, isMobile }) {
  if (isMobile) {
    // Stacked card layout for mobile
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {items.length === 0 && <div className="small">No submissions yet</div>}
        {items.map((row, i) => (
          <div key={row.id || i} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="small">{row.createdAt}</div>
              <div className="small">{row.eventId}</div>
            </div>
            <div style={{ fontWeight: 700 }}>{row.name}</div>
            <div className="small">{row.email} • {row.phone}</div>
            <div style={{ marginTop: 8 }}>
              <span className="helper">First Timer: </span><strong>{row.firstTimer ? 'Yes' : 'No'}</strong>
            </div>
            {row.department && <div className="small" style={{ marginTop: 6 }}>Dept: {row.department}</div>}
          </div>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="table-responsive">
      <table className="table" aria-label="Live attendance table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>First Timer</th>
            <th>Department</th>
            <th>Event</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan="7" className="small">No submissions yet</td>
            </tr>
          )}
          {items.map((row, i) => (
            <tr key={row.id || i}>
              <td>{row.createdAt}</td>
              <td>{row.name}</td>
              <td>{row.email}</td>
              <td>{row.phone}</td>
              <td>{row.firstTimer ? 'Yes' : 'No'}</td>
              <td>{row.department || '-'}</td>
              <td>{row.eventId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}