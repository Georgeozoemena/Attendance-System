import React from 'react';
import { Link } from 'react-router-dom';

export default function ThankYouPage() {
  return (
    <div>
      <div className="form-header" style={{ marginBottom: 16 }}>
        <h1>Thank You</h1>
        <p className="helper">Your attendance has been recorded.</p>
      </div>

      <div className="attendance-form" style={{ marginTop: 8, textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>All set</h2>
        <p className="helper">We appreciate you coming today.</p>
        <p style={{ marginTop: 12 }}>
          <Link to="/">Back to Home</Link>
        </p>
      </div>
    </div>
  );
}