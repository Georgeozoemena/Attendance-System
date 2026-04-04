import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { queueAdd, tryFlushQueue, saveUser } from '../../services/localCache.js';
import { lookupAttendance, API_BASE } from '../../services/api.js';
import Toast from '../UI/Toast.jsx';

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'address', 'occupation', 'gender', 'nationality'];

function validate(form, type) {
  const errs = {};
  if (!form.name || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
  if (!/\S+@\S+\.\S/.test(form.email)) errs.email = 'Please enter a valid email address';
  if (!form.phone || String(form.phone).length < 7) errs.phone = 'Please enter a valid phone number';

  // Fields required for Members only
  if (type === 'member') {
    if (!form.address || form.address.trim().length < 3) errs.address = 'Please enter your address';
    if (!form.birthday) errs.birthday = 'Please select your birthday';
    if (!form.occupation || form.occupation.trim().length < 2) errs.occupation = 'Please enter your occupation';
    if (!form.gender) errs.gender = 'Please select your gender';
    if (!form.nationality || form.nationality.trim().length < 2) errs.nationality = 'Please enter your nationality';
  } else if (type === 'worker') {
    // Worker required fields
    if (!form.department || form.department.trim().length < 2) errs.department = 'Please enter your department/unit';
  }
  return errs;
}

export default function AttendanceForm({ eventId, type, isAdmin }) {
  const navigate = useNavigate();

  const [allEvents, setAllEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(eventId);

  useEffect(() => {
    if (isAdmin) {
      fetch(`${API_BASE}/api/events`, {
        headers: { 'x-admin-key': localStorage.getItem('adminKey') }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setAllEvents(data);
        })
        .catch(err => console.error('Failed to fetch all events', err));
    }
  }, [isAdmin]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    birthday: '',
    occupation: '',
    firstTimer: false,
    gender: '',
    nationality: '',
    department: '',
    type: type || 'member'
  });

  const effectiveEventId = isAdmin && selectedEventId === 'admin-manual' ? (allEvents[0]?.id || eventId) : (selectedEventId || eventId);

  // Sync type prop changes (e.g. when switching Member/Worker station)
  useEffect(() => {
    setForm(f => ({ ...f, type: type || 'member' }));
  }, [type]);

  // Reset prefill state when event changes
  useEffect(() => {
    setPrefilledFrom(null);
  }, [eventId]);

  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [prefilledFrom, setPrefilledFrom] = useState(null); // 'phone' | 'email lookup' | 'smart lookup'
  const [smartSuggestion, setSmartSuggestion] = useState(null);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isHardExpired, setIsHardExpired] = useState(false);
  const [isNotStarted, setIsNotStarted] = useState(false);
  const [timeUntilStart, setTimeUntilStart] = useState(null);

  const fetchEventDetails = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/events/current`);
      if (res.ok) {
        const event = await res.json();
        setEventData(event);
      }
    } catch (err) {
      console.error('Failed to fetch event details', err);
    }
  }, []);

  useEffect(() => {
    fetchEventDetails();
    // Poll for status changes (freeze/unfreeze)
    const pollInterval = setInterval(fetchEventDetails, 10000);
    return () => clearInterval(pollInterval);
  }, [fetchEventDetails]);

  useEffect(() => {
    if (!eventData || eventData.is_frozen) {
      setTimeLeft(null);
      return;
    }

    const timer = setInterval(() => {
      const now = Date.now();
      let startObj = new Date(eventData.created_at);

      // If there's a specific start time, construct the exact start Date
      if (eventData.start_time) {
        // Assume start_time is "HH:mm" on the same day as eventData.date
        const eventDateStr = eventData.date; // e.g. "2026-03-14"
        startObj = new Date(`${eventDateStr}T${eventData.start_time}:00`);
      }

      const startTimeMs = startObj.getTime();

      // Check if event hasn't started yet
      if (now < startTimeMs) {
        setIsNotStarted(true);
        setTimeUntilStart(startTimeMs - now);
        setTimeLeft(null);
        return;
      }

      // Event has started
      setIsNotStarted(false);
      setTimeUntilStart(null);

      const totalDuration = (eventData.expiry_duration || 0) * 60 * 1000;

      // Hard 24h limit (e.g. 24h after start)
      if (now - startTimeMs > 24 * 60 * 60 * 1000) {
        setIsHardExpired(true);
        clearInterval(timer);
        return;
      }

      if (totalDuration === 0) {
        setTimeLeft(null);
        return;
      }

      const timeElapsed = now - startTimeMs;
      const frozenOffset = (eventData.total_frozen_ms || 0);
      const activeElapsed = timeElapsed - frozenOffset;
      const remaining = totalDuration - activeElapsed;

      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [eventData]);

  const formatTime = (ms) => {
    if (ms === null || ms < 0) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const field = useCallback((name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'name') {
      setSmartSuggestion(null); // Clear smart suggestion if name is being typed
    }
    // Only clear errors inline (don't add new ones) until user has tried to submit
    if (submitted && errors[name]) {
      const e = validate({ ...form, [name]: value }, type);
      setErrors(prev => ({ ...prev, [name]: e[name] || '' }));
    }
  }, [form, errors, submitted, type]);

  // --- Smart/Fuzzy Lookup on Name ---
  const lastLookupRef = useRef('');
  useEffect(() => {
    const name = form.name || '';
    if (name.length < 4 || prefilledFrom || type === 'worker' || name === lastLookupRef.current) return;

    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/lookup/smart?name=${encodeURIComponent(name)}`);
        if (resp.ok) {
          const matches = await resp.json();
          if (matches.length > 0) {
            setSmartSuggestion(matches[0].profile);
          } else {
            setSmartSuggestion(null);
          }
        }
      } catch (err) {
        console.warn('Smart lookup failed', err);
      }
      lastLookupRef.current = name;
    }, 800);

    return () => clearTimeout(timer);
  }, [form.name, prefilledFrom, type]);

  async function handleApplySmartSuggestion() {
    if (!smartSuggestion) return;
    setForm(s => ({ ...s, ...smartSuggestion, type: s.type, firstTimer: false }));
    setPrefilledFrom('smart lookup');
    setSmartSuggestion(null);
    setErrors({});
    setToast({ message: 'Welcome back! We found your profile.', type: 'info' });
  }

  // --- Prefill on phone blur ---
  async function handlePhoneBlur() {
    if (!form.phone || form.phone.length < 5 || prefilledFrom === 'remote' || prefilledFrom === 'smart lookup') return;
    setLookingUp(true);
    try {
      // Check if already checked in today for this event
      const found = await lookupAttendance({ phone: form.phone, eventId });
      const today = new Date().toISOString().split('T')[0];
      const alreadyMarked = Array.isArray(found) && found.find(r => r.eventId === eventId);
      if (alreadyMarked) {
        setToast({ message: 'You have already marked attendance for this event!', type: 'info' });
        return;
      }

      // Try to prefill from any past record
      const global = await lookupAttendance({ phone: form.phone });
      if (Array.isArray(global) && global.length > 0) {
        const user = global[0];
        const lastVisit = new Date(user.createdAt).toLocaleDateString();
        const isWorker = user.type === 'worker';
        const welcomeMsg = isWorker 
          ? `Welcome back, ${user.name}! Ready for service today? ⚡`
          : `Great to see you again, ${user.name}! (Last visit: ${lastVisit})`;

        setToast({
          message: (
            <div className="one-tap-checkin">
              <span style={{ display: 'block', marginBottom: '8px' }}>
                {welcomeMsg}
              </span>
              <button
                onClick={() => handleOneTapSubmit(user)}
                className="btn-station primary"
                style={{ width: '100%', padding: '10px', fontSize: '14px' }}
                disabled={loading}
              >
                {loading ? 'Checking in...' : 'One-Tap Check-In'}
              </button>
              <button
                onClick={() => {
                  setForm(s => ({ ...s, ...user, type: s.type, firstTimer: false }));
                  setPrefilledFrom('manual');
                  setToast(null);
                }}
                style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', fontSize: '12px', marginTop: '8px', cursor: 'pointer', width: '100%' }}
              >
                Not you? or edit details
              </button>
            </div>
          ),
          type: 'info'
        });
      }
    } catch {
      // silent fail
    } finally {
      setLookingUp(false);
    }
  }

  async function handleOneTapSubmit(userData) {
    setLoading(true);
    try {
      const payload = {
        ...userData,
        eventId,
        createdAt: new Date().toISOString(),
        firstTimer: false // Definitely not a first timer if we found them
      };

      // Save locally and queue
      saveUser(userData.phone, payload);
      queueAdd(eventId, payload);

      await tryFlushQueue();

      navigate('/thank-you', {
        state: { name: userData.name }
      });
    } catch (err) {
      console.error('One-tap failed', err);
      const msg = err.message?.includes('409') 
        ? 'You have already marked attendance for this event!'
        : 'Quick check-in failed. Please use the form.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // --- Prefill on email blur ---
  async function handleEmailBlur() {
    if (!form.email || prefilledFrom === 'phone' || prefilledFrom === 'smart lookup') return;
    setLookingUp(true);
    try {
      const found = await lookupAttendance({ email: form.email, eventId });
      if (Array.isArray(found) && found.length > 0) {
        setForm(s => ({ ...s, ...found[0], type: s.type, firstTimer: !!found[0].firstTimer }));
        saveUser(found[0].phone, found[0]);
        setPrefilledFrom('email lookup');
        setErrors({});
        setToast({ message: 'Form auto-filled from your previous record.', type: 'info' });
      }
    } catch {
      // silent fail
    } finally {
      setLookingUp(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);

    const errs = validate(form, type);
    setErrors(errs);
    if (Object.keys(errs).length > 0 || loading) return;

    setLoading(true);
    try {
      // Final duplicate check
      const existing = await lookupAttendance({ phone: form.phone, eventId });
      if (Array.isArray(existing) && existing.some(r => r.eventId === eventId)) {
        setToast({ message: 'You have already registered for this event!', type: 'info' });
        setLoading(false);
        return;
      }

      const payload = { ...form, eventId: effectiveEventId, createdAt: new Date().toISOString() };
      saveUser(form.phone, payload);
      queueAdd(effectiveEventId, payload);

      const results = await tryFlushQueue();
      const lastResult = results && results.length > 0 ? results[results.length - 1] : null;

      navigate('/thank-you', {
        state: { 
          name: form.name, 
          uniqueCode: lastResult?.appended?.uniqueCode,
          streak: lastResult?.streak || 0
        }
      });
    } catch (err) {
      if (err.status === 409 || err.message?.includes('409') || err.message?.includes('already marked')) {
        setToast({ message: 'You have already marked attendance for this event!', type: 'info' });
        setLoading(false);
        return;
      }
      navigate('/thank-you', { state: { name: form.name } });
    } finally {
      setLoading(false);
    }
  }

  const isFirstTimerType = type === 'member'; // Members could be first-timers; workers usually not

  const showMaintenance = !isAdmin && eventData?.is_frozen === 1;
  const showExpired = !isAdmin && ((timeLeft !== null && timeLeft <= 0) || isHardExpired);
  const showNotStarted = !isAdmin && isNotStarted;

  return (
    <div className="attendance-form-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showMaintenance && (
        <div className="maintenance-overlay">
          <div className="overlay-content">
            <div className="overlay-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
            </div>
            <h2>Currently experiencing maintenance</h2>
            <p>The check-in window is temporarily frozen by the administrator. Please wait; it will resume shortly.</p>
          </div>
        </div>
      )}

      {showExpired && (
        <div className="expiry-overlay">
          <div className="overlay-content">
            <div className="overlay-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <h2>Check-in Closed</h2>
            <p>{isHardExpired ? 'This event ended more than 24 hours ago.' : 'The attendance window for this event has expired.'}</p>
          </div>
        </div>
      )}

      {showNotStarted && (
        <div className="expiry-overlay not-started-overlay">
          <div className="overlay-content">
            <div className="overlay-icon" style={{ color: 'var(--primary)' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
            <h2>Check-in Not Yet Open</h2>
            <p>This event's attendance window will open soon.</p>
            {timeUntilStart !== null && (
              <div className="timer-pill" style={{ marginTop: '16px', fontSize: '16px', padding: '8px 16px' }}>
                Opens in {formatTime(timeUntilStart)}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="attendance-form">
        {/* Header */}
        <div className="form-header">
          <img
            src="/W2C.jpg"
            alt="Welcome to Church"
            style={{ width: '100%', borderRadius: '12px', marginBottom: '20px', objectFit: 'cover', height: '160px' }}
          />
          <h1>
            {eventData ? eventData.name : (type === 'worker' ? 'Worker Check-In' : 'Mark Attendance')}
          </h1>
          <p>
            {eventData
              ? `Check-in for ${new Date(eventData.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}`
              : (type === 'worker'
                ? 'Sign in to register your service for today.'
                : 'Fill in your details to confirm your attendance.')}
          </p>

          {/* Timer Pill */}
          {timeLeft !== null && (
            <div className={`timer-pill ${timeLeft < 300000 ? 'danger' : timeLeft < 900000 ? 'warning' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              Closes in {formatTime(timeLeft)}
            </div>
          )}

          {/* Station Badge */}
          <span className={`form-station-badge ${type}`}>
            {isAdmin ? '🛠️ Admin Manual Entry' : (type === 'worker' ? '⚡ Worker Station' : '✦ Member Station')}
          </span>

          {isAdmin && allEvents.length > 0 && (
            <div className="form-field" style={{ marginTop: '20px', textAlign: 'left' }}>
              <label>Select Target Event</label>
              <select 
                className="form-input select" 
                value={selectedEventId === 'admin-manual' ? (allEvents[0]?.id || '') : selectedEventId}
                onChange={e => setSelectedEventId(e.target.value)}
              >
                {allEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name} ({new Date(ev.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
              <p className="helper" style={{ fontSize: '11px', marginTop: '4px' }}>
                Admin bypass: Expiry and Freeze rules are ignored for manual entry.
              </p>
            </div>
          )}
        </div>

        {/* Prefill Notice */}
        {prefilledFrom && (
          <div className="prefill-notice">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            Form auto-filled from your {prefilledFrom}
          </div>
        )}

        {/* Lookup Spinner */}
        {lookingUp && (
          <div className="lookup-spinner">
            <span className="spinner-dot" /> Looking up your record...
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="form-field">
            <label>Full Name <span className="req">*</span></label>
            <input
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="e.g. George Ozoemena"
              value={form.name}
              autoComplete="name"
              onChange={e => field('name', e.target.value)}
              onBlur={() => submitted && setErrors(prev => ({ ...prev, name: validate(form).name || '' }))}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
            
            {smartSuggestion && !prefilledFrom && (
              <div className="smart-suggestion animate-fade-in" style={{ 
                marginTop: '8px', 
                padding: '12px', 
                background: 'var(--dc-blue-lt)', 
                border: '1px solid var(--dc-blue-border)', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                  Are you <strong>{smartSuggestion.name}</strong>?
                </div>
                <button 
                  type="button"
                  onClick={handleApplySmartSuggestion}
                  style={{ 
                    background: 'var(--dc-blue)', 
                    color: '#fff', 
                    border: 'none', 
                    padding: '4px 10px', 
                    borderRadius: '4px', 
                    fontSize: '11px',
                    fontWeight: '600'
                  }}
                >
                  Yes, pre-fill form
                </button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="form-field">
            <label>Email Address <span className="req">*</span></label>
            <div className="input-with-icon">
              <input
                className={`form-input ${errors.email ? 'error' : ''}`}
                type="email"
                placeholder="example@email.com"
                value={form.email}
                autoComplete="email"
                onChange={e => field('email', e.target.value)}
                onBlur={handleEmailBlur}
              />
              {lookingUp && <span className="input-spinner" />}
            </div>
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div className="form-field">
            <label>Phone Number <span className="req">*</span></label>
            <div className="input-with-icon">
              <input
                className={`form-input ${errors.phone ? 'error' : ''}`}
                type="tel"
                placeholder="e.g. 08012345678"
                value={form.phone}
                autoComplete="tel"
                onChange={e => { field('phone', e.target.value); if (toast) setToast(null); }}
                onBlur={handlePhoneBlur}
              />
              {lookingUp && <span className="input-spinner" />}
            </div>
            {errors.phone && <p className="field-error">{errors.phone}</p>}
          </div>

          {/* Member-specific fields: Address & Occupation */}
          {type === 'member' && (
            <>
              <div className="form-field">
                <label>Home Address <span className="req">*</span></label>
                <input
                  className={`form-input ${errors.address ? 'error' : ''}`}
                  placeholder="e.g. 13 Awka Road, Onitsha"
                  value={form.address}
                  autoComplete="street-address"
                  onChange={e => field('address', e.target.value)}
                />
                {errors.address && <p className="field-error">{errors.address}</p>}
              </div>

              <div className="form-field">
                <label>Birthday <span className="req">*</span></label>
                <input
                  className={`form-input ${errors.birthday ? 'error' : ''}`}
                  type="date"
                  value={form.birthday}
                  onChange={e => field('birthday', e.target.value)}
                />
                {errors.birthday && <p className="field-error">{errors.birthday}</p>}
              </div>

              <div className="form-field">
                <label>Occupation <span className="req">*</span></label>
                <input
                  className={`form-input ${errors.occupation ? 'error' : ''}`}
                  placeholder="e.g. Student, Engineer, Nurse"
                  value={form.occupation}
                  onChange={e => field('occupation', e.target.value)}
                />
                {errors.occupation && <p className="field-error">{errors.occupation}</p>}
              </div>
            </>
          )}

          {/* Member-specific fields: Gender & Nationality */}
          {type === 'member' && (
            <div className="form-row">
              <div className="form-field">
                <label>Gender <span className="req">*</span></label>
                <select
                  className={`form-input select ${errors.gender ? 'error' : ''}`}
                  value={form.gender}
                  onChange={e => field('gender', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && <p className="field-error">{errors.gender}</p>}
              </div>

              <div className="form-field">
                <label>Nationality <span className="req">*</span></label>
                <input
                  className={`form-input ${errors.nationality ? 'error' : ''}`}
                  placeholder="e.g. Nigerian"
                  value={form.nationality}
                  onChange={e => field('nationality', e.target.value)}
                />
                {errors.nationality && <p className="field-error">{errors.nationality}</p>}
              </div>
            </div>
          )}

          {/* First Timer — only shown for Member station */}
          {isFirstTimerType && (
            <div className="form-field">
              <label>Is this your first time?</label>
              <div className="first-timer-btns">
                <button
                  type="button"
                  className={`ft-btn ${!form.firstTimer ? 'active' : ''}`}
                  onClick={() => field('firstTimer', false)}
                >
                  No, I've been here before
                </button>
                <button
                  type="button"
                  className={`ft-btn highlight ${form.firstTimer ? 'active' : ''}`}
                  onClick={() => field('firstTimer', true)}
                >
                  Yes, first time! 🎉
                </button>
              </div>
            </div>
          )}

          {/* Department — only shown for Worker entries */}
          {type === 'worker' && (
            <div className="form-field">
              <label>
                Department / Unit <span className="req">*</span>
              </label>
              <input
                className={`form-input ${errors.department ? 'error' : ''}`}
                placeholder="e.g. Media, Choir, Ushering"
                value={form.department}
                onChange={e => field('department', e.target.value)}
              />
              {errors.department && <p className="field-error">{errors.department}</p>}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={`af-submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <><span className="btn-spinner" /> Processing...</>
            ) : (
              type === 'worker' ? 'Sign In for Service' : 'Submit Attendance'
            )}
          </button>
        </form>

        <div className="form-footer">
          <small>🔒 Your information is kept private and used only for church records.</small>
        </div>
      </div>
    </div>
  );
}
