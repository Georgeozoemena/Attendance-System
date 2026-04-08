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
        <>
            <style>{`
                .login-root {
                    display: flex;
                    min-height: 100vh;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                }

                /* ── Left panel ── */
                .login-left {
                    flex: 0 0 460px;
                    background: #0a0a0a;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    padding: 44px 52px;
                    position: relative;
                    z-index: 1;
                }

                .login-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .login-brand-mark {
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    background: #0047AB;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .login-brand-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #ffffff;
                    letter-spacing: -0.02em;
                }

                .login-form-area {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    max-width: 340px;
                }

                .login-heading {
                    font-size: 38px;
                    font-weight: 800;
                    color: #ffffff;
                    line-height: 1.15;
                    letter-spacing: -0.04em;
                    margin-bottom: 10px;
                }

                .login-sub {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 40px;
                    font-weight: 400;
                    line-height: 1.5;
                }

                .login-field-label {
                    display: block;
                    font-size: 12px;
                    font-weight: 600;
                    color: #888;
                    margin-bottom: 8px;
                    letter-spacing: 0.02em;
                    text-transform: uppercase;
                }

                .login-input-wrap {
                    position: relative;
                    margin-bottom: 20px;
                }

                .login-input {
                    width: 100%;
                    padding: 13px 44px 13px 16px;
                    background: #1a1a1a;
                    border: 1.5px solid #2a2a2a;
                    border-radius: 10px;
                    font-size: 14px;
                    color: #ffffff;
                    outline: none;
                    transition: border-color 0.15s;
                    box-sizing: border-box;
                    font-family: inherit;
                }

                .login-input::placeholder { color: #444; }

                .login-input:focus {
                    border-color: #0047AB;
                    background: #1f1f1f;
                }

                .login-input.has-error { border-color: #ef4444; }

                .login-pw-toggle {
                    position: absolute;
                    right: 14px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #555;
                    padding: 0;
                    display: flex;
                    align-items: center;
                }

                .login-pw-toggle:hover { color: #888; }

                .login-error-msg {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    color: #ef4444;
                    margin-top: -12px;
                    margin-bottom: 16px;
                }

                .login-submit {
                    width: 100%;
                    padding: 14px;
                    border-radius: 10px;
                    background: #0047AB;
                    color: #fff;
                    border: none;
                    font-size: 15px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background 0.15s;
                    font-family: inherit;
                    letter-spacing: -0.01em;
                    margin-top: 4px;
                }

                .login-submit:hover:not(:disabled) { background: #003380; }
                .login-submit:disabled { background: #1f1f1f; color: #444; cursor: not-allowed; }

                .login-footer {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .login-back-btn {
                    background: none;
                    border: none;
                    font-size: 13px;
                    color: #444;
                    cursor: pointer;
                    padding: 0;
                    font-family: inherit;
                    transition: color 0.12s;
                }

                .login-back-btn:hover { color: #888; }

                /* ── Right panel ── */
                .login-right {
                    flex: 1;
                    position: relative;
                    overflow: hidden;
                    background: #0a0a0a;
                }

                .login-right-img {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    object-position: center;
                    opacity: 0.6;
                }

                .login-right-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(
                        to top,
                        rgba(0,0,0,0.92) 0%,
                        rgba(0,0,0,0.4) 45%,
                        rgba(0,0,0,0.15) 100%
                    );
                }

                .login-right-content {
                    position: absolute;
                    bottom: 52px;
                    left: 48px;
                    right: 48px;
                }

                .login-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(0, 71, 171, 0.75);
                    backdrop-filter: blur(10px);
                    border-radius: 100px;
                    padding: 6px 14px;
                    margin-bottom: 22px;
                }

                .login-badge-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: #5b9cf6;
                    animation: loginPulse 2s ease-in-out infinite;
                }

                .login-badge-text {
                    font-size: 11px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                }

                .login-right-heading {
                    font-size: 34px;
                    font-weight: 800;
                    color: #ffffff;
                    line-height: 1.2;
                    letter-spacing: -0.03em;
                    margin-bottom: 12px;
                }

                .login-right-desc {
                    font-size: 14px;
                    color: rgba(255,255,255,0.6);
                    line-height: 1.65;
                    max-width: 380px;
                }

                .login-stats {
                    display: flex;
                    gap: 36px;
                    margin-top: 32px;
                }

                .login-stat-value {
                    font-size: 22px;
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.03em;
                }

                .login-stat-label {
                    font-size: 11px;
                    color: rgba(255,255,255,0.45);
                    margin-top: 3px;
                    font-weight: 500;
                }

                @keyframes loginPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(0.8); }
                }

                /* ── Responsive ── */
                @media (max-width: 900px) {
                    .login-left { flex: 0 0 400px; padding: 36px 40px; }
                    .login-heading { font-size: 32px; }
                }

                @media (max-width: 700px) {
                    .login-root { flex-direction: column; }
                    .login-left {
                        flex: none;
                        width: 100%;
                        min-height: 100vh;
                        padding: 40px 28px;
                    }
                    .login-right { display: none; }
                    .login-form-area { max-width: 100%; }
                    .login-heading { font-size: 34px; }
                }
            `}</style>

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
                        <span style={{ fontSize: 12, color: '#333' }}>Olive Parish</span>
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
        </>
    );
}
