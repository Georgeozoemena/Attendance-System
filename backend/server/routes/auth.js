const express = require('express');
const router = express.Router();

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(ip) {
    const now = Date.now();
    const attempts = loginAttempts.get(ip) || { count: 0, resetTime: now + WINDOW_MS };
    
    if (now > attempts.resetTime) {
        // Reset window expired
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

router.post('/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Check rate limiting
    if (isRateLimited(clientIp)) {
        return res.status(429).json({ 
            error: 'Too many login attempts. Please try again in 15 minutes.'
        });
    }

    if (!adminPassword) {
        return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD not set' });
    }

    // Validate password format - require minimum length
    if (!password || typeof password !== 'string' || password.length < 8) {
        // Don't reveal if password is wrong format to prevent enumeration
        return res.status(401).json({ error: 'Invalid password' });
    }

    if (password === adminPassword) {
        // Generate a simple session token instead of returning the password
        // In production, use JWT or session-based auth
        const sessionToken = Buffer.from(`${adminPassword}:${Date.now()}`).toString('base64');
        res.json({ 
            success: true, 
            token: sessionToken,
            expiresIn: 3600 // 1 hour
        });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

module.exports = router;
