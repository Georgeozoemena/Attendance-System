const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and developer or usher role
router.use(authMiddleware, requireRole('developer', 'usher'));

/**
 * GET /api/checkin/search?q=
 * Search members by name or uniqueCode in attendance_local.
 * Returns DISTINCT by uniqueCode (most recent record).
 * Returns: name, phone, uniqueCode, department
 */
router.get('/search', async (req, res) => {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
        return res.status(400).json({ error: 'Query parameter q is required' });
    }

    try {
        const searchTerm = `%${q.trim()}%`;

        // Get most recent record per uniqueCode matching the search term
        const members = await dbAll(
            `SELECT name, phone, uniqueCode, department
             FROM attendance_local
             WHERE (name LIKE ? OR uniqueCode LIKE ?)
               AND uniqueCode IS NOT NULL
               AND uniqueCode != ''
             GROUP BY uniqueCode
             HAVING MAX(createdAt)
             ORDER BY name ASC
             LIMIT 50`,
            [searchTerm, searchTerm]
        );

        res.json(members);
    } catch (err) {
        console.error('GET /api/checkin/search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/checkin/headcount
 * Count distinct uniqueCodes in attendance_local for the current active event.
 * Active event: status='active' ORDER BY date DESC LIMIT 1
 */
router.get('/headcount', async (req, res) => {
    try {
        // Get the current active event
        const activeEvent = await dbGet(
            `SELECT id FROM events WHERE status = 'active' ORDER BY date DESC LIMIT 1`
        );

        if (!activeEvent) {
            return res.json({ count: 0, eventId: null });
        }

        const result = await dbGet(
            `SELECT COUNT(DISTINCT uniqueCode) AS count
             FROM attendance_local
             WHERE eventId = ? AND uniqueCode IS NOT NULL AND uniqueCode != ''`,
            [activeEvent.id]
        );

        res.json({ count: result ? result.count : 0, eventId: activeEvent.id });
    } catch (err) {
        console.error('GET /api/checkin/headcount error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/checkin/mark
 * Insert an attendance record for the current active event.
 * Body: { uniqueCode?, phone? } — at least one required
 * Looks up member from attendance_local, inserts new record for current event.
 */
router.post('/mark', async (req, res) => {
    const { uniqueCode, phone } = req.body;

    if (!uniqueCode && !phone) {
        return res.status(400).json({ error: 'Either uniqueCode or phone is required' });
    }

    try {
        // Get the current active event
        const activeEvent = await dbGet(
            `SELECT id FROM events WHERE status = 'active' ORDER BY date DESC LIMIT 1`
        );

        if (!activeEvent) {
            return res.status(400).json({ error: 'No active event found' });
        }

        // Look up the member from attendance_local using uniqueCode or phone
        let member;
        if (uniqueCode) {
            member = await dbGet(
                `SELECT name, email, phone, address, birthday, occupation, gender,
                        nationality, department, uniqueCode
                 FROM attendance_local
                 WHERE uniqueCode = ?
                 ORDER BY createdAt DESC
                 LIMIT 1`,
                [uniqueCode]
            );
        } else {
            member = await dbGet(
                `SELECT name, email, phone, address, birthday, occupation, gender,
                        nationality, department, uniqueCode
                 FROM attendance_local
                 WHERE phone = ?
                 ORDER BY createdAt DESC
                 LIMIT 1`,
                [phone]
            );
        }

        if (!member) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Check if already checked in for this event
        const existing = await dbGet(
            `SELECT id FROM attendance_local
             WHERE eventId = ? AND (uniqueCode = ? OR phone = ?)`,
            [activeEvent.id, member.uniqueCode || '', member.phone || '']
        );

        if (existing) {
            return res.status(409).json({ error: 'Member already checked in for this event' });
        }

        // Insert attendance record for the current event
        const id = uuidv4();
        const now = new Date().toISOString();

        await dbRun(
            `INSERT INTO attendance_local
             (id, eventId, name, email, phone, address, birthday, occupation,
              gender, nationality, department, uniqueCode, type, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id,
                activeEvent.id,
                member.name,
                member.email || '',
                member.phone || '',
                member.address || '',
                member.birthday || '',
                member.occupation || '',
                member.gender || '',
                member.nationality || '',
                member.department || '',
                member.uniqueCode || '',
                'member',
                now
            ]
        );

        res.status(201).json({
            success: true,
            id,
            member: {
                name: member.name,
                uniqueCode: member.uniqueCode,
                phone: member.phone
            }
        });
    } catch (err) {
        console.error('POST /api/checkin/mark error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
