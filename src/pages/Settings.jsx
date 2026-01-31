import React, { useState, useEffect } from 'react';
import './Settings.css';
import { Palette, Wifi, User, Shield, CreditCard, ChevronRight, Bell } from 'lucide-react';

const Settings = ({ user, toggleTheme, currentTheme, dataSaver, toggleDataSaver }) => {
    const [notificationPermission, setNotificationPermission] = useState('default');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    // Check notification permission status
    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    // Test notification
    const sendTestNotification = () => {
        if (Notification.permission === 'granted') {
            new Notification('Test Notification 🔔', {
                body: 'This is what your study reminders will look like!',
                icon: '/vite.svg',
                tag: 'test-notification'
            });
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                setNotificationPermission(permission);
                if (permission === 'granted') {
                    sendTestNotification();
                }
            });
        }
    };

    // Get status info
    const getNotificationStatus = () => {
        if (!('Notification' in window)) {
            return { text: 'Not Supported', color: '#ef4444', icon: '❌' };
        }
        switch (Notification.permission) {
            case 'granted':
                return { text: 'Enabled', color: '#10b981', icon: '✅' };
            case 'denied':
                return { text: 'Blocked', color: '#ef4444', icon: '🚫' };
            default:
                return { text: 'Not Requested', color: '#f59e0b', icon: '⚠️' };
        }
    };

    const status = getNotificationStatus();
    return (
        <div className="settings-page">
            <div className="settings-header">
                <h1>Settings</h1>
                <p>Manage your preferences and account</p>
            </div>

            <div className="settings-grid">
                {/* Appearance & Performance Card */}
                <div className="settings-card">
                    <div className="card-header">
                        <div className="card-icon-bg" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                            <Palette size={20} />
                        </div>
                        <h2>Preferences</h2>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <h3>Dark Mode</h3>
                            <p>Switch between light and dark themes</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={currentTheme === 'dark'}
                                onChange={toggleTheme}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <h3>Data Saver Mode</h3>
                            <p>Disable high-res 3D models to save bandwidth</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={dataSaver}
                                onChange={toggleDataSaver}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>

                {/* Notifications Card */}
                <div className="settings-card">
                    <div className="card-header">
                        <div className="card-icon-bg" style={{ background: 'rgba(251, 146, 60, 0.2)', color: '#fb923c' }}>
                            <Bell size={20} />
                        </div>
                        <h2>Notifications</h2>
                    </div>

                    <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div className="setting-info">
                            <h3>Browser Notifications</h3>
                            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Status: <span style={{
                                    color: status.color,
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    {status.icon} {status.text}
                                </span>
                            </p>
                        </div>

                        {Notification.permission === 'granted' && (
                            <button
                                onClick={sendTestNotification}
                                style={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                                🔔 Send Test Notification
                            </button>
                        )}

                        {Notification.permission === 'default' && (
                            <button
                                onClick={sendTestNotification}
                                style={{
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    fontSize: '0.9rem'
                                }}
                            >
                                🔔 Enable Notifications
                            </button>
                        )}

                        {Notification.permission === 'denied' && (
                            <div style={{
                                padding: '1rem',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                width: '100%'
                            }}>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#fca5a5' }}>
                                    <strong>Notifications Blocked</strong><br />
                                    To re-enable, click the lock icon 🔒 in your browser's address bar and allow notifications.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="setting-row">
                        <div className="setting-info">
                            <h3>Study Reminders</h3>
                            <p>Get notified before your planned study sessions</p>
                        </div>
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={notificationsEnabled}
                                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                                disabled={Notification.permission !== 'granted'}
                            />
                            <span className="slider"></span>
                        </label>
                    </div>
                </div>

                {/* Account Card */}
                <div className="settings-card">
                    <div className="card-header">
                        <div className="card-icon-bg" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
                            <User size={20} />
                        </div>
                        <h2>Account</h2>
                    </div>

                    <div className="account-info-row">
                        <div className="account-label">Email</div>
                        <div className="account-value">{user?.email || 'N/A'}</div>
                    </div>

                    <div className="account-info-row">
                        <div className="account-label">User ID</div>
                        <div className="account-value" style={{ fontSize: '0.8rem' }}>{user?._id || user?.id || 'Local User'}</div>
                    </div>
                </div>

                {/* Subscription Card (Placeholder) */}
                <div className="settings-card" style={{ opacity: 0.7 }}>
                    <div className="card-header">
                        <div className="card-icon-bg" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#fb923c' }}>
                            <CreditCard size={20} />
                        </div>
                        <h2>Subscription</h2>
                    </div>
                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', textAlign: 'center' }}>
                        <p style={{ color: '#94a3b8', margin: 0 }}>Free Tier</p>
                        <button style={{
                            marginTop: '1rem',
                            background: 'transparent',
                            border: '1px solid #475569',
                            color: '#cbd5e1',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            cursor: 'not-allowed'
                        }}>Manage Plan (Coming Soon)</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
