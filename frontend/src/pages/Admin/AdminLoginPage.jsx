import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../services/api';

export default function AdminLoginPage() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const resp = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await resp.json();
            if (resp.ok && data.success) {
                localStorage.setItem('adminKey', data.token);
                localStorage.setItem('adminTokenExpiry', data.expiresAt.toString());
                navigate('/admin');
            } else {
                setError(data.error || 'Invalid password. Please try again.');
            }
        } catch {
            setError('Could not connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-root">
            {/* ── Left ── */}
            <div className="login-left">
                <div className="login-brand">
                    <div className="login-brand-mark">
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span className="login-brand-name">Dominion City</span>
                </div>

                <div className="login-form-area">
                    <h1 className="login-heading">Welcome<br />Back,</h1>
                    <p className="login-sub">Sign in to your admin dashboard to continue.</p>

                    <form onSubmit={handleLogin}>
                        <div>
                            <label className="login-field-label" htmlFor="pw">Password</label>
                            <div className="login-input-wrap">
                                <input
                                    id="pw"
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    placeholder="Enter your password"
                                    autoFocus
                                    required
                                    className={`login-input${error ? ' has-error' : ''}`}
                                />
                                <button type="button" className="login-pw-toggle" onClick={() => setShowPw(s => !s)} tabIndex={-1}>
                                    {showPw ? (
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    ) : (
                                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    )}
                                </button>
                            </div>
                            {error && (
                                <div className="login-error-msg">
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    {error}
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading || !password} className="login-submit">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                <div className="login-footer">
                    <button className="login-back-btn" onClick={() => navigate('/')}>← Back to check-in</button>
                    <span className="login-parish">Olive Parish</span>
                </div>
            </div>

            {/* ── Right ── */}
            <div className="login-right">
                <img src="/W2C.jpg" alt="" className="login-right-img" />
                <div className="login-right-overlay" />
                <div className="login-right-content">
                    <div className="login-badge">
                        <span className="login-badge-dot" />
                        <span className="login-badge-text">Church Management System</span>
                    </div>
                    <h2 className="login-right-heading">
                        Raising Leaders,<br />Building Community
                    </h2>
                    <p className="login-right-desc">
                        Attendance, members, departments, prayer requests, testimonies — everything your church needs, in one place.
                    </p>
                    <div className="login-stats">
                        {[
                            { value: 'Live', label: 'Attendance Tracking' },
                            { value: 'Full', label: 'Member Profiles' },
                            { value: '24/7', label: 'Always Available' },
                        ].map(s => (
                            <div key={s.label}>
                                <div className="login-stat-value">{s.value}</div>
                                <div className="login-stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
