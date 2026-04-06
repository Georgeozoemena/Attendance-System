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
            run: (sql, params, cb) => {
                client.execute({ sql, args: params })
                    .then(r => cb && cb.call({ lastID: Number(r.lastInsertRowid), changes: r.rowsAffected }, null))
                    .catch(e => cb && cb(e));
            },
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

// Initialize tables — run sequentially using the promisified dbRun
async function initializeDatabase() {
    const initSql = [
        `CREATE TABLE IF NOT EXISTS message_templates (id TEXT PRIMARY KEY, name TEXT NOT NULL, message TEXT NOT NULL, channel TEXT DEFAULT 'both', created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS scheduled_messages (id TEXT PRIMARY KEY, message TEXT NOT NULL, channel TEXT NOT NULL, recipient_count INTEGER, scheduled_time TEXT NOT NULL, status TEXT DEFAULT 'pending', sent_count INTEGER DEFAULT 0, failed_count INTEGER DEFAULT 0, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS message_history (id TEXT PRIMARY KEY, message TEXT NOT NULL, channel TEXT NOT NULL, recipient_count INTEGER, status TEXT, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            start_time TEXT,
            status TEXT DEFAULT 'active',
            expiry_duration INTEGER DEFAULT 0,
            is_frozen INTEGER DEFAULT 0,
            freeze_started_at TEXT,
            total_frozen_ms INTEGER DEFAULT 0,
            created_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS attendance_local (
            id TEXT PRIMARY KEY,
            eventId TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            phone TEXT NOT NULL,
            address TEXT,
            birthday TEXT,
            occupation TEXT,
            firstTimer BOOLEAN,
            gender TEXT,
            nationality TEXT,
            department TEXT,
            type TEXT DEFAULT 'member',
            uniqueCode TEXT,
            createdAt TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS testimonies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            category TEXT DEFAULT 'general',
            content TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            eventRef TEXT,
            createdAt TEXT NOT NULL,
            reviewedAt TEXT,
            reviewedBy TEXT
        )`
    ];

    for (const sql of initSql) {
        try { await dbRun(sql); } catch (e) { console.warn('Init SQL warning:', e.message); }
    }

    // Indexes
    const indexes = [
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON attendance_local (phone, eventId)`,
        `CREATE INDEX IF NOT EXISTS idx_attendance_uniqueCode ON attendance_local (uniqueCode)`
    ];
    for (const sql of indexes) {
        try { await dbRun(sql); } catch (e) { /* already exists */ }
    }

    // Schema migrations — ignore errors if column already exists
    const migrations = [
        `ALTER TABLE events ADD COLUMN start_time TEXT`,
        `ALTER TABLE attendance_local ADD COLUMN birthday TEXT`
    ];
    for (const sql of migrations) {
        try { await dbRun(sql); } catch (e) { /* column already exists */ }
    }

    console.log('Database initialized');
}

initializeDatabase().catch(err => console.error('Database initialization failed:', err));

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
