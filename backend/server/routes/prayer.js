const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const auth = require('../middleware/auth');

const RATE_LIMIT_MAP = new Map();
function isRateLimited(ip) {
    const now = Date.now();
    const entry = RATE_LIMIT_MAP.get(ip) || { count: 0, resetTime: now + 60 * 60 * 1000 };
    if (now > entry.resetTime) { RATE_LIMIT_MAP.set(ip, { count: 0, resetTime: now + 60 * 60 * 1000 }); return false; }
    return entry.count >= 5;
}
function incrementRateLimit(ip) {
    const now = Date.now();
    const entry = RATE_LIMIT_MAP.get(ip) || { count: 0, resetTime: now + 60 * 60 * 1000 };
    entry.count++;
    RATE_LIMIT_MAP.set(ip, entry);
}

const VALID_CATEGORIES = ['healing', 'family', 'finances', 'guidance', 'salvation', 'thanksgiving', 'general'];

// POST /api/prayer — public submission
router.post('/', async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (isRateLimited(ip)) return res.status(429).json({ error: 'Too many submissions. Please try again later.' });

    const { name, phone, category, request, anonymous, eventRef } = req.body;
    const submitterName = anonymous ? 'Anonymous' : (name?.trim() || '');
    if (!anonymous && submitterName.length < 2) return res.status(400).json({ error: 'Please enter your name or submit anonymously' });
    if (!request || request.trim().length < 10) return res.status(400).json({ error: 'Please describe your prayer request (min 10 characters)' });
    if (request.trim().length > 1000) return res.status(400).json({ error: 'Please keep it under 1000 characters' });

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'general';
    try {
        const id = uuidv4();
        await dbRun(`INSERT INTO prayer_requests (id, name, phone, category, request, anonymous, status, eventRef, createdAt) VALUES (?,?,?,?,?,?,?,?,?)`,
            [id, submitterName, phone?.trim() || null, safeCategory, request.trim(), anonymous ? 1 : 0, 'pending', eventRef || null, new Date().toISOString()]);
        incrementRateLimit(ip);
        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error('Prayer request failed', err);
        res.status(500).json({ error: 'Failed to submit prayer request' });
    }
});

// GET /api/prayer — admin
router.get('/', auth, async (req, res) => {
    const { status } = req.query;
    try {
        const rows = status
            ? await dbAll('SELECT * FROM prayer_requests WHERE status = ? ORDER BY createdAt DESC', [status])
            : await dbAll('SELECT * FROM prayer_requests ORDER BY createdAt DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch prayer requests' });
    }
});

// PATCH /api/prayer/:id — mark as prayed
router.patch('/:id', auth, async (req, res) => {
    const { status } = req.body;
    if (!['prayed', 'pending'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    try {
        const existing = await dbGet('SELECT id FROM prayer_requests WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Not found' });
        await dbRun('UPDATE prayer_requests SET status = ?, prayedAt = ? WHERE id = ?',
            [status, status === 'prayed' ? new Date().toISOString() : null, req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update' });
    }
});

// DELETE /api/prayer/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await dbRun('DELETE FROM prayer_requests WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

module.exports = router;
