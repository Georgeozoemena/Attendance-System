import React, { useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function AdminQRGenerator({ eventId, initialCategory = 'member' }) {
    const qrRef = useRef();
    const [category, setCategory] = useState(initialCategory);
    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(eventId);

    React.useEffect(() => {
        fetchEvents();
    }, []);

    React.useEffect(() => {
        setCategory(initialCategory);
    }, [initialCategory]);

    React.useEffect(() => {
        setSelectedEventId(eventId);
    }, [eventId]);

    const fetchEvents = async () => {
        try {
            const adminKey = localStorage.getItem('adminKey');
            const res = await fetch('/api/events', {
                headers: { 'Authorization': adminKey }
            });
            if (res.status === 401) {
                localStorage.removeItem('adminKey');
                window.location.href = '/admin/login';
                return;
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setEvents(data);
                if (data.length > 0 && !selectedEventId) {
                    setSelectedEventId(data[0].id);
                }
            } else {
                setEvents([]);
                console.error('API returned non-array data:', data);
            }
        } catch (err) {
            console.error('Failed to fetch events', err);
        }
    };

    // Append category type to the link
    const link = `${window.location.origin}/attend?eventId=${selectedEventId}&type=${category}`;

    const downloadQR = () => {
        const canvas = qrRef.current.querySelector('canvas');
        const image = canvas.toDataURL("image/png");
        const anchor = document.createElement("a");
        anchor.href = image;
        anchor.download = `attendance-qr-${eventId}-${category}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    };

    const printQR = () => {
        const printWindow = window.open('', '', 'height=600,width=800');
        const canvas = qrRef.current.querySelector('canvas');
        const imgUrl = canvas.toDataURL("image/png");

        printWindow.document.write('<html><head><title>Print QR Code</title>');
        printWindow.document.write(`
            <style>
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; background-color: #f8fafc; color: #1e293b; }
                .print-container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; border: 2px solid #e2e8f0; }
                h1 { margin-bottom: 8px; color: #1e293b; }
                .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 0.875rem; font-weight: 700; text-transform: uppercase; margin-bottom: 24px; }
                .badge-member { background: #dbeafe; color: #1e40af; }
                .badge-worker { background: #fef3c7; color: #92400e; }
                img { border: 8px solid #f1f5f9; padding: 20px; border-radius: 16px; margin-bottom: 24px; }
                .event-id { font-weight: 700; color: #4f46e5; }
                p { color: #64748b; font-size: 0.875rem; }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div class="print-container">');
        printWindow.document.write(`<h1>Attendance Check-in</h1>`);
        printWindow.document.write(`<div class="badge badge-${category}">${category} Access</div>`);
        printWindow.document.write(`<div class="qr-img"><img src="${imgUrl}" width="300" /></div>`);
        printWindow.document.write(`<p>Event ID: <span class="event-id">${eventId}</span></p>`);
        printWindow.document.write(`<p style="margin-top: 8px; font-family: monospace;">${link}</p>`);
        printWindow.document.write('</div>');
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // Wait for image to load before printing
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return (
        <div className="qr-generator-container">
            <div className="qr-station-card">
                <div className="station-header">
                    <div className="station-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <rect x="7" y="7" width="3" height="3"></rect>
                            <rect x="14" y="7" width="3" height="3"></rect>
                            <rect x="7" y="14" width="3" height="3"></rect>
                            <line x1="14" y1="14" x2="14" y2="14.01"></line>
                            <line x1="14" y1="17" x2="14" y2="17.01"></line>
                            <line x1="17" y1="14" x2="17" y2="14.01"></line>
                        </svg>
                    </div>
                    <div>
                        <h3>QR Scanning Station</h3>
                        <p>Generate and manage attendance entry points</p>
                    </div>
                </div>

                <div className="station-body">
                    <div className="config-grid">
                        <div className="config-item">
                            <label>Active Event</label>
                            <select
                                className="station-select"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                            >
                                {events.map(ev => (
                                    <option key={ev.id} value={ev.id}>
                                        {ev.name} ({new Date(ev.date).toLocaleDateString()})
                                    </option>
                                ))}
                                {events.length === 0 && <option value="default-event">Default Event</option>}
                            </select>
                        </div>
                        <div className="config-item">
                            <label>Station Type</label>
                            <div className="station-toggle-btns">
                                <button
                                    className={`toggle-btn ${category === 'member' ? 'active' : ''}`}
                                    onClick={() => setCategory('member')}
                                >
                                    Member Station
                                </button>
                                <button
                                    className={`toggle-btn ${category === 'worker' ? 'active' : ''}`}
                                    onClick={() => setCategory('worker')}
                                >
                                    Worker Station
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="qr-preview-section">
                        <div className={`qr-badge ${category}`}>
                            {category === 'member' ? 'Member Access' : 'Worker Access'}
                        </div>

                        <div ref={qrRef} className="qr-canvas-wrapper">
                            <div className="qr-border-corner top-left"></div>
                            <div className="qr-border-corner top-right"></div>
                            <div className="qr-border-corner bottom-left"></div>
                            <div className="qr-border-corner bottom-right"></div>

                            <QRCodeCanvas
                                value={link}
                                size={220}
                                level={"H"}
                                includeMargin={false}
                                bgColor={"transparent"}
                                fgColor={"#1e293b"}
                            />
                        </div>

                        <div className="qr-status-indicator">
                            <span className="pulse-dot"></span>
                            Live Entry Link Active
                        </div>
                    </div>

                    <div className="qr-station-actions">
                        <button onClick={downloadQR} className="btn-station primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Save for Digital Display
                        </button>
                        <button onClick={printQR} className="btn-station">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                                <rect x="6" y="14" width="12" height="8"></rect>
                            </svg>
                            Print for Check-in Desk
                        </button>
                    </div>
                </div>

                <div className="station-footer">
                    <div className="link-display">
                        <div className="link-label">Check-in URL</div>
                        <div className="link-url">{link}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
