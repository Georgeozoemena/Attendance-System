import { useSearchParams, Link } from 'react-router-dom';

export default function QRPage() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'member';
  const isWorker = type === 'worker';

  const churchName = localStorage.getItem('churchName') || 'Dominion City';
  const parish = localStorage.getItem('parish') || 'Olive Parish';
  const logoUrl = localStorage.getItem('logoUrl') || '/logo.png';

  return (
    <div className="public-page">
      <div className="public-card">
        {/* Brand */}
        <div className="public-brand">
          <img src={logoUrl} alt={churchName} className="public-logo" />
          <div>
            <div className="public-brand-name">{churchName}</div>
            <div className="public-brand-parish">{parish}</div>
          </div>
        </div>

        {/* Hero image */}
        <div className="public-hero">
          <img src="/W2C.jpg" alt="Welcome" className="public-hero-img" />
          <div className="public-hero-overlay" />
          <div className="public-hero-badge">
            <span className="public-hero-dot" />
            <span>{isWorker ? '⚡ Worker Station' : '✦ Member Station'}</span>
          </div>
        </div>

        {/* Heading */}
        <div className="public-heading-block">
          <h1 className="public-heading">Welcome to Service</h1>
          <p className="public-sub">How would you like to record your attendance today?</p>
        </div>

        {/* Action cards */}
        <div className="public-actions">
          <Link to={`/check-in?type=${type}`} className="public-action-card primary">
            <div className="public-action-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="public-action-label">Quick Check-in</div>
            <div className="public-action-sub">Been here before</div>
          </Link>

          <Link to={`/attend?type=${type}`} className="public-action-card secondary">
            <div className="public-action-icon secondary">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <div className="public-action-label">Register</div>
            <div className="public-action-sub">First time or new info</div>
          </Link>
        </div>

        <p className="public-footer-note">🔒 Your information is kept private and used only for church records.</p>
      </div>
    </div>
  );
}
