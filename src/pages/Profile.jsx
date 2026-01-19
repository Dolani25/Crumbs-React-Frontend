import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import Default from '../assets/profilePic.jpg';

const Profile = ({ user }) => {
    const navigate = useNavigate();

    if (!user) return <div className="profile-container">Loading...</div>;

    return (
        <div className="profile-container">
            <button className="profile-back-btn" onClick={() => navigate(-1)}>
                <i className="fas fa-arrow-left"></i> Back
            </button>
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar-wrapper">
                        <img
                            src={user.profile_picture?.src || Default}
                            alt="Profile"
                            className="profile-avatar"
                        />
                        <div className="verified-badge">
                            <i className="fas fa-check"></i>
                        </div>
                    </div>
                    <h1 className="profile-username">{user.username}</h1>
                    <p className="profile-email">{user.email}</p>
                    <div className="profile-stats-row">
                        <div className="stat-item">
                            <span className="stat-value">{user.xp || 0}</span>
                            <span className="stat-label">XP</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{user.streak || 0}</span>
                            <span className="stat-label">Streak (Days)</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{user.enrolledCourses?.length || 0}</span>
                            <span className="stat-label">Courses</span>
                        </div>
                    </div>
                </div>

                <div className="profile-details">
                    <h2>Account Details</h2>
                    <div className="detail-row">
                        <span className="detail-label">Member Since</span>
                        <span className="detail-value">
                            {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Last Active</span>
                        <span className="detail-value">
                            {new Date(user.lastActive).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="detail-row">
                        <span className="detail-label">Theme Preference</span>
                        <span className="detail-value" style={{ textTransform: 'capitalize' }}>{user.theme || 'Default'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
