import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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

    const churchName = localStorage.getItem('churchName') || 'Dominion City';
    const logoUrl = localStorage.getItem('logoUrl') || '/logo.png';

    useState(() => {
        if (!eventId) {
            fetch(`${import.meta.env.VITE_API_URL || ''}/api/events/current`)
                .then(r => r.ok ? r.json() : null)
                .then(d => setEventId(d?.id || 'default-event'))
                .catch(() => setEventId('default-event'))
                .finally(() => setFetchingEvent(false));
        }
    }, []);

    const handleCheckIn = async (e) => {
        e.preventDefault();
        if (!phone || phone.length < 5 || loading || fetchingEvent) return;
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
                const { id: _id, createdAt: _ts, eventId: _ev, type: _t, ...cleanUser } = user;
                const checkInType = searchParams.get('type') || _t || 'member';
                const payload = { ...cleanUser, id: crypto.randomUUID(), eventId, type: checkInType, createdAt: new Date().toISOString() };
                queueAdd(eventId, payload);
                try { await tryFlushQueue(); } catch {}
                setSuccess(`Welcome back, ${user.name}!`);
                setTimeout(() => navigate('/thank-you', { state: { name: user.name, uniqueCode: user.uniqueCode } }), 1400);
            } else {
                setToast({ message: 'Number not found. Redirecting to registration...', type: 'error' });
                setTimeout(() => navigate(`/attend?eventId=${eventId}`), 2200);
            }
        } catch {
            setToast({ message: 'Something went wrong. Please use the full form.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="public-page">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="public-card" style={{ maxWidth: '400px' }}>
                {/* Brand */}
                <div className="public-brand">
                    <img src={logoUrl} alt={churchName} className="public-logo" />
                    <div>
                        <div className="public-brand-name">{churchName}</div>
                    </div>
                </div>

                {/* Icon */}
                <div className="public-icon-wrap">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </div>

                <h1 className="public-heading" style={{ marginBottom: '8px' }}>Quick Check-in</h1>
                <p className="public-sub" style={{ marginBottom: '28px' }}>
                    {fetchingEvent ? 'Syncing with latest event...' : 'Enter your phone number to mark attendance.'}
                </p>

                {success && (
                    <div className="public-success-msg">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        {success}
                    </div>
                )}

                {!fetchingEvent && (
                    <form onSubmit={handleCheckIn}>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            placeholder="e.g. 08012345678"
                            autoFocus
                            className="public-phone-input"
                        />
                        <button type="submit" disabled={loading || !phone} className="public-submit-btn">
                            {loading ? 'Checking...' : 'Check In Now'}
                        </button>
                    </form>
                )}

                <Link to={`/attend?eventId=${eventId}`} className="public-link-btn">
                    New here? Register first →
                </Link>
            </div>
        </div>
    );
}
