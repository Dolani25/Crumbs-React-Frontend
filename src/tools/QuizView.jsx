import React, { useState } from 'react';
import { InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const QuizView = ({ quizData, onComplete, onRemediate }) => {
    // Handle both new Object format and legacy Array format
    const questions = Array.isArray(quizData) ? quizData : (quizData?.questions || []);
    const suggestedTools = !Array.isArray(quizData) ? (quizData?.tools || []) : [];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showResults, setShowResults] = useState(false);

    const currentQuestion = questions[currentIndex];

    // Helper to parse text with inline math ($...$) and bold (**...**)
    const renderTextWithMath = (text) => {
        if (!text) return null;

        // 1. Convert Markdown Bold to HTML Bold
        const formattedText = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

        // 2. Split by LaTeX delimiters ($...$)
        const parts = formattedText.split(/\$([^$]+)\$/g);

        // ... (existing helper logic implementation inferred, but for brevity using what was there)
        return (
            <span>
                {parts.map((part, index) => {
                    if (index % 2 === 1) return <InlineMath key={index} math={part} />;
                    return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
                })}
            </span>
        );
    };

    if (!currentQuestion) return <div>Loading Quiz...</div>;

    const handleOptionClick = (option) => {
        if (isAnswered) return;
        setSelectedOption(option);
        setIsAnswered(true);

        if (option === currentQuestion.correctAnswer) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
        } else {
            setShowResults(true);
        }
    };

    if (showResults) {
        return (
            <div className="quiz-container" style={{ textAlign: 'center', padding: '2rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎉 Quiz Complete!</h2>
                <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                    You scored <strong>{score} / {questions.length}</strong>
                </p>

                {/* Recommended Tools Section */}
                {suggestedTools.length > 0 && (
                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#0369a1' }}>🚀 Explore Further</h4>
                        <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '12px' }}>
                            Based on this topic, try these interactive tools:
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            {suggestedTools.map(tool => (
                                <span key={tool} style={{
                                    padding: '6px 12px', background: 'white', border: '1px solid #e2e8f0',
                                    borderRadius: '20px', fontSize: '0.85rem', color: '#475569', fontWeight: '500'
                                }}>
                                    🔧 {tool}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={onComplete}
                    style={{
                        padding: '12px 24px',
                        background: '#6366f1',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        cursor: 'pointer'
                    }}
                >
                    Finish Lesson
                </button>
            </div>
        );
    }

    return (
        <div className="quiz-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#666' }}>Active Recall</span>
                <span style={{ background: '#eee', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                    Question {currentIndex + 1} of {quizData.length}
                </span>
            </div>

            <h3 style={{ fontSize: '1.3rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                {renderTextWithMath(currentQuestion.question)}
            </h3>

            <div className="options-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {currentQuestion.options.map((option, idx) => {
                    let style = {
                        padding: '16px',
                        borderRadius: '12px',
                        borderWidth: '2px',
                        borderStyle: 'solid',
                        borderColor: '#eee',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        textAlign: 'left',
                        fontSize: '1rem'
                    };

                    if (isAnswered) {
                        if (option === currentQuestion.correctAnswer) {
                            style.background = '#dcfce7'; // Green bg
                            style.borderColor = '#22c55e';
                            style.color = '#15803d';
                        } else if (option === selectedOption) {
                            style.background = '#fee2e2'; // Red bg
                            style.borderColor = '#ef4444';
                            style.color = '#b91c1c';
                        } else {
                            style.opacity = 0.5;
                        }
                    } else if (selectedOption === option) {
                        style.borderColor = '#6366f1';
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleOptionClick(option)}
                            style={style}
                            disabled={isAnswered}
                        >
                            {renderTextWithMath(option)}
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <div style={{ marginTop: '20px', animation: 'fadeIn 0.3s' }}>
                    <div style={{
                        padding: '15px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: '4px solid #6366f1',
                        marginBottom: '20px'
                    }}>
                        <strong>Explanation:</strong> {renderTextWithMath(currentQuestion.explanation)}
                    </div>
                    <button
                        onClick={handleNext}
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: '#1e293b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        {currentIndex < quizData.length - 1 ? 'Next Question' : 'See Results'}
                    </button>

                    {/* Remediation Trigger (Learning DNA) */}
                    {selectedOption !== currentQuestion.correctAnswer && onRemediate && (
                        <button
                            onClick={() => onRemediate(currentQuestion.question)} // Pass failing concept
                            style={{
                                width: '100%',
                                padding: '14px',
                                marginTop: '10px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>⚡</span> I don't get it. Visualize this!
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizView;
