function authMiddleware(req, res, next) {
    const adminPassword = process.env.ADMIN_PASSWORD;

    // If password not set in env, we allow access but warn on console (for dev ease)
    if (!adminPassword) {
        return next();
    }

    const authHeader = req.headers['authorization'] || req.headers['x-admin-key'] || req.query.key;

    if (authHeader === adminPassword) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized: Admin access required' });
    }
}

module.exports = authMiddleware;
