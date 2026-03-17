const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { dbAll } = require('../database');

/**
 * GET /api/analytics/insights
 * Returns behavioral insights for better attendee engagement
 */
router.get('/insights', auth, async (req, res) => {
    try {
        const allRecords = await dbAll('SELECT * FROM attendance_local ORDER BY createdAt DESC');
        const allEvents = await dbAll('SELECT * FROM events WHERE status = "active" ORDER BY date DESC LIMIT 10');

        if (allRecords.length === 0 || allEvents.length === 0) {
            return res.json({ atRisk: [], loyal: [], recentFirstTimers: [] });
        }

        const latestEventDate = allEvents[0].date;
        const prevEventDate = allEvents[1]?.date;
        const twoWeeksAgoDate = allEvents[2]?.date;

        const membersMap = new Map();
        allRecords.forEach(r => {
            const code = r.uniqueCode;
            if (!code) return;
            if (!membersMap.has(code)) {
                membersMap.set(code, {
                    uniqueCode: code,
                    name: r.name,
                    phone: r.phone,
                    email: r.email,
                    type: r.type,
                    lastSeen: r.createdAt,
                    dates: new Set(),
                    firstTimer: !!r.firstTimer
                });
            }
            membersMap.get(code).dates.add(r.createdAt.split('T')[0]);
        });

        const insights = {
            atRisk: [], // Missed last 2 services but were regulars
            loyal: [],  // On a streak of 3+
            recentFirstTimers: []
        };

        membersMap.forEach(member => {
            const dates = Array.from(member.dates).sort().reverse();
            
            // 1. Calculate Streak
            let streak = 0;
            for (const event of allEvents) {
                if (member.dates.has(event.date)) streak++;
                else break;
            }
            if (streak >= 3) {
                insights.loyal.push({ ...member, streak });
            }

            // 2. Identify At Risk
            // If they haven't shown up in the last 2 events but have attended at least 3 times total
            const hasAttendedLast = member.dates.has(latestEventDate);
            const hasAttendedPrev = prevEventDate ? member.dates.has(prevEventDate) : true;
            
            if (!hasAttendedLast && !hasAttendedPrev && member.dates.size >= 3) {
                insights.atRisk.push({ ...member, streak: 0 });
            }

            // 3. Recent First Timers
            if (member.firstTimer && (member.lastSeen.startsWith(latestEventDate) || (prevEventDate && member.lastSeen.startsWith(prevEventDate)))) {
                insights.recentFirstTimers.push(member);
            }
        });

        res.json(insights);

    } catch (err) {
        console.error('Insights failed:', err);
        res.status(500).json({ error: 'Failed to generate behavioral insights' });
    }
});

module.exports = router;
