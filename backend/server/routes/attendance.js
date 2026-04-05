const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Simple Levenshtein distance for fuzzy matching
function levenshtein(a, b) {
  const tmp = [];
  for (let i = 0; i <= a.length; i++) { tmp[i] = [i]; }
  for (let j = 0; j <= b.length; j++) { tmp[0][j] = j; }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1,
        tmp[i][j - 1] + 1,
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return tmp[a.length][b.length];
}

function calculateSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  s1 = s1.toLowerCase().trim();
  s2 = s2.toLowerCase().trim();
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  return (longer.length - levenshtein(longer, shorter)) / parseFloat(longer.length);
}

/**
 * Calculates attendance streak for a member
 */
async function getAttendanceStreak(uniqueCode) {
  if (!uniqueCode) return 0;
  const { dbAll } = require('../database');
  try {
    // 1. Get all unique dates this person attended
    const userAttendance = await dbAll(`
      SELECT DISTINCT substr(createdAt, 1, 10) as date 
      FROM attendance_local 
      WHERE uniqueCode = ? 
      ORDER BY date DESC
    `, [uniqueCode]);

    if (userAttendance.length === 0) return 0;

    // 2. Get all distinct active event dates in the system (up to most recent attendance)
    // We only care about events of the same type or all? Usually streak is across all main services.
    const allSystemEvents = await dbAll(`
      SELECT DISTINCT date 
      FROM events 
      WHERE status = 'active' 
      ORDER BY date DESC
    `);

    const userDates = new Set(userAttendance.map(d => d.date));
    let streak = 0;

    for (const event of allSystemEvents) {
      if (userDates.has(event.date)) {
        streak++;
      } else {
        // If they missed an event that occurred before their last check-in, streak breaks.
        // But what if the event is "today" and they haven't checked in yet? 
        // This function is usually called AFTER insertion.
        break;
      }
    }
    return streak;
  } catch (err) {
    console.error('Streak calculation failed:', err);
    return 0;
  }
}
const SheetsClient = require('../sheetsClient');
const auth = require('../middleware/auth');

const sseClients = [];

// Input validation helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  // Remove null bytes and trim
  return str.replace(/\0/g, '').trim();
}

function isValidEventId(eventId) {
  // Event ID should be alphanumeric, dash, or underscore only
  const eventIdRegex = /^[a-zA-Z0-9_-]+$/;
  return eventIdRegex.test(eventId);
}

// GET /api/attendance (Admin History)
router.get('/attendance', auth, async (req, res) => {
  const { eventId, date } = req.query;

  // Validate eventId if provided
  if (eventId && !isValidEventId(eventId)) {
    return res.status(400).json({ error: 'Invalid eventId format' });
  }

  try {
    let rows;
    const { dbAll } = require('../database');
    if (eventId) {
      rows = await dbAll('SELECT * FROM attendance_local WHERE eventId = ? ORDER BY createdAt DESC', [eventId]);
    } else {
      rows = await dbAll('SELECT * FROM attendance_local ORDER BY createdAt DESC');
    }

    const mappedRows = rows.map(r => ({
      eventId: r.eventId,
      name: r.name,
      email: r.email,
      phone: r.phone,
      address: r.address,
      birthday: r.birthday,
      occupation: r.occupation,
      firstTimer: r.firstTimer === 1 || r.firstTimer === true ? 'Yes' : 'No',
      gender: r.gender,
      nationality: r.nationality,
      department: r.department,
      type: r.type,
      uniqueCode: r.uniqueCode,
      createdAt: r.createdAt
    }));

    res.json(mappedRows);
  } catch (err) {
    console.error('History fetch failed', err);
    res.status(500).json({ error: 'fetch failed' });
  }
});

// GET /api/members (Unique list of members/workers)
router.get('/members', auth, async (req, res) => {
  try {
    const { dbAll } = require('../database');
    const allRecords = await dbAll('SELECT * FROM attendance_local ORDER BY createdAt DESC');
    const membersMap = new Map();

    allRecords.forEach(record => {
      const code = record.uniqueCode;
      if (!code) return;

      if (!membersMap.has(code) || new Date(record.createdAt) > new Date(membersMap.get(code).lastSeen)) {
        membersMap.set(code, {
          uniqueCode: code,
          name: record.name,
          email: record.email,
          phone: record.phone,
          category: record.type || 'member',
          department: record.department,
          lastSeen: record.createdAt,
        });
      }
    });

    res.json(Array.from(membersMap.values()));
  } catch (err) {
    console.error('Members fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// GET /api/absentees (People who were here last week but not today)
router.get('/absentees', auth, async (req, res) => {
  try {
    const { dbAll } = require('../database');
    // Use event dates from the events table for reliability instead of inferring from attendance timestamps
    const recentEvents = await dbAll(`
      SELECT DISTINCT date FROM events WHERE status = 'active' ORDER BY date DESC LIMIT 2
    `);

    if (recentEvents.length < 2) return res.json([]);

    const today = recentEvents[0].date;
    const lastSession = recentEvents[1].date;

    const todayAttendees = new Set(
      (await dbAll('SELECT uniqueCode FROM attendance_local WHERE substr(createdAt,1,10) = ?', [today]))
        .map(r => r.uniqueCode).filter(Boolean)
    );

    const lastSessionAttendees = await dbAll(
      'SELECT * FROM attendance_local WHERE substr(createdAt,1,10) = ?', [lastSession]
    );

    const absentees = [];
    const processedCodes = new Set();

    lastSessionAttendees.forEach(record => {
      if (!record.uniqueCode) return;
      if (!todayAttendees.has(record.uniqueCode) && !processedCodes.has(record.uniqueCode)) {
        absentees.push({
          uniqueCode: record.uniqueCode,
          name: record.name,
          phone: record.phone,
          lastSeen: record.createdAt,
          category: record.type || 'member'
        });
        processedCodes.add(record.uniqueCode);
      }
    });

    res.json(absentees);
  } catch (err) {
    console.error('Absentees fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch absentees' });
  }
});

// GET /api/lookup/smart (Fuzzy matching for form pre-filling)
router.get('/lookup/smart', async (req, res) => {
  const { name, phone } = req.query;
  if (!name && !phone) return res.json([]);

  try {
    const { dbAll } = require('../database');

    let records;
    if (phone) {
      // Exact phone match — no need for fuzzy
      records = await dbAll(`
        SELECT * FROM attendance_local WHERE phone = ? ORDER BY createdAt DESC LIMIT 1
      `, [phone]);
    } else {
      // Pre-filter by first letter to reduce in-memory work
      const firstChar = name.charAt(0).toLowerCase();
      records = await dbAll(`
        SELECT a.* FROM attendance_local a
        INNER JOIN (
          SELECT phone, MAX(createdAt) as maxDate
          FROM attendance_local
          WHERE LOWER(SUBSTR(name, 1, 1)) = ?
          GROUP BY phone
        ) latest ON a.phone = latest.phone AND a.createdAt = latest.maxDate
        LIMIT 200
      `, [firstChar]);
    }

    let matches = [];
    records.forEach(r => {
      let score = 0;
      if (phone && r.phone === phone) {
        score = 1.0;
      } else if (name && r.name) {
        score = calculateSimilarity(name, r.name);
      }

      // Only suggest if similarity is high but not a perfect match (perfect = already filled)
      if (score >= 0.8 && score < 1.0) {
        matches.push({
          score,
          profile: {
            name: r.name,
            email: r.email,
            phone: r.phone,
            address: r.address,
            birthday: r.birthday,
            occupation: r.occupation,
            gender: r.gender,
            nationality: r.nationality,
            department: r.department,
            uniqueCode: r.uniqueCode
          }
        });
      }
    });

    matches.sort((a, b) => b.score - a.score);
    res.json(matches.slice(0, 3));
  } catch (err) {
    console.error('Smart lookup failed', err);
    res.status(500).json({ error: 'Smart lookup failed' });
  }
});

// GET /api/admin/velocity (Check-in rate monitoring)
router.get('/admin/velocity', auth, async (req, res) => {
  try {
    const { dbGet } = require('../database');
    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = await dbGet(`
      SELECT COUNT(*) as count FROM attendance_local 
      WHERE createdAt > ?
    `, [fiveMinsAgo]);
    
    // Suggest freeze if count is 0 or extremely low during active event
    res.json({
      count: result.count,
      suggestFreeze: result.count === 0,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Velocity check failed' });
  }
});

// GET /api/members/:code (Member profile with history)
router.get('/members/:code', auth, async (req, res) => {
  try {
    const { dbAll } = require('../database');
    const history = await dbAll('SELECT * FROM attendance_local WHERE uniqueCode = ? ORDER BY createdAt DESC', [req.params.code]);

    if (!history || history.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const streak = await getAttendanceStreak(req.params.code);
    const member = {
      ...history[0],
      streak,
      history: history.map(h => ({
        eventId: h.eventId,
        createdAt: h.createdAt,
        type: h.type
      }))
    };

    res.json(member);
  } catch (err) {
    console.error('Member details fetch failed', err);
    res.status(500).json({ error: 'Failed to fetch member details' });
  }
});

// GET /api/lookup (Public Lookup - e.g. for prefill)
router.get('/lookup', async (req, res) => {
  const { email, phone, eventId } = req.query;

  // Validate email format if provided
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Validate eventId format if provided
  if (eventId && !isValidEventId(eventId)) {
    return res.status(400).json({ error: 'Invalid eventId format' });
  }

  if (!email && !phone) {
    return res.status(400).json({ error: 'email or phone required for lookup' });
  }

  try {
    const { dbAll } = require('../database');
    const params = [];
    const conditions = [];

    if (email) {
      conditions.push('LOWER(email) = LOWER(?)');
      params.push(email);
    }
    if (phone) {
      conditions.push('phone = ?');
      params.push(phone);
    }
    if (eventId) {
      conditions.push('eventId = ?');
      params.push(eventId);
    }

    // Return multiple records so caller can check for duplicate eventId
    const query = `SELECT * FROM attendance_local WHERE ${conditions.join(' AND ')} ORDER BY createdAt DESC LIMIT 10`;
    const rows = await dbAll(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Lookup failed', err);
    res.status(500).json({ error: 'lookup failed' });
  }
});

// POST /api/attendance
router.post('/attendance', async (req, res) => {
  const payload = req.body || {};

  // Sanitize input fields
  const typeForm = sanitizeString(payload.type) || 'member';
  const sanitizedPayload = {
    id: payload.id || uuidv4(),
    createdAt: payload.createdAt || new Date().toISOString(),
    name: sanitizeString(payload.name),
    email: sanitizeString(payload.email),
    phone: sanitizeString(payload.phone),
    address: sanitizeString(payload.address),
    birthday: sanitizeString(payload.birthday),
    occupation: sanitizeString(payload.occupation),
    firstTimer: typeForm === 'worker' ? false : payload.firstTimer,
    gender: sanitizeString(payload.gender),
    nationality: sanitizeString(payload.nationality),
    department: sanitizeString(payload.department),
    type: typeForm,
    eventId: sanitizeString(payload.eventId)
  };

  // Validate required fields
  const requiredFields = ['name', 'email', 'phone'];
  for (const field of requiredFields) {
    if (!sanitizedPayload[field] || sanitizedPayload[field].length === 0) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }

  // Validate email format
  if (!isValidEmail(sanitizedPayload.email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const { dbRun, dbGet } = require('../database');

    // 0. Server-side duplication check for the same phone + eventId
    const existing = await dbGet(`
      SELECT id FROM attendance_local 
      WHERE phone = ? AND eventId = ? 
      LIMIT 1
    `, [sanitizedPayload.phone, sanitizedPayload.eventId]);

    if (existing) {
      return res.status(409).json({ error: 'You have already marked attendance for this event!' });
    }

    // 1. Persist to SQLite FIRST (Local source of truth)
    await dbRun(
      `INSERT INTO attendance_local (
        id, eventId, name, email, phone, address, birthday, occupation, 
        firstTimer, gender, nationality, department, type, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sanitizedPayload.id, sanitizedPayload.eventId, sanitizedPayload.name,
        sanitizedPayload.email, sanitizedPayload.phone, sanitizedPayload.address,
        sanitizedPayload.birthday, sanitizedPayload.occupation, sanitizedPayload.firstTimer ? 1 : 0,
        sanitizedPayload.gender, sanitizedPayload.nationality,
        sanitizedPayload.department, sanitizedPayload.type, sanitizedPayload.createdAt
      ]
    );

    // 2. Sync to Google Sheets
    const result = await SheetsClient.appendRow(sanitizedPayload);

    // 3. Calculate Streak (New!)
    const streak = await getAttendanceStreak(result?.uniqueCode);

    // broadcast to SSE admin clients
    // Merge sanitizedPayload (which guaranteed has eventId) with result (which has uniqueCode)
    const broadcastData = {
      ...sanitizedPayload,
      ...(result || {}),
      streak
    };

    const message = JSON.stringify(broadcastData);
    sseClients.forEach((c) => {
      try {
        c.res.write(`data: ${message}\n\n`);
      } catch (err) {
        console.warn('Failed to send SSE to a client', err);
      }
    });
    res.status(201).json(broadcastData);
  } catch (err) {
    if (err.code === 'DUPLICATE_ATTENDANCE' || err.message?.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'You have already marked attendance for this event!' });
    }
    console.error('Failed to append', err);
    res.status(500).json({ error: 'persist failed' });
  }
});

// SSE endpoint for admin dashboard
router.get('/admin/stream', auth, (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache'
  });
  res.flushHeaders && res.flushHeaders();

  const client = { id: Date.now(), res };
  sseClients.push(client);

  // Limit SSE clients to prevent memory exhaustion
  if (sseClients.length > 100) {
    const removed = sseClients.shift();
    try {
      removed.res.end();
    } catch (e) {
      // Client already disconnected
    }
  }

  req.on('close', () => {
    const idx = sseClients.findIndex((c) => c.id === client.id);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

module.exports = router;