import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FieldInput from './FieldInput.jsx';
import SubmitButton from './SubmitButton.jsx';
import { getLatest, saveLatest, queueAdd, tryFlushQueue, saveUser } from '../../services/localCache.js';
import { lookupAttendance } from '../../services/api.js';
import Toast from '../UI/Toast.jsx';

const requiredFields = ['name', 'email', 'phone', 'address', 'occupation', 'firstTimer', 'gender', 'nationality'];

export default function AttendanceForm({ eventId }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Removed initialPhone from URL to ensure a plain form for new registrations.

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    firstTimer: false,
    gender: '',
    nationality: '',
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [prefilledFrom, setPrefilledFrom] = useState(null);
  const [toast, setToast] = useState(null); // { message, type }
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // PREVIOUS LOGIC: load from local storage
    // The user requested a plain form for the register tab, 
    // so we disable automatic prefilling from previous local sessions 
    // to avoid mixing data when multiple people use the same device.

    /* 
    const cached = getLatest(eventId);
    if (cached) {
      setForm((s) => ({ ...s, ...cached }));
      setPrefilledFrom('local');
    } else {
      setPrefilledFrom(null);
    }
    */
    setPrefilledFrom(null);
  }, [eventId]);

  const isValid = () => {
    for (const k of requiredFields) {
      const v = form[k];
      if (v === '' || v === null || v === undefined) return false;
    }
    if (!/\S+@\S+\.\S/.test(form.email)) return false;
    if (String(form.phone).length < 7) return false;
    return true;
  };

  // Duplicate Flagging Logic
  async function handlePhoneBlur() {
    if (!form.phone || form.phone.length < 5) return;

    // Don't flag if it's the same as what we prefilled (welcome back scenario)
    if (prefilledFrom === 'remote') return;

    try {
      // NOTE: We pass eventId to check for duplicates in THIS event.
      const found = await lookupAttendance({ phone: form.phone, eventId });

      const today = new Date().toISOString().split('T')[0];
      const alreadyMarked = found && found.find(r =>
        String(r.createdAt || r.timestamp).startsWith(today)
      );

      if (alreadyMarked) {
        setToast({
          message: `You have already marked attendance for this event today!`,
          type: 'info'
        });
        return;
      }

      // If not marked today, check if the phone belongs to someone else (Global check)
      const globalFound = await lookupAttendance({ phone: form.phone });
      if (globalFound && globalFound.length > 0) {
        const user = globalFound[0];
        setToast({
          message: (
            <span>
              This number is registered to <strong>{user.name}</strong>.{' '}
              <button
                onClick={() => {
                  setForm(s => ({ ...s, ...user }));
                  saveUser(user.phone, user);
                  setPrefilledFrom('remote');
                  setToast(null);
                }}
                style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', padding: 0 }}
              >
                Click to prefill
              </button>
            </span>
          ),
          type: 'error'
        });
      }
    } catch (err) {
      console.warn('Phone lookup failed', err);
    }
  }

  async function handleEmailBlur() {
    if (!form.email || prefilledFrom === 'local') return;
    setLoading(true);
    try {
      const found = await lookupAttendance({ email: form.email, eventId });
      // If we find by Email, we auto-fill (Welcome Back feature)
      if (found && found.length) {
        setForm((s) => ({ ...s, ...found[0] }));
        saveUser(found[0].phone, found[0]);
        setPrefilledFrom('remote');
        setNotice('Form autoprefilled from previous attendance record.');
        setTimeout(() => setNotice(''), 4000);
      }
    } catch (err) {
      console.warn('lookup failed', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid() || loading) return;

    setLoading(true);

    try {
      // 1. Final Duplicate Check before sync
      const existing = await lookupAttendance({ phone: form.phone, eventId });
      const today = new Date().toISOString().split('T')[0];
      if (existing && existing.find(r => String(r.createdAt || r.timestamp).startsWith(today))) {
        setToast({ message: "You have already registered for this event today!", type: "info" });
        setLoading(false);
        return;
      }

      // 2. Clear to proceed
      const payload = { ...form, eventId, createdAt: new Date().toISOString() };
      saveUser(form.phone, payload);
      queueAdd(eventId, payload);

      const results = await tryFlushQueue();
      // If successful, results is an array of responses. The last one matches this payload.
      const lastResult = results && results.length > 0 ? results[results.length - 1] : null;

      const state = {
        name: form.name,
        uniqueCode: lastResult?.appended?.uniqueCode
      };

      navigate('/thank-you', { state });
    } catch (err) {
      console.warn('Sync failed, queued for retry', err);
      // Offline fallback
      navigate('/thank-you', { state: { name: form.name } });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="attendance-form-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="form-header">
        <h1>Mark Attendance</h1>
        <p>Please fill in your details to mark attendance</p>
      </div>

      <div className="attendance-form">
        {prefilledFrom && <div style={{ marginBottom: 10 }}><span className="badge">Prefilled: {prefilledFrom}</span></div>}
        {notice && <div className="error-text" style={{ marginBottom: 12 }}>{notice}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Name <span className="required">*</span></label>
            <FieldInput placeholder="George Ozoemena" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          </div>

          <div className="form-group">
            <label>Email <span className="required">*</span></label>
            <FieldInput placeholder="example@email.com" value={form.email} onChange={(v) => setForm({ ...form, email: v })} onBlur={handleEmailBlur} />
          </div>

          <div className="form-group">
            <FieldInput
              label="Phone Number"
              type="tel"
              value={form.phone}
              onChange={(v) => {
                setForm({ ...form, phone: v });
                // No need to clear toast on change immediately, or maybe we should?
                // Let's keep it until it auto-hides or they close it, or we can clear it.
                if (toast) setToast(null);
              }}
              onBlur={handlePhoneBlur}
              placeholder="08012345678"
              required
            />
            {/* Inline warning removed */}
          </div>

          <div className="form-group">
            <label>Address <span className="required">*</span></label>
            <FieldInput placeholder="No 13 Awka road" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
          </div>

          <div className="form-group">
            <label>Occupation <span className="required">*</span></label>
            <FieldInput placeholder="Student" value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })} />
          </div>

          <div className="form-group">
            <label>First Timer? <span className="required">*</span></label>
            <select className="select" value={String(form.firstTimer)} onChange={(e) => setForm({ ...form, firstTimer: e.target.value === 'true' })}>
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

          <div className="form-group" style={{ color: "#000" }}>
            <label>Gender <span className="required">*</span></label>
            <select className="select" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nationality <span className="required">*</span></label>
            <FieldInput placeholder="Nigerian" value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} />
          </div>

          <div className="form-group">
            <label>Department in Church (optional)</label>
            <FieldInput placeholder="Media" value={form.department} onChange={(v) => setForm({ ...form, department: v })} />
          </div>

          <div style={{ marginTop: 6 }}>
            <SubmitButton disabled={!isValid() || loading} loading={loading} label="Submit Attendance" />
          </div>
        </form>

        <div className="form-footer">
          <small className="helper">We respect your privacy. Your information will be used only for church records.</small>
        </div>
      </div>
    </div>
  );
}