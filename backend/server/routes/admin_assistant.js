const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { dbAll, dbGet } = require('../database');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// OpenAI and Anthropic will be initialized inside the route if the keys are present

/**
 * GET Data Context for AI
 * Fetches relevant stats to provide as ground truth to the AI
 */
async function getAttendanceContext() {
    try {
        const events = await dbAll('SELECT id, name, type, date FROM events ORDER BY date DESC LIMIT 10');
        const attendanceSummary = await dbAll(`
            SELECT e.name, e.type, e.date, COUNT(a.id) as turnout
            FROM events e
            LEFT JOIN attendance_local a ON e.id = a.eventId
            GROUP BY e.id
            ORDER BY e.date DESC
            LIMIT 10
        `);

        const totalAttendees = await dbGet('SELECT COUNT(*) as count FROM attendance_local');
        const firstTimers = await dbGet('SELECT COUNT(*) as count FROM attendance_local WHERE firstTimer = 1');
        
        const demographics = await dbAll(`
            SELECT occupation, COUNT(*) as count 
            FROM attendance_local 
            WHERE occupation IS NOT NULL AND occupation != ''
            GROUP BY occupation 
            ORDER BY count DESC 
            LIMIT 5
        `);

        // New: Day of week participation patterns
        const dayOfWeekStats = await dbAll(`
            SELECT 
                CASE CAST(strftime('%w', createdAt) AS INT)
                    WHEN 0 THEN 'Sunday'
                    WHEN 1 THEN 'Monday'
                    WHEN 2 THEN 'Tuesday'
                    WHEN 3 THEN 'Wednesday'
                    WHEN 4 THEN 'Thursday'
                    WHEN 5 THEN 'Friday'
                    WHEN 6 THEN 'Saturday'
                END as day,
                COUNT(*) as count
            FROM attendance_local
            GROUP BY day
            ORDER BY count DESC
        `);

        return {
            systemSchema: {
                events: "id, name, type, date, start_time, status",
                attendance: "id, eventId, name, email, phone, occupation, firstTimer, type (member/worker), uniqueCode, createdAt"
            },
            stats: {
                totalAttendanceRecords: totalAttendees.count,
                totalFirstTimers: firstTimers.count,
                topOccupations: demographics,
                dayOfWeekParticipation: dayOfWeekStats
            },
            recentEvents: attendanceSummary
        };
    } catch (err) {
        console.error('Error fetching AI context:', err);
        return null;
    }
}

/**
 * POST /api/admin/assistant/query
 * Natural language query for attendance data
 */
router.post('/query', auth, async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    let provider = null;
    let apiKey = null;

    // Intelligent provider selection
    if (anthropicKey && anthropicKey.startsWith('sk-ant')) {
        provider = 'anthropic';
        apiKey = anthropicKey;
    } else if (openAIKey && openAIKey.startsWith('sk-ant')) {
        provider = 'anthropic';
        apiKey = openAIKey;
    } else if (openAIKey && openAIKey.startsWith('sk-')) {
        provider = 'openai';
        apiKey = openAIKey;
    }

    // Local insights fallback if no valid provider found
    if (!provider) {
        let answer = "";
        const lowerQuery = query.toLowerCase();

        if (lowerQuery.includes('time') || lowerQuery.includes('suggest') || lowerQuery.includes('when')) {
            // Calculate best time locally
            const timeStats = await dbAll(`
                SELECT 
                    CASE CAST(strftime('%w', createdAt) AS INT)
                        WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
                        WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
                        WHEN 6 THEN 'Saturday'
                    END as day,
                    strftime('%H:00', createdAt) as hour,
                    COUNT(*) as count
                FROM attendance_local
                GROUP BY day, hour
                ORDER BY count DESC
                LIMIT 3
            `);
            
            answer = "### 🗓️ Recommended Event Schedule (Local Analysis)\nBased on historical peak turnouts, your most successful slots are:\n\n" + 
                     timeStats.map((s, i) => `${i+1}. **${s.day}s at ${s.hour}** (${s.count} typical check-ins)`).join('\n') +
                     "\n\n*Add a valid AI API key for more nuanced demographic suggestions!*";
        } else if (lowerQuery.includes('high') || lowerQuery.includes('best') || lowerQuery.includes('most') || lowerQuery.includes('attendance')) {
            const currentYear = new Date().getFullYear();
            const yearFilter = lowerQuery.includes('year') ? `WHERE e.date LIKE '${currentYear}%'` : '';
            const yearLabel = lowerQuery.includes('year') ? ` in ${currentYear}` : '';

            const highAttendance = await dbGet(`
                SELECT e.name, e.date, COUNT(a.id) as turnout
                FROM events e
                JOIN attendance_local a ON e.id = a.eventId
                ${yearFilter}
                GROUP BY e.id
                ORDER BY turnout DESC
                LIMIT 1
            `);
            
            if (highAttendance) {
                answer = `### 🏆 Record Attendance${yearLabel}\nYour highest attended event was **${highAttendance.name}** on **${highAttendance.date}** with **${highAttendance.turnout}** attendees.`;
            } else {
                answer = `I couldn't find any attendance records${yearLabel} yet to determine the highest turnout.`;
            }
        } else if (lowerQuery.includes('year')) {
            const currentYear = new Date().getFullYear();
            const yearStats = await dbGet('SELECT COUNT(*) as count FROM attendance_local WHERE createdAt LIKE ?', [`${currentYear}%`]);
            answer = `### 📅 Yearly Summary (${currentYear})\nThroughout this year, you've had a total of **${yearStats.count}** check-ins across all events.`;
        } else if (lowerQuery.includes('new') || lowerQuery.includes('month') || lowerQuery.includes('growth')) {
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const isoMonth = lastMonth.toISOString().slice(0, 7); // YYYY-MM
            
            const newAttendees = await dbGet('SELECT COUNT(*) as count FROM attendance_local WHERE firstTimer = 1 AND createdAt LIKE ?', [`${isoMonth}%`]);
            const totalThisMonth = await dbGet('SELECT COUNT(*) as count FROM attendance_local WHERE createdAt LIKE ?', [`${isoMonth}%`]);
            
            answer = `### 📈 Performance Insights (${isoMonth})\n• **New Attendees**: ${newAttendees.count}\n• **Total Check-ins**: ${totalThisMonth.count}\n\nThis data is calculated locally from your database records.`;
        } else {
            const total = (await dbGet('SELECT COUNT(*) as count FROM attendance_local')).count;
            const topDayRow = await dbGet(`
                SELECT 
                    CASE CAST(strftime('%w', createdAt) AS INT)
                        WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
                        WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday' WHEN 5 THEN 'Friday'
                        WHEN 6 THEN 'Saturday'
                    END as day,
                    COUNT(*) as count
                FROM attendance_local
                GROUP BY day
                ORDER BY count DESC
                LIMIT 1
            `);
            answer = `### 📊 System Overview (Mock Mode)\n• **Total Records**: ${total}\n• **Busiest Day**: ${topDayRow ? topDayRow.day : 'N/A'}\n\n*Note: AI API Key is missing or invalid. I am providing localized statistics instead.*`;
        }

        return res.json({ answer, isMock: true });
    }

    try {
        const context = await getAttendanceContext();
        let answer = '';
        let usage = null;
        
        const systemPrompt = `
You are an Attendance Data Specialist for a church management system. 
Your goal is to help administrators understand their data and provide event suggestions.

CONTEXT DATA:
${JSON.stringify(context, null, 2)}

GUIDELINES:
1. Use the provided context to answer questions accurately.
2. If the data is not in the context, be honest and say you don't have that specific detail.
3. Keep answers professional, concise, and helpful.
4. For event suggestions, analyze turnouts and event types in the context.
5. If the user asks for "everyone", provide a summary or a few examples rather than a massive list.
`;

        if (provider === 'anthropic') {
            // Use Anthropic
            const anthropic = new Anthropic({ apiKey });
            const msg = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: "user", content: query }],
            });
            answer = msg.content[0].text;
            usage = msg.usage;
        } else if (provider === 'openai') {
            // Use OpenAI
            const openai = new OpenAI({ apiKey });
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: query }
                ],
                temperature: 0.7,
            });
            answer = response.choices[0].message.content;
            usage = response.usage;
        }

        res.json({ answer, usage });

    } catch (err) {
        console.error('AI Assistant Error:', err);
        
        // Handle Quota/Credit errors gracefully with local fallback suggestion
        const isQuotaError = err.message.toLowerCase().includes('quota') || 
                            err.message.toLowerCase().includes('credit') || 
                            err.message.toLowerCase().includes('balance');

        if (isQuotaError) {
             return res.status(200).json({ 
                isMock: true,
                answer: `### ⚠️ AI Service Limit Reached\nYour ${provider} account has run out of credits or reached a quota limit. \n\n**Local Insight for your query:**\nI can still calculate basic stats for you. I see you have **${(await dbGet('SELECT COUNT(*) as count FROM attendance_local')).count}** total records in your database. \n\n*Please top up your ${provider} credits to resume advanced natural language logic.*`
            });
        }

        res.status(500).json({ 
            error: 'AI Assistant failed to process query', 
            details: err.message,
            answer: `I encountered an error while processing your request: ${err.message}. Please check your API key and quota.`
        });
    }
});

module.exports = router;
