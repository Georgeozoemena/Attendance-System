const { dbRun } = require('../database');
const { v4: uuidv4 } = require('uuid');

async function logAudit(req, action, module, targetId = null) {
  try {
    const userId = req.user?.id || 'unknown';
    const role = req.user?.role || 'unknown';
    const ip = req.ip || req.connection?.remoteAddress || null;
    await dbRun(
      `INSERT INTO audit_logs (id, user_id, role, action, module, target_id, ip_address) VALUES (?,?,?,?,?,?,?)`,
      [uuidv4(), userId, role, action, module, targetId, ip]
    );
  } catch (err) {
    console.error('logAudit error (non-fatal):', err.message);
  }
}

module.exports = { logAudit };
