import React, { useState, useEffect } from 'react';
import { API_BASE, getAuthHeaders } from '../../services/api';

const MemberDetailsModal = ({ memberCode, onClose }) => {
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (memberCode) fetchDetails();
    }, [memberCode]);

    const fetchDetails = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/members/${memberCode}`, {
                headers: { ...getAuthHeaders() }
            });
            if (res.ok) {
                const data = await res.json();
                setMember(data);
            }
        } catch (err) {
            console.error('Failed to fetch member details', err);
        } finally {
            setLoading(false);
        }
    };

    if (!memberCode) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal wide" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                {loading ? (
                    <div className="loading-state">Loading profile...</div>
                ) : member ? (
                    <div className="member-details-view">
                        <header className="details-header" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div className="avatar large" style={{
                                    width: '64px', height: '64px', borderRadius: '50%',
                                    background: 'var(--primary-lt)', color: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '24px', fontWeight: '700'
                                }}>
                                    {member.name?.charAt(0)}
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '20px' }}>{member.name}</h2>
                                    <span className={`badge ${member.category}`} style={{ marginTop: '4px', display: 'inline-block' }}>
                                        #{member.uniqueCode} • {member.category}
                                    </span>
                                </div>
                            </div>
                        </header>

                        <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
                            <div className="detail-item">
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>Phone Number</label>
                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.phone || 'N/A'}</div>
                            </div>
                            <div className="detail-item">
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>Email Address</label>
                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.email || 'N/A'}</div>
                            </div>
                            <div className="detail-item">
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>Department</label>
                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.department || 'General'}</div>
                            </div>
                            <div className="detail-item">
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>Occupation</label>
                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.occupation || 'N/A'}</div>
                            </div>
                            <div className="detail-item" style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-3)', marginBottom: '4px' }}>Address</label>
                                <div style={{ fontSize: '14px', fontWeight: '500' }}>{member.address || 'N/A'}</div>
                            </div>
                        </div>

                        <div className="attendance-history">
                            <h3 style={{ fontSize: '15px', marginBottom: '12px', fontWeight: '600' }}>Attendance History</h3>
                            <div className="history-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                                <table className="admin-table mini">
                                    <thead style={{ position: 'sticky', top: 0, background: 'var(--surface)' }}>
                                        <tr>
                                            <th>Date</th>
                                            <th>Event</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {member.history?.map((h, i) => (
                                            <tr key={i}>
                                                <td>{new Date(h.createdAt).toLocaleDateString()}</td>
                                                <td>{h.eventId || 'General'}</td>
                                                <td style={{ textTransform: 'capitalize' }}>{h.type}</td>
                                            </tr>
                                        ))}
                                        {(!member.history || member.history.length === 0) && (
                                            <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-3)' }}>No history found</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: '24px' }}>
                            <button className="modal-btn" onClick={onClose} style={{ width: '100%' }}>Close Profile</button>
                        </div>
                    </div>
                ) : (
                    <div className="error-state">Member not found.</div>
                )}
            </div>
        </div>
    );
};

export default MemberDetailsModal;
