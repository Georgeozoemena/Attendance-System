import React, { useState, useEffect } from 'react';
import MemberDetailsModal from '../../components/Admin/MemberDetailsModal.jsx';
import { API_BASE } from '../../services/api';

const MembersPage = () => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [selectedMemberCode, setSelectedMemberCode] = useState(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const adminKey = localStorage.getItem('adminKey');
            const res = await fetch(`${API_BASE}/api/members`, {
                headers: { 'Authorization': adminKey }
            });
            const data = await res.json();
            setMembers(data);
        } catch (err) {
            console.error('Failed to fetch members', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredMembers = members.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.uniqueCode.includes(searchTerm) ||
            (m.phone && m.phone.includes(searchTerm));
        const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    if (loading) {
        return <div className="loading-state">Loading members...</div>;
    }

    return (
        <div className="admin-page-container">
            <header className="page-header">
                <div className="header-content">
                    <h1>Member Directory</h1>
                    <p className="subtitle">Manage all unique members and workers</p>
                </div>
            </header>

            <div className="controls-row">
                <div className="search-box">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                        type="text"
                        placeholder="Search members by name, code, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="all">All Categories</option>
                        <option value="member">Members</option>
                        <option value="worker">Workers</option>
                    </select>
                </div>
            </div>

            <div className="data-table-card">
                <div className="table-responsive">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Name</th>
                                <th>Category</th>
                                <th>Phone</th>
                                <th>Last Seen</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.length > 0 ? (
                                filteredMembers.map(member => (
                                    <tr key={member.uniqueCode}>
                                        <td className="code-cell">#{member.uniqueCode}</td>
                                        <td className="name-cell">{member.name}</td>
                                        <td>
                                            <span className={`badge ${member.category}`}>
                                                {member.category}
                                            </span>
                                        </td>
                                        <td>{member.phone || '-'}</td>
                                        <td>{new Date(member.lastSeen).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                className="small-btn text"
                                                onClick={() => setSelectedMemberCode(member.uniqueCode)}
                                                style={{ color: 'var(--primary)', fontWeight: '600' }}
                                            >
                                                View profile
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="empty-state">No members found matching your search.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedMemberCode && (
                <MemberDetailsModal
                    memberCode={selectedMemberCode}
                    onClose={() => setSelectedMemberCode(null)}
                />
            )}
        </div>
    );
};

export default MembersPage;
