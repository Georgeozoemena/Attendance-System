const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const auth = require('../middleware/auth');

const GIVING_TYPES = ['tithe', 'offering', 'seed', 'project', 'welfare', 'other'];

// GET /api/giving — list with optional filters
router.get('/', auth, async (req, res) => {
    const { month, type, memberId } = req.query;
    try {
        let sql = 'SELECT * FROM giving WHERE 1=1';
        const params = [];
        if (month) { sql += ' AND substr(createdAt,1,7) = ?'; params.push(month); }
        if (type) { sql += ' AND type = ?'; params.push(type); }
        if (memberId) { sql += ' AND memberId = ?'; params.push(memberId); }
        sql += ' ORDER BY createdAt DESC';
        const rows = await dbAll(sql, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch giving records' });
    }
});

// GET /api/giving/summary — monthly totals by type
router.get('/summary', auth, async (req, res) => {
    const { year } = req.query;
    const y = year || new Date().getFullYear();
    try {
        const rows = await dbAll(`
            SELECT substr(createdAt,1,7) as month, type, SUM(amount) as total, COUNT(*) as count
            FROM giving WHERE substr(createdAt,1,4) = ?
            GROUP BY month, type ORDER BY month DESC
        `, [String(y)]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

// POST /api/giving — record a giving entry
router.post('/', auth, async (req, res) => {
    const { memberId, memberName, phone, amount, type, eventId, notes } = req.body;
    if (!memberName || !amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Member name and valid amount are required' });
    }
    if (parseFloat(amount) <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than zero' });
    }
    const safeType = GIVING_TYPES.includes(type) ? type : 'offering';
    try {
        const id = uuidv4();
        await dbRun(`INSERT INTO giving (id, memberId, memberName, phone, amount, type, eventId, notes, createdAt) VALUES (?,?,?,?,?,?,?,?,?)`,
            [id, memberId || null, memberName, phone || null, parseFloat(amount), safeType, eventId || null, notes || null, new Date().toISOString()]);
        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error('Giving record failed', err);
        res.status(500).json({ error: 'Failed to record giving' });
    }
});

// DELETE /api/giving/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        await dbRun('DELETE FROM giving WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete record' });
    }
});

module.exports = router;
