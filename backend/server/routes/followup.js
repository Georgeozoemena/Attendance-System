const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { logAudit } = require('../helpers/auditLogger');

const router = express.Router();

const VALID_ACTION_TYPES = ['called', 'visited', 'note', 'resolved'];
const VALID_STATUSES = ['pending', 'in_progress', 'resolved'];

// All routes require authentication and developer or followup_head role
router.use(authMiddleware, requireRole('developer', 'followup_head'));

/**
 * GET /api/followup-logs
 * List follow-up log entries.
 * - followup_head: only sees their own entries (done_by = req.user.id)
 * - developer: can filter by done_by and other params
 * Query params: status, action_type, date_from, date_to, done_by (developer only)
 */
router.get('/', async (req, res) => {
    try {
        const { status, action_type, date_from, date_to, done_by } = req.query;
        const isFollowupHead = req.user.role === 'followup_head';

        const conditions = [];
        const params = [];

        // followup_head is always scoped to their own entries
        if (isFollowupHead) {
            conditions.push('fl.done_by = ?');
            params.push(req.user.id);
        } else if (done_by) {
            // developer can filter by done_by
            conditions.push('fl.done_by = ?');
            params.push(done_by);
        }

        if (status) {
            conditions.push('fl.status = ?');
            params.push(status);
        }
        if (action_type) {
            conditions.push('fl.action_type = ?');
            params.push(action_type);
        }
        if (date_from) {
            conditions.push('fl.created_at >= ?');
            params.push(date_from);
        }
        if (date_to) {
            conditions.push('fl.created_at <= ?');
            params.push(date_to);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const logs = await dbAll(
            `SELECT fl.id, fl.member_id, fl.action_type, fl.note, fl.done_by,
                    fl.status, fl.created_at,
                    u.name AS done_by_name
             FROM followup_logs fl
             LEFT JOIN users u ON fl.done_by = u.id
             ${where}
             ORDER BY fl.created_at DESC`,
            params
        );

        res.json(logs);
    } catch (err) {
        console.error('GET /api/followup-logs error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/followup-logs/export
 * Return JSON array for PDF generation, scoped same as GET /.
 * Must be defined BEFORE /:id to avoid route conflict.
 */
router.get('/export', async (req, res) => {
    try {
        const { status, action_type, date_from, date_to, done_by } = req.query;
        const isFollowupHead = req.user.role === 'followup_head';

        const conditions = [];
        const params = [];

        if (isFollowupHead) {
            conditions.push('fl.done_by = ?');
            params.push(req.user.id);
        } else if (done_by) {
            conditions.push('fl.done_by = ?');
            params.push(done_by);
        }

        if (status) {
            conditions.push('fl.status = ?');
            params.push(status);
        }
        if (action_type) {
            conditions.push('fl.action_type = ?');
            params.push(action_type);
        }
        if (date_from) {
            conditions.push('fl.created_at >= ?');
            params.push(date_from);
        }
        if (date_to) {
            conditions.push('fl.created_at <= ?');
            params.push(date_to);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const logs = await dbAll(
            `SELECT fl.id, fl.member_id, fl.action_type, fl.note, fl.done_by,
                    fl.status, fl.created_at,
                    u.name AS done_by_name
             FROM followup_logs fl
             LEFT JOIN users u ON fl.done_by = u.id
             ${where}
             ORDER BY fl.created_at DESC`,
            params
        );

        res.json(logs);
    } catch (err) {
        console.error('GET /api/followup-logs/export error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/followup-logs
 * Create a new follow-up log entry.
 * Body: { member_id, action_type, note?, status? }
 * Sets done_by = req.user.id automatically.
 */
router.post('/', async (req, res) => {
    const { member_id, action_type, note, status = 'pending' } = req.body;

    if (!member_id) {
        return res.status(400).json({ error: 'member_id is required' });
    }
    if (!action_type) {
        return res.status(400).json({ error: 'action_type is required' });
    }
    if (!VALID_ACTION_TYPES.includes(action_type)) {
        return res.status(400).json({ error: `Invalid value for field: action_type. Must be one of: ${VALID_ACTION_TYPES.join(', ')}` });
    }
    if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid value for field: status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    try {
        const id = uuidv4();
        await dbRun(
            `INSERT INTO followup_logs (id, member_id, action_type, note, done_by, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, member_id, action_type, note || null, req.user.id, status]
        );

        await logAudit(req, 'create', 'followup_logs', id);
        res.status(201).json({ success: true, id });
    } catch (err) {
        console.error('POST /api/followup-logs error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/followup-logs/:id
 * Update status and/or note.
 * followup_head can only update their own entries.
 * Body: { status?, note? }
 */
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, note } = req.body;

    if (status === undefined && note === undefined) {
        return res.status(400).json({ error: 'At least one of status or note must be provided' });
    }

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid value for field: status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    try {
        const entry = await dbGet('SELECT id, done_by FROM followup_logs WHERE id = ?', [id]);
        if (!entry) {
            return res.status(404).json({ error: 'Follow-up log entry not found' });
        }

        // followup_head can only update their own entries
        if (req.user.role === 'followup_head' && entry.done_by !== req.user.id) {
            return res.status(403).json({ error: 'Forbidden: You can only update your own entries' });
        }

        const fields = [];
        const params = [];

        if (status !== undefined) {
            fields.push('status = ?');
            params.push(status);
        }
        if (note !== undefined) {
            fields.push('note = ?');
            params.push(note);
        }

        params.push(id);
        await dbRun(`UPDATE followup_logs SET ${fields.join(', ')} WHERE id = ?`, params);

        await logAudit(req, 'update', 'followup_logs', id);
        res.json({ success: true });
    } catch (err) {
        console.error('PATCH /api/followup-logs/:id error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
