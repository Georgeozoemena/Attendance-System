const { verifySessionToken } = require('../routes/auth');

const adminPassword = process.env.ADMIN_PASSWORD;

function authMiddleware(req, res, next) {
    if (!adminPassword) {
        console.error('FATAL: ADMIN_PASSWORD environment variable is not set');
        return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD not set' });
    }

    const token = req.headers['authorization'] || req.headers['x-admin-key'] || req.query.key;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    // Verify signed session token
    const expiry = verifySessionToken(token);
    if (expiry === null) {
        console.warn(`Invalid admin token from ${req.ip} at ${new Date().toISOString()}`);
        return res.status(401).json({ error: 'Unauthorized: Invalid or malformed token' });
    }

    if (Date.now() > expiry) {
        return res.status(401).json({ error: 'Unauthorized: Session expired, please log in again' });
    }

    next();
}

module.exports = authMiddleware;
