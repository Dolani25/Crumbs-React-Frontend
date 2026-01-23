import React from 'react';
import './Profile.css'; // Reusing Profile CSS

const Settings = ({ user, toggleTheme, currentTheme }) => {
    return (
        <div className="profile-container">
            <h1 className="profile-title">Settings ⚙️</h1>

            <div className="profile-card">
                <div className="profile-header">
                    <h2>Application Preferences</h2>
                </div>

                <div className="stats-grid">
                    <div className="stat-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '20px' }}>
                        <span>Appearance</span>
                        <button className="auth-btn" onClick={toggleTheme} style={{ width: 'auto' }}>
                            {currentTheme === 'dark' ? 'Switch to Light Mode ☀️' : 'Switch to Dark Mode 🌙'}
                        </button>
                    </div>
                </div>

                <div className="profile-header" style={{ marginTop: '30px' }}>
                    <h2>Account</h2>
                </div>
                <div className="stats-grid">
                    <div className="stat-card" style={{ width: '100%', padding: '20px' }}>
                        <p style={{ marginBottom: '10px' }}>Connected as: <strong>{user?.email || 'User'}</strong></p>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>More account settings coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
