const express = require('express');
const router = express.Router();
const crypto = require('crypto');

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

/**
 * Generate a cryptographically signed session token.
 * Format: <expiry>.<hmac>
 */
function generateSessionToken(expiry) {
    const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
    const payload = String(expiry);
    const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    return `${payload}.${hmac}`;
}

/**
 * Verify a session token. Returns expiry timestamp or null if invalid.
 */
function verifySessionToken(token) {
    try {
        const [payload, hmac] = token.split('.');
        if (!payload || !hmac) return null;
        const secret = process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD;
        const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        // Constant-time comparison to prevent timing attacks
        if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null;
        return parseInt(payload, 10);
    } catch {
        return null;
    }
}

router.post('/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const clientIp = req.ip || req.connection.remoteAddress;

    if (isRateLimited(clientIp)) {
        return res.status(429).json({
            error: 'Too many login attempts. Please try again in 15 minutes.'
        });
    }

    if (!adminPassword) {
        return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD not set' });
    }

    if (!password || typeof password !== 'string') {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Constant-time comparison to prevent timing attacks
    const passwordMatch = password.length === adminPassword.length &&
        crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));

    if (passwordMatch) {
        const expiresAt = Date.now() + 4 * 60 * 60 * 1000; // 4 hours
        const token = generateSessionToken(expiresAt);
        res.json({
            success: true,
            token,
            expiresAt
        });
    } else {
        console.warn(`Failed admin login from ${clientIp} at ${new Date().toISOString()}`);
        res.status(401).json({ error: 'Invalid password' });
    }
});

module.exports = router;
module.exports.verifySessionToken = verifySessionToken;
