import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Confetti from 'react-confetti';

export default function ThankYouPage() {
  const location = useLocation();
  const { name, uniqueCode, streak } = location.state || {};
  const [showConfetti, setShowConfetti] = useState(true);

  const churchName = localStorage.getItem('churchName') || 'Dominion City';
  const logoUrl = localStorage.getItem('logoUrl') || '/logo.png';

  useEffect(() => {
    if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
    const t = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="public-page">
      {showConfetti && (
        <Confetti numberOfPieces={160} recycle={false}
          colors={['#0047AB', '#5b9cf6', '#93c5fd', '#ffffff', '#003380']} />
      )}

      <div className="public-card thankyou-card">
        {/* Brand */}
        <div className="public-brand">
          <img src={logoUrl} alt={churchName} className="public-logo" />
          <div className="public-brand-name">{churchName}</div>
        </div>

        {/* Check icon */}
        <div className="thankyou-icon">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 className="thankyou-heading">You're Checked In!</h1>
        <p className="thankyou-sub">
          Thank you, <strong>{name || 'Friend'}</strong>.<br />
          Your attendance has been recorded.
        </p>

        {uniqueCode && (
          <div className="thankyou-code-card">
            <span className="thankyou-code-label">Your Check-in ID</span>
            <div className="thankyou-code">{uniqueCode}</div>
          </div>
        )}

        {streak > 1 && (
          <div className="thankyou-streak">
            <span style={{ fontSize: '20px' }}>🔥</span>
            <span>{streak} Week Streak! Keep it up!</span>
          </div>
        )}

        <Link to="/" className="thankyou-back-btn">Back to Home</Link>
      </div>
    </div>
  );
}
