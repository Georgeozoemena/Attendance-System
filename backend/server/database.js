const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// bcryptjs is installed in task 2; guard against it not being present yet
let bcrypt;
try { bcrypt = require('bcryptjs'); } catch(e) { console.warn('bcryptjs not yet installed, skipping seed'); }

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
        )`,
        `CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('developer','church_admin','followup_head','pastor','usher')),
            is_active INTEGER NOT NULL DEFAULT 1,
            last_login TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            created_by TEXT REFERENCES users(id)
        )`,
        `CREATE TABLE IF NOT EXISTS followup_logs (
            id TEXT PRIMARY KEY,
            member_id TEXT NOT NULL,
            action_type TEXT NOT NULL CHECK(action_type IN ('called','visited','note','resolved')),
            note TEXT,
            done_by TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','in_progress','resolved')),
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )`,
        `CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            action TEXT NOT NULL CHECK(action IN ('create','update','delete','export')),
            module TEXT NOT NULL,
            target_id TEXT,
            ip_address TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
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
        `ALTER TABLE attendance_local ADD COLUMN birthday TEXT`,
        `ALTER TABLE departments ADD COLUMN leaderPhone TEXT`,
        `ALTER TABLE departments ADD COLUMN meetingDay TEXT`,
        `ALTER TABLE departments ADD COLUMN meetingTime TEXT`,
        `ALTER TABLE departments ADD COLUMN leaderPhoto TEXT`
    ];
    for (const sql of migrations) {
        try { await dbRun(sql); } catch (e) { /* column already exists */ }
    }

    await seedUsers();
    console.log('Database initialized');
}

async function seedUsers() {
    try {
        if (!bcrypt) {
            console.warn('bcryptjs not available, skipping user seed');
            return;
        }

        const row = await dbGet('SELECT COUNT(*) as count FROM users');
        if (row && row.count > 0) return; // idempotent — already seeded

        const seedAccounts = [
            { email: 'developer@dominioncity.com', password: 'Dev@2025!',    name: 'Developer',    role: 'developer' },
            { email: 'admin@dominioncity.com',     password: 'Admin@2025!',  name: 'Church Admin', role: 'church_admin' },
            { email: 'followup@dominioncity.com',  password: 'Follow@2025!', name: 'Follow-Up Head', role: 'followup_head' },
            { email: 'pastor@dominioncity.com',    password: 'Pastor@2025!', name: 'Pastor',       role: 'pastor' },
            { email: 'usher@dominioncity.com',     password: 'Usher@2025!',  name: 'Usher',        role: 'usher' },
        ];

        for (const account of seedAccounts) {
            const password_hash = await bcrypt.hash(account.password, 12);
            const id = uuidv4();
            await dbRun(
                `INSERT INTO users (id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
                [id, account.name, account.email, password_hash, account.role]
            );
        }

        console.log('Seed users created successfully');
    } catch (err) {
        console.error('seedUsers error:', err.message);
    }
}

// Export the ready promise so index.js can wait before starting the server
const dbReady = initializeDatabase().catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
});

module.exports = { db, dbAll, dbRun, dbGet, dbReady };
