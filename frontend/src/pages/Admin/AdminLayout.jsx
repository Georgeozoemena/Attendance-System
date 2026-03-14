import React, { useState, useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useAttendanceData } from '../../hooks/useAttendanceData.js';
import DashboardHeader from '../../components/Admin/DashboardHeader.jsx';
import Sidebar from '../../components/Admin/Sidebar.jsx';
import TopNavbar from '../../components/Admin/TopNavbar.jsx';
import { API_BASE } from '../../services/api';

export default function AdminLayout() {
    const { items, loadingHistory, fetchByEvent, currentEventId } = useAttendanceData();
    const [showExportModal, setShowExportModal] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [eventFilter, setEventFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    React.useEffect(() => {
        // Sync the local filter state with the auto-detected current event
        if (currentEventId) {
            setEventFilter(currentEventId);
        }
    }, [currentEventId]);

    React.useEffect(() => {
        const fetchEventsList = async () => {
            setLoadingEvents(true);
            try {
                const adminKey = localStorage.getItem('adminKey');
                const res = await fetch(`${API_BASE}/api/events`, {
                    headers: { 'Authorization': adminKey }
                });
                if (res.ok) {
                    const data = await res.json();
                    setEvents(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Failed to fetch events list', err);
            } finally {
                setLoadingEvents(false);
            }
        };
        fetchEventsList();
    }, []);

    // Global search logic
    const filteredItems = useMemo(() => {
        if (!searchQuery) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(item =>
            (item.name?.toLowerCase().includes(q)) ||
            (item.email?.toLowerCase().includes(q)) ||
            (item.phone?.includes(q)) ||
            (item.uniqueCode?.toLowerCase().includes(q)) ||
            (item.department?.toLowerCase().includes(q))
        );
    }, [items, searchQuery]);

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
                headStyles: { fillColor: [30, 64, 175] }
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
        <div className='admin-layout-wrapper'>
            <Sidebar />

            <main className="admin-main-content">
                <TopNavbar onSearch={setSearchQuery} />

                <div className="admin-content-scroll">
                    <DashboardHeader
                        onFilter={() => setShowFilterModal(true)}
                        onExport={() => setShowExportModal(true)}
                    />

                    <div className="content-area">
                        <Outlet context={{
                            items: filteredItems,
                            eventFilter,
                            setEventFilter,
                            fetchByEvent,
                            loadingHistory
                        }} />
                    </div>
                </div>
            </main>

            {showExportModal && (
                <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="modal-icon-wrapper" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                            </div>
                            <h3>Export Data</h3>
                            <p className="helper">Choose a format to download the attendance data.</p>
                            <div className="modal-actions">
                                <button className="modal-btn primary" onClick={() => { downloadCsv(filteredItems); setShowExportModal(false); }}>Download CSV</button>
                                <button className="modal-btn" onClick={() => { downloadExcel(filteredItems); setShowExportModal(false); }}>Download Excel</button>
                                <button className="modal-btn" onClick={() => { downloadPdf(filteredItems); setShowExportModal(false); }}>Download PDF</button>
                            </div>
                            <button className="modal-close" onClick={() => setShowExportModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showFilterModal && (
                <div className="modal-overlay" onClick={() => setShowFilterModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="modal-icon-wrapper" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                                </svg>
                            </div>
                            <h3>Filter Data</h3>
                            <p className="helper">Select an event to load historical attendance records.</p>
                            <div style={{ marginTop: 16, textAlign: 'left' }}>
                                <label className="small" style={{ display: 'block', marginBottom: 6 }}>Select Event</label>
                                <select 
                                    className="input" 
                                    value={eventFilter} 
                                    onChange={(e) => setEventFilter(e.target.value)}
                                    style={{ width: '100%', height: '42px' }}
                                >
                                    <option value="">All Events (Live Feed)</option>
                                    {events.map(e => (
                                        <option key={e.id} value={e.id}>
                                            {new Date(e.date).toLocaleDateString()} - {e.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button 
                                    disabled={loadingHistory} 
                                    className="modal-btn primary" 
                                    onClick={handleFilterLoad}
                                    style={{ flex: 1 }}
                                >
                                    {loadingHistory ? 'Loading...' : 'Apply Filter'}
                                </button>
                                {eventFilter && (
                                    <button 
                                        className="modal-btn" 
                                        onClick={() => { setEventFilter(''); fetchByEvent(''); setShowFilterModal(false); }}
                                        style={{ flex: 1 }}
                                    >
                                        Clear Filter
                                    </button>
                                )}
                            </div>
                            <button className="modal-close" onClick={() => setShowFilterModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
