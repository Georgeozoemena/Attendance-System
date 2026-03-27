const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const auth = require('../middleware/auth');

// GET /api/events/current (Public)
router.get('/current', async (req, res) => {
    try {
        // Find most recent active event
        const event = await dbGet('SELECT * FROM events WHERE status = ? ORDER BY date DESC, created_at DESC LIMIT 1', ['active']);
        
        if (event) {
            res.json(event);
        } else {
            // Fallback: If no event today, check for any active event on current date if date format differs
            // For now, return 404 so frontend knows to show generic or wait
            res.status(404).json({ error: 'No active event found for today' });
        }
    } catch (err) {
        console.error('Failed to fetch current event', err);
        res.status(500).json({ error: 'Failed to fetch current event' });
    }
});

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
    const { name, type, date, start_time, expiry_duration } = req.body;
    if (!name || !type || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    try {
        await dbRun(
            'INSERT INTO events (id, name, type, date, start_time, status, expiry_duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, name, type, date, start_time || null, 'active', expiry_duration || 0, createdAt]
        );
        res.status(201).json({ id, name, type, date, start_time: start_time || null, status: 'active', expiry_duration: expiry_duration || 0, createdAt });
    } catch (err) {
        console.error('Failed to create event', err);
        res.status(500).json({ error: 'Failed to create event' });
    }
});

// PATCH /api/events/:id/freeze
router.patch('/:id/freeze', auth, async (req, res) => {
    try {
        const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const now = new Date().toISOString();
        let newIsFrozen = event.is_frozen === 1 ? 0 : 1;
        let newFreezeStartedAt = event.freeze_started_at;
        let newTotalFrozenMs = event.total_frozen_ms || 0;

        if (newIsFrozen === 1) {
            // Starting freeze
            newFreezeStartedAt = now;
        } else {
            // Ending freeze
            if (event.freeze_started_at) {
                const elapsed = new Date(now) - new Date(event.freeze_started_at);
                newTotalFrozenMs += elapsed;
            }
            newFreezeStartedAt = null;
        }

        await dbRun(
            'UPDATE events SET is_frozen = ?, freeze_started_at = ?, total_frozen_ms = ? WHERE id = ?',
            [newIsFrozen, newFreezeStartedAt, newTotalFrozenMs, req.params.id]
        );

        res.json({ id: req.params.id, is_frozen: newIsFrozen, total_frozen_ms: newTotalFrozenMs });
    } catch (err) {
        console.error('Failed to toggle freeze', err);
        res.status(500).json({ error: 'Failed to toggle freeze' });
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
