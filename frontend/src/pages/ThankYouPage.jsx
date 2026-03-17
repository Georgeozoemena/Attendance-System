import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Confetti from 'react-confetti';

export default function ThankYouPage() {
  const location = useLocation();
  const { name, uniqueCode, streak } = location.state || {};
  const [showConfetti, setShowConfetti] = React.useState(true);

  useEffect(() => {
    if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.volume = 0.4;
      audio.play().catch(() => { });
    } catch { }
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', background: 'var(--bg, #0c0c0e)'
    }}>
      {showConfetti && (
        <Confetti numberOfPieces={180} recycle={false}
          colors={['#f59e0b', '#fbbf24', '#fcd34d', '#ffffff', '#d97706']} />
      )}

      <div style={{
        background: 'var(--surface, #18181b)', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', padding: '48px 36px',
        maxWidth: '460px', width: '100%', textAlign: 'center',
        boxShadow: '0 12px 24px rgba(0,0,0,0.5)'
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px auto', color: '#f59e0b'
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{
          fontSize: '1.75rem', fontWeight: 800, color: '#fafafa',
          marginBottom: '8px', letterSpacing: '-0.03em'
        }}>
          You're Checked In!
        </h1>

        <p style={{ fontSize: '0.95rem', color: '#71717a', marginBottom: '32px', lineHeight: 1.6 }}>
          Thank you, <strong style={{ color: '#e4e4e7' }}>{name || 'Friend'}</strong>.<br />
          Your attendance has been recorded.
        </p>

        {uniqueCode && (
          <div style={{
            background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '12px', padding: '20px 24px', marginBottom: '32px'
          }}>
            <span style={{
              display: 'block', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: '#71717a', marginBottom: '8px'
            }}>
              Your Check-in ID
            </span>
            <div style={{
              fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b',
              letterSpacing: '-0.03em', lineHeight: 1, fontVariantNumeric: 'tabular-nums'
            }}>
              {uniqueCode}
            </div>
          </div>
        )}

        {streak > 1 && (
          <div className="animate-bounce-subtle" style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            color: '#ef4444'
          }}>
            <span style={{ fontSize: '20px' }}>🔥</span>
            <span style={{ fontWeight: 700, fontSize: '14px' }}>
              {streak} Week Streak! Keep it up!
            </span>
          </div>
        )}

        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '11px 28px', background: '#f59e0b', color: '#000',
          borderRadius: '8px', fontWeight: 700, fontSize: '14px',
          border: 'none', transition: 'background 0.12s', textDecoration: 'none'
        }}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}