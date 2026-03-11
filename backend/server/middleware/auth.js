const adminPassword = process.env.ADMIN_PASSWORD;

function authMiddleware(req, res, next) {
    // Validate that admin password is configured in production
    if (!adminPassword) {
        console.error('FATAL: ADMIN_PASSWORD environment variable is not set');
        return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD not set' });
    }

    const authHeader = req.headers['authorization'] || req.headers['x-admin-key'] || req.query.key;

    if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }

    if (authHeader === adminPassword) {
        next();
    } else {
        // Log failed authentication attempts
        console.warn(`Failed admin auth attempt from ${req.ip} at ${new Date().toISOString()}`);
        res.status(401).json({ error: 'Unauthorized: Invalid admin key' });
    }
}

module.exports = authMiddleware;
