import React, { useState, useEffect } from 'react';

const AbsenteesPage = () => {
    const [absentees, setAbsentees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAbsentees();
    }, []);

    const fetchAbsentees = async () => {
        try {
            const adminKey = localStorage.getItem('adminKey');
            const res = await fetch('/api/absentees', {
                headers: { 'Authorization': adminKey }
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

            <div className="stats-grid">
                <div className="stat-card danger">
                    <span className="stat-label">Total Absentees</span>
                    <span className="stat-value">{absentees.length}</span>
                </div>
            </div>

            <div className="data-table-card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Last Seen</th>
                            <th>Action</th>
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
                                    <td>
                                        <button className="small-btn outline">Follow Up</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="empty-state">No absentees found. Great attendance today!</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AbsenteesPage;
