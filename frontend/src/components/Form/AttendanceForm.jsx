import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { queueAdd, tryFlushQueue, saveUser } from '../../services/localCache.js';
import { lookupAttendance } from '../../services/api.js';
import Toast from '../UI/Toast.jsx';

const REQUIRED_FIELDS = ['name', 'email', 'phone', 'address', 'occupation', 'gender', 'nationality'];

function validate(form) {
  const errs = {};
  if (!form.name || form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
  if (!/\S+@\S+\.\S/.test(form.email)) errs.email = 'Please enter a valid email address';
  if (!form.phone || String(form.phone).length < 7) errs.phone = 'Please enter a valid phone number';
  if (!form.address || form.address.trim().length < 3) errs.address = 'Please enter your address';
  if (!form.occupation || form.occupation.trim().length < 2) errs.occupation = 'Please enter your occupation';
  if (!form.gender) errs.gender = 'Please select your gender';
  if (!form.nationality || form.nationality.trim().length < 2) errs.nationality = 'Please enter your nationality';
  return errs;
}

export default function AttendanceForm({ eventId, type }) {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    firstTimer: false,
    gender: '',
    nationality: '',
    department: '',
    type: type || 'member'
  });

  // Sync type prop changes (e.g. when switching Member/Worker station)
  useEffect(() => {
    setForm(f => ({ ...f, type: type || 'member' }));
  }, [type]);

  // Reset prefill state when event changes
  useEffect(() => {
    setPrefilledFrom(null);
  }, [eventId]);

  const [loading, setLoading] = useState(false);
  const [lookingUp, setLookingUp] = useState(false); // separate state for prefill spinner
  const [prefilledFrom, setPrefilledFrom] = useState(null);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false); // only show errors after first submit attempt

  const field = useCallback((name, value) => {
    setForm(f => ({ ...f, [name]: value }));
    // Only clear errors inline (don't add new ones) until user has tried to submit
    if (submitted && errors[name]) {
      const e = validate({ ...form, [name]: value });
      setErrors(prev => ({ ...prev, [name]: e[name] || '' }));
    }
  }, [form, errors, submitted]);

  // --- Prefill on phone blur ---
  async function handlePhoneBlur() {
    if (!form.phone || form.phone.length < 5 || prefilledFrom === 'remote') return;
    setLookingUp(true);
    try {
      // Check if already checked in today for this event
      const found = await lookupAttendance({ phone: form.phone, eventId });
      const today = new Date().toISOString().split('T')[0];
      const alreadyMarked = Array.isArray(found) && found.find(r =>
        String(r.createdAt || r.timestamp).startsWith(today)
      );
      if (alreadyMarked) {
        setToast({ message: 'You have already marked attendance for this event today!', type: 'info' });
        return;
      }

      // Try to prefill from any past record
      const global = await lookupAttendance({ phone: form.phone });
      if (Array.isArray(global) && global.length > 0) {
        const user = global[0];
        setToast({
          message: (
            <span>
              Number registered to <strong>{user.name}</strong>.{' '}
              <button
                onClick={() => {
                  setForm(s => ({ ...s, ...user, type: s.type, firstTimer: !!user.firstTimer }));
                  saveUser(user.phone, user);
                  setPrefilledFrom('previous record');
                  setToast(null);
                  setErrors({});
                }}
                style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', padding: '0 4px', cursor: 'pointer' }}
              >
                Tap to auto-fill
              </button>
            </span>
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

  // --- Prefill on email blur ---
  async function handleEmailBlur() {
    if (!form.email || prefilledFrom) return;
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

    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0 || loading) return;

    setLoading(true);
    try {
      // Final duplicate check
      const existing = await lookupAttendance({ phone: form.phone, eventId });
      const today = new Date().toISOString().split('T')[0];
      if (Array.isArray(existing) && existing.find(r => String(r.createdAt || r.timestamp).startsWith(today))) {
        setToast({ message: 'You have already registered for this event today!', type: 'info' });
        setLoading(false);
        return;
      }

      const payload = { ...form, eventId, createdAt: new Date().toISOString() };
      saveUser(form.phone, payload);
      queueAdd(eventId, payload);

      const results = await tryFlushQueue();
      const lastResult = results && results.length > 0 ? results[results.length - 1] : null;

      navigate('/thank-you', {
        state: { name: form.name, uniqueCode: lastResult?.appended?.uniqueCode }
      });
    } catch {
      navigate('/thank-you', { state: { name: form.name } });
    } finally {
      setLoading(false);
    }
  }

  const isFirstTimerType = type === 'member'; // Members could be first-timers; workers usually not

  return (
    <div className="attendance-form-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="attendance-form">
        {/* Header */}
        <div className="form-header">
          <img
            src="/W2C.jpg"
            alt="Welcome to Church"
            style={{ width: '100%', borderRadius: '12px', marginBottom: '20px', objectFit: 'cover', height: '160px' }}
          />
          <h1>
            {type === 'worker' ? 'Worker Check-In' : 'Mark Attendance'}
          </h1>
          <p>
            {type === 'worker'
              ? 'Sign in to register your service for today.'
              : 'Fill in your details to confirm your attendance.'}
          </p>

          {/* Station Badge */}
          <span className={`form-station-badge ${type}`}>
            {type === 'worker' ? '⚡ Worker Station' : '✦ Member Station'}
          </span>
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
            {errors.name && <p className="field-error">{errors.name}</p>}
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

          {/* Address */}
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

          {/* Occupation */}
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

          {/* Two-column row: Gender + Nationality */}
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

          {/* Department (optional) */}
          <div className="form-field">
            <label>
              Department / Unit <span className="optional">(optional)</span>
            </label>
            <input
              className="form-input"
              placeholder="e.g. Media, Choir, Ushering"
              value={form.department}
              onChange={e => field('department', e.target.value)}
            />
          </div>

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
