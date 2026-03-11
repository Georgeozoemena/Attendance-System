const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
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
  const { eventId } = req.query;

  // Validate eventId if provided
  if (eventId && !isValidEventId(eventId)) {
    return res.status(400).json({ error: 'Invalid eventId format' });
  }

  try {
    // If we want ALL records when no eventId, GAS doGet needs update, 
    // but for now we follow the existing pattern.
    const rows = await SheetsClient.lookup({ eventId });
    res.json(rows);
  } catch (err) {
    console.error('History fetch failed', err);
    res.status(500).json({ error: 'fetch failed' });
  }
});

// GET /api/members (Unique list of members/workers)
router.get('/members', auth, async (req, res) => {
  try {
    const allRecords = await SheetsClient.lookup();
    const membersMap = new Map();

    allRecords.forEach(record => {
      const code = record.uniqueCode;
      if (!code) return;

      if (!membersMap.has(code) || new Date(record.timestamp) > new Date(membersMap.get(code).lastSeen)) {
        membersMap.set(code, {
          uniqueCode: code,
          name: record.name,
          email: record.email,
          phone: record.phone,
          category: record.type || 'member',
          department: record.department,
          lastSeen: record.timestamp,
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
    const allRecords = await SheetsClient.lookup();

    // Sort records by timestamp descending
    const sorted = allRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Identify the latest two "service" dates (simplification)
    const dates = [...new Set(sorted.map(r => r.timestamp.split('T')[0]))].slice(0, 2);

    if (dates.length < 1) return res.json([]);

    const today = dates[0];
    const lastSession = dates[1];

    const todayAttendees = new Set(sorted.filter(r => r.timestamp.startsWith(today)).map(r => r.uniqueCode));
    const lastSessionAttendees = sorted.filter(r => r.timestamp.startsWith(lastSession));

    const absentees = [];
    const processedCodes = new Set();

    lastSessionAttendees.forEach(record => {
      if (!todayAttendees.has(record.uniqueCode) && !processedCodes.has(record.uniqueCode)) {
        absentees.push({
          uniqueCode: record.uniqueCode,
          name: record.name,
          phone: record.phone,
          lastSeen: record.timestamp,
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
    const rows = await SheetsClient.lookup({ email, phone, eventId });
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
  const sanitizedPayload = {
    id: payload.id || uuidv4(),
    createdAt: payload.createdAt || new Date().toISOString(),
    name: sanitizeString(payload.name),
    email: sanitizeString(payload.email),
    phone: sanitizeString(payload.phone),
    address: sanitizeString(payload.address),
    occupation: sanitizeString(payload.occupation),
    firstTimer: payload.firstTimer,
    gender: sanitizeString(payload.gender),
    nationality: sanitizeString(payload.nationality),
    department: sanitizeString(payload.department),
    type: sanitizeString(payload.type) || 'member',
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
    const result = await SheetsClient.appendRow(sanitizedPayload);
    // broadcast to SSE admin clients
    const message = JSON.stringify(sanitizedPayload);
    sseClients.forEach((c) => {
      try {
        c.res.write(`data: ${message}\n\n`);
      } catch (err) {
        console.warn('Failed to send SSE to a client', err);
      }
    });
    res.status(201).json(result || sanitizedPayload);
  } catch (err) {
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