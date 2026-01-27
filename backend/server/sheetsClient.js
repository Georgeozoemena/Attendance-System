/* backend/sheetsClient.js
 *
 * Forwards requests to an Apps Script Web App.
 * Requires environment variables:
 *   APPS_SCRIPT_WEBHOOK - the Apps Script URL (e.g. https://script.google.com/macros/s/XXX/exec)
 *   APPS_SCRIPT_KEY     - (optional) API key to include in requests
 *
 * Notes:
 * - Node 18+ is recommended (global fetch). engines in package.json specify node>=18.
 */

const APPS_SCRIPT_WEBHOOK = process.env.APPS_SCRIPT_WEBHOOK;
const APPS_SCRIPT_KEY = process.env.APPS_SCRIPT_KEY;

if (!APPS_SCRIPT_WEBHOOK) {
  console.warn('APPS_SCRIPT_WEBHOOK not set — Sheets client will not work until configured.');
}

function buildUrlWithKey(baseUrl) {
  if (!APPS_SCRIPT_KEY) return baseUrl;
  try {
    const url = new URL(baseUrl);
    url.searchParams.set('key', APPS_SCRIPT_KEY);
    return url.toString();
  } catch (err) {
    return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}key=${encodeURIComponent(APPS_SCRIPT_KEY)}`;
  }
}

async function appendRow(payload) {
  if (!APPS_SCRIPT_WEBHOOK) throw new Error('APPS_SCRIPT_WEBHOOK not configured');
  const url = buildUrlWithKey(APPS_SCRIPT_WEBHOOK);

  const body = { ...payload };
  if (APPS_SCRIPT_KEY) body.key = APPS_SCRIPT_KEY;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Apps Script appendRow failed: ${res.status} ${res.statusText} ${txt}`);
  }

  const json = await res.json().catch(() => null);
  return json;
}

async function lookup({ email, phone, eventId } = {}) {
  if (!APPS_SCRIPT_WEBHOOK) throw new Error('APPS_SCRIPT_WEBHOOK not configured');
  const base = buildUrlWithKey(APPS_SCRIPT_WEBHOOK);
  const url = new URL(base);
  url.searchParams.set('action', 'lookup');
  if (email) url.searchParams.set('email', email);
  if (phone) url.searchParams.set('phone', phone);
  if (eventId) url.searchParams.set('eventId', eventId);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Accept: 'application/json' }
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Apps Script lookup failed: ${res.status} ${res.statusText} ${txt}`);
  }

  const json = await res.json().catch(() => null);
  return json || [];
}

module.exports = { appendRow, lookup };