import React, { useState } from 'react';
import { useAttendanceData } from '../../hooks/useAttendanceData.js';

import AdminQRGenerator from '../../components/Admin/AdminQRGenerator.jsx';
import AnalyticsDashboard from '../../components/Admin/AnalyticsDashboard.jsx';
import AttendanceCategoryView from '../../components/Admin/AttendanceCategoryView.jsx';
import DashboardHeader from '../../components/Admin/DashboardHeader.jsx';
import LiveTable from '../../components/Admin/LiveTable.jsx';
import MemberDetailsModal from '../../components/Admin/MemberDetailsModal.jsx';

/*
  Responsive Admin Dashboard
  Refactored to use:
  - useAttendanceData hook for logic
  - DashboardHeader for navigation
  - LiveTable for the data grid
*/

export default function AdminDashboard() {
  const { items, loadingHistory, fetchByEvent } = useAttendanceData();

  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'analysis' | 'categories' | 'qrcode'
  const [eventFilter, setEventFilter] = useState('');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMemberCode, setSelectedMemberCode] = useState(null);
  const [velocityAlert, setVelocityAlert] = useState(false);

  // Poll check-in velocity during active event
  React.useEffect(() => {
    if (activeTab !== 'live') return;
    
    const checkVelocity = async () => {
      try {
        const adminKey = localStorage.getItem('adminKey');
        const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/velocity`, {
          headers: { 'x-admin-key': adminKey }
        });
        if (resp.ok) {
          const data = await resp.json();
          // Show alert if no check-ins in 5 mins AND we have history (meaning event should be active)
          setVelocityAlert(data.suggestFreeze && items.length > 0);
        }
      } catch (err) {
        console.warn('Velocity check failed', err);
      }
    };

    const timer = setInterval(checkVelocity, 60000); // Check every minute
    checkVelocity();
    return () => clearInterval(timer);
  }, [activeTab, items.length]);

  // --- Export Helpers ---
  function downloadCsv(rows) {
    if (!rows || !rows.length) return;
    const headers = ['createdAt', 'uniqueCode', 'id', 'eventId', 'name', 'email', 'phone', 'address', 'occupation', 'firstTimer', 'gender', 'nationality', 'department', 'deviceId'];
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

      const tableColumn = ["Time", "Code", "Name", "Email", "Phone", "First Timer", "Dept", "Event"];
      const tableRows = rows.map(r => [
        r.createdAt ? new Date(r.createdAt).toLocaleTimeString() : '-',
        r.uniqueCode || '-',
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

  // --- Handlers ---
  const handleFilterLoad = () => {
    fetchByEvent(eventFilter);
    setShowFilterModal(false);
  };

  return (
    <div className='admin-dashboard'>
      <DashboardHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onFilter={() => setShowFilterModal(true)}
        onExport={() => setShowExportModal(true)}
      />

      {velocityAlert && (
        <div className="animate-fade-in" style={{ 
          background: 'var(--amber-lt)', 
          border: '1px solid var(--amber-border)', 
          padding: '12px 20px', 
          borderRadius: 'var(--radius)', 
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ color: 'var(--amber)', fontSize: '20px' }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '13px', color: 'var(--amber-dk)', margin: 0 }}>Low Activity Detected</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-3)', margin: 0 }}>No check-ins in the last 5 minutes. Consider freezing the timer if there's a delay.</p>
          </div>
          <button 
            className="modal-btn" 
            style={{ padding: '6px 12px', fontSize: '11px', borderColor: 'var(--amber-border)' }}
            onClick={() => setVelocityAlert(false)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="attendance-form" style={{ marginTop: 8, background: activeTab === 'qrcode' ? 'transparent' : 'var(--card)' }}>
        {activeTab === 'live' && <LiveTable items={items} onRowClick={setSelectedMemberCode} />}
        {activeTab === 'analysis' && <AnalyticsDashboard attendanceData={items} />}
        {activeTab === 'categories' && <AttendanceCategoryView data={items} />}
        {activeTab === 'qrcode' && (
          <div className="animate-fade-in">
            <AdminQRGenerator eventId={eventFilter || 'default-event'} />
          </div>
        )}
      </div>

      {selectedMemberCode && (
        <MemberDetailsModal
          memberCode={selectedMemberCode}
          onClose={() => setSelectedMemberCode(null)}
        />
      )}

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
                onClick={handleFilterLoad}
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