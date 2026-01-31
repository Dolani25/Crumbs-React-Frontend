import React, { useState, useEffect } from 'react';
import './QuizDashboard.css';
import {
    Zap,
    Trophy,
    Target,
    Flame,
    BookOpen,
    Play,
    CheckCircle,
    XCircle,
    ArrowRight,
    RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Fallback Demo Questions (To ensure playability if no courses exist)
const DEMO_QUESTIONS = [
    {
        question: "What is the primary function of a globe valve?",
        options: ["Quick shut-off", "Throttling flow", "Preventing backflow", "Relieving pressure"],
        answer: "Throttling flow",
        explanation: "Globe valves are designed for regulating flow in a pipeline, consisting of a movable disk-type element and a stationary ring seat."
    },
    {
        question: "Which rock type is formed from the cooling of magma?",
        options: ["Sedimentary", "Metamorphic", "Igneous", "Limestone"],
        answer: "Igneous",
        explanation: "Igneous rock is formed through the cooling and solidification of magma or lava."
    },
    {
        question: "In React, which hook is used for side effects?",
        options: ["useState", "useEffect", "useContext", "useReducer"],
        answer: "useEffect",
        explanation: "useEffect allows you to perform side effects in function components, such as data fetching or subscriptions."
    }
];

const QuizDashboard = ({ courses = [], handleAddXP }) => {
    const navigate = useNavigate();

    // UI State
    const [gameMode, setGameMode] = useState('dashboard'); // 'dashboard', 'playing', 'result'
    const [difficulty, setDifficulty] = useState('Medium');
    const [loading, setLoading] = useState(false);

    // Quiz Data State
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);

    // Question Interaction State
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [feedback, setFeedback] = useState(null); // 'correct' or 'incorrect'

    // Topic Selection State
    const [selectedSubtopicIds, setSelectedSubtopicIds] = useState([]);

    const toggleSubtopic = (id) => {
        setSelectedSubtopicIds(prev => {
            if (prev.includes(id)) return prev.filter(i => i !== id);
            return [...prev, id];
        });
    };

    const modulesWithQuestions = React.useMemo(() => {
        const modules = [];
        courses.forEach(c => {
            const courseTitle = c.title || c.name || "Untitled Course";
            // Flat Subtopics
            if (c.subtopics) {
                c.subtopics.forEach(s => {
                    if (s?.lesson?.quiz?.questions?.length > 0) {
                        modules.push({
                            id: s.id || s._id,
                            title: s.title,
                            course: courseTitle,
                            qCount: s.lesson.quiz.questions.length
                        });
                    }
                });
            }
            // Nested Topics
            if (c.topics) {
                c.topics.forEach(t => {
                    if (t.subtopics) {
                        t.subtopics.forEach(s => {
                            if (s?.lesson?.quiz?.questions?.length > 0) {
                                modules.push({
                                    id: s.id || s._id,
                                    title: `${t.title} - ${s.title}`,
                                    course: courseTitle,
                                    qCount: s.lesson.quiz.questions.length
                                });
                            }
                        });
                    }
                });
            }
        });
        return modules;
    }, [courses]);

    // --- HELPER: Extract Questions from Courses ---
    const getAvailableQuestions = () => {
        const allQuestions = [];

        // 1. Gather from Courses
        courses.forEach(course => {
            // Flat Subtopics
            if (course.subtopics) {
                course.subtopics.forEach(sub => {
                    if (sub?.lesson?.quiz?.questions?.length > 0) {
                        // Filter Check
                        if (selectedSubtopicIds.length === 0 || selectedSubtopicIds.includes(sub.id || sub._id)) {
                            allQuestions.push(...sub.lesson.quiz.questions);
                        }
                    }
                });
            }
            // Nested Topics
            if (course.topics) {
                course.topics.forEach(topic => {
                    if (topic.subtopics) {
                        topic.subtopics.forEach(sub => {
                            if (sub?.lesson?.quiz?.questions?.length > 0) {
                                // Filter Check
                                if (selectedSubtopicIds.length === 0 || selectedSubtopicIds.includes(sub.id || sub._id)) {
                                    allQuestions.push(...sub.lesson.quiz.questions);
                                }
                            }
                        });
                    }
                });
            }
        });

        // 2. Mix in Demo Questions if list is small or empty
        if (allQuestions.length < 5) {
            allQuestions.push(...DEMO_QUESTIONS);
        }

        // 3. Shuffle
        return allQuestions.sort(() => 0.5 - Math.random());
    };

    const startQuiz = () => {
        setLoading(true);
        // Simulate loading feel
        setTimeout(() => {
            const q = getAvailableQuestions();
            // Take top 5 for a quick session
            setQuestions(q.slice(0, 5));
            setCurrentQuestionIndex(0);
            setScore(0);
            setStreak(0);
            setGameMode('playing');
            setLoading(false);
            setIsAnswered(false);
            setSelectedOption(null);
            setFeedback(null);
        }, 600);
    };

    const handleOptionSelect = (option) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const checkAnswer = () => {
        if (!selectedOption || isAnswered) return;

        const currentQ = questions[currentQuestionIndex];

        // Aggressive normalization: Remove all non-alphanumeric chars to handle punctuation/spacing quirks
        const normalize = (str) => String(str).toLowerCase().replace(/[^a-z0-9]/g, '');

        const isCorrect = normalize(selectedOption) === normalize(currentQ.answer);

        // Debugging mismatch if any
        if (!isCorrect) {
            console.log('Quiz Mismatch Debug:', {
                selected: selectedOption,
                answer: currentQ.answer,
                normSelected: normalize(selectedOption),
                normAnswer: normalize(currentQ.answer)
            });
        }

        setIsAnswered(true);
        setFeedback(isCorrect ? 'correct' : 'incorrect');

        // Also update selectedOption visually to match answer if it was just a case/space issue
        // (Optional polish but let's stick to logic fix first)

        if (isCorrect) {
            setScore(prev => prev + 1);
            setStreak(prev => prev + 1);
            // Play sound?
        } else {
            setStreak(0);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex + 1 < questions.length) {
            setCurrentQuestionIndex(prev => prev + 1);
            setIsAnswered(false);
            setSelectedOption(null);
            setFeedback(null);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        setGameMode('result');
        // Calculate XP
        const xpEarned = score * 10 + (streak > 3 ? 50 : 0); // 10XP per Q + 50 Bonus
        if (handleAddXP) handleAddXP(xpEarned, 'Quiz Completed');
    };

    const returnToDashboard = () => {
        setGameMode('dashboard');
    };

    // --- RENDER: PLAYING MODE ---
    if (gameMode === 'playing') {
        const currentQ = questions[currentQuestionIndex];
        const progress = ((currentQuestionIndex) / questions.length) * 100;

        return (
            <div className="quiz-page playing-mode">
                <div className="quiz-content">
                    {/* Progress Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span onClick={() => { if (window.confirm('Quit quiz?')) setGameMode('dashboard'); }} style={{ cursor: 'pointer', color: '#94a3b8' }}>Exclude</span>
                        <div style={{ flex: 1, margin: '0 1rem', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: '#3b82f6', borderRadius: '3px', transition: 'width 0.3s' }}></div>
                        </div>
                        <span style={{ color: '#fff', fontSize: '0.9rem' }}>{currentQuestionIndex + 1}/{questions.length}</span>
                    </div>

                    {/* Question Card */}
                    <div className="quiz-card" style={{ minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <span style={{
                                background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa',
                                padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold'
                            }}>
                                {difficulty.toUpperCase()}
                            </span>
                            <h2 style={{ fontSize: '1.25rem', marginTop: '1rem', lineHeight: '1.5', color: '#f8fafc' }}>
                                {currentQ.question}
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                            {currentQ.options.map((opt, i) => {
                                const normalize = (str) => String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
                                const isCorrectOption = normalize(opt) === normalize(currentQ.answer);
                                const isSelected = opt === selectedOption;

                                let styleClass = "option-btn";
                                if (isAnswered) {
                                    if (isCorrectOption) styleClass += " correct";
                                    else if (isSelected) styleClass += " wrong";
                                    else styleClass += " disabled";
                                } else if (isSelected) {
                                    styleClass += " selected";
                                }

                                return (
                                    <button
                                        key={i}
                                        className={styleClass}
                                        onClick={() => handleOptionSelect(opt)}
                                        disabled={isAnswered}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: isAnswered
                                                ? (isCorrectOption ? 'rgba(34, 197, 94, 0.2)' : (isSelected ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.4)'))
                                                : (isSelected ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.4)'),
                                            color: isAnswered
                                                ? (isCorrectOption ? '#4ade80' : (isSelected ? '#f87171' : '#94a3b8'))
                                                : (isSelected ? '#60a5fa' : '#f1f5f9'),
                                            borderColor: isAnswered
                                                ? (isCorrectOption ? '#22c55e' : (isSelected ? '#ef4444' : 'transparent'))
                                                : (isSelected ? '#3b82f6' : 'rgba(255,255,255,0.1)'),
                                            cursor: isAnswered ? 'default' : 'pointer',
                                            textAlign: 'left',
                                            fontWeight: '500',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span>{opt}</span>
                                        {isAnswered && isCorrectOption && <CheckCircle size={18} />}
                                        {isAnswered && isSelected && !isCorrectOption && <XCircle size={18} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feedback / Next Action */}
                    <div style={{ marginTop: '1.5rem', minHeight: '80px' }}>
                        {!isAnswered ? (
                            <button
                                className="start-btn"
                                onClick={checkAnswer}
                                disabled={!selectedOption}
                                style={{ opacity: !selectedOption ? 0.5 : 1, cursor: !selectedOption ? 'not-allowed' : 'pointer' }}
                            >
                                Check Answer
                            </button>
                        ) : (
                            <div className="feedback-section" style={{ animation: 'fadeIn 0.3s ease' }}>
                                <div style={{
                                    padding: '1rem',
                                    background: feedback === 'correct' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    borderLeft: `4px solid ${feedback === 'correct' ? '#22c55e' : '#ef4444'}`,
                                    borderRadius: '0 8px 8px 0',
                                    marginBottom: '1rem'
                                }}>
                                    <h4 style={{ margin: '0 0 0.25rem', color: feedback === 'correct' ? '#4ade80' : '#f87171' }}>
                                        {feedback === 'correct' ? 'Correct! 🎉' : 'Incorrect'}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
                                        {currentQ.explanation}
                                    </p>
                                </div>
                                <button className="start-btn" onClick={nextQuestion}>
                                    {currentQuestionIndex + 1 < questions.length ? 'Next Question' : 'Finish Quiz'} <ArrowRight size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: RESULT MODE ---
    if (gameMode === 'result') {
        const percentage = Math.round((score / questions.length) * 100);

        return (
            <div className="quiz-page">
                <div className="quiz-content" style={{ textAlign: 'center' }}>
                    <div className="quiz-card" style={{ padding: '3rem 1.5rem' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <Trophy size={64} color={percentage > 70 ? '#fbbf24' : '#94a3b8'} style={{ filter: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.4))' }} />
                        </div>

                        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#fff' }}>
                            {percentage > 90 ? 'Perfect Score!' : (percentage > 70 ? 'Great Job!' : 'Keep Practicing!')}
                        </h2>
                        <p style={{ color: '#94a3b8' }}>You completed the practice session.</p>

                        <div style={{
                            display: 'flex', justifyContent: 'center', gap: '2rem',
                            marginTop: '2rem', marginBottom: '2rem',
                            padding: '1.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px'
                        }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4ade80' }}>{score}/{questions.length}</div>
                                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Score</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>+{score * 10}XP</div>
                                <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>XP Earned</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <button className="start-btn" onClick={returnToDashboard}>
                                Return to Dashboard
                            </button>
                            <button
                                onClick={startQuiz}
                                style={{
                                    padding: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#cbd5e1', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}
                            >
                                <RotateCcw size={16} /> Play Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER: DASHBOARD MODE (Default) ---
    return (
        <div className="quiz-page">
            <div className="quiz-header">
                <h1>Quiz Arena 🏆</h1>
                <p>Test your knowledge, earn XP, and climb the leaderboard.</p>
            </div>

            <div className="quiz-content">

                {/* 1. Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div className="quiz-card stat-item">
                        <div style={{ color: '#f59e0b', marginBottom: '0.5rem' }}><Flame size={24} /></div>
                        <div className="stat-value">{streak}</div>
                        <div className="stat-label">Streak</div>
                    </div>
                    <div className="quiz-card stat-item">
                        <div style={{ color: '#8b5cf6', marginBottom: '0.5rem' }}><Zap size={24} /></div>
                        <div className="stat-value">850</div>
                        <div className="stat-label">Total XP</div>
                    </div>
                    <div className="quiz-card stat-item">
                        <div style={{ color: '#ec4899', marginBottom: '0.5rem' }}><Trophy size={24} /></div>
                        <div className="stat-value">#42</div>
                        <div className="stat-label">Rank</div>
                    </div>
                </div>

                {/* 2. Featured Challenge */}
                <div className="quiz-card challenge-card">
                    <div className="challenge-header">
                        <div className="challenge-icon">
                            <Target />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Weekly Challenge</h3>
                            <p style={{ margin: '0.2rem 0 0', fontSize: '0.9rem', color: '#e2e8f0' }}>Master "Thermodynamics" to unlock the badge.</p>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', height: '8px', overflow: 'hidden', marginTop: '1rem' }}>
                        <div style={{ width: '66%', height: '100%', background: 'linear-gradient(90deg, #8b5cf6, #d946ef)' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.5rem', color: '#cbd5e1' }}>
                        <span>2/3 Quizzes Completed</span>
                        <span>66%</span>
                    </div>
                </div>

                {/* 3. Quick Play & Topics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>

                    {/* Quick Play Card */}
                    <div className="quiz-card">
                        <div className="quick-play-header">
                            <Play size={20} color="#3b82f6" />
                            <span>Quick Practice</span>
                        </div>

                        <div className="difficulty-selector">
                            {['Easy', 'Medium', 'Hard'].map(d => (
                                <button
                                    key={d}
                                    className={`diff-btn ${difficulty === d ? 'active ' + d.toLowerCase() : ''} ${d.toLowerCase()}`}
                                    onClick={() => setDifficulty(d)}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>

                        <button className="start-btn" onClick={startQuiz} disabled={loading}>
                            {loading ? 'Loading Refresher...' : (
                                <><span>Start Session</span><Zap size={16} /></>
                            )}
                        </button>
                    </div>

                    {/* Topic Selection */}
                    <div className="quiz-card">
                        <div className="quick-play-header">
                            <BookOpen size={20} color="#10b981" />
                            <span>Topic Selection</span>
                        </div>

                        <div style={{ maxHeight: '250px', overflowY: 'auto', marginTop: '1rem', paddingRight: '0.5rem' }} className="custom-scroll">
                            {modulesWithQuestions.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {modulesWithQuestions.map(m => {
                                        const isSelected = selectedSubtopicIds.includes(m.id);
                                        return (
                                            <div
                                                key={m.id}
                                                onClick={() => toggleSubtopic(m.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '10px',
                                                    padding: '8px', borderRadius: '8px',
                                                    background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                                    border: `1px solid ${isSelected ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
                                                    cursor: 'pointer', transition: 'all 0.2s'
                                                }}
                                            >
                                                <div style={{
                                                    width: '18px', height: '18px', borderRadius: '4px',
                                                    border: `2px solid ${isSelected ? '#10b981' : '#94a3b8'}`,
                                                    background: isSelected ? '#10b981' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {isSelected && <CheckCircle size={12} color="white" />}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.9rem', color: '#f1f5f9' }}>{m.title}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{m.course} • {m.qCount} Qs</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ fontSize: '0.9rem', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                                    No quizzes found in your courses yet.
                                    <br /> Generate some lessons first!
                                </p>
                            )}
                        </div>

                        {modulesWithQuestions.length > 0 && (
                            <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                                <button
                                    onClick={() => setSelectedSubtopicIds(modulesWithQuestions.map(m => m.id))}
                                    style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }}
                                >
                                    Select All
                                </button>
                                <button
                                    onClick={() => setSelectedSubtopicIds([])}
                                    style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                                >
                                    Clear
                                </button>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </div>
    );
};

export default QuizDashboard;
