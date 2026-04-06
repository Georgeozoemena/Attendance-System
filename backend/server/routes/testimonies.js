const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const auth = require('../middleware/auth');

const VALID_CATEGORIES = ['healing', 'provision', 'breakthrough', 'salvation', 'family', 'general'];
const RATE_LIMIT_MAP = new Map(); // ip -> { count, resetTime }

function isRateLimited(ip) {
    const now = Date.now();
    const entry = RATE_LIMIT_MAP.get(ip) || { count: 0, resetTime: now + 60 * 60 * 1000 };
    if (now > entry.resetTime) {
        RATE_LIMIT_MAP.set(ip, { count: 1, resetTime: now + 60 * 60 * 1000 });
        return false;
    }
    if (entry.count >= 3) return true; // max 3 submissions per hour per IP
    entry.count++;
    RATE_LIMIT_MAP.set(ip, entry);
    return false;
}

// POST /api/testimonies — public, no auth
router.post('/', async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    if (isRateLimited(ip)) {
        return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
    }

    const { name, phone, category, content, eventRef } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name is required' });
    }
    if (!content || typeof content !== 'string' || content.trim().length < 20) {
        return res.status(400).json({ error: 'Testimony must be at least 20 characters' });
    }
    if (content.trim().length > 2000) {
        return res.status(400).json({ error: 'Testimony must be under 2000 characters' });
    }

    const safeCategory = VALID_CATEGORIES.includes(category) ? category : 'general';

    try {
        const id = uuidv4();
        await dbRun(
            `INSERT INTO testimonies (id, name, phone, category, content, status, eventRef, createdAt)
             VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`,
            [id, name.trim(), phone?.trim() || null, safeCategory, content.trim(), eventRef || null, new Date().toISOString()]
        );
        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error('Testimony submit failed', err);
        res.status(500).json({ error: 'Failed to submit testimony' });
    }
});

// GET /api/testimonies — admin, all with optional status filter
router.get('/', auth, async (req, res) => {
    const { status } = req.query;
    try {
        const rows = status
            ? await dbAll('SELECT * FROM testimonies WHERE status = ? ORDER BY createdAt DESC', [status])
            : await dbAll('SELECT * FROM testimonies ORDER BY createdAt DESC');
        res.json(rows);
    } catch (err) {
        console.error('Testimonies fetch failed', err);
        res.status(500).json({ error: 'Failed to fetch testimonies' });
    }
});

// PATCH /api/testimonies/:id — admin, approve or reject
router.patch('/:id', auth, async (req, res) => {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Status must be approved or rejected' });
    }
    try {
        const existing = await dbGet('SELECT id FROM testimonies WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Testimony not found' });

        await dbRun(
            'UPDATE testimonies SET status = ?, reviewedAt = ? WHERE id = ?',
            [status, new Date().toISOString(), req.params.id]
        );
        res.json({ success: true, status });
    } catch (err) {
        console.error('Testimony update failed', err);
        res.status(500).json({ error: 'Failed to update testimony' });
    }
});

// DELETE /api/testimonies/:id — admin
router.delete('/:id', auth, async (req, res) => {
    try {
        await dbRun('DELETE FROM testimonies WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Testimony delete failed', err);
        res.status(500).json({ error: 'Failed to delete testimony' });
    }
});

module.exports = router;
