const sqlite3 = require('sqlite3');
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, '..', 'data', 'attendance.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database at', dbPath);
    }
});

// Initialize tables
db.serialize(() => {
    // Message templates table
    db.run(`
        CREATE TABLE IF NOT EXISTS message_templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            channel TEXT DEFAULT 'both',
            created_at TEXT
        )
    `);

    // Scheduled messages table
    db.run(`
        CREATE TABLE IF NOT EXISTS scheduled_messages (
            id TEXT PRIMARY KEY,
            message TEXT NOT NULL,
            channel TEXT NOT NULL,
            recipient_count INTEGER,
            scheduled_time TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            sent_count INTEGER DEFAULT 0,
            failed_count INTEGER DEFAULT 0,
            created_at TEXT
        )
    `);

    // Message history table
    db.run(`
        CREATE TABLE IF NOT EXISTS message_history (
            id TEXT PRIMARY KEY,
            message TEXT NOT NULL,
            channel TEXT NOT NULL,
            recipient_count INTEGER,
            status TEXT,
            created_at TEXT
        )
    `);

    // Events table
    db.run(`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TEXT
        )
    `);

    console.log('Messaging tables initialized');
});

// Promisify db methods for cleaner async/await usage
const dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
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
