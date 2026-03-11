import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function QRPage() {
  const [searchParams] = useSearchParams();
  // Preserve eventId and type from URL so they flow through to the form
  const eventId = searchParams.get('eventId') || 'default-event';
  const type = searchParams.get('type') || 'member';

  const attendUrl = `/attend?eventId=${eventId}&type=${type}`;
  const checkInUrl = `/check-in?eventId=${eventId}`;

  const styles = {
    container: {
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px', backgroundColor: '#f0f4ff'
    },
    card: {
      background: 'white', width: '100%', maxWidth: '520px', padding: '48px 40px',
      borderRadius: '20px',
      boxShadow: '0 20px 60px rgba(30, 64, 175, 0.12), 0 4px 12px rgba(0,0,0,0.08)',
      textAlign: 'center', border: '1px solid #dbeafe'
    },
    logo: {
      width: '56px', height: '56px', borderRadius: '16px',
      background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 24px auto', color: 'white'
    },
    h1: {
      fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px',
      letterSpacing: '-0.025em'
    },
    p: {
      fontSize: '0.95rem', color: '#64748b', marginBottom: '36px', lineHeight: '1.6'
    },
    buttonGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px'
    },
    bigButton: (primary) => ({
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '28px 20px', borderRadius: '16px', cursor: 'pointer',
      transition: 'all 0.2s ease', textDecoration: 'none',
      background: primary ? 'linear-gradient(135deg, #1e40af, #3b82f6)' : 'white',
      color: primary ? 'white' : '#0f172a',
      border: primary ? 'none' : '2px solid #e2e8f0',
      boxShadow: primary ? '0 8px 24px rgba(30, 64, 175, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
    }),
    btnIcon: (primary) => ({
      marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '44px', height: '44px', borderRadius: '12px',
      backgroundColor: primary ? 'rgba(255,255,255,0.2)' : '#eff6ff',
      color: primary ? 'white' : '#1e40af'
    }),
    btnLabel: { fontSize: '1rem', fontWeight: '700', marginBottom: '4px' },
    btnSub: (primary) => ({
      fontSize: '0.8rem', color: primary ? 'rgba(255,255,255,0.75)' : '#64748b', fontWeight: '400'
    }),
    typeBadge: {
      display: 'inline-block', padding: '6px 16px', borderRadius: '100px',
      background: type === 'worker' ? '#fef3c7' : '#eff6ff',
      color: type === 'worker' ? '#92400e' : '#1e40af',
      fontSize: '0.8rem', fontWeight: '700', marginBottom: '24px',
      textTransform: 'uppercase', letterSpacing: '0.05em'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo / Icon */}
        <div style={styles.logo}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        <h1 style={styles.h1}>Welcome to Service</h1>
        <p style={styles.p}>Select how you'd like to record your attendance today.</p>

        {/* Station type badge */}
        {type && (
          <div style={styles.typeBadge}>
            {type === 'worker' ? '⚡ Worker Station' : '✦ Member Station'}
          </div>
        )}

        <div style={styles.buttonGrid}>
          {/* Quick Check-In */}
          <Link to={checkInUrl} style={styles.bigButton(true)}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(30, 64, 175, 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(30, 64, 175, 0.3)'; }}
          >
            <div style={styles.btnIcon(true)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span style={styles.btnLabel}>Quick Check-in</span>
            <span style={styles.btnSub(true)}>I've been here before</span>
          </Link>

          {/* Full Registration */}
          <Link to={attendUrl} style={styles.bigButton(false)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1e40af'; e.currentTarget.style.background = '#f8faff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={styles.btnIcon(false)}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <span style={styles.btnLabel}>Register</span>
            <span style={styles.btnSub(false)}>First time or new details</span>
          </Link>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
          Dominion City, Olive Parish • Attendance System
        </p>
      </div>
    </div>
  );
}