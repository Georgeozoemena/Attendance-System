import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showQRDropdown, setShowQRDropdown] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('adminKey');
        localStorage.removeItem('adminTokenExpiry');
        navigate('/admin/login');
        setShowLogoutDialog(false);
        if (onClose) onClose();
    };

    const handleNavClick = () => {
        // On mobile, close sidebar after clicking a link
        if (window.innerWidth <= 768 && onClose) {
            onClose();
        }
    };

    const linkClass = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`;

    return (
        <aside className={`admin-sidebar ${isOpen ? 'mobile-open' : ''}`}>
            {/* Brand */}
            <div className="sidebar-brand">
                <img src="/logo.png" alt="Dominion City" className="sidebar-logo" />
                <div className="brand-text">
                    <h2>Dominion City</h2>
                    <span>Olive Parish</span>
                </div>
                {/* Close button for mobile */}
                <button className="sidebar-close-btn" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-group">
                    <label>General</label>
                    <NavLink to="/admin/live" className={linkClass} onClick={handleNavClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                        </svg>
                        Dashboard
                    </NavLink>
                    <NavLink to="/admin/analysis" className={linkClass} onClick={handleNavClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
                            <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        Analytics
                    </NavLink>
                    <NavLink to="/admin/predictive" className={linkClass} onClick={handleNavClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                        Predictive
                    </NavLink>
                    <NavLink to="/admin/events" className={linkClass} onClick={handleNavClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Events
                    </NavLink>
                    <NavLink to="/admin/assistant" className={linkClass} onClick={handleNavClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l4-4-4-4h12a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="12" r="3" />
                        </svg>
                        AI Assistant
                    </NavLink>
                </div>

                <div className="nav-group">
                    <label>People</label>
                    <NavLink to="/admin/members" className={linkClass} onClick={handleNavClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Member Directory
                    </NavLink>
                    <NavLink to="/admin/absentees" className={linkClass} onClick={handleNavClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                            <line x1="12" y1="2" x2="12" y2="12" />
                        </svg>
                        Absentees
                    </NavLink>
                </div>

                <div className="nav-group">
                    <label>Tools</label>
                    <div className={`dropdown-container ${showQRDropdown ? 'open' : ''}`}>
                        <button className="sidebar-link dropdown-toggle" onClick={() => setShowQRDropdown(!showQRDropdown)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                <path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                <rect x="7" y="7" width="3" height="3" /><rect x="14" y="7" width="3" height="3" />
                                <rect x="7" y="14" width="3" height="3" /><rect x="14" y="14" width="3" height="3" />
                            </svg>
                            QR Generator
                            <svg className={`chevron ${showQRDropdown ? 'up' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {showQRDropdown && (
                            <div className="dropdown-menu">
                                <NavLink to="/admin/qrcode?type=member" className={linkClass} onClick={handleNavClick}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    Member Station
                                </NavLink>
                                <NavLink to="/admin/qrcode?type=worker" className={linkClass} onClick={handleNavClick}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                    </svg>
                                    Worker Station
                                </NavLink>
                                <NavLink to="/attend?eventId=admin-manual&admin=true" className={linkClass} onClick={handleNavClick}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                    </svg>
                                    Admin Check-In
                                </NavLink>
                            </div>
                        )}
                    </div>
                </div>

                <div className="nav-group" style={{ marginTop: 'auto' }}>
                    <label>Admin</label>
                    <NavLink to="/admin/settings" className={linkClass} onClick={handleNavClick}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
                        </svg>
                        Settings
                    </NavLink>
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={() => setShowLogoutDialog(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                </button>
            </div>

            {showLogoutDialog && (
                <div className="modal-overlay" onClick={() => setShowLogoutDialog(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="modal-icon-wrapper danger">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </div>
                            <h3>Logout Confirmation</h3>
                            <p className="helper" style={{ marginTop: 8 }}>Are you sure you want to logout?</p>
                            <div className="modal-actions" style={{ justifyContent: 'center' }}>
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
