import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from '../services/api';

const CATEGORIES = [
  { value: 'healing', label: '🙏 Healing' },
  { value: 'provision', label: '💰 Provision' },
  { value: 'breakthrough', label: '🔥 Breakthrough' },
  { value: 'salvation', label: '✝️ Salvation' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'general', label: '⭐ General' },
];

export default function TestimonyPage() {
  const [searchParams] = useSearchParams();
  const eventRef = searchParams.get('ref') || null;

  const [form, setForm] = useState({ name: '', phone: '', category: 'general', content: '' });
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const errs = {};
    if (!anonymous && (!form.name || form.name.trim().length < 2)) {
      errs.name = 'Please enter your name, or submit anonymously';
    }
    if (!form.content || form.content.trim().length < 20) {
      errs.content = 'Please share at least a few sentences (min 20 characters)';
    }
    if (form.content.trim().length > 2000) {
      errs.content = 'Please keep it under 2000 characters';
    }
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/testimonies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, anonymous, eventRef })
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setErrors({ submit: data.error || 'Submission failed. Please try again.' });
      }
    } catch {
      setErrors({ submit: 'Could not connect. Please check your connection and try again.' });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="attendance-form-container">
        <div className="attendance-form" style={{ textAlign: 'center', padding: '48px 36px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🙌</div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px' }}>Thank you!</h1>
          <p style={{ color: 'var(--text-3)', lineHeight: '1.6' }}>
            Your testimony has been received. It will be reviewed and shared to encourage others.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendance-form-container">
      <div className="attendance-form">
        <div className="form-header" style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img
            src="/W2C.jpg"
            alt="Dominion City"
            style={{ width: '100%', borderRadius: '12px', marginBottom: '20px', objectFit: 'cover', height: '160px' }}
          />
          <h1>Share Your Testimony</h1>
          <p>What has God done for you? Your story encourages others.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>

          {/* Anonymous toggle */}
          <div className="form-field">
            <label
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div
                onClick={() => { setAnonymous(a => !a); setErrors(e => ({ ...e, name: '' })); }}
                style={{
                  width: '40px', height: '22px', borderRadius: '11px', flexShrink: 0,
                  background: anonymous ? 'var(--dc-blue)' : 'var(--surface-3)',
                  border: '1px solid var(--border-2)',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer'
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: anonymous ? '20px' : '3px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s'
                }} />
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                Submit anonymously
              </span>
            </label>
          </div>

          {/* Name — hidden when anonymous */}
          {!anonymous && (
            <div className="form-field">
              <label>Your Name <span className="req">*</span></label>
              <input
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="e.g. George Ozoemena"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
          )}

          <div className="form-field">
            <label>Phone Number <span style={{ fontWeight: 400, color: 'var(--text-3)', fontSize: '11px' }}>(optional)</span></label>
            <input
              className="form-input"
              type="tel"
              placeholder="e.g. 08012345678"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>

          <div className="form-field">
            <label>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '4px' }}>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  className={`ft-btn ${form.category === cat.value ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  style={{ fontSize: '12px', padding: '8px 4px' }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label>Your Testimony <span className="req">*</span></label>
            <textarea
              className={`form-input ${errors.content ? 'error' : ''}`}
              placeholder="Share what God has done for you..."
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={6}
              style={{ resize: 'vertical', minHeight: '120px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              {errors.content ? <span className="error-text">{errors.content}</span> : <span />}
              <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{form.content.length}/2000</span>
            </div>
          </div>

          {errors.submit && (
            <div className="login-error" style={{ marginBottom: '16px' }}>{errors.submit}</div>
          )}

          <button type="submit" className="af-submit-btn" disabled={loading}>
            {loading ? <><span className="btn-spinner" /> Submitting...</> : 'Submit Testimony'}
          </button>
        </form>

        <div className="form-footer">
          <small>🔒 Your testimony is reviewed before being shared.</small>
        </div>
      </div>
    </div>
  );
}
