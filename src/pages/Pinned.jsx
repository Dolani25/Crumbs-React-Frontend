import React from 'react';
import './Planner.css'; // Reusing Planner/Generic CSS for consistency

const Pinned = () => {
    return (
        <div className="planner-container">
            <h1 className="page-title">Pinned Items 📌</h1>
            <div className="empty-state">
                <p>You haven't pinned any items yet.</p>
                <p className="sub-text">Pin important lessons or courses to access them quickly here.</p>
            </div>
        </div>
    );
};

export default Pinned;
