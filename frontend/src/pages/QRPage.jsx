import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function QRPage() {
  const navigate = useNavigate();
  const sampleUrl = `${window.location.origin}/attend?eventId=2026-01-25-morning`;

  const styles = {
    container: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px', backgroundColor: '#f8fafc'
    },
    card: {
      background: 'white', width: '100%', maxWidth: '600px', padding: '48px',
      borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      textAlign: 'center', border: '1px solid #e2e8f0'
    },
    h1: {
      fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '12px',
      letterSpacing: '-0.025em'
    },
    p: {
      fontSize: '1rem', color: '#64748b', marginBottom: '40px', lineHeight: '1.5'
    },
    buttonGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px'
    },
    bigButton: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', borderRadius: '12px', border: '1px solid #cbd5e1', cursor: 'pointer',
      transition: 'all 0.2s ease', textDecoration: 'none', backgroundColor: '#fff',
      color: '#1e293b'
    },
    bigButtonHover: {
      borderColor: '#2563eb', backgroundColor: '#eff6ff'
    },
    btnIcon: {
      marginBottom: '16px', color: '#2563eb',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#eff6ff'
    },
    btnLabel: {
      fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px'
    },
    btnSub: {
      fontSize: '0.875rem', color: '#64748b', fontWeight: '400'
    },
    qrSection: {
      marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #f1f5f9'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.h1}>Welcome to Service</h1>
        <p style={styles.p}>Please verify your attendance to continue.</p>

        <div style={styles.buttonGrid}>
          {/* Quick Check-In Button */}
          <Link
            to="/check-in"
            style={styles.bigButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            <div style={styles.btnIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <span style={styles.btnLabel}>Quick Check-in</span>
            <span style={styles.btnSub}>I have been here before</span>
          </Link>

          {/* Registration Button */}
          <Link
            to="/attend"
            style={styles.bigButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0f172a';
              e.currentTarget.style.backgroundColor = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            <div style={{ ...styles.btnIcon, color: '#0f172a', backgroundColor: '#f1f5f9' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <span style={styles.btnLabel}>Register</span>
            <span style={styles.btnSub}>I am a first-timer</span>
          </Link>
        </div>

        <div style={styles.qrSection}>
          <p style={{ ...styles.p, fontSize: '0.875rem', marginBottom: '8px' }}>Or scan to open on your phone</p>
          <div style={{ background: '#f8fafc', padding: '12px 24px', borderRadius: '8px', display: 'inline-block', border: '1px solid #e2e8f0' }}>
            <pre style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{sampleUrl}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}