require('dotenv').config();
const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { db, dbAll, dbRun } = require('../database');

// Email configuration
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
};

// Get all templates
router.get('/templates', async (req, res) => {
    try {
        const templates = await dbAll('SELECT * FROM message_templates ORDER BY created_at DESC');
        res.json(templates);
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Create new template
router.post('/templates', async (req, res) => {
    try {
        const { name, message, channel } = req.body;
        const id = uuidv4();
        await dbRun(
            'INSERT INTO message_templates (id, name, message, channel, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
            [id, name, message, channel || 'both']
        );
        res.status(201).json({ id, name, message, channel: channel || 'both' });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Delete template
router.delete('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await dbRun('DELETE FROM message_templates WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// Send bulk message
router.post('/send', async (req, res) => {
    try {
        const { message, channel, recipients, recipientFilter } = req.body;
        
        if (!message || !recipients || recipients.length === 0) {
            return res.status(400).json({ error: 'Message and recipients are required' });
        }

        let filteredRecipients = recipients;
        if (recipientFilter === 'firstTimer') {
            filteredRecipients = recipients.filter(r => r.firstTimer);
        } else if (recipientFilter === 'members') {
            filteredRecipients = recipients.filter(r => !r.firstTimer);
        }

        const results = { total: filteredRecipients.length, sent: 0, failed: 0, channel };

        for (const recipient of filteredRecipients) {
            try {
                const personalizedMessage = message
                    .replace(/{{name}}/g, recipient.name || '')
                    .replace(/{{time}}/g, new Date().toLocaleTimeString())
                    .replace(/{{date}}/g, new Date().toLocaleDateString());

                let sendResult;
                
                if (channel === 'whatsapp') {
                    sendResult = await sendWhatsAppMessage(recipient.phone, personalizedMessage);
                } else if (channel === 'email') {
                    const emailBody = '<p>Dear ' + recipient.name + ',</p><p>' + personalizedMessage + '</p>';
                    sendResult = await sendEmail(recipient.email, 'Church Attendance', emailBody);
                } else {
                    sendResult = await sendSMS(recipient.phone, personalizedMessage);
                }

                if (sendResult.success) {
                    results.sent++;
                } else {
                    results.failed++;
                }
            } catch (error) {
                console.error('Send error:', error);
                results.failed++;
            }
        }

        await dbRun(
            'INSERT INTO message_history (id, message, channel, recipient_count, status, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
            [uuidv4(), message, channel, results.sent, results.failed === 0 ? 'sent' : 'partial']
        );

        res.json(results);
    } catch (error) {
        console.error('Error sending bulk message:', error);
        res.status(500).json({ error: 'Failed to send bulk message' });
    }
});

// Schedule a message
router.post('/schedule', async (req, res) => {
    try {
        const { message, channel, recipients, scheduledTime, recipientFilter } = req.body;
        
        if (!message || !scheduledTime || !recipients || recipients.length === 0) {
            return res.status(400).json({ error: 'Message, scheduled time, and recipients are required' });
        }

        const scheduledDate = new Date(scheduledTime);
        if (scheduledDate <= new Date()) {
            return res.status(400).json({ error: 'Scheduled time must be in the future' });
        }

        const scheduleId = uuidv4();
        
        await dbRun(
            'INSERT INTO scheduled_messages (id, message, channel, recipient_count, scheduled_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now"))',
            [scheduleId, message, channel, recipients.length, scheduledTime, 'pending']
        );

        res.status(201).json({ 
            id: scheduleId, 
            scheduledTime: scheduledDate.toISOString(),
            status: 'scheduled',
            message: 'Message scheduled for ' + scheduledDate.toLocaleString()
        });
    } catch (error) {
        console.error('Error scheduling message:', error);
        res.status(500).json({ error: 'Failed to schedule message' });
    }
});

// Get all scheduled messages
router.get('/scheduled', async (req, res) => {
    try {
        const scheduled = await dbAll('SELECT * FROM scheduled_messages ORDER BY scheduled_time ASC');
        res.json(scheduled);
    } catch (error) {
        console.error('Error fetching scheduled messages:', error);
        res.status(500).json({ error: 'Failed to fetch scheduled messages' });
    }
});

// Get message history
router.get('/history', async (req, res) => {
    try {
        const history = await dbAll('SELECT * FROM message_history ORDER BY created_at DESC LIMIT 50');
        res.json(history);
    } catch (error) {
        console.error('Error fetching message history:', error);
        res.status(500).json({ error: 'Failed to fetch message history' });
    }
});

// Helper functions
async function sendEmail(to, subject, body) {
    if (!emailConfig.user || !emailConfig.pass) {
        console.log('[Email Mock] To:', to);
        return { success: true, mock: true };
    }

    try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: { user: emailConfig.user, pass: emailConfig.pass }
        });

        await transporter.sendMail({ from: emailConfig.user, to, subject, html: body });
        return { success: true };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
}

async function sendWhatsAppMessage(phone, message) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    if (!phoneNumberId || !accessToken) {
        console.log('[WhatsApp Mock] To:', phone);
        return { success: true, mock: true };
    }

    const formattedPhone = phone.startsWith('+') ? phone.substring(1) : phone;
    
    try {
        const response = await fetch(
            'https://graph.facebook.com/v18.0/' + phoneNumberId + '/messages',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: formattedPhone,
                    type: 'text',
                    text: { body: message }
                })
            }
        );

        const result = await response.json();
        return response.ok ? { success: true, messageId: result.messages?.[0]?.id } : { success: false, error: result.error?.message };
    } catch (error) {
        console.error('WhatsApp error:', error);
        return { success: false, error: error.message };
    }
}

async function sendSMS(phone, message) {
    console.log('[SMS Mock] To:', phone, 'Message:', message);
    return { success: true, mock: true };
}

module.exports = router;
