import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TopNavbar = ({ onSearch }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch(query);
    };

    const formatDate = (date) => date.toLocaleDateString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });

    const formatTime = (date) => date.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

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
                        onChange={handleSearchChange}
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
                    <button className="utility-btn" title="Notifications" onClick={() => { }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <span className="notification-badge"></span>
                    </button>
                </div>

                <div className="user-profile">
                    <div className="profile-info">
                        <span className="user-name">Admin User</span>
                        <span className="user-role">Super Admin</span>
                    </div>
                    <div className="profile-avatar">
                        <img
                            src="https://ui-avatars.com/api/?name=Admin+User&background=f59e0b&color=000&size=64"
                            alt="Admin"
                        />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default TopNavbar;
