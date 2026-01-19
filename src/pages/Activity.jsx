import React from 'react';

const Activity = () => {
    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1>📊 Your Activity</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>
                Track your learning progress, streaks, and achievements here.
            </p>
            <div style={{
                marginTop: '40px',
                padding: '30px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
            }}>
                <h2>🔥 32 Day Streak!</h2>
                <p>You are on fire! Keep learning to maintain your momentum.</p>
            </div>
        </div>
    );
};

export default Activity;
