const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const auth = require('../middleware/auth');

// GET /api/departments
router.get('/', auth, async (req, res) => {
    try {
        const depts = await dbAll('SELECT * FROM departments ORDER BY name ASC');
        // Attach member count from attendance_local
        const withCounts = await Promise.all(depts.map(async d => {
            const row = await dbGet('SELECT COUNT(DISTINCT uniqueCode) as count FROM attendance_local WHERE department = ?', [d.name]);
            return { ...d, memberCount: row?.count || 0 };
        }));
        res.json(withCounts);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// POST /api/departments
router.post('/', auth, async (req, res) => {
    const { name, description, leaderName, leaderId } = req.body;
    if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Department name is required' });
    try {
        const existing = await dbGet('SELECT id FROM departments WHERE name = ?', [name.trim()]);
        if (existing) return res.status(409).json({ error: 'Department already exists' });
        const id = uuidv4();
        await dbRun('INSERT INTO departments (id, name, description, leaderName, leaderId, createdAt) VALUES (?,?,?,?,?,?)',
            [id, name.trim(), description || null, leaderName || null, leaderId || null, new Date().toISOString()]);
        res.status(201).json({ success: true, id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create department' });
    }
});

// PATCH /api/departments/:id
router.patch('/:id', auth, async (req, res) => {
    const { name, description, leaderName, leaderId } = req.body;
    try {
        const existing = await dbGet('SELECT id FROM departments WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Department not found' });
        const fields = [], vals = [];
        if (name) { fields.push('name = ?'); vals.push(name.trim()); }
        if (description !== undefined) { fields.push('description = ?'); vals.push(description); }
        if (leaderName !== undefined) { fields.push('leaderName = ?'); vals.push(leaderName); }
        if (leaderId !== undefined) { fields.push('leaderId = ?'); vals.push(leaderId); }
        if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
        vals.push(req.params.id);
        await dbRun(`UPDATE departments SET ${fields.join(', ')} WHERE id = ?`, vals);
        res.json({ success: true });
    } catch (err) {
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
