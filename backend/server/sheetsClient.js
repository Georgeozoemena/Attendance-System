/* backend/sheetsClient.js
 *
 * Local SQLite attendance storage.
 * All attendance records are stored in the local SQLite database.
 * If APPS_SCRIPT_WEBHOOK is set, data is ALSO forwarded to Google Sheets (optional sync).
 */

const { db, dbAll, dbRun, dbGet } = require('./database');

// Ensure the attendance table exists
db.serialize(() => {
  db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            createdAt TEXT,
            name TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            birthday TEXT,
            occupation TEXT,
            firstTimer INTEGER DEFAULT 0,
            gender TEXT,
            nationality TEXT,
            department TEXT,
            type TEXT DEFAULT 'member',
            eventId TEXT,
            uniqueCode TEXT
        )
    `, (err) => {
    if (err) console.error('Failed to create attendance table:', err);
    else console.log('Attendance table ready.');
  });
});

// Optional: forward to Google Sheets if webhook is configured
const APPS_SCRIPT_WEBHOOK = process.env.APPS_SCRIPT_WEBHOOK;
const APPS_SCRIPT_KEY = process.env.APPS_SCRIPT_KEY;

async function forwardToSheets(payload) {
  if (!APPS_SCRIPT_WEBHOOK) return;
  try {
    const url = new URL(APPS_SCRIPT_WEBHOOK);
    if (APPS_SCRIPT_KEY) url.searchParams.set('key', APPS_SCRIPT_KEY);
    const body = { ...payload };
    if (APPS_SCRIPT_KEY) body.key = APPS_SCRIPT_KEY;
    await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (err) {
    console.warn('Sheets sync failed (non-fatal):', err.message);
  }
}

async function appendRow(payload) {
  const {
    id, createdAt, name, email, phone,
    address, birthday, occupation, firstTimer, gender,
    nationality, department, type, eventId, uniqueCode
  } = payload;

  // Duplicate check: Same person, same event, same day
  const todayStart = new Date().toISOString().split('T')[0];
  const existing = await dbGet(`
    SELECT id FROM attendance 
    WHERE (phone = ? OR uniqueCode = ?) 
      AND eventId = ? 
      AND createdAt LIKE ? 
    LIMIT 1
  `, [phone, uniqueCode, eventId, `${todayStart}%`]);

  if (existing) {
    const err = new Error('Duplicate attendance');
    err.code = 'DUPLICATE_ATTENDANCE';
    throw err;
  }

  await dbRun(`
        INSERT OR REPLACE INTO attendance
        (id, createdAt, name, email, phone, address, birthday, occupation, firstTimer, gender, nationality, department, type, eventId, uniqueCode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
    id, createdAt, name, email, phone,
    address, birthday, occupation,
    firstTimer ? 1 : 0,
    gender, nationality, department,
    type || 'member',
    eventId, uniqueCode
  ]);

  // Optionally also write to Google Sheets (fire-and-forget)
  forwardToSheets(payload);

  return payload;
}

async function lookup({ email, phone, eventId } = {}) {
  const conditions = [];
  const params = [];

  if (email) { conditions.push('LOWER(email) = LOWER(?)'); params.push(email); }
  if (phone) { conditions.push('phone = ?'); params.push(phone); }
  if (eventId) { conditions.push('eventId = ?'); params.push(eventId); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = await dbAll(
    `SELECT *, (firstTimer = 1) as firstTimer FROM attendance ${where} ORDER BY createdAt DESC`,
    params
  );

  // Normalize: convert firstTimer from integer back to boolean
  return rows.map(r => ({
    ...r,
    firstTimer: r.firstTimer === 1 || r.firstTimer === true
  }));
}

module.exports = { appendRow, lookup };