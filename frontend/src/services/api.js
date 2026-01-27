export async function postAttendance(payload) {
  const res = await fetch('/api/attendance', {
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
  const res = await fetch(`/api/attendance?${params.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data;
}