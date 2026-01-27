import React from 'react';
import { Link } from 'react-router-dom';

export default function QRPage() {
  const sampleUrl = `${window.location.origin}/attend?eventId=2026-01-25-morning`;
  return (
    <div>
      <div className="form-header" style={{ marginBottom: 16 }}>
        <h1>Scan to Mark Attendance</h1>
        <p className="helper">Use the QR code at the entrance or open the link below.</p>
      </div>

      <div className="attendance-form" style={{ marginTop: 8 }}>
        <h2 style={{ marginTop: 0 }}>Sample QR link</h2>
        <pre className="small">{sampleUrl}</pre>
        <p className="helper">
          For testing, open <Link to={`/attend?eventId=2026-01-25-morning`}>Attendance Form</Link>
        </p>
      </div>
    </div>
  );
}