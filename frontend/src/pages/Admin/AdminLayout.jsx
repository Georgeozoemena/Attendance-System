import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAttendanceData } from '../../hooks/useAttendanceData.js';
import DashboardHeader from '../../components/Admin/DashboardHeader.jsx';

export default function AdminLayout() {
    const { items, loadingHistory, fetchByEvent } = useAttendanceData();
    const [showExportModal, setShowExportModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [eventFilter, setEventFilter] = useState('');
    const location = useLocation();

    // Map current path to active tab for header highlighting
    const activeTab = location.pathname.split('/').pop() || 'live';

    // --- Export Helpers (Same as before) ---
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

    const handleFilterLoad = () => {
        fetchByEvent(eventFilter);
        setShowFilterModal(false);
    };

    return (
        <div className='admin-dashboard'>
            <DashboardHeader
                activeTab={activeTab}
                // setActiveTab removed, navigation handles it
                onFilter={() => setShowFilterModal(true)}
                onExport={() => setShowExportModal(true)}
            />

            <div className="attendance-form" style={{ marginTop: 8, background: activeTab === 'qrcode' ? 'transparent' : 'var(--card)' }}>
                <Outlet context={{ items, eventFilter }} />
            </div>

            {showExportModal && (
                <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Export Data</h3>
                        <div className="modal-actions">
                            <button className="modal-btn primary" onClick={() => { downloadCsv(items); setShowExportModal(false); }}>Download CSV</button>
                            <button className="modal-btn" onClick={() => { downloadExcel(items); setShowExportModal(false); }}>Download Excel</button>
                            <button className="modal-btn" onClick={() => { downloadPdf(items); setShowExportModal(false); }}>Download PDF</button>
                        </div>
                        <button className="modal-close" onClick={() => setShowExportModal(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {showFilterModal && (
                <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Filter Data</h3>
                        <div style={{ marginTop: 16 }}>
                            <label>Event ID</label>
                            <input className="input" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} />
                        </div>
                        <div className="modal-actions">
                            <button className="modal-btn primary" onClick={handleFilterLoad}>{loadingHistory ? 'Loading...' : 'Load'}</button>
                        </div>
                        <button className="modal-close" onClick={() => setShowFilterModal(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
