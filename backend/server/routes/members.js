const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { dbAll, dbRun, dbGet } = require('../database');
const auth = require('../middleware/auth');

// GET /api/members/profiles — full member profiles
router.get('/profiles', auth, async (req, res) => {
    try {
        const members = await dbAll('SELECT * FROM members ORDER BY name ASC');
        res.json(members);
    } catch (err) {
        console.error('Members fetch failed', err);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

// GET /api/members/profiles/birthdays — upcoming birthdays (next 30 days)
router.get('/profiles/birthdays', auth, async (req, res) => {
    try {
        const members = await dbAll(`SELECT id, name, phone, birthday, department FROM members WHERE birthday IS NOT NULL AND birthday != ''`);
        const today = new Date();
        const upcoming = members.filter(m => {
            if (!m.birthday) return false;
            try {
                const bday = new Date(m.birthday);
                const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
                const nextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
                const next = thisYear >= today ? thisYear : nextYear;
                const diff = (next - today) / (1000 * 60 * 60 * 24);
                return diff <= 30;
            } catch { return false; }
        }).map(m => {
            const bday = new Date(m.birthday);
            const thisYear = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
            const nextYear = new Date(today.getFullYear() + 1, bday.getMonth(), bday.getDate());
            const next = thisYear >= today ? thisYear : nextYear;
            const daysUntil = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
            return { ...m, daysUntil, nextBirthday: next.toISOString().split('T')[0] };
        }).sort((a, b) => a.daysUntil - b.daysUntil);
        res.json(upcoming);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch birthdays' });
    }
});

// GET /api/members/profiles/first-timers — follow-up pipeline
router.get('/profiles/first-timers', auth, async (req, res) => {
    try {
        const { status } = req.query;
        const rows = status && status !== 'all'
            ? await dbAll(`SELECT * FROM members WHERE followUpStatus = ? ORDER BY createdAt DESC`, [status])
            : await dbAll(`SELECT * FROM members WHERE followUpStatus != 'converted' ORDER BY createdAt DESC`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch first-timers' });
    }
});

// POST /api/members/profiles — create or upsert member profile
router.post('/profiles', auth, async (req, res) => {
    const { uniqueCode, name, email, phone, address, birthday, occupation, gender, nationality, department, type, notes, followUpStatus } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    try {
        const now = new Date().toISOString();
        // Check if member with this uniqueCode already exists
        const existing = uniqueCode ? await dbGet('SELECT id FROM members WHERE uniqueCode = ?', [uniqueCode]) : null;

        if (existing) {
            await dbRun(`UPDATE members SET name=?, email=?, phone=?, address=?, birthday=?, occupation=?, gender=?, nationality=?, department=?, type=?, notes=?, followUpStatus=?, updatedAt=? WHERE uniqueCode=?`,
                [name, email, phone, address, birthday, occupation, gender, nationality, department, type || 'member', notes, followUpStatus || 'none', now, uniqueCode]);
            res.json({ success: true, id: existing.id });
        } else {
            const id = uuidv4();
            await dbRun(`INSERT INTO members (id, uniqueCode, name, email, phone, address, birthday, occupation, gender, nationality, department, type, status, followUpStatus, joinDate, notes, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                [id, uniqueCode || null, name, email, phone, address, birthday, occupation, gender, nationality, department, type || 'member', 'active', followUpStatus || 'none', now.split('T')[0], notes, now, now]);
            res.status(201).json({ success: true, id });
        }
    } catch (err) {
        console.error('Member save failed', err);
        res.status(500).json({ error: 'Failed to save member' });
    }
});

// PATCH /api/members/profiles/:id — update follow-up status or notes
router.patch('/profiles/:id', auth, async (req, res) => {
    const { followUpStatus, notes, status, department, name, phone, email } = req.body;
    try {
        const existing = await dbGet('SELECT id FROM members WHERE id = ?', [req.params.id]);
        if (!existing) return res.status(404).json({ error: 'Member not found' });

        const fields = [];
        const vals = [];
        if (followUpStatus !== undefined) { fields.push('followUpStatus = ?'); vals.push(followUpStatus); }
        if (notes !== undefined) { fields.push('notes = ?'); vals.push(notes); }
        if (status !== undefined) { fields.push('status = ?'); vals.push(status); }
        if (department !== undefined) { fields.push('department = ?'); vals.push(department); }
        if (name !== undefined) { fields.push('name = ?'); vals.push(name); }
        if (phone !== undefined) { fields.push('phone = ?'); vals.push(phone); }
        if (email !== undefined) { fields.push('email = ?'); vals.push(email); }
        fields.push('updatedAt = ?'); vals.push(new Date().toISOString());
        vals.push(req.params.id);

        await dbRun(`UPDATE members SET ${fields.join(', ')} WHERE id = ?`, vals);
        res.json({ success: true });
    } catch (err) {
        console.error('Member update failed', err);
        res.status(500).json({ error: 'Failed to update member' });
    }
});

// POST /api/members/profiles/sync — sync from attendance_local into members table
router.post('/profiles/sync', auth, async (req, res) => {
    try {
        const records = await dbAll(`
            SELECT a.* FROM attendance_local a
            INNER JOIN (
                SELECT uniqueCode, MAX(createdAt) as maxDate
                FROM attendance_local WHERE uniqueCode IS NOT NULL AND uniqueCode != ''
                GROUP BY uniqueCode
            ) latest ON a.uniqueCode = latest.uniqueCode AND a.createdAt = latest.maxDate
        `);

        if (records.length === 0) return res.json({ success: true, created: 0, updated: 0 });

        // Fetch all existing uniqueCodes in one query
        const existingRows = await dbAll('SELECT id, uniqueCode, followUpStatus FROM members WHERE uniqueCode IS NOT NULL');
        const existingMap = new Map(existingRows.map(r => [r.uniqueCode, r]));

        let created = 0, updated = 0;
        const now = new Date().toISOString();

        for (const r of records) {
            if (!r.uniqueCode) continue;
            const existing = existingMap.get(r.uniqueCode);
            if (existing) {
                await dbRun(
                    `UPDATE members SET name=?, email=?, phone=?, address=?, birthday=?, occupation=?, gender=?, nationality=?, department=?, type=?, updatedAt=? WHERE uniqueCode=?`,
                    [r.name, r.email, r.phone, r.address, r.birthday, r.occupation, r.gender, r.nationality, r.department, r.type, now, r.uniqueCode]
                );
                updated++;
            } else {
                const isFirstTimer = r.firstTimer === 1 || r.firstTimer === true;
                await dbRun(
                    `INSERT INTO members (id, uniqueCode, name, email, phone, address, birthday, occupation, gender, nationality, department, type, status, followUpStatus, joinDate, notes, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                    [uuidv4(), r.uniqueCode, r.name, r.email, r.phone, r.address, r.birthday, r.occupation, r.gender, r.nationality, r.department, r.type, 'active', isFirstTimer ? 'new' : 'none', r.createdAt.split('T')[0], null, r.createdAt, now]
                );
                existingMap.set(r.uniqueCode, { id: 'new' }); // prevent duplicate inserts
                created++;
            }
        }
        res.json({ success: true, created, updated });
    } catch (err) {
        console.error('Sync failed', err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

module.exports = router;
