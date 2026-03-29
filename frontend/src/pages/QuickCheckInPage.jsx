import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { lookupAttendance } from '../services/api';
import { getUser, saveUser, queueAdd, tryFlushQueue } from '../services/localCache';
import Toast from '../components/UI/Toast.jsx';

export default function QuickCheckInPage() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [eventId, setEventId] = useState(searchParams.get('eventId'));
    const [fetchingEvent, setFetchingEvent] = useState(!eventId);

    React.useEffect(() => {
        if (!eventId) {
            const fetchCurrentEvent = async () => {
                try {
                    const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/events/current`);
                    if (res.ok) {
                        const data = await res.json();
                        setEventId(data.id);
                    } else {
                        setEventId('default-event');
                    }
                } catch (err) {
                    console.error('Failed to fetch current event', err);
                    setEventId('default-event');
                } finally {
                    setFetchingEvent(false);
                }
            };
            fetchCurrentEvent();
        }
    }, [eventId]);

    const handleCheckIn = async (e) => {
        e.preventDefault();
        if (!phone || phone.length < 5 || loading || fetchingEvent) {
            if (!loading && !fetchingEvent) setToast({ message: 'Please enter a valid phone number', type: 'error' });
            return;
        }
        setLoading(true); setToast(null); setSuccess(null);

        try {
            let user = getUser(phone);
            const results = await lookupAttendance({ phone, eventId });

            if (!user && results?.length > 0) {
                user = results.find(r => String(r.phone) === String(phone));
                if (user) saveUser(phone, user);
            }

            const today = new Date().toISOString().split('T')[0];
            const alreadyCheckedIn = results?.find(r =>
                String(r.eventId) === String(eventId) &&
                String(r.createdAt || r.timestamp).startsWith(today)
            );

            if (alreadyCheckedIn) {
                setToast({ message: `Hi ${user?.name || 'there'}, you're already checked in for today!`, type: 'info' });
                setLoading(false); return;
            }

            if (user) {
                saveUser(phone, user);
                // Strip stale fields from cached user and generate a fresh id
                const { id: _oldId, createdAt: _oldTs, eventId: _oldEv, ...cleanUser } = user;
                const payload = { ...cleanUser, id: crypto.randomUUID(), eventId, createdAt: new Date().toISOString() };
                queueAdd(eventId, payload);
                try {
                    await tryFlushQueue();
                    setSuccess(`Welcome back, ${user.name}!`);
                } catch {
                    setSuccess(`Welcome back, ${user.name}! (Offline — syncing soon)`);
                }
                setTimeout(() => navigate('/thank-you', { state: { name: user.name, uniqueCode: user.uniqueCode } }), 1400);
            } else {
                setToast({ message: `Number not found. Redirecting to registration...`, type: 'error' });
                setTimeout(() => navigate(`/attend?eventId=${eventId}`), 2200);
            }
        } catch {
            setToast({ message: 'Something went wrong. Please use the full form.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '24px', background: 'var(--bg, #0c0c0e)'
        }}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div style={{
                background: 'var(--surface, #18181b)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '36px 32px',
                width: '100%', maxWidth: '380px', textAlign: 'center',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
            }}>
                {/* Icon */}
                <div style={{
                    width: 52, height: 52, borderRadius: '14px',
                    background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px auto', color: '#f59e0b'
                }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </div>

                <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#fafafa', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                    Quick Check-in
                </h1>
                
                {fetchingEvent ? (
                    <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '24px' }}>
                        Syncing with latest event...
                    </p>
                ) : (
                    <>
                        <p style={{ color: '#71717a', fontSize: '13px', marginBottom: '24px' }}>
                            Enter your phone number to mark attendance.
                        </p>

                        {success && (
                            <div style={{
                                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                                borderRadius: '8px', padding: '10px 14px', marginBottom: '16px',
                                color: '#22c55e', fontSize: '13px', fontWeight: 500
                            }}>
                                ✓ {success}
                            </div>
                        )}

                        <form onSubmit={handleCheckIn}>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="e.g. 08012345678"
                                autoFocus
                                style={{
                                    width: '100%', padding: '11px 14px', fontSize: '15px',
                                    borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)',
                                    marginBottom: '12px', textAlign: 'center', letterSpacing: '1px',
                                    background: 'rgba(255,255,255,0.04)', color: '#fafafa',
                                    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                    transition: 'border-color 0.15s'
                                }}
                                onFocus={e => e.target.style.borderColor = '#f59e0b'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%', padding: '11px', background: '#f59e0b', color: '#000',
                                    border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1, fontFamily: 'inherit', transition: 'background 0.12s'
                                }}
                            >
                                {loading ? 'Checking...' : 'Check In Now'}
                            </button>
                        </form>

                        <button
                            onClick={() => navigate(`/attend?eventId=${eventId}`)}
                            style={{
                                display: 'block', width: '100%', marginTop: '14px',
                                color: '#52525b', background: 'none', border: 'none',
                                fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', padding: '4px'
                            }}
                        >
                            New here? Register first →
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
