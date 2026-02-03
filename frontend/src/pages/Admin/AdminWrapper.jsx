import React from 'react';
import { useOutletContext } from 'react-router-dom';
import LiveTable from '../../components/Admin/LiveTable.jsx';
import AnalyticsDashboard from '../../components/Admin/AnalyticsDashboard.jsx';
import AttendanceCategoryView from '../../components/Admin/AttendanceCategoryView.jsx';
import AdminQRGenerator from '../../components/Admin/AdminQRGenerator.jsx';

export function AdminLive() {
    const { items } = useOutletContext();
    return <LiveTable items={items} />;
}

export function AdminAnalytics() {
    const { items } = useOutletContext();
    return <AnalyticsDashboard attendanceData={items} />;
}

export function AdminCategories() {
    const { items } = useOutletContext();
    return <AttendanceCategoryView data={items} />;
}

export function AdminQR() {
    const { eventFilter } = useOutletContext();
    return (
        <div className="animate-fade-in">
            <AdminQRGenerator eventId={eventFilter || 'default-event'} />
        </div>
    );
}
