
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ConceptGraph from '../visualizations/ConceptGraph'; // Reuse for background wow factor
import './Hero.css';

const Hero = () => {
    const navigate = useNavigate();

    return (
        <div className="hero-container">
            {/* Background Visualization - Subtle & Interactive */}
            <div className="hero-bg">
                <ConceptGraph width={window.innerWidth} height={window.innerHeight} />
                <div className="hero-overlay"></div>
            </div>

            {/* Navbar (Transparent) */}
            <nav className="hero-nav">
                <div className="logo">Crumbs</div>
                <div className="nav-links">
                    <button className="login-btn" onClick={() => navigate('/login')}>Log In</button>
                    <button className="cta-btn-small" onClick={() => navigate('/signup')}>Get Started</button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="hero-content">
                <h1 className="hero-title">
                    Eat the Elephant,<br />
                    <span className="highlight-text">One Crumb at a Time.</span>
                </h1>
                <p className="hero-subtitle">
                    The AI-powered learning platform that turns complex subjects into bite-sized, interactive mastery.
                </p>

                <div className="cta-group">
                    <button className="main-cta" onClick={() => navigate('/signup')}>
                        Start Learning Free
                    </button>
                    <button className="secondary-cta" onClick={() => navigate('/demo')}>
                        View Demo Course
                    </button>
                </div>

                {/* Social Proof / Stats */}
                <div className="hero-stats">
                    <div className="stat-item">
                        <span className="stat-num">10k+</span>
                        <span className="stat-label">Learners</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-num">500+</span>
                        <span className="stat-label">Interactive Sims</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-num">AI</span>
                        <span className="stat-label">Personalized Tutor</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
