/* backend/sheetsClient.js
 *
 * Handles Google Sheets synchronization.
 * Persistent storage is managed in database.js (attendance_local table).
 */

const APPS_SCRIPT_WEBHOOK = process.env.APPS_SCRIPT_WEBHOOK;
const APPS_SCRIPT_KEY = process.env.APPS_SCRIPT_KEY;

/**
 * Forwards attendance payload to Google Sheets via Apps Script Webhook
 */
async function forwardToSheets(payload) {
  if (!APPS_SCRIPT_WEBHOOK) return;
  try {
    const url = new URL(APPS_SCRIPT_WEBHOOK);
    if (APPS_SCRIPT_KEY) url.searchParams.set('key', APPS_SCRIPT_KEY);
    
    // Ensure payload has all necessary fields for Sheets
    const body = { 
      ...payload,
      key: APPS_SCRIPT_KEY
    };

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('Sheets sync returned non-OK status:', response.status, text);
    }
  } catch (err) {
    console.warn('Sheets sync failed (non-fatal):', err.message);
  }
}

/**
 * Interface for attendance.js to trigger Sheets sync.
 * Duplicate checks are now handled at the database level in database.js
 * and route level in attendance.js.
 */
async function appendRow(payload) {
  // Fire and forget: don't block the main attendance flow for Sheets sync
  // unless strictly required. For robustness, we let it run in the background.
  forwardToSheets(payload);
  return payload;
}

// Keep lookup for backward compatibility if needed, but refer to attendance_local
async function lookup({ email, phone, eventId } = {}) {
  const { dbAll } = require('./database');
  const conditions = [];
  const params = [];

  if (email) { conditions.push('LOWER(email) = LOWER(?)'); params.push(email); }
  if (phone) { conditions.push('phone = ?'); params.push(phone); }
  if (eventId) { conditions.push('eventId = ?'); params.push(eventId); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await dbAll(
    `SELECT *, (firstTimer = 1) as firstTimer FROM attendance_local ${where} ORDER BY createdAt DESC`,
    params
  );

  return rows.map(r => ({
    ...r,
    firstTimer: r.firstTimer === 1
  }));
}

module.exports = { appendRow, lookup };