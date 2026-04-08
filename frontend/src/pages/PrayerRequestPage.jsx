import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '../services/api';

const CATEGORIES = [
  { value: 'healing', label: '🙏 Healing' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'finances', label: '💰 Finances' },
  { value: 'guidance', label: '🧭 Guidance' },
  { value: 'salvation', label: '✝️ Salvation' },
  { value: 'thanksgiving', label: '🙌 Thanksgiving' },
  { value: 'general', label: '⭐ General' },
];

export default function PrayerRequestPage() {
  const [searchParams] = useSearchParams();
  const eventRef = searchParams.get('ref') || null;
  const [form, setForm] = useState({ name: '', phone: '', category: 'general', request: '' });
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const errs = {};
    if (!anonymous && (!form.name || form.name.trim().length < 2)) errs.name = 'Please enter your name or submit anonymously';
    if (!form.request || form.request.trim().length < 10) errs.request = 'Please describe your request (min 10 characters)';
    if (form.request.trim().length > 1000) errs.request = 'Please keep it under 1000 characters';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/prayer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, anonymous, eventRef })
      });
      if (res.ok) { setSubmitted(true); }
      else { const d = await res.json(); setErrors({ submit: d.error || 'Submission failed.' }); }
    } catch { setErrors({ submit: 'Could not connect. Please try again.' }); }
    finally { setLoading(false); }
  }

  if (submitted) return (
    <div className="attendance-form-container">
      <div className="attendance-form" style={{ textAlign: 'center', padding: '48px 36px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🙏</div>
        <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Request Received</h1>
        <p style={{ color: 'var(--text-3)', lineHeight: '1.6' }}>
          Your prayer request has been submitted. Our pastoral team will pray over it.
        </p>
      </div>
    </div>
  );

  return (
    <div className="attendance-form-container">
      <div className="attendance-form">
        <div className="form-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src="/W2C.jpg" alt="Dominion City" style={{ width: '100%', borderRadius: '12px', marginBottom: '20px', objectFit: 'cover', height: '160px' }} />
          <h1>Prayer Request</h1>
          <p>Share your prayer need. Our team will pray with you.</p>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}>
              <div onClick={() => { setAnonymous(a => !a); setErrors(e => ({ ...e, name: '' })); }}
                style={{ width: '40px', height: '22px', borderRadius: '11px', flexShrink: 0, background: anonymous ? 'var(--dc-blue)' : 'var(--surface-3)', border: '1px solid var(--border-2)', position: 'relative', transition: 'background 0.2s', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', top: '3px', left: anonymous ? '20px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>Submit anonymously</span>
            </label>
          </div>
          {!anonymous && (
            <div className="form-field">
              <label>Your Name <span className="req">*</span></label>
              <input className={`form-input ${errors.name ? 'error' : ''}`} placeholder="e.g. George Ozoemena" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}
          <div className="form-field">
            <label>Phone <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '11px' }}>(optional)</span></label>
            <input className="form-input" type="tel" placeholder="e.g. 08012345678" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
          <div className="form-field">
            <label>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.value} type="button" className={`ft-btn ${form.category === cat.value ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))} style={{ fontSize: '11px', padding: '8px 4px' }}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Prayer Request <span className="req">*</span></label>
            <textarea className={`form-input ${errors.request ? 'error' : ''}`} placeholder="Share your prayer need..." value={form.request}
              onChange={e => setForm(f => ({ ...f, request: e.target.value }))} rows={5} style={{ resize: 'vertical', minHeight: '100px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {errors.request ? <span className="error-text">{errors.request}</span> : <span />}
              <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{form.request.length}/1000</span>
            </div>
          </div>
          {errors.submit && <div className="login-error" style={{ marginBottom: '16px' }}>{errors.submit}</div>}
          <button type="submit" className="af-submit-btn" disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Submitting...</> : 'Submit Prayer Request'}
          </button>
        </form>
        <div className="form-footer"><small>🔒 Your request is kept confidential.</small></div>
      </div>
    </div>
  );
}
