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
        <div style={{
            display: 'flex', minHeight: '100vh', background: '#ffffff',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
        }}>
            {/* ── Left: Form panel ── */}
            <div style={{
                flex: '0 0 480px', display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', padding: '48px 56px',
                background: '#ffffff'
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: '#0047AB', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f0f0f', letterSpacing: '-0.02em' }}>
                        Dominion City
                    </span>
                </div>

                {/* Form */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 360 }}>
                    <h1 style={{
                        fontSize: 40, fontWeight: 800, color: '#0f0f0f',
                        lineHeight: 1.15, letterSpacing: '-0.04em', marginBottom: 10
                    }}>
                        Welcome<br />Back,
                    </h1>
                    <p style={{ fontSize: 15, color: '#888', marginBottom: 40, fontWeight: 400 }}>
                        Sign in to your admin dashboard
                    </p>

                    <form onSubmit={handleLogin}>
                        {/* Password field */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 8 }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    autoFocus
                                    required
                                    style={{
                                        width: '100%', padding: '13px 44px 13px 16px',
                                        border: error ? '1.5px solid #ef4444' : '1.5px solid #e0e0e0',
                                        borderRadius: 10, fontSize: 14, outline: 'none',
                                        background: '#fafafa', color: '#0f0f0f',
                                        transition: 'border-color 0.15s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={e => { if (!error) e.target.style.borderColor = '#0047AB'; }}
                                    onBlur={e => { if (!error) e.target.style.borderColor = '#e0e0e0'; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(s => !s)}
                                    style={{
                                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', padding: 0
                                    }}
                                >
                                    {showPw ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    )}
                                </button>
                            </div>
                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 12, color: '#ef4444' }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !password}
                            style={{
                                width: '100%', padding: '14px', borderRadius: 10,
                                background: loading || !password ? '#ccc' : '#0047AB',
                                color: '#fff', border: 'none', fontSize: 15, fontWeight: 700,
                                cursor: loading || !password ? 'not-allowed' : 'pointer',
                                transition: 'background 0.15s, transform 0.1s',
                                letterSpacing: '-0.01em'
                            }}
                            onMouseEnter={e => { if (!loading && password) e.currentTarget.style.background = '#003380'; }}
                            onMouseLeave={e => { if (!loading && password) e.currentTarget.style.background = '#0047AB'; }}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{ background: 'none', border: 'none', fontSize: 13, color: '#aaa', cursor: 'pointer', padding: 0 }}
                    >
                        ← Back to check-in
                    </button>
                    <span style={{ fontSize: 12, color: '#ccc' }}>Olive Parish</span>
                </div>
            </div>

            {/* ── Right: Image panel ── */}
            <div style={{
                flex: 1, position: 'relative', overflow: 'hidden',
                background: '#0a0a0a', minHeight: '100vh'
            }}>
                {/* Background image */}
                <img
                    src="/W2C.jpg"
                    alt="Dominion City"
                    style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', objectPosition: 'center',
                        opacity: 0.75
                    }}
                />

                {/* Gradient overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)'
                }} />

                {/* Blue accent overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(0,71,171,0.3) 0%, transparent 60%)'
                }} />

                {/* Content */}
                <div style={{
                    position: 'absolute', bottom: 56, left: 48, right: 48
                }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(0,71,171,0.8)', backdropFilter: 'blur(8px)',
                        borderRadius: 100, padding: '6px 14px', marginBottom: 20
                    }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#5b9cf6', animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '0.04em' }}>
                            LIVE ATTENDANCE SYSTEM
                        </span>
                    </div>

                    <h2 style={{
                        fontSize: 36, fontWeight: 800, color: '#ffffff',
                        lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: 12
                    }}>
                        Raising Leaders,<br />Building Community
                    </h2>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 400 }}>
                        Track attendance, manage your congregation, and grow your church — all in one place.
                    </p>

                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 32, marginTop: 32 }}>
                        {[
                            { label: 'Members Tracked', value: '∞' },
                            { label: 'Events Managed', value: '∞' },
                            { label: 'Always Live', value: '24/7' },
                        ].map(s => (
                            <div key={s.label}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>{s.value}</div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2, fontWeight: 500 }}>{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Responsive: hide image panel on small screens */}
            <style>{`
                @media (max-width: 768px) {
                    div[style*="flex: 0 0 480px"] {
                        flex: 1 !important;
                        padding: 40px 28px !important;
                    }
                    div[style*="flex: 1"][style*="minHeight: 100vh"] {
                        display: none !important;
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
            `}</style>
        </div>
    );
}
