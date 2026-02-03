import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Confetti from 'react-confetti';

export default function ThankYouPage() {
  const location = useLocation();
  const { name, uniqueCode } = location.state || {};
  const [showConfetti, setShowConfetti] = React.useState(true);

  useEffect(() => {
    // Haptic Feedback (if supported)
    if (window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 100]);
    }

    // Play success sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.warn('Audio play blocked', e));
    } catch (err) {
      console.warn('Audio play failed', err);
    }

    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const styles = {
    wrapper: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc', // Admin/Welcome Hub background
      //   fontFamily: 'inherit', // Uses global font
      padding: '24px'
    },
    container: {
      background: 'white',
      borderRadius: '16px',
      padding: '48px 32px',
      maxWidth: '500px',
      width: '100%',
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      color: '#1e293b'
    },
    iconWrapper: {
      width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#ecfccb',
      color: '#65a30d', display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 24px auto'
    },
    title: {
      fontSize: '2rem',
      marginTop: '0',
      marginBottom: '12px',
      fontWeight: '700',
      color: '#1e293b',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      fontSize: '1.1rem',
      color: '#64748b',
      marginBottom: '32px',
      lineHeight: '1.5'
    },
    idCard: {
      background: '#f1f5f9',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '32px',
      position: 'relative'
    },
    idLabel: {
      textTransform: 'uppercase',
      fontSize: '0.8rem',
      letterSpacing: '0.05em',
      fontWeight: '600',
      color: '#64748b',
      marginBottom: '8px',
      display: 'block'
    },
    idValue: {
      fontSize: '3rem',
      lineHeight: '1',
      fontWeight: '800',
      color: '#1e293b',
      letterSpacing: '-0.02em',
      margin: 0
    },
    homeBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '14px 32px',
      background: '#1e293b',
      color: 'white',
      borderRadius: '8px',
      textDecoration: 'none',
      fontWeight: '600',
      fontSize: '1rem',
      transition: 'all 0.2s',
      border: '1px solid #1e293b'
    }
  };

  return (
    <div style={styles.wrapper}>
      {showConfetti && <Confetti numberOfPieces={200} recycle={false} colors={['#2563eb', '#1e293b', '#64748b']} />}

      <div style={styles.container}>
        <div style={styles.iconWrapper}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1 style={styles.title}>You're Checked In!</h1>
        <p style={styles.subtitle}>
          Thank you, <strong>{name || 'Friend'}</strong>.<br />
          Your attendance has been recorded to the database.
        </p>

        {uniqueCode && (
          <div style={styles.idCard}>
            <span style={styles.idLabel}>Unique Check-in ID</span>
            <div style={styles.idValue}>{uniqueCode}</div>
          </div>
        )}

        <Link
          to="/"
          style={styles.homeBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#334155';
            e.currentTarget.style.borderColor = '#334155';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#1e293b';
            e.currentTarget.style.borderColor = '#1e293b';
          }}
        >
          Return to Form
        </Link>
      </div>
    </div>
  );
}