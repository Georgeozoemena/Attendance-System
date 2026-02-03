import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { lookupAttendance, postAttendance } from '../services/api';
import { getUser, saveUser, queueAdd, tryFlushQueue } from '../services/localCache';
import Toast from '../components/UI/Toast.jsx';

export default function QuickCheckInPage() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const eventId = searchParams.get('eventId') || 'default-event';

    const handleCheckIn = async (e) => {
        e.preventDefault();
        if (!phone || phone.length < 5 || loading) {
            if (!loading) setToast({ message: 'Please enter a valid phone number', type: 'error' });
            return;
        }

        setLoading(true);
        setToast(null);
        setSuccess(null);

        try {
            // 1. Get User Profile (Cache is fine for name/phone)
            let user = getUser(phone);

            // 2. We MUST check server to see if they already registered TODAY for THIS event
            const results = await lookupAttendance({ phone, eventId });

            // If user profile wasn't in cache, get it from the latest server record
            if (!user && results && results.length > 0) {
                user = results.find(r => String(r.phone) === String(phone));
                if (user) saveUser(phone, user);
            }

            // Check if already checked in TODAY for THIS event
            const today = new Date().toISOString().split('T')[0];
            const alreadyCheckedIn = results && results.find(r =>
                String(r.eventId) === String(eventId) &&
                String(r.createdAt || r.timestamp).startsWith(today)
            );

            if (alreadyCheckedIn) {
                setToast({
                    message: `Hi ${user?.name || 'there'}, you have already marked attendance for this event today!`,
                    type: 'info'
                });
                setLoading(false);
                return;
            }

            if (user) {
                // 3. User Found!
                // Update local cache for next time
                saveUser(phone, user);

                // Auto-mark attendance
                const payload = { ...user, eventId, createdAt: new Date().toISOString() };

                // Add to queue for offline support and try to flush
                queueAdd(eventId, payload);

                try {
                    await tryFlushQueue();
                    setSuccess(`Welcome back, ${user.name}! Checked in.`);
                } catch (err) {
                    // If sync fails, it's still queued locally, so we consider it "successful" for the user
                    setSuccess(`Welcome back, ${user.name}! (Offline: Queued for sync)`);
                }

                setTimeout(() => {
                    navigate('/thank-you', { state: { name: user.name, uniqueCode: user.uniqueCode } });
                }, 1500);
            } else {
                // 4. Not Found -> Show Toast and Redirect
                setToast({
                    message: `Number ${phone} not found. Redirecting to registration...`,
                    type: 'error'
                });

                setTimeout(() => {
                    navigate(`/attend?eventId=${eventId}`);
                }, 2500);
            }

        } catch (err) {
            console.error(err);
            setToast({ message: 'Something went wrong. Please use the full form.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const styles = {
        container: {
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: '24px', backgroundColor: '#f8fafc'
        },
        card: {
            background: 'white', width: '100%', maxWidth: '400px', padding: '32px',
            borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center', border: '1px solid #e2e8f0'
        },
        title: { fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', marginBottom: '8px' },
        subtitle: { color: '#64748b', marginBottom: '24px' },
        input: {
            width: '100%', padding: '12px', fontSize: '1.1rem', borderRadius: '8px',
            border: '1px solid #cbd5e1', marginBottom: '16px', textAlign: 'center', letterSpacing: '1px'
        },
        button: {
            width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600',
            cursor: 'pointer', opacity: loading ? 0.7 : 1
        },
        link: {
            display: 'block', marginTop: '16px', color: '#64748b', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer'
        },
        error: { color: '#dc2626', marginBottom: '16px', fontSize: '0.9rem' },
        success: { color: '#16a34a', marginBottom: '16px', fontWeight: '600' }
    };

    return (
        <div style={styles.container}>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div style={styles.card}>
                <h1 style={styles.title}>Quick Check-in</h1>
                <p style={styles.subtitle}>Enter your phone number to mark attendance.</p>

                {success && <div style={styles.success}>{success}</div>}

                <form onSubmit={handleCheckIn}>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 08012345678"
                        style={styles.input}
                        autoFocus
                    />
                    <button type="submit" style={styles.button} disabled={loading}>
                        {loading ? 'Checking...' : 'Check In'}
                    </button>
                </form>

                <div
                    onClick={() => navigate(`/attend?eventId=${eventId}`)}
                    style={styles.link}
                >
                    New here? Register First
                </div>
            </div>
        </div>
    );
}
