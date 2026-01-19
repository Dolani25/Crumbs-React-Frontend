import React, { useState, useEffect } from 'react';

const Bookmarks = () => {
    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1>🔖 Bookmarked Lessons</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '20px' }}>
                Quick access to your saved lessons and important concepts.
            </p>

            <div style={{ marginTop: '40px', display: 'grid', gap: '20px' }}>
                <div style={{
                    padding: '20px',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    textAlign: 'left'
                }}>
                    <h3>⚛️ Quantum Entanglement</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>From: Advanced Physics</p>
                </div>

                <div style={{
                    padding: '20px',
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    textAlign: 'left'
                }}>
                    <h3>🧬 DNA Replication</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>From: Biology 101</p>
                </div>
            </div>
        </div>
    );
};

export default Bookmarks;
