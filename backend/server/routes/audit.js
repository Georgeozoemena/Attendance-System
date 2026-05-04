const express = require('express');
const { dbAll } = require('../database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and developer role
router.use(authMiddleware, requireRole('developer'));

/**
 * GET /api/audit
 * List audit log entries in reverse chronological order.
 * Query params: date_from, date_to, user_id, role, action, module
 */
router.get('/', async (req, res) => {
    try {
        const { date_from, date_to, user_id, role, action, module: moduleName } = req.query;

        const conditions = [];
        const params = [];

        if (date_from) {
            conditions.push('al.created_at >= ?');
            params.push(date_from);
        }
        if (date_to) {
            conditions.push('al.created_at <= ?');
            params.push(date_to);
        }
        if (user_id) {
            conditions.push('al.user_id = ?');
            params.push(user_id);
        }
        if (role) {
            conditions.push('al.role = ?');
            params.push(role);
        }
        if (action) {
            conditions.push('al.action = ?');
            params.push(action);
        }
        if (moduleName) {
            conditions.push('al.module = ?');
            params.push(moduleName);
        }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        const entries = await dbAll(
            `SELECT al.id, al.user_id, al.role, al.action, al.module,
                    al.target_id, al.ip_address, al.created_at,
                    u.name AS user_name, u.email AS user_email
             FROM audit_logs al
             LEFT JOIN users u ON al.user_id = u.id
             ${where}
             ORDER BY al.created_at DESC`,
            params
        );

        res.json(entries);
    } catch (err) {
        console.error('GET /api/audit error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE and PATCH are not allowed on audit logs — return 405 Method Not Allowed
 */
router.delete('/', (req, res) => {
    res.status(405).json({ error: 'Method Not Allowed: Audit log entries cannot be deleted' });
});

router.delete('/:id', (req, res) => {
    res.status(405).json({ error: 'Method Not Allowed: Audit log entries cannot be deleted' });
});

router.patch('/', (req, res) => {
    res.status(405).json({ error: 'Method Not Allowed: Audit log entries cannot be modified' });
});

router.patch('/:id', (req, res) => {
    res.status(405).json({ error: 'Method Not Allowed: Audit log entries cannot be modified' });
});

module.exports = router;
