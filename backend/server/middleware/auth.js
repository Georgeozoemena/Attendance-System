const jwt = require('jsonwebtoken');
const { dbGet } = require('../database');

/**
 * JWT authentication middleware.
 * Extracts the token from `Authorization: Bearer <token>`, verifies it,
 * checks that the user is still active, and attaches the decoded payload
 * to `req.user`.
 */
async function authMiddleware(req, res, next) {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        console.error('FATAL: JWT_SECRET environment variable is not set');
        return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET not set' });
    }

    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.slice(7); // strip "Bearer "

    let decoded;
    try {
        decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Unauthorized: Token expired, please log in again' });
        }
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    // Confirm the user is still active in the database
    try {
        const user = await dbGet('SELECT is_active FROM users WHERE id = ?', [decoded.id]);

        if (!user || !user.is_active) {
            return res.status(403).json({ error: 'Forbidden: Account is deactivated' });
        }
    } catch (err) {
        console.error('authMiddleware DB error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }

    req.user = decoded;
    next();
}

/**
 * Role-based access control middleware factory.
 * Returns a middleware that allows only users whose role is in the provided list.
 *
 * Usage: router.get('/protected', requireRole('developer', 'church_admin'), handler)
 *
 * @param {...string} roles - Allowed roles
 */
function requireRole(...roles) {
    return function roleGuard(req, res, next) {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
        next();
    };
}

module.exports = authMiddleware;
module.exports.authMiddleware = authMiddleware;
module.exports.requireRole = requireRole;
