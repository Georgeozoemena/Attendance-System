import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function AdminQRGenerator({ eventId }) {
    const qrRef = useRef();
    const link = `${window.location.origin}/attend?eventId=${eventId}`;

    const downloadQR = () => {
        const canvas = qrRef.current.querySelector('canvas');
        const image = canvas.toDataURL("image/png");
        const anchor = document.createElement("a");
        anchor.href = image;
        anchor.download = `attendance-qr-${eventId}.png`;
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
                body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                h1 { margin-bottom: 20px; }
                img { border: 1px solid #ddd; padding: 20px; border-radius: 10px; }
                p { margin-top: 20px; color: #666; }
            </style>
        `);
        printWindow.document.write('</head><body>');
        printWindow.document.write(`<h1>Attendance QR Code: ${eventId}</h1>`);
        printWindow.document.write(`<img src="${imgUrl}" width="400" />`);
        printWindow.document.write(`<p>${link}</p>`);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="qr-generator-container" style={{
            height: 'calc(100vh - 300px)',
            overflowY: 'auto',
            paddingRight: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div className="card text-center" style={{ maxWidth: 450, width: '100%', margin: '0 auto' }}>
                <h3 className="mb-4" style={{ fontSize: '1.25rem', color: '#1e293b' }}>Event QR Code</h3>
                <p className="text-muted small mb-4">
                    Scan to mark attendance for event ID:<br />
                    <strong style={{ fontSize: '1.1rem', color: '#4f46e5' }}>{eventId}</strong>
                </p>

                <div ref={qrRef} className="mb-4 p-4 bg-white rounded border inline-block" style={{ display: 'inline-block', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                    <QRCodeCanvas
                        value={link}
                        size={250}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={downloadQR} className="btn primary-btn" style={{
                        background: '#1e293b',
                        color: 'white',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}>
                        Download PNG
                    </button>
                    <button onClick={printQR} className="btn" style={{
                        background: 'white',
                        color: '#1e293b',
                        border: '1px solid #cbd5e1',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}>
                        Print QR
                    </button>
                </div>

                <div style={{
                    marginTop: '24px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.85rem',
                    color: '#64748b',
                    wordBreak: 'break-all'
                }}>
                    <span style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>Direct Link:</span>
                    {link}
                </div>
            </div>
        </div>
    );
}
