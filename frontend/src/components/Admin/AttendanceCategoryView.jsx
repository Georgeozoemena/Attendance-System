import React, { useState, useMemo } from 'react';
import BulkMessageModal from './BulkMessageModal';

// Styles object to replace Tailwind
const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px' },
    header: {
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--card-bg, white)', padding: '24px', borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb'
    },
    headerTitle: { fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 4px 0', color: '#1f2937' },
    headerSubtitle: { color: '#6b7280', margin: 0 },
    controls: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' },
    btnGroup: { display: 'flex', background: '#f3f4f6', borderRadius: '8px', padding: '4px' },
    viewBtn: (isActive) => ({
        padding: '8px 16px', border: 'none', background: isActive ? 'white' : 'transparent',
        color: isActive ? '#2563eb' : '#4b5563', borderRadius: '6px', fontWeight: 500,
        boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s'
    }),
    actionBtn: (disabled) => ({
        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px',
        background: disabled ? '#d1d5db' : '#2563eb', color: 'white', border: 'none',
        borderRadius: '8px', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 4px 6px -1px rgba(37, 99, 235, 0.2)', transition: 'all 0.2s'
    }),
    badge: { background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', height: 'fit-content' },
    emptyState: {
        textAlign: 'center', padding: '80px 20px', background: '#f9fafb', borderRadius: '12px',
        border: '2px dashed #e5e7eb', color: '#6b7280'
    },
    grid: {
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px'
    },
    card: (isSelected) => ({
        position: 'relative', cursor: 'pointer', borderRadius: '12px', border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
        background: isSelected ? '#eff6ff' : 'white', transition: 'all 0.2s', overflow: 'hidden',
        boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.1)' : '0 1px 2px rgba(0,0,0,0.05)'
    }),
    checkbox: (isSelected) => ({
        position: 'absolute', top: '16px', right: '16px', width: '24px', height: '24px', borderRadius: '50%',
        border: isSelected ? 'none' : '2px solid #d1d5db', background: isSelected ? '#3b82f6' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
    }),
    cardContent: { padding: '24px' },
    cardTitle: { fontSize: '1.25rem', fontWeight: 'bold', marginRight: '32px', marginBottom: '16px', color: '#1f2937' },
    bigNumber: { fontSize: '2.5rem', fontWeight: '900', color: '#2563eb', lineHeight: 1 },
    metaText: { fontSize: '0.875rem', color: '#6b7280', marginLeft: '8px', fontWeight: 500 },
    facepile: { display: 'flex', marginTop: '24px', marginLeft: '10px' },
    avatar: {
        width: '36px', height: '36px', borderRadius: '50%', background: '#e5e7eb', border: '2px solid white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold',
        marginLeft: '-10px', color: '#4b5563', textTransform: 'uppercase'
    },
    moreAvatar: { background: '#f3f4f6', color: '#6b7280' }
};

const AttendanceCategoryView = ({ data }) => {
    const [viewMode, setViewMode] = useState('month'); // 'day', 'month', 'year'
    const [selectedGroups, setSelectedGroups] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Group data based on viewMode
    const groupedData = useMemo(() => {
        const groups = {};

        data.forEach(item => {
            const date = new Date(item.createdAt || item.timestamp);
            if (isNaN(date.getTime())) return;

            let key;
            const options = { year: 'numeric', month: 'long', day: 'numeric' };

            switch (viewMode) {
                case 'year': key = date.getFullYear().toString(); break;
                case 'month': key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }); break;
                case 'day':
                default: key = date.toLocaleDateString('en-US', options); break;
            }

            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
        });

        return Object.fromEntries(
            Object.entries(groups).sort((a, b) => new Date(b.key) - new Date(a.key))
        );
    }, [data, viewMode]);

    const toggleGroup = (groupKey) => {
        setSelectedGroups(prev => ({ ...prev, [groupKey]: !prev[groupKey] }));
    };

    const getSelectedCount = () => {
        let count = 0;
        Object.keys(selectedGroups).forEach(key => {
            if (selectedGroups[key]) count += groupedData[key]?.length || 0;
        });
        return count;
    };

    const handleSendMessage = (messageData) => {
        console.log('Sending message:', messageData);
        alert(`Message ${messageData.scheduledTime ? 'scheduled' : 'sent'} to ${getSelectedCount()} recipients!`);
        setSelectedGroups({});
    };

    const groupKeys = Object.keys(groupedData);

    return (
        <div style={styles.container}>
            {/* Header / Controls */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.headerTitle}>Category Groups</h2>
                    <p style={styles.headerSubtitle}>Select groups to send bulk updates.</p>
                </div>

                <div style={styles.controls}>
                    <div style={styles.btnGroup}>
                        {['day', 'month', 'year'].map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                style={styles.viewBtn(viewMode === mode)}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>

                    <button
                        disabled={getSelectedCount() === 0}
                        onClick={() => setIsModalOpen(true)}
                        style={styles.actionBtn(getSelectedCount() === 0)}
                    >
                        <span>Send Message</span>
                        {getSelectedCount() > 0 && (
                            <span style={styles.badge}>{getSelectedCount()}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Grid Content */}
            {groupKeys.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>No attendance data found for this view.</p>
                </div>
            ) : (
                <div style={styles.grid}>
                    {groupKeys.map(key => {
                        const isSelected = !!selectedGroups[key];
                        const count = groupedData[key].length;

                        return (
                            <div
                                key={key}
                                onClick={() => toggleGroup(key)}
                                style={styles.card(isSelected)}
                            >
                                {/* Selection Checkbox */}
                                <div style={styles.checkbox(isSelected)}>
                                    {isSelected && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"></polyline>
                                        </svg>
                                    )}
                                </div>

                                <div style={styles.cardContent}>
                                    <h3 style={styles.cardTitle}>{key}</h3>

                                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                        <span style={styles.bigNumber}>{count}</span>
                                        <span style={styles.metaText}>attendees</span>
                                    </div>

                                    {/* Facepile */}
                                    <div style={styles.facepile}>
                                        {groupedData[key].slice(0, 6).map((user, idx) => (
                                            <div
                                                key={user.id || idx}
                                                style={styles.avatar}
                                                title={user.name}
                                            >
                                                {user.name ? user.name.charAt(0) : '?'}
                                            </div>
                                        ))}
                                        {count > 6 && (
                                            <div style={{ ...styles.avatar, ...styles.moreAvatar }}>
                                                +{count - 6}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <BulkMessageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                recipientCount={getSelectedCount()}
                onSend={handleSendMessage}
            />
        </div>
    );
};

export default AttendanceCategoryView;
