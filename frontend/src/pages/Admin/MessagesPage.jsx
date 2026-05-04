import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import BulkMessageModal from '../../components/Admin/BulkMessageModal.jsx';
import { API_BASE, getAuthHeaders } from '../../services/api';

export default function MessagesPage() {
    const { items } = useOutletContext();
    const navigate = useNavigate();
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [history, setHistory] = useState([]);
    const [scheduled, setScheduled] = useState([]);
    const [insights, setInsights] = useState({ atRisk: [], loyal: [], recentFirstTimers: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMessageData();
    }, []);

    const fetchMessageData = async () => {
        try {
            const headers = { ...getAuthHeaders() };
            const [historyRes, scheduledRes, insightsRes] = await Promise.all([
                fetch(`${API_BASE}/api/messages/history`, { headers }),
                fetch(`${API_BASE}/api/messages/scheduled`, { headers }),
                fetch(`${API_BASE}/api/analytics/insights`, { headers })
            ]);
            if (historyRes.ok) setHistory(await historyRes.json());
            if (scheduledRes.ok) setScheduled(await scheduledRes.json());
            if (insightsRes.ok) setInsights(await insightsRes.json());
        } catch (error) {
            console.error('Error fetching message data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendBulkMessage = async (payload) => {
        try {
            const endpoint = payload.scheduledTime
                ? `${API_BASE}/api/messages/schedule`
                : `${API_BASE}/api/messages/send`;
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

    const stats = {
        totalAttendees: items?.length || 0,
        firstTimers: items?.filter(r => r.firstTimer).length || 0,
        members: items?.filter(r => !r.firstTimer).length || 0,
        totalSent: history.reduce((sum, h) => sum + (h.recipient_count || 0), 0)
    };

    const actionCards = [
        {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>,
            iconClass: 'blue',
            title: 'Quick Broadcast',
            desc: `Send to all ${stats.totalAttendees} attendees`
        },
        {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
            iconClass: 'red',
            title: 'At-Risk Members',
            desc: `Missed 2+ wks: ${insights.atRisk?.length || 0} people`
        },
        {
            icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
            iconClass: 'amber',
            title: 'Loyal Superstars',
            desc: `3+ wk streak: ${insights.loyal?.length || 0} people`
        }
    ];

    return (
        <div className="admin-page-container">
            <header className="page-header">
                <div className="header-content">
                    <h1>Messaging Center</h1>
                    <p className="subtitle">Send bulk messages to your attendees</p>
                </div>
                <div className="top-bar-actions">
                    <button className="action-btn" onClick={() => navigate('/admin/categories')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Select by Date
                    </button>
                    <button className="action-btn primary" onClick={() => setShowBulkModal(true)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                        New Message
                    </button>
                </div>
            </header>

            {/* Stats */}
            <div className="admin-card-grid" style={{ marginBottom: '24px' }}>
                {[
                    { value: stats.totalAttendees, label: 'Total Attendees', colorClass: 'blue' },
                    { value: stats.firstTimers, label: 'First Timers', colorClass: 'green' },
                    { value: stats.members, label: 'Members', colorClass: 'purple' },
                    { value: stats.totalSent, label: 'Messages Sent', colorClass: 'amber' }
                ].map((stat, i) => (
                    <div key={i} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setShowBulkModal(true)}>
                        <div className="stat-card-top">
                            <span className="stat-label">{stat.label}</span>
                            <span className={`stat-icon ${stat.colorClass}`} />
                        </div>
                        <div className="stat-value">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Quick Action Cards */}
            <div className="msg-action-grid">
                {actionCards.map((card, i) => (
                    <div key={i} className="msg-action-card" onClick={() => setShowBulkModal(true)}>
                        <div className={`msg-action-icon ${card.iconClass}`}>{card.icon}</div>
                        <div className="msg-action-title">{card.title}</div>
                        <div className="msg-action-desc">{card.desc}</div>
                    </div>
                ))}
            </div>

            {/* Scheduled Messages */}
            <div style={{ marginBottom: '24px' }}>
                <div className="table-header" style={{ padding: '0 0 12px 0', border: 'none' }}>
                    <h3 className="msg-section-title">Scheduled Messages</h3>
                    <span className="helper">{scheduled.filter(s => s.status === 'pending').length} pending</span>
                </div>
                <div className="data-table-card">
                    {loading ? (
                        <div className="empty-state">Loading...</div>
                    ) : scheduled.length === 0 ? (
                        <div className="empty-state">
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                            No scheduled messages yet. Create a message and set a future date.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Channel</th>
                                        <th>Recipients</th>
                                        <th>Scheduled For</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scheduled.map(msg => (
                                        <tr key={msg.id}>
                                            <td style={{ textTransform: 'capitalize' }}>{msg.channel}</td>
                                            <td>{msg.recipient_count}</td>
                                            <td>{formatDate(msg.scheduled_time)}</td>
                                            <td><span className={`status-pill ${msg.status}`}>{msg.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Message History */}
            <div>
                <div className="table-header" style={{ padding: '0 0 12px 0', border: 'none' }}>
                    <h3 className="msg-section-title">Recent Messages</h3>
                    <span className="helper">Last 10 messages</span>
                </div>
                <div className="data-table-card">
                    {loading ? (
                        <div className="empty-state">Loading...</div>
                    ) : history.length === 0 ? (
                        <div className="empty-state">
                            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
                            No messages sent yet. Send your first bulk message.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Channel</th>
                                        <th>Message</th>
                                        <th>Recipients</th>
                                        <th>Status</th>
                                        <th>Sent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.slice(0, 10).map(msg => (
                                        <tr key={msg.id}>
                                            <td style={{ textTransform: 'capitalize' }}>{msg.channel}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {msg.message}
                                            </td>
                                            <td>{msg.recipient_count}</td>
                                            <td><span className={`status-pill ${msg.status}`}>{msg.status}</span></td>
                                            <td style={{ color: 'var(--text-3)', fontSize: '12px' }}>{formatDate(msg.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showBulkModal && (
                <BulkMessageModal
                    isOpen={showBulkModal}
                    onClose={() => setShowBulkModal(false)}
                    recipients={items || []}
                    onSend={handleSendBulkMessage}
                    insights={insights}
                />
            )}
        </div>
    );
}
