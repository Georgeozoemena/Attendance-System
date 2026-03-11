import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
    const navigate = useNavigate();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showQRDropdown, setShowQRDropdown] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('adminKey');
        navigate('/admin/login');
        setShowLogoutDialog(false);
    };

    const linkClass = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`;

    return (
        <aside className="admin-sidebar">
            <div className="sidebar-brand">
                <div className="login-brand-icon" style={{ width: 30, height: 30, flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2L2 7l10 5 10-5-10-5z" />
                        <path d="M2 17l10 5 10-5" />
                        <path d="M2 12l10 5 10-5" />
                    </svg>
                </div>
                <div className="brand-text">
                    <h2>Dominion City</h2>
                    <span>Olive Parish</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-group">
                    <label>General</label>
                    <NavLink to="/admin/live" className={linkClass}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        Dashboard
                    </NavLink>
                    <NavLink to="/admin/analysis" className={linkClass}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        Analytics
                    </NavLink>
                    <NavLink to="/admin/events" className={linkClass}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Events
                    </NavLink>
                </div>

                <div className="nav-group">
                    <NavLink to="/admin/members" className={linkClass}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        Member Directory
                    </NavLink>
                    <NavLink to="/admin/absentees" className={linkClass}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                            <line x1="12" y1="2" x2="12" y2="12"></line>
                        </svg>
                        Absentees
                    </NavLink>
                </div>

                <div className="nav-group">
                    <label>Tools</label>
                    <div className={`dropdown-container ${showQRDropdown ? 'open' : ''}`}>
                        <button className="sidebar-link dropdown-toggle" onClick={() => setShowQRDropdown(!showQRDropdown)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                                <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                                <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                                <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                                <rect x="7" y="7" width="3" height="3"></rect>
                                <rect x="14" y="7" width="3" height="3"></rect>
                                <rect x="7" y="14" width="3" height="3"></rect>
                                <rect x="14" y="14" width="3" height="3"></rect>
                            </svg>
                            QR Generator
                            <svg className={`chevron ${showQRDropdown ? 'up' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        {showQRDropdown && (
                            <div className="dropdown-menu">
                                <NavLink to="/admin/qrcode?type=member" className={linkClass}>
                                    Member Station
                                </NavLink>
                                <NavLink to="/admin/qrcode?type=worker" className={linkClass}>
                                    Worker Station
                                </NavLink>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={() => setShowLogoutDialog(true)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                    </svg>
                    Logout
                </button>
            </div>

            {showLogoutDialog && (
                <div className="modal-overlay" onClick={() => setShowLogoutDialog(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="modal-icon-wrapper danger">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                            </div>
                            <h3>Logout Confirmation</h3>
                            <p className="helper">Are you sure you want to logout? You will need to login again to access the admin dashboard.</p>
                            <div className="modal-actions">
                                <button className="modal-btn primary danger" onClick={handleLogout}>Logout</button>
                                <button className="modal-btn" onClick={() => setShowLogoutDialog(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
