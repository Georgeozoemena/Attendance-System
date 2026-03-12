const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

// Create database connection
const dbPath = path.join(__dirname, '..', 'data', 'attendance.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

let db;
const useTurso = process.env.LIBSQL_URL && process.env.LIBSQL_AUTH_TOKEN;

if (useTurso) {
    console.log('Connecting to Turso Cloud Database...');
    // Note: User will need to run 'npm install @libsql/client'
    try {
        const { createClient } = require('@libsql/client');
        const client = createClient({
            url: process.env.LIBSQL_URL,
            authToken: process.env.LIBSQL_AUTH_TOKEN,
        });

        // Mock the sqlite3 interface for basic queries if possible, 
        // or provide Turso-specific methods.
        // For now, we will stick to a simplified wrapper.
        db = {
            run: (sql, params, cb) => client.execute({ sql, args: params }).then(r => cb && cb(null)).catch(e => cb && cb(e)),
            all: (sql, params, cb) => client.execute({ sql, args: params }).then(r => cb && cb(null, r.rows)).catch(e => cb && cb(e)),
            get: (sql, params, cb) => client.execute({ sql, args: params }).then(r => cb && cb(null, r.rows[0])).catch(e => cb && cb(e)),
            serialize: (fn) => fn()
        };
    } catch (e) {
        console.error('Failed to initialize Turso client. Make sure @libsql/client is installed.', e.message);
        process.exit(1);
    }
} else {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
        } else {
            console.log('Connected to local SQLite database at', dbPath);
        }
    });
}

// Initialize tables
db.serialize(() => {
    const initSql = [
        `CREATE TABLE IF NOT EXISTS message_templates (id TEXT PRIMARY KEY, name TEXT NOT NULL, message TEXT NOT NULL, channel TEXT DEFAULT 'both', created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS scheduled_messages (id TEXT PRIMARY KEY, message TEXT NOT NULL, channel TEXT NOT NULL, recipient_count INTEGER, scheduled_time TEXT NOT NULL, status TEXT DEFAULT 'pending', sent_count INTEGER DEFAULT 0, failed_count INTEGER DEFAULT 0, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS message_history (id TEXT PRIMARY KEY, message TEXT NOT NULL, channel TEXT NOT NULL, recipient_count INTEGER, status TEXT, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, date TEXT NOT NULL, status TEXT DEFAULT 'active', created_at TEXT)`
    ];

    initSql.forEach(sql => {
        if (useTurso) {
            db.run(sql);
        } else {
            db.run(sql);
        }
    });

    console.log('Database initialized');
});

// Promisify db methods
const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
        });
    });
};

const dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
};

const dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

module.exports = {
    db,
    dbAll,
    dbRun,
    dbGet
};
