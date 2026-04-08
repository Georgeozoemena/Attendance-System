const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'attendance.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let db;
const useTurso = process.env.LIBSQL_URL && process.env.LIBSQL_AUTH_TOKEN;

if (useTurso) {
    console.log('Connecting to Turso Cloud Database...');
    try {
        const { createClient } = require('@libsql/client');
        const client = createClient({
            url: process.env.LIBSQL_URL,
            authToken: process.env.LIBSQL_AUTH_TOKEN,
        });
        db = {
            run: (sql, params, cb) => {
                client.execute({ sql, args: params || [] })
                    .then(r => cb && cb.call({ lastID: Number(r.lastInsertRowid), changes: r.rowsAffected }, null))
                    .catch(e => cb && cb(e));
            },
            all: (sql, params, cb) => client.execute({ sql, args: params || [] }).then(r => cb && cb(null, r.rows)).catch(e => cb && cb(e)),
            get: (sql, params, cb) => client.execute({ sql, args: params || [] }).then(r => cb && cb(null, r.rows[0])).catch(e => cb && cb(e)),
        };
    } catch (e) {
        console.error('Failed to initialize Turso client:', e.message);
        process.exit(1);
    }
} else {
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) console.error('Error opening database:', err);
        else console.log('Connected to local SQLite database at', dbPath);
    });
}

// Promisified helpers — defined before initializeDatabase so it can use them
const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows || []));
});

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
    db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});

// Initialize tables sequentially — awaits each statement
async function initializeDatabase() {
    const tables = [
        `CREATE TABLE IF NOT EXISTS message_templates (id TEXT PRIMARY KEY, name TEXT NOT NULL, message TEXT NOT NULL, channel TEXT DEFAULT 'both', created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS scheduled_messages (id TEXT PRIMARY KEY, message TEXT NOT NULL, channel TEXT NOT NULL, recipient_count INTEGER, scheduled_time TEXT NOT NULL, status TEXT DEFAULT 'pending', sent_count INTEGER DEFAULT 0, failed_count INTEGER DEFAULT 0, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS message_history (id TEXT PRIMARY KEY, message TEXT NOT NULL, channel TEXT NOT NULL, recipient_count INTEGER, status TEXT, created_at TEXT)`,
        `CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, type TEXT NOT NULL, date TEXT NOT NULL,
            start_time TEXT, status TEXT DEFAULT 'active', expiry_duration INTEGER DEFAULT 0,
            is_frozen INTEGER DEFAULT 0, freeze_started_at TEXT, total_frozen_ms INTEGER DEFAULT 0, created_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS attendance_local (
            id TEXT PRIMARY KEY, eventId TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL,
            phone TEXT NOT NULL, address TEXT, birthday TEXT, occupation TEXT, firstTimer BOOLEAN,
            gender TEXT, nationality TEXT, department TEXT, type TEXT DEFAULT 'member',
            uniqueCode TEXT, createdAt TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS testimonies (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, category TEXT DEFAULT 'general',
            content TEXT NOT NULL, status TEXT DEFAULT 'pending', eventRef TEXT,
            createdAt TEXT NOT NULL, reviewedAt TEXT, reviewedBy TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS members (
            id TEXT PRIMARY KEY,
            uniqueCode TEXT UNIQUE,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            address TEXT,
            birthday TEXT,
            occupation TEXT,
            gender TEXT,
            nationality TEXT,
            department TEXT,
            type TEXT DEFAULT 'member',
            status TEXT DEFAULT 'active',
            followUpStatus TEXT DEFAULT 'none',
            joinDate TEXT,
            notes TEXT,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS giving (
            id TEXT PRIMARY KEY,
            memberId TEXT,
            memberName TEXT NOT NULL,
            phone TEXT,
            amount REAL NOT NULL,
            type TEXT DEFAULT 'tithe',
            eventId TEXT,
            notes TEXT,
            recordedBy TEXT,
            createdAt TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS prayer_requests (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            category TEXT DEFAULT 'general',
            request TEXT NOT NULL,
            anonymous INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            eventRef TEXT,
            createdAt TEXT NOT NULL,
            prayedAt TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            leaderId TEXT,
            leaderName TEXT,
            createdAt TEXT NOT NULL
        )`
    ];

    for (const sql of tables) {
        try { await dbRun(sql); } catch (e) { console.warn('Table init warning:', e.message); }
    }

    const indexes = [
        `CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON attendance_local (phone, eventId)`,
        `CREATE INDEX IF NOT EXISTS idx_attendance_uniqueCode ON attendance_local (uniqueCode)`
    ];
    for (const sql of indexes) {
        try { await dbRun(sql); } catch (e) { /* already exists */ }
    }

    const migrations = [
        `ALTER TABLE events ADD COLUMN start_time TEXT`,
        `ALTER TABLE attendance_local ADD COLUMN birthday TEXT`
    ];
    for (const sql of migrations) {
        try { await dbRun(sql); } catch (e) { /* column already exists */ }
    }

    console.log('Database initialized');
}

// Export the ready promise so index.js can wait before starting the server
const dbReady = initializeDatabase().catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
});

module.exports = { db, dbAll, dbRun, dbGet, dbReady };
