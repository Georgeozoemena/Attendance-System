export const API_BASE = import.meta.env.VITE_API_URL || '';

export function getAuthHeaders() {
  const token = localStorage.getItem('adminToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Wrapper that handles 401 globally
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401) {
    // Clear auth and redirect to login
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin/login';
    throw new Error('Session expired');
  }
  return res;
}

export async function postAttendance(payload) {
  const res = await fetch(`${API_BASE}/api/attendance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Failed to post attendance');
  }
  return res.json();
}

export async function lookupAttendance({ email, phone, eventId }) {
  const params = new URLSearchParams();
  if (email) params.set('email', email);
  if (phone) params.set('phone', phone);
  if (eventId) params.set('eventId', eventId);
  const res = await fetch(`${API_BASE}/api/lookup?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
