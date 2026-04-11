import { postAttendance } from './api.js';

function queueKey(eventId) {
  return `attendance:${eventId}:queue`;
}
function userKey(phone) {
  return `user_profile:${phone}`;
}

export function saveUser(phone, data) {
  if (!phone) return;
  localStorage.setItem(userKey(phone), JSON.stringify(data));
}

export function getUser(phone) {
  if (!phone) return null;
  try {
    const raw = localStorage.getItem(userKey(phone));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function queueAdd(eventId, payload) {
  const k = queueKey(eventId);
  const arr = JSON.parse(localStorage.getItem(k) || '[]');
  arr.push(payload);
  localStorage.setItem(k, JSON.stringify(arr));
}

export async function tryFlushQueue() {
  const keys = Object.keys(localStorage).filter((k) => k.endsWith(':queue'));
  const responses = [];

  for (const k of keys) {
    const arr = JSON.parse(localStorage.getItem(k) || '[]');
    if (!arr.length) continue;
    const remaining = [];

    for (const item of arr) {
      try {
        const res = await postAttendance(item);
        responses.push(res);
        // saveLatest(eventId, item); // Disabled to prevent cross-user prefilling
        if (item.phone) {
          saveUser(item.phone, item);
        }
      } catch {
        remaining.push(item);
      }
    }
    localStorage.setItem(k, JSON.stringify(remaining));
  }
  return responses;
}

window.addEventListener('online', () => {
  tryFlushQueue().catch(console.error);
});
