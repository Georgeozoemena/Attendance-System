import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { EVENT_CONFIGS } from '../../utils/events';
import { API_BASE } from '../../services/api';

const BulkMessageModal = ({ isOpen, onClose, recipients = [], onSend }) => {
    const [message, setMessage] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [channel, setChannel] = useState('both');
    const [includeQR, setIncludeQR] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState('sunday-service');
    const [recipientFilter, setRecipientFilter] = useState('all');

    // Template management
    const [templates, setTemplates] = useState([]);
    const [templateName, setTemplateName] = useState('');
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);
    const [isSavingTemplate, setIsSavingTemplate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/messages/templates`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data || []);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const saveTemplate = async () => {
        if (!templateName.trim() || !message.trim()) return;

        setIsSavingTemplate(true);
        try {
            const response = await fetch(`${API_BASE}/api/messages/templates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: templateName,
                    message,
                    channel
                })
            });

            if (response.ok) {
                const newTemplate = await response.json();
                setTemplates([newTemplate, ...templates]);
                setTemplateName('');
                setShowSaveTemplate(false);
            }
        } catch (error) {
            console.error('Error saving template:', error);
        } finally {
            setIsSavingTemplate(false);
        }
    };

    const loadTemplate = (template) => {
        setMessage(template.message);
        setChannel(template.channel || 'both');
    };

    const deleteTemplate = async (id) => {
        try {
            await fetch(`${API_BASE}/api/messages/templates/${id}`, { method: 'DELETE' });
            setTemplates(templates.filter(t => t.id !== id));
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    if (!isOpen) return null;

    const recipientCount = getFilteredRecipients().length;

    function getFilteredRecipients() {
        if (recipientFilter === 'firstTimer') {
            return recipients.filter(r => r.firstTimer);
        } else if (recipientFilter === 'members') {
            return recipients.filter(r => !r.firstTimer);
        }
        return recipients;
    }

    const handleSend = () => {
        setIsSending(true);

        const payload = {
            message,
            channel,
            scheduledTime: scheduledTime || null,
            recipients: getFilteredRecipients(),
            recipientCount,
            recipientFilter,
            includeQR,
            selectedEvent
        };

        setTimeout(() => {
            onSend?.(payload);
            setIsSending(false);
            setMessage('');
            setIncludeQR(false);
            setScheduledTime('');
            onClose();
        }, 1500);
    };

    const getScheduledStatus = () => {
        if (!scheduledTime) return null;
        const scheduled = new Date(scheduledTime);
        const now = new Date();
        if (scheduled <= now) return { status: 'invalid', text: 'Scheduled time must be in the future' };
        return { status: 'valid', text: 'Will be sent on ' + scheduled.toLocaleString() };
    };

    const scheduledStatus = getScheduledStatus();

    const styles = {
        overlay: {
            position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)'
        },
        modal: {
            backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            width: '100%', maxWidth: '650px', maxHeight: '90vh', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
        },
        header: {
            padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)', color: 'white'
        },
        title: { fontSize: '1.25rem', fontWeight: '700', margin: 0 },
        subtitle: { fontSize: '0.875rem', opacity: 0.9, marginTop: '4px' },
        body: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', maxHeight: 'calc(90vh - 200px)' },
        footer: {
            padding: '16px 24px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px'
        },
        label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '6px' },
        textarea: {
            width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '0.95rem', minHeight: '100px', fontFamily: 'inherit', resize: 'vertical',
            outline: 'none', transition: 'border-color 0.2s'
        },
        input: {
            width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none'
        },
        select: {
            width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', backgroundColor: 'white', cursor: 'pointer'
        },
        btn: {
            padding: '10px 18px', borderRadius: '25px', fontSize: '0.875rem', fontWeight: '600',
            cursor: 'pointer', border: 'none', transition: 'all 0.2s'
        },
        secondaryBtn: { backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' },
        primaryBtn: { backgroundColor: '#2563eb', color: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
        disabled: { opacity: 0.5, cursor: 'not-allowed' },
        channelOption: (isActive) => ({
            padding: '10px 16px', borderRadius: '8px', border: isActive ? '2px solid #2563eb' : '1px solid #e5e7eb',
            backgroundColor: isActive ? '#eff6ff' : 'white', cursor: 'pointer', transition: 'all 0.2s',
            fontWeight: isActive ? '600' : '400', color: isActive ? '#2563eb' : '#374151'
        }),
        sectionTitle: { fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', marginBottom: '12px' },
        qrPreview: {
            backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px',
            border: '1px solid #e5e7eb', textAlign: 'center'
        },
        qrCode: {
            display: 'inline-block', padding: '12px', backgroundColor: 'white',
            borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '12px'
        },
        checkboxWrapper: {
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
            backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb',
            cursor: 'pointer'
        },
        checkbox: (isChecked) => ({
            width: '20px', height: '20px', borderRadius: '4px',
            border: isChecked ? 'none' : '2px solid #d1d5db',
            backgroundColor: isChecked ? '#2563eb' : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
        }),
        infoRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280' },
        templateItem: {
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px',
            border: '1px solid #e5e7eb', marginBottom: '8px'
        },
        templateName: { fontWeight: '500', fontSize: '0.9rem' },
        templateActions: { display: 'flex', gap: '8px' },
        iconBtn: {
            padding: '6px', borderRadius: '6px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background-color 0.2s'
        }
    };

    const eventConfig = EVENT_CONFIGS[selectedEvent] || { name: selectedEvent };
    const qrLink = `${window.location.origin}/attend?eventId=${selectedEvent}`;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Send Bulk Message</h2>
                    <p style={styles.subtitle}>To: {recipientCount} recipients</p>
                </div>

                <div style={styles.body}>
                    {/* Channel Selection */}
                    <div>
                        <span style={styles.sectionTitle}>Channel</span>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <div onClick={() => setChannel('sms')} style={styles.channelOption(channel === 'sms')}>
                                SMS
                            </div>
                            <div onClick={() => setChannel('whatsapp')} style={styles.channelOption(channel === 'whatsapp')}>
                                WhatsApp
                            </div>
                            <div onClick={() => setChannel('email')} style={styles.channelOption(channel === 'email')}>
                                Email
                            </div>
                            <div onClick={() => setChannel('both')} style={styles.channelOption(channel === 'both')}>
                                Both
                            </div>
                        </div>
                    </div>

                    {/* Recipient Filter */}
                    <div>
                        <label style={styles.label}>Recipients</label>
                        <select
                            style={styles.select}
                            value={recipientFilter}
                            onChange={(e) => setRecipientFilter(e.target.value)}
                        >
                            <option value="all">All Recipients ({recipients.length})</option>
                            <option value="firstTimer">First Timers ({recipients.filter(r => r.firstTimer).length})</option>
                            <option value="members">Members ({recipients.filter(r => !r.firstTimer).length})</option>
                        </select>
                    </div>

                    {/* QR Code Attachment */}
                    <div>
                        <span style={styles.sectionTitle}>Attach QR Code</span>
                        <div
                            style={styles.checkboxWrapper}
                            onClick={() => setIncludeQR(!includeQR)}
                        >
                            <div style={styles.checkbox(includeQR)}>
                                {includeQR && (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>
                                    Include Attendance QR Code
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                    Send a scannable QR code with the message
                                </div>
                            </div>
                        </div>

                        {includeQR && (
                            <div style={{ marginTop: '12px' }}>
                                <label style={styles.label}>Select Event for QR Code</label>
                                <select
                                    style={styles.select}
                                    value={selectedEvent}
                                    onChange={(e) => setSelectedEvent(e.target.value)}
                                >
                                    <option value="sunday-service">{EVENT_CONFIGS['sunday-service']?.name || 'Sunday Service'}</option>
                                    <option value="wednesday-service">{EVENT_CONFIGS['wednesday-service']?.name || 'Wednesday Service'}</option>
                                    <option value="special-program">{EVENT_CONFIGS['special-program']?.name || 'Special Program'}</option>
                                </select>

                                <div style={styles.qrPreview}>
                                    <div style={styles.qrCode}>
                                        <QRCodeCanvas value={qrLink} size={120} level="H" includeMargin={true} />
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                        {eventConfig.name}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                                        {qrLink}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Templates */}
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <span style={styles.sectionTitle}>Templates</span>
                            {!showSaveTemplate && (
                                <button
                                    onClick={() => setShowSaveTemplate(true)}
                                    style={{ ...styles.iconBtn, backgroundColor: '#eff6ff', color: '#2563eb' }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {showSaveTemplate && (
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                <input
                                    style={{ ...styles.input, flex: 1 }}
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    placeholder="Template name..."
                                />
                                <button
                                    onClick={saveTemplate}
                                    disabled={!templateName.trim() || !message.trim() || isSavingTemplate}
                                    style={{ ...styles.btn, ...styles.primaryBtn }}
                                >
                                    {isSavingTemplate ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                    onClick={() => { setShowSaveTemplate(false); setTemplateName(''); }}
                                    style={{ ...styles.btn, ...styles.secondaryBtn }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {templates.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#9ca3af', fontSize: '0.9rem' }}>
                                No templates yet. Create one to save time!
                            </div>
                        ) : (
                            <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                                {templates.map((template) => (
                                    <div key={template.id} style={styles.templateItem}>
                                        <div>
                                            <div style={styles.templateName}>{template.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                                                {template.channel} • {template.message?.substring(0, 40)}...
                                            </div>
                                        </div>
                                        <div style={styles.templateActions}>
                                            <button
                                                onClick={() => loadTemplate(template)}
                                                style={{ ...styles.iconBtn, backgroundColor: '#eff6ff', color: '#2563eb' }}
                                                title="Load template"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => deleteTemplate(template.id)}
                                                style={{ ...styles.iconBtn, backgroundColor: '#fef2f2', color: '#dc2626' }}
                                                title="Delete template"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Message */}
                    <div>
                        <label style={styles.label}>
                            Message {channel !== 'email' && `(${message.length} chars)`}
                        </label>
                        <textarea
                            style={{ ...styles.textarea, borderColor: message ? '#2563eb' : '#d1d5db' }}
                            rows="4"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder={includeQR
                                ? "Scan the QR code to mark your attendance. See you at church!"
                                : "Type your message here... Use {{name}} for recipient's name"
                            }
                        />
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>
                            Available variables: {'{{name}}'}, {'{{time}}'}, {'{{date}}'}
                        </div>
                    </div>

                    {/* Schedule */}
                    <div>
                        <label style={styles.label}>Schedule (Optional)</label>
                        <input
                            type="datetime-local"
                            style={{ ...styles.input, borderColor: scheduledTime ? '#2563eb' : '#d1d5db' }}
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                        {scheduledStatus && (
                            <div style={{
                                fontSize: '0.8rem',
                                color: scheduledStatus.status === 'invalid' ? '#dc2626' : '#16a34a',
                                marginTop: '4px'
                            }}>
                                {scheduledStatus.text}
                            </div>
                        )}
                    </div>
                </div>

                <div style={styles.footer}>
                    <div style={styles.infoRow}>
                        <span>{recipientCount} recipients</span>
                        {includeQR && <span style={{ color: '#2563eb' }}>QR Attached</span>}
                        {scheduledTime && <span style={{ color: '#16a34a' }}>Scheduled</span>}
                        <span style={{ textTransform: 'capitalize' }}>{channel}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={onClose} style={{ ...styles.btn, ...styles.secondaryBtn }}>
                            Cancel
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!message || isSending || (scheduledTime && scheduledStatus?.status === 'invalid')}
                            style={{
                                ...styles.btn,
                                ...styles.primaryBtn,
                                ...((!message || isSending || (scheduledTime && scheduledStatus?.status === 'invalid')) ? styles.disabled : {})
                            }}
                        >
                            {isSending ? 'Sending...' : scheduledTime ? 'Schedule' : 'Send Message'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkMessageModal;
