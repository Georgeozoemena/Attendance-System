import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FieldInput from './FieldInput.jsx';
import SubmitButton from './SubmitButton.jsx';
import { getLatest, saveLatest, queueAdd, tryFlushQueue } from '../../services/localCache.js';
import { lookupAttendance } from '../../services/api.js';

const requiredFields = ['name', 'email', 'phone', 'address', 'occupation', 'firstTimer', 'gender', 'nationality'];

export default function AttendanceForm({ eventId }) {
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
    department: ''
  });
  const [loading, setLoading] = useState(false);
  const [prefilledFrom, setPrefilledFrom] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const cached = getLatest(eventId);
    if (cached) {
      setForm((s) => ({ ...s, ...cached }));
      setPrefilledFrom('local');
    } else {
      setPrefilledFrom(null);
    }
  }, [eventId]);

  const isValid = () => {
    for (const k of requiredFields) {
      const v = form[k];
      if (v === '' || v === null || v === undefined) return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) return false;
    if (String(form.phone).length < 7) return false;
    return true;
  };

  async function handleEmailBlur() {
    if (!form.email || prefilledFrom === 'local') return;
    setLoading(true);
    try {
      const found = await lookupAttendance({ email: form.email, eventId });
      if (found && found.length) {
        setForm((s) => ({ ...s, ...found[0] }));
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
    if (!isValid()) return;
    const payload = { ...form, eventId, createdAt: new Date().toISOString() };

    saveLatest(eventId, payload);
    queueAdd(eventId, payload);

    try {
      setLoading(true);
      await tryFlushQueue();
      navigate('/thank-you');
    } catch (err) {
      console.warn('Sync failed, queued for retry', err);
      navigate('/thank-you');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="attendance-form-container">
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
            <label>Phone <span className="required">*</span></label>
            <FieldInput placeholder="+234 (701) 546 490" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
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