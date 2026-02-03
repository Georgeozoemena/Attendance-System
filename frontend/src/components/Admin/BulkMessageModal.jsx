import React, { useState } from 'react';

const BulkMessageModal = ({ isOpen, onClose, recipientCount, onSend }) => {
    const [message, setMessage] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSend = () => {
        setIsSending(true);
        // Simulate API call
        setTimeout(() => {
            onSend({ message, scheduledTime });
            setIsSending(false);
            setMessage('');
            setScheduledTime('');
            onClose();
        }, 1000);
    };

    const styles = {
        overlay: {
            position: 'fixed', inset: 0, zIndex: 1000, display: 'flex',
            alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)'
        },
        modal: {
            backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            width: '100%', maxWidth: '480px', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
        },
        header: {
            padding: '24px 24px 16px', borderBottom: '1px solid #e5e7eb'
        },
        title: { fontSize: '1.25rem', fontWeight: '700', color: '#111827', margin: 0 },
        subtitle: { fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' },
        body: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' },
        label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '6px' },
        textarea: {
            width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '0.95rem', minHeight: '120px', fontFamily: 'inherit', resize: 'vertical',
            outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s'
        },
        input: {
            width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
            fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none'
        },
        footer: {
            padding: '16px 24px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb',
            display: 'flex', justifyContent: 'flex-end', gap: '12px'
        },
        btn: {
            padding: '10px 18px', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '600',
            cursor: 'pointer', border: 'none', transition: 'all 0.2s'
        },
        secondaryBtn: { backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db' },
        primaryBtn: { backgroundColor: '#2563eb', color: 'white', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
        disabled: { opcode: 0.5, cursor: 'not-allowed', backgroundColor: '#93c5fd' }
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.header}>
                    <h2 style={styles.title}>Send Bulk Message</h2>
                    <p style={styles.subtitle}>To: {recipientCount} recipients</p>
                </div>

                <div style={styles.body}>
                    <div>
                        <label style={styles.label}>Message</label>
                        <textarea
                            style={{ ...styles.textarea, borderColor: message ? '#2563eb' : '#d1d5db' }}
                            rows="4"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message here... (e.g. Service shifted to 9AM)"
                        />
                    </div>

                    <div>
                        <label style={styles.label}>Schedule (Optional)</label>
                        <input
                            type="datetime-local"
                            style={styles.input}
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                        />
                    </div>
                </div>

                <div style={styles.footer}>
                    <button
                        onClick={onClose}
                        style={{ ...styles.btn, ...styles.secondaryBtn }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={!message || isSending}
                        style={{
                            ...styles.btn,
                            ...styles.primaryBtn,
                            ...((!message || isSending) ? styles.disabled : {})
                        }}
                    >
                        {isSending ? 'Sending...' : scheduledTime ? 'Schedule' : 'Send Message'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkMessageModal;
