import React, { useState, useEffect } from 'react';
import { API_BASE, getAuthHeaders } from '../../services/api';

const AbsenteesPage = ({ readOnly, viewMode }) => {
    const [absentees, setAbsentees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAbsentees();
    }, []);

    const fetchAbsentees = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/absentees`, {
                headers: { ...getAuthHeaders() }
            });
            const data = await res.json();
            setAbsentees(data);
        } catch (err) {
            console.error('Failed to fetch absentees', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading-state">Loading absentees...</div>;
    }

    // Summary-only view (e.g. pastor role via viewMode='summary')
    if (viewMode === 'summary') {
        return (
            <div className="admin-page-container">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Absentees</h1>
                        <p className="subtitle">People who were here last time but not today</p>
                    </div>
                </header>
                <div className="admin-card-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '260px' }}>
                    <div className="stat-card">
                        <div className="stat-card-top">
                            <span className="stat-label">Total Absentees</span>
                        </div>
                        <div className="stat-value">{absentees.length}</div>
                        <div className="stat-sub">Contact details hidden for your role</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            <header className="page-header">
                <div className="header-content">
                    <h1>Absentees</h1>
                    <p className="subtitle">People who were here last time but not today</p>
                </div>
                <button className="action-btn" onClick={fetchAbsentees}>
                    Refresh List
                </button>
            </header>

            <div className="admin-card-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '200px', marginBottom: '20px' }}>
                <div className="stat-card">
                    <div className="stat-card-top">
                        <span className="stat-label">Total Absentees</span>
                    </div>
                    <div className="stat-value">{absentees.length}</div>
                    <div className="stat-sub">Missed last session</div>
                </div>
            </div>

            <div className="data-table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Last Seen</th>
                                {!readOnly && <th>Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {absentees.length > 0 ? (
                                absentees.map(person => (
                                    <tr key={person.uniqueCode}>
                                        <td className="code-cell">#{person.uniqueCode}</td>
                                        <td className="name-cell">{person.name}</td>
                                        <td>{person.phone || '-'}</td>
                                        <td>{new Date(person.lastSeen).toLocaleDateString()}</td>
                                        {!readOnly && (
                                            <td>
                                                <button
                                                    className="small-btn"
                                                    onClick={() => {
                                                        if (person.phone) {
                                                            const msg = encodeURIComponent(`Hi ${person.name}, we missed you at our last service. Hope to see you soon! 🙏`);
                                                            window.open(`https://wa.me/${person.phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
                                                        } else {
                                                            alert('No phone number on record for this person.');
                                                        }
                                                    }}
                                                >
                                                    Follow Up
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={readOnly ? 4 : 5} className="empty-state">No absentees found. Great attendance today!</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AbsenteesPage;
