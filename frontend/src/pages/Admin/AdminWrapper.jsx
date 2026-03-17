import React from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import LiveTable from '../../components/Admin/LiveTable.jsx';
import AnalyticsDashboard from '../../components/Admin/AnalyticsDashboard.jsx';
import AttendanceCategoryView from '../../components/Admin/AttendanceCategoryView.jsx';
import AdminQRGenerator from '../../components/Admin/AdminQRGenerator.jsx';
import MessagesPage from './MessagesPage.jsx';
import PredictiveAnalytics from '../../components/Admin/PredictiveAnalytics.jsx';

export function AdminLive() {
    const { items } = useOutletContext();

    const totalEntries = items.length;
    const firstTimers = items.filter(i => i.firstTimer).length;
    const departments = new Set(items.map(i => i.department).filter(Boolean)).size;
    const today = new Date().toISOString().slice(0, 10);
    const todayEntries = items.filter(i => i.createdAt?.startsWith(today)).length;
    const todayFirstTimers = items.filter(i => i.createdAt?.startsWith(today) && i.firstTimer).length;

    return (
        <div className="admin-live-container animate-fade-in">
            <div className="admin-card-grid">
                {/* Total Registered */}
                <div className="stat-card">
                    <div className="stat-card-top">
                        <span className="stat-label">Total Registered</span>
                        <span className="stat-icon blue">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </span>
                    </div>
                    <div className="stat-value">{totalEntries}</div>
                    <div className="stat-sub">Across all events</div>
                </div>

                {/* Today's Check-ins */}
                <div className="stat-card highlighted">
                    <div className="stat-card-top">
                        <span className="stat-label">Today's Check-ins</span>
                        <span className="stat-icon blue">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </span>
                    </div>
                    <div className="stat-value">{todayEntries}</div>
                    <div className="stat-sub">{todayFirstTimers} new first-timers today</div>
                </div>

                {/* First Timers */}
                <div className="stat-card">
                    <div className="stat-card-top">
                        <span className="stat-label">First Timers</span>
                        <span className="stat-icon purple">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
                            </svg>
                        </span>
                    </div>
                    <div className="stat-value">{firstTimers}</div>
                    <div className="stat-sub">{totalEntries > 0 ? ((firstTimers / totalEntries) * 100).toFixed(0) : 0}% of total</div>
                </div>

                {/* Departments */}
                <div className="stat-card">
                    <div className="stat-card-top">
                        <span className="stat-label">Departments</span>
                        <span className="stat-icon green">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="6" height="4" rx="1" /><rect x="9" y="3" width="6" height="4" rx="1" />
                                <rect x="16" y="3" width="6" height="4" rx="1" /><rect x="2" y="10" width="6" height="11" rx="1" />
                                <rect x="9" y="10" width="6" height="11" rx="1" /><rect x="16" y="10" width="6" height="11" rx="1" />
                            </svg>
                        </span>
                    </div>
                    <div className="stat-value">{departments}</div>
                    <div className="stat-sub">Units represented</div>
                </div>
            </div>

            {/* Live Table */}
            <div className="data-table-card">
                <div className="table-header">
                    <div className="table-header-left">
                        <h3>Live Attendance Feed</h3>
                        <span className="live-badge"><span className="pulse-dot" /> Live</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{totalEntries} total entries</span>
                </div>
                <LiveTable items={items} />
            </div>
        </div>
    );
}

export function AdminAnalytics() {
    const { items } = useOutletContext();
    return <AnalyticsDashboard attendanceData={items} />;
}

export function AdminPredictive() {
    return <PredictiveAnalytics />;
}

export function AdminCategories() {
    const { items } = useOutletContext();
    return <AttendanceCategoryView data={items} />;
}

export function AdminQR() {
    const { eventFilter } = useOutletContext();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const type = params.get('type') || 'member';

    return (
        <div className="animate-fade-in">
            <AdminQRGenerator
                eventId={eventFilter || 'default-event'}
                initialCategory={type}
            />
        </div>
    );
}

import EventsPage from './EventsPage.jsx';
export function AdminEvents() {
    return <EventsPage />;
}

export function AdminMessages() {
    return <MessagesPage />;
}

import MembersPage from './MembersPage.jsx';
export function AdminMembers() {
    return <MembersPage />;
}

import AbsenteesPage from './AbsenteesPage.jsx';
export function AdminAbsentees() {
    return <AbsenteesPage />;
}

import SettingsPage from './SettingsPage.jsx';
export function AdminSettings() {
    return <SettingsPage />;
}
