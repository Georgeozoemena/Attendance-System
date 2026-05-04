import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccess } from '../../config/permissions';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [showQRDropdown, setShowQRDropdown] = useState(false);

    const [churchName, setChurchName] = useState(() => localStorage.getItem('churchName') || 'Dominion City');
    const [parish, setParish] = useState(() => localStorage.getItem('parish') || 'Olive Parish');
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('logoUrl') || '/logo.png');

    // Re-read org settings when they change from SettingsPage
    useEffect(() => {
        function handleOrgChange() {
            setChurchName(localStorage.getItem('churchName') || 'Dominion City');
            setParish(localStorage.getItem('parish') || 'Olive Parish');
            setLogoUrl(localStorage.getItem('logoUrl') || '/logo.png');
        }
        window.addEventListener('orgSettingsChanged', handleOrgChange);
        return () => window.removeEventListener('orgSettingsChanged', handleOrgChange);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
        setShowLogoutDialog(false);
        if (onClose) onClose();
    };

    const handleNavClick = () => {
        if (window.innerWidth <= 768 && onClose) onClose();
    };

    const linkClass = ({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`;

    const role = user?.role;

    return (
        <aside className={`admin-sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-brand">
                <img src={logoUrl} alt={churchName} className="sidebar-logo" />
                <div className="brand-text">
                    <h2>{churchName}</h2>
                    <span>{parish}</span>
                </div>
                <button className="sidebar-close-btn" onClick={onClose}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            <nav className="sidebar-nav">
                {/* Overview */}
                <div className="nav-group">
                    <label>Overview</label>
                    {canAccess(role, '/admin/live') && (
                        <NavLink to="/admin/live" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                                <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
                            </svg>
                            <span>Dashboard</span>
                        </NavLink>
                    )}
                    {canAccess(role, '/admin/analysis') && (
                        <NavLink to="/admin/analysis" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                            </svg>
                            <span>Analytics</span>
                        </NavLink>
                    )}
                    {canAccess(role, '/admin/events') && (
                        <NavLink to="/admin/events" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span>Events</span>
                        </NavLink>
                    )}
                </div>

                {/* People */}
                <div className="nav-group">
                    <label>People</label>
                    {canAccess(role, '/admin/members') && (
                        <NavLink to="/admin/members" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span>Members</span>
                        </NavLink>
                    )}
                    {canAccess(role, '/admin/departments') && (
                        <NavLink to="/admin/departments" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="2" y="3" width="6" height="4" rx="1" /><rect x="9" y="3" width="6" height="4" rx="1" />
                                <rect x="16" y="3" width="6" height="4" rx="1" /><rect x="2" y="10" width="6" height="11" rx="1" />
                                <rect x="9" y="10" width="6" height="11" rx="1" /><rect x="16" y="10" width="6" height="11" rx="1" />
                            </svg>
                            <span>Departments</span>
                        </NavLink>
                    )}
                    {canAccess(role, '/admin/absentees') && (
                        <NavLink to="/admin/absentees" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
                            </svg>
                            <span>Absentees</span>
                        </NavLink>
                    )}
                </div>

                {/* Pastoral */}
                <div className="nav-group">
                    <label>Pastoral</label>
                    {canAccess(role, '/admin/prayer') && (
                        <NavLink to="/admin/prayer" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                                <line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                            </svg>
                            <span>Prayer Requests</span>
                        </NavLink>
                    )}
                    {canAccess(role, '/admin/testimonies') && (
                        <NavLink to="/admin/testimonies" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l4-4-4-4h12a2 2 0 0 1 2 2z" />
                            </svg>
                            <span>Testimonies</span>
                        </NavLink>
                    )}
                    {canAccess(role, '/admin/followup') && (
                        <NavLink to="/admin/followup" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <polyline points="23 11 17 11" /><line x1="20" y1="8" x2="20" y2="14" />
                            </svg>
                            <span>Follow-Up Log</span>
                        </NavLink>
                    )}
                </div>

                {/* Tools */}
                {canAccess(role, '/admin/qrcode') && (
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
                                <span>QR Generator</span>
                                <svg className={`chevron ${showQRDropdown ? 'up' : ''}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>
                            {showQRDropdown && (
                                <div className="dropdown-menu">
                                    <NavLink to="/admin/qrcode?type=member" className={linkClass} onClick={handleNavClick}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        <span>Member Station</span>
                                    </NavLink>
                                    <NavLink to="/admin/qrcode?type=worker" className={linkClass} onClick={handleNavClick}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        <span>Worker Station</span>
                                    </NavLink>
                                    <NavLink to="/attend?admin=true" className={linkClass} onClick={handleNavClick}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                        <span>Admin Check-In</span>
                                    </NavLink>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Check-In (usher only) */}
                {canAccess(role, '/admin/check-in') && (
                    <div className="nav-group">
                        <label>Check-In</label>
                        <NavLink to="/admin/check-in" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 11 12 14 22 4" />
                                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            <span>Check-In</span>
                        </NavLink>
                    </div>
                )}

                {/* Admin */}
                <div className="nav-group" style={{ marginTop: 'auto' }}>
                    <label>Admin</label>
                    {canAccess(role, '/admin/settings') && (
                        <NavLink to="/admin/settings" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="3" />
                                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" />
                            </svg>
                            <span>Settings</span>
                        </NavLink>
                    )}
                    {canAccess(role, '/admin/users') && (
                        <NavLink to="/admin/users" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span>User Management</span>
                        </NavLink>
                    )}
                    {canAccess(role, '/admin/audit') && (
                        <NavLink to="/admin/audit" className={linkClass} onClick={handleNavClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            <span>Audit Log</span>
                        </NavLink>
                    )}
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={() => setShowLogoutDialog(true)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Logout</span>
                </button>
            </div>

            {showLogoutDialog && (
                <div className="modal-overlay" onClick={() => setShowLogoutDialog(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center' }}>
                            <div className="modal-icon-wrapper danger">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
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
