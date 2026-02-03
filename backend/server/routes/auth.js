const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        return res.status(500).json({ error: 'Server misconfigured: ADMIN_PASSWORD not set' });
    }

    if (password === adminPassword) {
        // In a real app we'd use JWT, but for simplicity and high security requirement 
        // we'll return a success and the user will store the password (or a hash) in localStorage 
        // to send in headers. Or we just return the password itself as the 'token' for now 
        // if it's a single-user system. Better: return a simple success.
        res.json({ success: true, token: adminPassword }); // Simple approach
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

module.exports = router;
