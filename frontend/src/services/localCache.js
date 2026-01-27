import { postAttendance } from './api.js';

function latestKey(eventId) {
  return `attendance:${eventId}:latest`;
}
function queueKey(eventId) {
  return `attendance:${eventId}:queue`;
}

export function getLatest(eventId) {
  try {
    const raw = localStorage.getItem(latestKey(eventId));
    return raw ? JSON.parse(raw) : null;
  // eslint-disable-next-line no-unused-vars
  } catch (e) {
    return null;
  }
}
export function saveLatest(eventId, payload) {
  localStorage.setItem(latestKey(eventId), JSON.stringify(payload));
}
export function queueAdd(eventId, payload) {
  const k = queueKey(eventId);
  const arr = JSON.parse(localStorage.getItem(k) || '[]');
  arr.push(payload);
  localStorage.setItem(k, JSON.stringify(arr));
}

export async function tryFlushQueue() {
  const keys = Object.keys(localStorage).filter((k) => k.endsWith(':queue'));
  for (const k of keys) {
    const arr = JSON.parse(localStorage.getItem(k) || '[]');
    if (!arr.length) continue;
    const eventId = k.split(':')[1];
    const remaining = [];
    for (const item of arr) {
      try {
        await postAttendance(item);
        saveLatest(eventId, item);
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        remaining.push(item);
      }
    }
    localStorage.setItem(k, JSON.stringify(remaining));
  }
}

window.addEventListener('online', () => {
  tryFlushQueue().catch(console.error);
});