const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const auth = require('../middleware/auth');

// GET /api/departments
router.get('/', auth, async (req, res) => {
    try {
        const depts = await dbAll('SELECT * FROM departments ORDER BY name ASC');
        const withCounts = await Promise.all(depts.map(async d => {
            const row = await dbGet(
                'SELECT COUNT(*) as count FROM members WHERE LOWER(department) = LOWER(?) AND status = ?',
                [d.name, 'active']
            );
            return { ...d, memberCount: row?.count || 0 };
        }));
        res.json(withCounts);
    } catch (err) {
        console.error('Departments fetch failed', err);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// GET /api/departments/list — lightweight list for dropdowns (no photo)
router.get('/list', async (req, res) => {
    try {
        const depts = await dbAll('SELECT id, name, leaderName FROM departments ORDER BY name ASC');
        res.json(depts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// POST /api/departments
router.post('/', auth, async (req, res) => {
    const { name, description, leaderName, leaderPhone, meetingDay, meetingTime, leaderPhoto } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Department name is required' });

    // Validate photo size if provided (base64 ~1.33x raw, limit to ~500KB raw = ~670KB base64)
    if (leaderPhoto && leaderPhoto.length > 700000) {
        return res.status(400).json({ error: 'Photo too large. Please use an image under 500KB.' });
    }

    try {
        const existing = await dbGet('SELECT id FROM departments WHERE LOWER(name) = LOWER(?)', [name.trim()]);
        if (existing) return res.status(409).json({ error: 'Department already exists' });
        const id = uuidv4();
        await dbRun(
            'INSERT INTO departments (id, name, description, leaderName, leaderPhone, meetingDay, meetingTime, leaderPhoto, createdAt) VALUES (?,?,?,?,?,?,?,?,?)',
            [id, name.trim(), description || null, leaderName || null, leaderPhone || null, meetingDay || null, meetingTime || null, leaderPhoto || null, new Date().toISOString()]
        );
        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error('Department create failed', err);
        res.status(500).json({ error: 'Failed to create department' });
    }
});

// PATCH /api/departments/:id
router.patch('/:id', auth, async (req, res) => {
    const { name, description, leaderName, leaderPhone, meetingDay, meetingTime, leaderPhoto } = req.body;

    if (leaderPhoto && leaderPhoto.length > 700000) {
        return res.status(400).json({ error: 'Photo too large. Please use an image under 500KB.' });
    }

    try {
        const existing = await dbGet('SELECT id FROM departments WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Department not found' });

        const fields = [], vals = [];
        if (name !== undefined) { fields.push('name = ?'); vals.push(name.trim()); }
        if (description !== undefined) { fields.push('description = ?'); vals.push(description); }
        if (leaderName !== undefined) { fields.push('leaderName = ?'); vals.push(leaderName); }
        if (leaderPhone !== undefined) { fields.push('leaderPhone = ?'); vals.push(leaderPhone); }
        if (meetingDay !== undefined) { fields.push('meetingDay = ?'); vals.push(meetingDay); }
        if (meetingTime !== undefined) { fields.push('meetingTime = ?'); vals.push(meetingTime); }
        if (leaderPhoto !== undefined) { fields.push('leaderPhoto = ?'); vals.push(leaderPhoto); }

        if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
        vals.push(req.params.id);
        await dbRun(`UPDATE departments SET ${fields.join(', ')} WHERE id = ?`, vals);
        res.json({ success: true });
    } catch (err) {
        console.error('Department update failed', err);
        res.status(500).json({ error: 'Failed to update department' });
    }
});

// DELETE /api/departments/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await dbRun('DELETE FROM departments WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete department' });
    }
});

module.exports = router;
