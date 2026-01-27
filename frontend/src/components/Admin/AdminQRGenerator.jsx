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

    return (
        <div className="card text-center" style={{ maxWidth: 400, margin: '0 auto' }}>
            <h3 className="mb-4">Event QR Code</h3>
            <p className="text-muted small mb-4">Scan to mark attendance for: <strong>{eventId}</strong></p>

            <div ref={qrRef} className="mb-4 p-4 bg-white rounded border inline-block" style={{ display: 'inline-block' }}>
                <QRCodeCanvas
                    value={link}
                    size={200}
                    level={"H"}
                    includeMargin={true}
                />
            </div>

            <div className="flex flex-col gap-2">
                <button onClick={downloadQR} className="btn primary-btn w-full justify-center">
                    Download PNG
                </button>
                <div className="mt-2 text-muted small break-all p-2 bg-input rounded">
                    {link}
                </div>
            </div>
        </div>
    );
}
