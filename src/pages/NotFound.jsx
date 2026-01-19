import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="content-wrapper">
                <div className="glitch-wrapper">
                    <h1 className="glitch" data-text="404">404</h1>
                </div>
                <h2>Breadcrumb Not Found</h2>
                <p>It seems this crumb has been eaten or swept away into the void.</p>

                <div className="action-buttons">
                    <button className="home-btn" onClick={() => navigate('/dashboard')}>
                        Return to Kitchen (Dashboard)
                    </button>
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        Go Back
                    </button>
                </div>
            </div>

            {/* Background elements */}
            <div className="crumb-particle cp-1"></div>
            <div className="crumb-particle cp-2"></div>
            <div className="crumb-particle cp-3"></div>
        </div>
    );
};

export default NotFound;
