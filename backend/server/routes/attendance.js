const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const SheetsClient = require('../sheetsClient');
const auth = require('../middleware/auth');

const sseClients = [];

// GET /api/attendance (Admin History)
router.get('/attendance', auth, async (req, res) => {
  const { eventId } = req.query;
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

// GET /api/lookup (Public Lookup - e.g. for prefill)
router.get('/lookup', async (req, res) => {
  const { email, phone, eventId } = req.query;
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
  payload.id = payload.id || uuidv4();
  payload.createdAt = payload.createdAt || new Date().toISOString();

  try {
    const result = await SheetsClient.appendRow(payload);
    // broadcast to SSE admin clients
    const message = JSON.stringify(payload);
    sseClients.forEach((c) => {
      try {
        c.res.write(`data: ${message}\n\n`);
      } catch (err) {
        console.warn('Failed to send SSE to a client', err);
      }
    });
    res.status(201).json(result || payload);
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

  req.on('close', () => {
    const idx = sseClients.findIndex((c) => c.id === client.id);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

module.exports = router;