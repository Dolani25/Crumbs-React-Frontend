import React from 'react';
import './Settings.css';
import { Palette, Wifi, User, Shield, CreditCard, ChevronRight } from 'lucide-react';

const Settings = ({ user, toggleTheme, currentTheme, dataSaver, toggleDataSaver }) => {
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
