import React from 'react';
import { useLocation } from 'react-router-dom';

const DashboardHeader = ({ onFilter, onExport }) => {
    const location = useLocation();

    // Get title based on current path
    const getTitle = () => {
        const path = location.pathname.split('/').pop();
        switch (path) {
            case 'live': return 'Live Attendance';
            case 'analysis': return 'Analytics Overview';
            case 'categories': return 'Attendance Categories';
            case 'messages': return 'Mass Messaging';
            case 'qrcode': return 'QR Code Generator';
            case 'events': return 'Service & Events Management';
            case 'members': return 'Member Directory';
            case 'absentees': return 'Absentee Tracking';
            default: return 'Admin Dashboard';
        }
    };

    const getDescription = () => {
        const path = location.pathname.split('/').pop();
        switch (path) {
            case 'live': return 'Real-time monitoring of all event check-ins.';
            case 'analysis': return 'In-depth analysis of attendance trends and demographics.';
            case 'categories': return 'View and manage attendance by different categories.';
            case 'messages': return 'Send bulk messages to registered participants.';
            case 'qrcode': return 'Generate unique QR codes for event check-ins.';
            case 'events': return 'Create and manage church services, programs, and weekly meetings.';
            case 'members': return 'Manage the complete database of members, workers, and visitors.';
            case 'absentees': return 'Track members who missed recent services for follow-up.';
            default: return 'Welcome back to the admin portal.';
        }
    };

    return (
        <header className="admin-top-bar">
            <div className="page-title">
                <h1>{getTitle()}</h1>
                <p>{getDescription()}</p>
            </div>

            <div className="top-bar-actions">
                <button className="action-btn" onClick={onFilter}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    Filter
                </button>
                <button className="action-btn primary" onClick={onExport}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Export Data
                </button>
            </div>
        </header>
    );
};

export default DashboardHeader;
