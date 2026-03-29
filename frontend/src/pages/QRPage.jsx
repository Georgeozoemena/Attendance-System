import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function QRPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'member';

  const attendUrl = `/attend?type=${type}`;
  const checkInUrl = `/check-in?type=${type}`;

  const isWorker = type === 'worker';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '24px', background: 'var(--bg, #0c0c0e)'
    }}>
      <div style={{
        background: 'var(--surface, #18181b)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px', padding: '44px 36px',
        width: '100%', maxWidth: '480px', textAlign: 'center',
        boxShadow: '0 12px 32px rgba(0,0,0,0.6)'
      }}>
        {/* Brand icon */}
        <div style={{
          width: 52, height: 52, borderRadius: '14px',
          background: '#f59e0b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px auto', color: '#000'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>

        {/* Station badge */}
        <div style={{
          display: 'inline-block', padding: '4px 14px', borderRadius: '100px',
          background: isWorker ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
          color: isWorker ? '#22c55e' : '#f59e0b',
          border: `1px solid ${isWorker ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
          fontSize: '11px', fontWeight: 700, marginBottom: '16px',
          textTransform: 'uppercase', letterSpacing: '0.06em'
        }}>
          {isWorker ? '⚡ Worker' : '✦ Member'}
        </div>

        <h1 style={{
          fontSize: '22px', fontWeight: 800, color: '#fafafa',
          marginBottom: '6px', letterSpacing: '-0.02em'
        }}>
          Welcome to Service
        </h1>
        <p style={{ fontSize: '13px', color: '#71717a', marginBottom: '32px', lineHeight: 1.6 }}>
          Select how you'd like to record your attendance today.
        </p>

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          {/* Quick Check-in */}
          <Link
            to={checkInUrl}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '24px 16px', borderRadius: '12px', textDecoration: 'none',
              background: '#f59e0b', color: '#000',
              border: '1px solid #f59e0b',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#d97706'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f59e0b'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>Quick Check-in</span>
            <span style={{ fontSize: '11px', opacity: 0.7 }}>Been here before</span>
          </Link>

          {/* Register */}
          <Link
            to={attendUrl}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '24px 16px', borderRadius: '12px', textDecoration: 'none',
              background: 'rgba(255,255,255,0.04)',
              color: '#e4e4e7', border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: '#f59e0b'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, marginBottom: '3px' }}>Register</span>
            <span style={{ fontSize: '11px', color: '#52525b' }}>First time or new info</span>
          </Link>
        </div>

        <p style={{ fontSize: '12px', color: '#3f3f46' }}>
          Dominion City, Olive Parish · Attendance System
        </p>
      </div>
    </div>
  );
}