const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { logAudit } = require('../helpers/auditLogger');

const router = express.Router();

const VALID_ROLES = ['developer', 'church_admin', 'followup_head', 'pastor', 'usher'];

// All routes require authentication and developer role
router.use(authMiddleware, requireRole('developer'));

/**
 * GET /api/users
 * List all users — returns id, name, email, role, is_active, last_login, created_at (NOT password_hash)
 */
router.get('/', async (req, res) => {
    try {
        const users = await dbAll(
            `SELECT id, name, email, role, is_active, last_login, created_at
             FROM users
             ORDER BY created_at DESC`
        );
        res.json(users);
    } catch (err) {
        console.error('GET /api/users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/users
 * Create a new user.
 * Body: { name, email, role, password? }
 * Returns: { success: true, id, tempPassword? }
 */
router.post('/', async (req, res) => {
    const { name, email, role, password } = req.body;

    if (!name || !email || !role) {
        return res.status(400).json({ error: 'name, email, and role are required' });
    }

    if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    // Check for duplicate email
    try {
        const existing = await dbGet('SELECT id FROM users WHERE email = ?', [email]);
        if (existing) {
            return res.status(409).json({ error: 'A user with that email already exists' });
        }
    } catch (err) {
        console.error('POST /api/users duplicate check error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }

    // Generate temp password if not provided
    let tempPassword = null;
    const plainPassword = password || (() => {
        tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase() + '!';
        return tempPassword;
    })();

    try {
        const password_hash = await bcrypt.hash(plainPassword, 12);
        const id = uuidv4();

        await dbRun(
            `INSERT INTO users (id, name, email, password_hash, role, created_by)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, name, email, password_hash, role, req.user.id]
        );

        const response = { success: true, id };
        if (tempPassword !== null) {
            response.tempPassword = tempPassword;
        }

        await logAudit(req, 'create', 'users', id);
        res.status(201).json(response);
    } catch (err) {
        console.error('POST /api/users insert error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/users/:id
 * Update a user's role and/or is_active status.
 * Body: { role?, is_active? }
 */
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { role, is_active } = req.body;

    if (role === undefined && is_active === undefined) {
        return res.status(400).json({ error: 'At least one of role or is_active must be provided' });
    }

    if (role !== undefined && !VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}` });
    }

    try {
        const user = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const fields = [];
        const params = [];

        if (role !== undefined) {
            fields.push('role = ?');
            params.push(role);
        }
        if (is_active !== undefined) {
            fields.push('is_active = ?');
            params.push(is_active ? 1 : 0);
        }

        params.push(id);
        await dbRun(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

        await logAudit(req, 'update', 'users', id);
        res.json({ success: true });
    } catch (err) {
        console.error('PATCH /api/users/:id error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * DELETE /api/users/:id
 * Delete a user. Cannot delete yourself.
 */
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (req.user.id === id) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    try {
        const user = await dbGet('SELECT id FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await dbRun('DELETE FROM users WHERE id = ?', [id]);
        await logAudit(req, 'delete', 'users', id);
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/users/:id error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
