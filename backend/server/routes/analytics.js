const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { dbAll, dbGet } = require('../database');

/**
 * Helper to calculate moving average and standard deviation
 */
function calculateStats(values) {
    if (values.length === 0) return { avg: 0, std: 0 };
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / values.length);
    return { avg, std };
}

/**
 * GET /api/analytics/predictive
 * Returns predictive insights based on historical data
 */
router.get('/predictive', auth, async (req, res) => {
    try {
        const allRecords = await dbAll('SELECT * FROM attendance_local ORDER BY createdAt ASC');
        if (allRecords.length === 0) {
            return res.json({
                forecast: { range: [0, 0], message: "Not enough data yet." },
                peakTimes: [],
                trends: []
            });
        }

        // 1. Identify the upcoming event
        const nowIso = new Date().toISOString();
        const nextEvent = await dbGet('SELECT * FROM events WHERE date >= ? AND status = ? ORDER BY date ASC LIMIT 1', [nowIso.split('T')[0], 'active']);

        // 2. Group by Event to get turnout per event
        const eventTurnouts = {};
        const eventTypes = {}; // Map eventId to type
        
        allRecords.forEach(r => {
            const e = r.eventId || 'General';
            eventTurnouts[e] = (eventTurnouts[e] || 0) + 1;
            if (r.type) eventTypes[e] = r.type; // This might be member/worker, we need the event type from events table
        });

        // Better way: Join with events table to get event types for all attendance records
        const historicalTurnouts = await dbAll(`
            SELECT e.type, a.eventId, COUNT(*) as count 
            FROM attendance_local a
            JOIN events e ON a.eventId = e.id
            GROUP BY e.type, a.eventId
        `);

        let targetTurnouts = historicalTurnouts.map(h => h.count);
        let forecastLabel = "General";
        
        if (nextEvent) {
            forecastLabel = nextEvent.name;
            const sameTypeTurnouts = historicalTurnouts
                .filter(h => h.type === nextEvent.type)
                .map(h => h.count);
            
            if (sameTypeTurnouts.length >= 2) {
                targetTurnouts = sameTypeTurnouts;
            }
        }

        const { avg, std } = calculateStats(targetTurnouts);
        
        // 3. Attendance Forecasting
        const low = Math.max(0, Math.floor(avg - (std || 0)));
        const high = Math.ceil(avg + (std || 0));
        
        let message = `Based on the last ${targetTurnouts.length} ${nextEvent ? nextEvent.type : 'general'} events, expect between ${low}–${high} attendees.`;
        if (nextEvent) {
            message = `Predicted turnout for ${nextEvent.name} (${nextEvent.type}): ${low}–${high} attendees based on historical ${nextEvent.type} data.`;
        }

        const forecast = {
            range: [low, high],
            average: Math.round(avg),
            upcomingEvent: nextEvent ? { name: nextEvent.name, date: nextEvent.date, type: nextEvent.type } : null,
            message: targetTurnouts.length >= 2 || nextEvent ? message : "Collecting more data for better accuracy..."
        };

        // 3. Peak Time Prediction
        // Group check-ins by hour:minute (15 min intervals)
        const checkInBins = {};
        allRecords.forEach(r => {
            const date = new Date(r.createdAt);
            const minutes = date.getMinutes();
            const bin = `${date.getHours().toString().padStart(2, '0')}:${(Math.floor(minutes / 15) * 15).toString().padStart(2, '0')}`;
            checkInBins[bin] = (checkInBins[bin] || 0) + 1;
        });

        const sortedBins = Object.entries(checkInBins)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([time, count]) => ({ time, count }));

        // 4. Trend Reports
        const trends = [];
        const turnouts = historicalTurnouts.map(h => h.count);
        
        // Growth/Drop-off
        const eventDates = [...new Set(allRecords.map(r => r.createdAt.split('T')[0]))].slice(-4);
        if (eventDates.length >= 2) {
            const latestDate = eventDates[eventDates.length - 1];
            const prevDate = eventDates[eventDates.length - 2];
            
            const latestCount = turnouts[turnouts.length - 1] || 0;
            const prevCount = turnouts[turnouts.length - 2] || 0;
            
            if (prevCount > 0) {
                const change = ((latestCount - prevCount) / prevCount * 100).toFixed(1);
                trends.push({
                    type: 'growth',
                    value: `${change}%`,
                    label: change >= 0 ? 'Attendance Growth' : 'Attendance Drop',
                    message: `Attendance has ${change >= 0 ? 'increased' : 'dropped'} ${Math.abs(change)}% compared to the previous event.`
                });
            }
        }

        // First-timer conversion (stub/logic)
        const firstTimers = allRecords.filter(r => r.firstTimer === 1).length;
        const total = allRecords.length;
        const ftPct = ((firstTimers / total) * 100).toFixed(1);
        trends.push({
            type: 'conversion',
            value: `${ftPct}%`,
            label: 'First-timer Ratio',
            message: `${ftPct}% of your attendees are joining for the first time.`
        });

        // Holiday impact (Mock logic or date-based)
        // For now, let's just identify if attendance is higher on weekends
        const weekends = allRecords.filter(r => {
            const day = new Date(r.createdAt).getDay();
            return day === 0 || day === 6;
        }).length;
        const weekdays = total - weekends;
        if (weekends > weekdays) {
            trends.push({
                type: 'pattern',
                value: 'Weekend Peak',
                label: 'Attendance Pattern',
                message: 'Your highest attendance consistently occurs on weekends.'
            });
        }

        res.json({
            forecast,
            peakTimes: sortedBins,
            trends
        });

    } catch (err) {
        console.error('Analytics failed:', err);
        res.status(500).json({ error: 'Failed to generate predictive analytics', details: err.message });
    }
});

module.exports = router;
