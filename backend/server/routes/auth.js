const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbRun } = require('../database');

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip) {
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || { count: 0, resetTime: now + WINDOW_MS };

    if (now > attempts.resetTime) {
        loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return false;
    }

    if (attempts.count >= MAX_ATTEMPTS) {
        return true;
    }

    attempts.count++;
    loginAttempts.set(ip, attempts);
    return false;
}

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    if (isRateLimited(clientIp)) {
        return res.status(429).json({
            error: 'Too many login attempts. Please try again in 15 minutes.'
        });
    }

    if (!email || !password) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    try {
        // Look up user by email
        const user = await dbGet('SELECT * FROM users WHERE email = ?', [email]);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Verify password
        let passwordMatch;
        try {
            passwordMatch = await bcrypt.compare(password, user.password_hash);
        } catch (err) {
            console.error('bcrypt compare error:', err);
            return res.status(500).json({ error: 'Login failed' });
        }

        if (!passwordMatch) {
            console.warn(`Failed login attempt for ${email} from ${clientIp} at ${new Date().toISOString()}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if account is active
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated. Contact your administrator.' });
        }

        // Issue JWT
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('FATAL: JWT_SECRET environment variable is not set');
            return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET not set' });
        }

        const payload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: '8h' });

        // Update last_login
        const now = new Date().toISOString();
        await dbRun('UPDATE users SET last_login = ? WHERE id = ?', [now, user.id]);

        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * Stub for backward compatibility — the old middleware imported verifySessionToken from this module.
 * The new JWT-based middleware no longer uses it.
 */
function verifySessionToken() {
    return null;
}

router.verifySessionToken = verifySessionToken;
module.exports = router;
module.exports.verifySessionToken = verifySessionToken;
