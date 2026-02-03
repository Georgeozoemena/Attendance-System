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
        <div className="qr-generator-container">
            <div className="card qr-card text-center">
                <h3 className="mb-4" style={{ fontSize: '1.25rem' }}>Event QR Code</h3>
                <p className="text-muted small mb-4">
                    Scan to mark attendance for event ID:<br />
                    <strong style={{ fontSize: '1.1rem', color: '#4f46e5' }}>{eventId}</strong>
                </p>

                <div ref={qrRef} className="qr-code-wrapper">
                    <QRCodeCanvas
                        value={link}
                        size={250}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>

                <div className="qr-actions">
                    <button onClick={downloadQR} className="modal-btn primary">
                        Download PNG
                    </button>
                    <button onClick={printQR} className="modal-btn">
                        Print QR
                    </button>
                </div>

                <div className="qr-link-box">
                    <span className="qr-link-label">Direct Link:</span>
                    {link}
                </div>
            </div>
        </div>
    );
}
