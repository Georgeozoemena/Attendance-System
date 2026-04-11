import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../../services/api';

function useOrgSettings() {
    const [org, setOrg] = useState({
        churchName: localStorage.getItem('churchName') || 'Dominion City',
        parish: localStorage.getItem('parish') || 'Olive Parish',
    });
    useEffect(() => {
        function update() {
            setOrg({
                churchName: localStorage.getItem('churchName') || 'Dominion City',
                parish: localStorage.getItem('parish') || 'Olive Parish',
            });
        }
        window.addEventListener('orgSettingsChanged', update);
        return () => window.removeEventListener('orgSettingsChanged', update);
    }, []);
    return org;
}

function NotificationsPanel({ onClose, onNavigate }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const adminKey = localStorage.getItem('adminKey');

    useEffect(() => {
        async function fetchAll() {
            setLoading(true);
            try {
                const headers = { 'x-admin-key': adminKey };
                const [prayerRes, testimonyRes, birthdayRes, membersRes] = await Promise.allSettled([
                    fetch(`${API_BASE}/api/prayer?status=pending`, { headers }),
                    fetch(`${API_BASE}/api/testimonies?status=pending`, { headers }),
                    fetch(`${API_BASE}/api/members/profiles/birthdays`, { headers }),
                    fetch(`${API_BASE}/api/members/profiles?followUpStatus=new`, { headers }),
                ]);

                const notifications = [];

                if (prayerRes.status === 'fulfilled' && prayerRes.value.ok) {
                    const data = await prayerRes.value.json();
                    if (data.length > 0) notifications.push({
                        id: 'prayer', type: 'prayer', icon: '🙏',
                        title: `${data.length} prayer request${data.length > 1 ? 's' : ''} need attention`,
                        sub: 'Tap to review',
                        route: '/admin/prayer',
                        count: data.length
                    });
                }

                if (testimonyRes.status === 'fulfilled' && testimonyRes.value.ok) {
                    const data = await testimonyRes.value.json();
                    if (data.length > 0) notifications.push({
                        id: 'testimony', type: 'testimony', icon: '✨',
                        title: `${data.length} testimon${data.length > 1 ? 'ies' : 'y'} pending review`,
                        sub: 'Tap to review',
                        route: '/admin/testimonies',
                        count: data.length
                    });
                }

                if (birthdayRes.status === 'fulfilled' && birthdayRes.value.ok) {
                    const data = await birthdayRes.value.json();
                    const today = data.filter(m => m.daysUntil === 0);
                    const soon = data.filter(m => m.daysUntil > 0 && m.daysUntil <= 7);
                    if (today.length > 0) notifications.push({
                        id: 'birthday-today', type: 'birthday', icon: '🎂',
                        title: `${today.map(m => m.name).join(', ')} ${today.length === 1 ? 'has' : 'have'} a birthday today!`,
                        sub: 'Send them a message',
                        route: '/admin/members',
                        count: today.length
                    });
                    if (soon.length > 0) notifications.push({
                        id: 'birthday-soon', type: 'birthday', icon: '🎁',
                        title: `${soon.length} birthday${soon.length > 1 ? 's' : ''} coming up this week`,
                        sub: soon.map(m => `${m.name} (${m.daysUntil}d)`).join(', '),
                        route: '/admin/members',
                        count: soon.length
                    });
                }

                if (membersRes.status === 'fulfilled' && membersRes.value.ok) {
                    const data = await membersRes.value.json();
                    // Filter to only new visitors (followUpStatus = 'new')
                    const newVisitors = Array.isArray(data) ? data.filter(m => m.followUpStatus === 'new') : [];
                    if (newVisitors.length > 0) notifications.push({
                        id: 'new-visitors', type: 'visitor', icon: '👋',
                        title: `${newVisitors.length} new visitor${newVisitors.length > 1 ? 's' : ''} need follow-up`,
                        sub: 'Check the follow-up pipeline',
                        route: '/admin/members',
                        count: newVisitors.length
                    });
                }

                setItems(notifications);
            } catch (err) {
                console.error('Notifications fetch failed', err);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [adminKey]);

    return (
        <div style={{
            position: 'absolute', top: '48px', right: 0, width: '340px',
            background: 'var(--surface)', border: '1px solid var(--border-2)',
            borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)',
            zIndex: 999, overflow: 'hidden', animation: 'fadeUp 0.15s ease'
        }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-1)' }}>Notifications</span>
                {items.length > 0 && (
                    <span style={{ fontSize: '11px', fontWeight: '700', background: 'var(--dc-blue-lt)', color: 'var(--dc-blue)', border: '1px solid var(--dc-blue-border)', borderRadius: '100px', padding: '2px 8px' }}>
                        {items.length}
                    </span>
                )}
            </div>

            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-4)', fontSize: '13px' }}>Loading...</div>
                ) : items.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-2)' }}>All caught up</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>No pending items right now</div>
                    </div>
                ) : items.map(item => (
                    <button
                        key={item.id}
                        onClick={() => { onClose(); onNavigate(item.route); }}
                        style={{
                            width: '100%', padding: '14px 16px', background: 'none', border: 'none',
                            borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
                            display: 'flex', alignItems: 'flex-start', gap: '12px', transition: 'background 0.12s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>{item.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-1)', lineHeight: '1.4' }}>{item.title}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.sub}</div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

const TopNavbar = ({ onSearch }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifCount, setNotifCount] = useState(0);
    const notifRef = useRef();
    const navigate = useNavigate();
    const org = useOrgSettings();
    const adminKey = localStorage.getItem('adminKey');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Quick count for badge — lightweight
    useEffect(() => {
        async function fetchCount() {
            try {
                const headers = { 'x-admin-key': adminKey };
                const [p, t] = await Promise.allSettled([
                    fetch(`${API_BASE}/api/prayer?status=pending`, { headers }),
                    fetch(`${API_BASE}/api/testimonies?status=pending`, { headers }),
                ]);
                let count = 0;
                if (p.status === 'fulfilled' && p.value.ok) { const d = await p.value.json(); count += d.length; }
                if (t.status === 'fulfilled' && t.value.ok) { const d = await t.value.json(); count += d.length; }
                setNotifCount(count);
            } catch {}
        }
        fetchCount();
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, [adminKey]);

    // Close panel on outside click
    useEffect(() => {
        function handleClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Navigate from notification panel
    function handleNotifNavigate(route) {
        setShowNotifications(false);
        navigate(route);
    }

    return (
        <nav className="admin-top-navbar">
            <div className="navbar-search">
                <div className="search-input-wrapper">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search members, events, or check-ins..."
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); onSearch(e.target.value); }}
                    />
                    <div className="search-shortcut">⌘F</div>
                </div>
            </div>

            <div className="navbar-utilities">
                <div className="system-time">
                    <div className="time-display">{formatTime(currentTime)}</div>
                    <div className="date-display">{formatDate(currentTime)}</div>
                </div>

                <div className="utility-icons">
                    <div style={{ position: 'relative' }} ref={notifRef}>
                        <button
                            className="utility-btn"
                            title="Notifications"
                            onClick={() => setShowNotifications(s => !s)}
                            style={{ position: 'relative' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {notifCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '4px', right: '4px',
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: 'var(--dc-blue)', border: '1.5px solid var(--bg-2)'
                                }} />
                            )}
                        </button>

                        {showNotifications && (
                            <NotificationsPanel onClose={() => setShowNotifications(false)} onNavigate={handleNotifNavigate} />
                        )}
                    </div>
                </div>

                <div className="user-profile">
                    <div className="profile-info">
                        <span className="user-name">{org.churchName}</span>
                        <span className="user-role">{org.parish}</span>
                    </div>
                    <div className="profile-avatar" style={{ background: 'var(--dc-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: 34, height: 34, flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default TopNavbar;
