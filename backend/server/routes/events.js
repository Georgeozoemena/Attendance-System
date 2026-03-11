const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const auth = require('../middleware/auth');

// GET /api/events
router.get('/', auth, async (req, res) => {
    try {
        const events = await dbAll('SELECT * FROM events ORDER BY date DESC');
        res.json(events);
    } catch (err) {
        console.error('Failed to fetch events', err);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// POST /api/events
router.post('/', auth, async (req, res) => {
    const { name, type, date } = req.body;
    if (!name || !type || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    try {
        await dbRun(
            'INSERT INTO events (id, name, type, date, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [id, name, type, date, 'active', createdAt]
        );
        res.status(201).json({ id, name, type, date, status: 'active', createdAt });
    } catch (err) {
        console.error('Failed to create event', err);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// DELETE /api/events/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await dbRun('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        console.error('Failed to delete event', err);
        res.status(500).json({ error: 'Failed to delete event' });
    }
});

module.exports = router;
