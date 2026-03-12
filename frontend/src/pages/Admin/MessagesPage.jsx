import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import BulkMessageModal from '../../components/Admin/BulkMessageModal.jsx';
import { API_BASE } from '../../services/api';

export default function MessagesPage() {
    const { items } = useOutletContext();
    const navigate = useNavigate();
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [history, setHistory] = useState([]);
    const [scheduled, setScheduled] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessageData();
    }, []);

    const fetchMessageData = async () => {
        try {
            const [historyRes, scheduledRes] = await Promise.all([
                fetch(`${API_BASE}/api/messages/history`),
                fetch(`${API_BASE}/api/messages/scheduled`)
            ]);

            if (historyRes.ok) setHistory(await historyRes.json());
            if (scheduledRes.ok) setScheduled(await scheduledRes.json());
        } catch (error) {
            console.error('Error fetching message data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendBulkMessage = async (payload) => {
        try {
            const endpoint = payload.scheduledTime ? `${API_BASE}/api/messages/schedule` : `${API_BASE}/api/messages/send`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                alert(payload.scheduledTime
                    ? 'Message scheduled successfully!'
                    : `Message sent! ${result.sent} successful, ${result.failed} failed.`);
                fetchMessageData();
            } else {
                const error = await response.json();
                alert('Failed: ' + (error.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error sending message');
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString();
    };

    const getStatusBadge = (status) => {
        const colors = {
            sent: { bg: '#dcfce7', color: '#16a34a' },
            partial: { bg: '#fef9c3', color: '#ca8a04' },
            pending: { bg: '#e0f2fe', color: '#0284c7' },
            scheduled: { bg: '#e0f2fe', color: '#0284c7' },
            completed: { bg: '#dcfce7', color: '#16a34a' },
            cancelled: { bg: '#fee2e2', color: '#dc2626' }
        };
        const style = colors[status] || { bg: '#f3f4f6', color: '#6b7280' };
        return (
            <span style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'capitalize',
                backgroundColor: style.bg,
                color: style.color
            }}>
                {status}
            </span>
        );
    };

    const stats = {
        totalAttendees: items?.length || 0,
        firstTimers: items?.filter(r => r.firstTimer).length || 0,
        members: items?.filter(r => !r.firstTimer).length || 0,
        totalSent: history.reduce((sum, h) => sum + (h.recipient_count || 0), 0)
    };

    const styles = {
        container: { padding: '20px 0' },
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '16px'
        },
        headerContent: { flex: 1 },
        title: { fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', margin: 0 },
        subtitle: { color: '#64748b', marginTop: '4px', fontSize: '0.95rem' },
        btnPrimary: {
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.2s'
        },
        btnSecondary: {
            padding: '10px 20px',
            backgroundColor: 'white',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            transition: 'all 0.2s'
        },
        section: { marginBottom: '32px' },
        sectionHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
        },
        sectionTitle: { fontSize: '1rem', fontWeight: '600', color: '#374151', margin: 0 },
        card: {
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            border: '1px solid #f1f5f9'
        },
        table: { width: '100%', borderCollapse: 'collapse' },
        th: {
            textAlign: 'left',
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            fontWeight: '600',
            fontSize: '0.8rem',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: '1px solid #e5e7eb'
        },
        td: {
            padding: '14px 16px',
            fontSize: '0.875rem',
            color: '#374151',
            borderBottom: '1px solid #f1f5f9'
        },
        empty: { textAlign: 'center', padding: '48px', color: '#9ca3af' },
        emptyIcon: { fontSize: '3rem', marginBottom: '12px', opacity: 0.5 },
        statGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
        },
        statCard: {
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            border: '2px solid transparent',
            textAlign: 'center'
        },
        statValue: { fontSize: '1.75rem', fontWeight: '700', color: '#1e293b' },
        statLabel: { fontSize: '0.8rem', color: '#64748b', marginTop: '4px', fontWeight: '500' },
        quickActions: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
        },
        actionCard: {
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '14px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            border: '1px solid #f1f5f9',
            transition: 'all 0.2s ease',
            textAlign: 'left'
        },
        actionIcon: {
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
        },
        actionTitle: { fontWeight: '600', color: '#1e293b', marginBottom: '4px', fontSize: '0.95rem' },
        actionDesc: { fontSize: '0.8rem', color: '#64748b' }
    };

    const actionCards = [
        {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
            bg: '#eff6ff',
            title: 'Quick Broadcast',
            desc: `Send to all ${stats.totalAttendees} attendees`
        },
        {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>,
            bg: '#f0fdf4',
            title: 'First Timers',
            desc: `Send to ${stats.firstTimers} first timers`
        },
        {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
            bg: '#faf5ff',
            title: 'Members Only',
            desc: `Send to ${stats.members} members`
        }
    ];

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.headerContent}>
                    <h1 style={styles.title}>Messaging Center</h1>
                    <p style={styles.subtitle}>Send bulk messages to your attendees</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        style={styles.btnSecondary}
                        onClick={() => navigate('/admin/categories')}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Select by Date
                    </button>
                    <button
                        style={styles.btnPrimary}
                        onClick={() => setShowBulkModal(true)}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                        New Message
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div style={styles.statGrid}>
                {[
                    { value: stats.totalAttendees, label: 'Total Attendees', color: '#2563eb' },
                    { value: stats.firstTimers, label: 'First Timers', color: '#16a34a' },
                    { value: stats.members, label: 'Members', color: '#8b5cf6' },
                    { value: stats.totalSent, label: 'Messages Sent', color: '#f59e0b' }
                ].map((stat, i) => (
                    <div
                        key={i}
                        style={styles.statCard}
                        onClick={() => setShowBulkModal(true)}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = stat.color;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = 'transparent';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
                        <div style={styles.statLabel}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div style={styles.quickActions}>
                {actionCards.map((card, i) => (
                    <div
                        key={i}
                        style={styles.actionCard}
                        onClick={() => setShowBulkModal(true)}
                        onMouseOver={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.borderColor = '#f1f5f9';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{ ...styles.actionIcon, backgroundColor: card.bg }}>
                            {card.icon}
                        </div>
                        <div style={styles.actionTitle}>{card.title}</div>
                        <div style={styles.actionDesc}>{card.desc}</div>
                    </div>
                ))}
            </div>

            {/* Scheduled Messages */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Scheduled Messages</h3>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                        {scheduled.filter(s => s.status === 'pending').length} pending
                    </span>
                </div>
                <div style={styles.card}>
                    {loading ? (
                        <div style={styles.empty}>Loading...</div>
                    ) : scheduled.length === 0 ? (
                        <div style={styles.empty}>
                            <div style={styles.emptyIcon}>📅</div>
                            <p>No scheduled messages yet</p>
                            <p style={{ fontSize: '0.85rem' }}>Create a message and set a future date</p>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Channel</th>
                                    <th style={styles.th}>Recipients</th>
                                    <th style={styles.th}>Scheduled For</th>
                                    <th style={styles.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scheduled.map(msg => (
                                    <tr key={msg.id}>
                                        <td style={styles.td}>
                                            <span style={{ textTransform: 'capitalize' }}>{msg.channel}</span>
                                        </td>
                                        <td style={styles.td}>{msg.recipient_count}</td>
                                        <td style={styles.td}>{formatDate(msg.scheduled_time)}</td>
                                        <td style={styles.td}>{getStatusBadge(msg.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Message History */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <h3 style={styles.sectionTitle}>Recent Messages</h3>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                        Last 10 messages
                    </span>
                </div>
                <div style={styles.card}>
                    {loading ? (
                        <div style={styles.empty}>Loading...</div>
                    ) : history.length === 0 ? (
                        <div style={styles.empty}>
                            <div style={styles.emptyIcon}>📭</div>
                            <p>No messages sent yet</p>
                            <p style={{ fontSize: '0.85rem' }}>Send your first bulk message</p>
                        </div>
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Channel</th>
                                    <th style={styles.th}>Message</th>
                                    <th style={styles.th}>Recipients</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Sent</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.slice(0, 10).map(msg => (
                                    <tr key={msg.id}>
                                        <td style={styles.td}>
                                            <span style={{ textTransform: 'capitalize' }}>{msg.channel}</span>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                maxWidth: '200px',
                                                display: 'inline-block',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                color: '#4b5563'
                                            }}>
                                                {msg.message}
                                            </span>
                                        </td>
                                        <td style={styles.td}>{msg.recipient_count}</td>
                                        <td style={styles.td}>{getStatusBadge(msg.status)}</td>
                                        <td style={styles.td}>
                                            <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                                                {formatDate(msg.created_at)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Bulk Message Modal */}
            {showBulkModal && (
                <BulkMessageModal
                    isOpen={showBulkModal}
                    onClose={() => setShowBulkModal(false)}
                    recipients={items || []}
                    onSend={handleSendBulkMessage}
                />
            )}
        </div>
    );
}
