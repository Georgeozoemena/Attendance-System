import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext.jsx';

// Dispatch a custom event so Sidebar/Navbar react immediately without a page reload
function broadcastOrgChange() {
    window.dispatchEvent(new Event('orgSettingsChanged'));
}

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const logoRef = useRef();

    const [churchName, setChurchName] = useState(() => localStorage.getItem('churchName') || 'Dominion City');
    const [parish, setParish] = useState(() => localStorage.getItem('parish') || 'Olive Parish');
    const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem('logoUrl') || '');
    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [logoError, setLogoError] = useState('');

    function handleLogoChange(e) {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 300000) { setLogoError('Logo must be under 300KB'); return; }
        setLogoError('');
        const reader = new FileReader();
        reader.onload = ev => setLogoUrl(ev.target.result);
        reader.readAsDataURL(file);
    }

    function handleSaveOrg(e) {
        e.preventDefault();
        localStorage.setItem('churchName', churchName);
        localStorage.setItem('parish', parish);
        if (logoUrl) localStorage.setItem('logoUrl', logoUrl);
        else localStorage.removeItem('logoUrl');
        broadcastOrgChange();
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    }

    function handleRemoveLogo() {
        setLogoUrl('');
        localStorage.removeItem('logoUrl');
        broadcastOrgChange();
    }

    const displayLogo = logoUrl || '/logo.png';

    return (
        <div className="settings-page animate-fade-in">
            {/* Appearance */}
            <section className="settings-section">
                <div className="settings-section-header">
                    <h2>Appearance</h2>
                    <p>Control how the dashboard looks for your session.</p>
                </div>
                <div className="settings-card">
                    <div className="settings-row">
                        <div className="settings-row-info">
                            <span className="settings-row-label">Theme</span>
                            <span className="settings-row-desc">Switch between dark and light mode</span>
                        </div>
                        <div className="theme-switcher">
                            <button className={`theme-opt ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
                                Dark
                            </button>
                            <button className={`theme-opt ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                                Light
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Organization */}
            <section className="settings-section">
                <div className="settings-section-header">
                    <h2>Organization</h2>
                    <p>Your church details and logo shown across the system.</p>
                </div>
                <div className="settings-card">
                    {editing ? (
                        <form onSubmit={handleSaveOrg} style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Logo upload */}
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-2)', display: 'block', marginBottom: '10px' }}>Church Logo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <img src={displayLogo} alt="logo" style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'contain', background: 'var(--surface-3)', padding: 4 }} />
                                    <div>
                                        <button type="button" className="action-btn" onClick={() => logoRef.current.click()} style={{ fontSize: '12px', padding: '6px 12px' }}>
                                            {logoUrl ? 'Change Logo' : 'Upload Logo'}
                                        </button>
                                        {logoUrl && (
                                            <button type="button" className="small-btn" onClick={handleRemoveLogo} style={{ marginLeft: '8px', fontSize: '11px' }}>Remove</button>
                                        )}
                                        <div style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '4px' }}>PNG, JPG · Max 300KB</div>
                                        {logoError && <div style={{ fontSize: '11px', color: 'var(--red)', marginTop: '2px' }}>{logoError}</div>}
                                        <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                                    </div>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Church Name</label>
                                <input className="input" value={churchName} onChange={e => setChurchName(e.target.value)} required />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label>Parish / Branch</label>
                                <input className="input" value={parish} onChange={e => setParish(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button type="submit" className="modal-btn primary" style={{ padding: '7px 16px' }}>Save Changes</button>
                                <button type="button" className="modal-btn" style={{ padding: '7px 16px' }} onClick={() => setEditing(false)}>Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="settings-row border-bottom">
                                <div className="settings-row-info">
                                    <span className="settings-row-label">Logo</span>
                                </div>
                                <img src={displayLogo} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain', background: 'var(--surface-3)', padding: 3 }} />
                            </div>
                            <div className="settings-row border-bottom">
                                <div className="settings-row-info">
                                    <span className="settings-row-label">Church Name</span>
                                </div>
                                <span className="settings-row-value">{churchName}</span>
                            </div>
                            <div className="settings-row border-bottom">
                                <div className="settings-row-info">
                                    <span className="settings-row-label">Parish</span>
                                </div>
                                <span className="settings-row-value">{parish}</span>
                            </div>
                            <div className="settings-row">
                                <div className="settings-row-info">
                                    <span className="settings-row-label">Edit Details</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {saved && <span style={{ fontSize: '12px', color: 'var(--green)' }}>Saved ✓</span>}
                                    <button className="small-btn" onClick={() => setEditing(true)}>Edit</button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* Session */}
            <section className="settings-section">
                <div className="settings-section-header">
                    <h2>Session & Security</h2>
                    <p>Manage your admin access and session settings.</p>
                </div>
                <div className="settings-card">
                    <div className="settings-row border-bottom">
                        <div className="settings-row-info">
                            <span className="settings-row-label">Session Duration</span>
                            <span className="settings-row-desc">Admin session expires after 4 hours</span>
                        </div>
                        <span className="settings-row-value">4 hours</span>
                    </div>
                    <div className="settings-row">
                        <div className="settings-row-info">
                            <span className="settings-row-label">Sign Out</span>
                            <span className="settings-row-desc">End your admin session immediately</span>
                        </div>
                        <button className="settings-danger-btn" onClick={() => {
                            localStorage.removeItem('adminKey');
                            localStorage.removeItem('adminTokenExpiry');
                            navigate('/admin/login');
                        }}>Sign Out</button>
                    </div>
                </div>
            </section>

            {/* Data */}
            <section className="settings-section">
                <div className="settings-section-header">
                    <h2>Data</h2>
                    <p>Information about data storage and sync.</p>
                </div>
                <div className="settings-card">
                    <div className="settings-row border-bottom">
                        <div className="settings-row-info">
                            <span className="settings-row-label">Database</span>
                            <span className="settings-row-desc">Turso cloud database (libSQL)</span>
                        </div>
                        <span className="settings-row-value">Turso</span>
                    </div>
                    <div className="settings-row">
                        <div className="settings-row-info">
                            <span className="settings-row-label">Offline Support</span>
                            <span className="settings-row-desc">Attendance is queued locally if offline</span>
                        </div>
                        <span className="settings-badge green">Enabled</span>
                    </div>
                </div>
            </section>
        </div>
    );
}
