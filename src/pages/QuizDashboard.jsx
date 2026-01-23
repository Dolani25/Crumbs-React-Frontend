import React, { useState } from 'react';
import './Planner.css';
import { HelpCircle, Award, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuizDashboard = () => {
    const navigate = useNavigate();
    const [difficulty, setDifficulty] = useState('Medium');

    const handleStartQuiz = () => {
        // In a real app, this would generate a random quiz or fetch one.
        // For now, let's look for a course with a quiz or mock it.
        // Since we don't have a standalone "Run Quiz" route that takes arbitrary data without a course context easily,
        // we might need to mock a "General Knowledge" course or redirect to a known course's quiz.

        // BETTER: Create a "Practice Mode" mock lesson object and route to Reader or a new QuizRunner.
        // BUT Reader is tied to /course/:id.

        // Simplest: Alert user this is a demo or route to the specific "General" course if it exists.
        // Let's just show an alert for the prototype or navigate to a random course's quiz if possible.

        alert("Starting infinite practice mode... (Simulation: Redirecting to Dashboard)");
        navigate('/dashboard');
    };

    return (
        <div className="planner-page">
            <div className="planner-header">
                <h1>Quiz Arena 🏆</h1>
                <p style={{ color: '#94a3b8' }}>Test your knowledge and earn XP!</p>
            </div>

            <div className="planner-content" style={{ justifyContent: 'center' }}>
                <div className="planner-list" style={{ maxWidth: '600px', width: '100%' }}>

                    {/* Stats Card */}
                    <div className="plan-item" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'block', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⚡</div>
                        <h2 style={{ margin: 0 }}>Weekly Challenge</h2>
                        <p>Complete 3 quizzes to maintain your streak!</p>
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '30px' }}>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>12</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Quizzes Taken</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>85%</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Avg Score</div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Start */}
                    <div className="planner-form" style={{ position: 'static', marginTop: '20px', maxWidth: '100%' }}>
                        <h3><Play size={20} /> Quick Play</h3>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', color: '#cbd5e1' }}>Difficulty</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['Easy', 'Medium', 'Hard'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            borderRadius: '8px',
                                            border: '1px solid ' + (difficulty === d ? '#a855f7' : '#334155'),
                                            background: difficulty === d ? 'rgba(168, 85, 247, 0.2)' : 'rgba(30, 41, 59, 0.5)',
                                            color: 'white',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" onClick={handleStartQuiz}>
                            Start Practice Session
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default QuizDashboard;
