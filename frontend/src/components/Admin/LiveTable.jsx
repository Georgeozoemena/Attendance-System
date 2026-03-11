import React from 'react';

export default function LiveTable({ items }) {
    if (items.length === 0) {
        return (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-4)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}>
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 4 }}>No check-ins yet</p>
                <p style={{ fontSize: 13, color: 'var(--text-4)' }}>Attendance will appear here in real-time as people check in.</p>
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>First Timer</th>
                        <th>Department</th>
                        <th>Event</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((row, i) => (
                        <tr key={row.id || i}>
                            <td style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                                {row.createdAt ? new Date(row.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td>
                                <span className={`badge-pill ${row.type || 'member'}`}>
                                    {row.type || 'member'}
                                </span>
                            </td>
                            <td style={{ color: 'var(--text-3)', fontFamily: 'monospace', fontSize: 12 }}>{row.uniqueCode || '—'}</td>
                            <td className="name-cell">{row.name}</td>
                            <td style={{ color: 'var(--text-3)' }}>{row.email}</td>
                            <td style={{ color: 'var(--text-3)' }}>{row.phone}</td>
                            <td>
                                {row.firstTimer
                                    ? <span className="badge-pill" style={{ background: 'var(--purple-lt)', color: 'var(--purple)' }}>Yes 🎉</span>
                                    : <span style={{ color: 'var(--text-4)', fontSize: 12 }}>No</span>
                                }
                            </td>
                            <td style={{ color: 'var(--text-3)' }}>{row.department || '—'}</td>
                            <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{row.eventId}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
