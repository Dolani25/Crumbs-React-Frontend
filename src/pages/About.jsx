import React from 'react';
import './Hero.css'; // Reusing Hero CSS for styled text

const About = () => {
    return (
        <div className="hero-container" style={{ paddingTop: '100px', textAlign: 'center' }}>
            <h1 className="hero-title">About Crumbs 🍪</h1>
            <p className="hero-subtitle">
                Crumbs is an AI-powered personalized learning platform designed to make complex topics digestible.
            </p>
            <div className="features-grid" style={{ marginTop: '50px', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                <div className="feature-card">
                    <h3>AI Generation</h3>
                    <p>Powered by Google Gemini to create custom lessons on fly.</p>
                </div>
                <div className="feature-card">
                    <h3>Interactive Tools</h3>
                    <p>Visualizations, graphs, and 3D models to enhance learning.</p>
                </div>
                <div className="feature-card">
                    <h3>Open Source</h3>
                    <p>Built with ❤️ for the community.</p>
                </div>
            </div>
            <div style={{ marginTop: '50px', color: '#94a3b8' }}>
                Version 1.0.0
            </div>
        </div>
    );
};

export default About;
