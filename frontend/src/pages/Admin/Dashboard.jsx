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
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

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
  // Export helpers
  const getExportData = (rows) => {
    if (!rows || !rows.length) return [];
    return rows.map(r => ({
      Time: r.createdAt,
      Name: r.name,
      Email: r.email,
      Phone: r.phone,
      FirstTimer: r.firstTimer ? 'Yes' : 'No',
      Dept: r.department || '-',
      Event: r.eventId
    }));
  };

  function downloadCsv(rows) {
    if (!rows || !rows.length) return;
    const headers = ['createdAt', 'id', 'eventId', 'name', 'email', 'phone', 'address', 'occupation', 'firstTimer', 'gender', 'nationality', 'department', 'deviceId'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const vals = headers.map((h) => {
        const v = r[h] === undefined || r[h] === null ? '' : String(r[h]);
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

  function downloadExcel(rows) {
    if (!rows || !rows.length) return;
    try {
      if (!window.XLSX) {
        alert('Excel library not loaded yet. Please try again in a moment.');
        return;
      }
      const wb = window.XLSX.utils.book_new();
      const ws = window.XLSX.utils.json_to_sheet(rows);
      window.XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      window.XLSX.writeFile(wb, `attendance_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Excel export failed', err);
      alert('Failed to export Excel. Fallback to CSV.');
      downloadCsv(rows);
    }
  }

  function downloadPdf(rows) {
    if (!rows || !rows.length) return;
    try {
      if (!window.jspdf) {
        alert('PDF library not loaded yet.');
        return;
      }
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Attendance Report", 14, 22);

      doc.setFontSize(11);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

      const tableColumn = ["Time", "Name", "Email", "Phone", "First Timer", "Dept", "Event"];
      const tableRows = rows.map(r => [
        r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : '-',
        r.name,
        r.email,
        r.phone,
        r.firstTimer ? 'Yes' : 'No',
        r.department || '-',
        r.eventId
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [30, 64, 175] } // Blue primary
      });

      doc.save(`attendance_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
      alert('Failed to generate PDF. Try printing instead.');
      window.print();
    }
  }

  // ability to fetch rows filtered by eventId (manual)
  async function fetchByEvent(customEventId) {
    const targetEvent = customEventId || eventFilter;
    if (!targetEvent) return;
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams();
      params.set('eventId', targetEvent);
      const resp = await fetch(`/api/attendance?${params.toString()}`);
      if (!resp.ok) throw new Error('Failed to fetch');
      const data = await resp.json();
      if (Array.isArray(data)) {
        setItems(data.reverse()); // Replace items or append? User implied filtering, so maybe replace is better, or just show filtered.
        // For now, let's keep the behavior of just loading them.
        // Actually, to make it a true filter, we might want to plain replace 'items' or filter the existing 'items'.
        // But since we are fetching from backend, let's treat it as a fresh load.
        // However, the previous logic was appending. Let's strictly follow the "Load event" logic but inside the modal.
      }
      setShowFilterModal(false);
    } catch (err) {
      console.warn('Failed to fetch by event', err);
      alert('Failed to load event history. Check backend support for the endpoint.');
    } finally {
      setLoadingHistory(false);
    }
  }

  return (
    <div className='admin-dashboard'>
      <div className="form-header admin-header" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1><span>Admin Dashboard</span><br />Overview</h1>
        <p className="helper" style={{ textAlign: 'right' }}>New submissions appear here in real time. Use the tabs to view analysis and tools.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <div className='admin-tabs-btns' style={{ display: 'flex', alignSelf: 'center', justifySelf: 'center', gap: 8 }}>
          <button
            className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
            onClick={() => setActiveTab('live')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
            Live Data
          </button>
          <button
            className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
            Analytics
          </button>
          <button
            className={`tab-btn ${activeTab === 'qrcode' ? 'active' : ''}`}
            onClick={() => setActiveTab('qrcode')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            QR Generator
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-ghost" onClick={() => setShowFilterModal(true)}>
            Filter
          </button>
          <button className="btn-ghost" onClick={() => setShowExportModal(true)}>
            Export
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

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Export Data</h3>
            <p className="helper">Choose a format to download the attendance data.</p>
            <div className="modal-actions">
              <button className="modal-btn primary" onClick={() => { downloadCsv(items); setShowExportModal(false); }}>
                Download CSV
              </button>
              <button className="modal-btn" onClick={() => { downloadExcel(items); setShowExportModal(false); }}>
                Download Excel (.xlsx)
              </button>
              <button className="modal-btn" onClick={() => { downloadPdf(items); setShowExportModal(false); }}>
                Download PDF
              </button>
            </div>
            <button className="modal-close" onClick={() => setShowExportModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Filter Data</h3>
            <p className="helper">Load historical data for a specific event.</p>
            <div style={{ marginTop: 16 }}>
              <label className="small" style={{ display: 'block', marginBottom: 6 }}>Event ID</label>
              <input
                className="input"
                placeholder="e.g. 2026-01-25-morning"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              />
            </div>
            <div className="modal-actions">
              <button
                className="modal-btn primary"
                disabled={loadingHistory || !eventFilter}
                onClick={() => fetchByEvent(eventFilter)}
              >
                {loadingHistory ? 'Loading...' : 'Load Event Data'}
              </button>
            </div>
            <button className="modal-close" onClick={() => setShowFilterModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Responsive Table component
function LiveTable({ items }) {
  // Responsive behavior is now handled purely by CSS using media queries
  // and data-label attributes for mobile stacking.

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
              <td colSpan="7" className="small" style={{ textAlign: 'center' }}>No submissions yet</td>
            </tr>
          )}
          {items.map((row, i) => (
            <tr key={row.id || i}>
              <td data-label="Time">{row.createdAt}</td>
              <td data-label="Name" style={{ fontWeight: 600 }}>{row.name}</td>
              <td data-label="Email">{row.email}</td>
              <td data-label="Phone">{row.phone}</td>
              <td data-label="First Timer">{row.firstTimer ? 'Yes' : 'No'}</td>
              <td data-label="Department">{row.department || '-'}</td>
              <td data-label="Event">{row.eventId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}