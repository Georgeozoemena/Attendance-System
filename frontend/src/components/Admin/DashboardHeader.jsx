import React from 'react';
import { NavLink } from 'react-router-dom';

const DashboardHeader = ({ onFilter, onExport }) => {
    const linkClass = ({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`;

    return (
        <>
            <div className="form-header admin-header" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1><span>Admin Dashboard</span><br />Overview</h1>
                <p className="helper" style={{ textAlign: 'right' }}>
                    New submissions appear here in real time. Use the tabs to view analysis and tools.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
                <div className='admin-tabs-btns' style={{ display: 'flex', alignSelf: 'center', justifySelf: 'center', gap: 8 }}>
                    <NavLink to="/admin/live" className={linkClass}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        Live Data
                    </NavLink>
                    <NavLink to="/admin/analysis" className={linkClass}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        Analytics
                    </NavLink>
                    <NavLink to="/admin/categories" className={linkClass}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Categories
                    </NavLink>
                    <NavLink to="/admin/qrcode" className={linkClass}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        QR Generator
                    </NavLink>
                </div>

                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn-ghost" onClick={onFilter}>
                        Filter
                    </button>
                    <button className="btn-ghost" onClick={onExport}>
                        Export
                    </button>
                    <button className="btn-ghost" style={{ color: '#e11d48' }} onClick={() => {
                        localStorage.removeItem('adminKey');
                        window.location.href = '/admin/login';
                    }}>
                        Logout
                    </button>
                </div>
            </div>
        </>
    );
};

export default DashboardHeader;
