import React, { useEffect, useRef, useState } from 'react';
import { parseMultipleExpressions, isValidDesmosExpression } from '../utils/latexValidator';

const DesmosGrapher = ({ expression = "y=x^2", title = "Interactive Graph" }) => {
    const calculatorRef = useRef(null);
    const elementRef = useRef(null);
    const [error, setError] = useState(null);
    const [isValidated, setIsValidated] = useState(false);

    useEffect(() => {
        let mounted = true;

        const initCalculator = () => {
            if (!elementRef.current) return;

            try {
                if (window.Desmos && !calculatorRef.current) {
                    calculatorRef.current = window.Desmos.GraphingCalculator(elementRef.current, {
                        keypad: true,
                        expressions: true,
                        settingsMenu: false,
                        xAxisStep: 1,
                        yAxisStep: 1
                    });

                    // 🔧 Parse and validate expression(s)
                    const expressions = parseMultipleExpressions(expression);

                    try {
                        // Add each expression with unique ID
                        expressions.forEach((expr, index) => {
                            calculatorRef.current.setExpression({
                                id: `graph${index + 1}`,
                                latex: expr
                            });
                        });
                        setIsValidated(true);
                    } catch (desmosErr) {
                        console.error("Desmos setExpression failed:", desmosErr);
                        // Try fallback
                        calculatorRef.current.setExpression({
                            id: 'graph1',
                            latex: 'y=x'
                        });
                        if (mounted) {
                            setError(`Equation error: "${expression}". Using default graph.`);
                        }
                    }
                }
            } catch (err) {
                console.error("Desmos initialization failed:", err);
                if (mounted) setError("Failed to load graphing calculator.");
            }
        };

        if (window.Desmos) {
            initCalculator();
        } else {
            // Load script only if not present
            if (!document.getElementById('desmos-script')) {
                const script = document.createElement('script');
                script.id = 'desmos-script';
                script.src = `https://www.desmos.com/api/v1.10/calculator.js?apiKey=${import.meta.env.VITE_DESMOS_API_KEY}`;
                script.async = true;
                script.onload = () => {
                    if (mounted) initCalculator();
                };
                script.onerror = () => {
                    if (mounted) setError("Failed to connect to Desmos servers.");
                };
                document.body.appendChild(script);
            } else {
                const existingScript = document.getElementById('desmos-script');
                existingScript.addEventListener('load', initCalculator);
            }
        }

        return () => {
            mounted = false;
            if (calculatorRef.current && typeof calculatorRef.current.destroy === 'function') {
                try {
                    calculatorRef.current.destroy();
                } catch (e) { /* ignore cleanup errors */ }
                calculatorRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        let mounted = true;

        if (calculatorRef.current) {
            // 🔧 Parse into multiple expressions if needed
            const expressions = parseMultipleExpressions(expression);

            try {
                // Clear existing expressions
                calculatorRef.current.setBlank();

                // Add each expression
                expressions.forEach((expr, index) => {
                    calculatorRef.current.setExpression({
                        id: `graph${index + 1}`,
                        latex: expr
                    });
                });

                // Auto-Detect and Inject Sliders for Variables
                const allExpressions = expressions.join(' ');
                const commonVars = [
                    '\\sigma', '\\mu', '\\alpha', '\\beta', '\\gamma', '\\lambda', '\\theta', '\\phi',
                    'a', 'b', 'c', 'd', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't'
                ];

                commonVars.forEach(v => {
                    const escV = v.replace(/\\/g, '\\\\');
                    const regex = new RegExp(`(^|[^a-zA-Z\\\\])${escV}([^a-zA-Z]|$)`);

                    if (regex.test(allExpressions)) {
                        calculatorRef.current.setExpression({
                            id: `slider_${v.replace(/\\/g, '')}`,
                            latex: `${v}=1`
                        });
                    }
                });

                setError(null); // Clear any previous errors
            } catch (err) {
                console.error("Failed to update Desmos expression:", err);
                if (mounted) setError(`Invalid equation: ${err.message}`);
            }
        }

        return () => { mounted = false; };
    }, [expression]);

    if (error) {
        return (
            <div className="tool-container" style={{
                padding: '20px',
                textAlign: 'center',
                background: '#fef3c7',
                borderRadius: '8px',
                color: '#92400e',
                border: '1px solid #fcd34d'
            }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px' }}></i>
                <p>⚠️ {error}</p>
                <p style={{ fontSize: '0.85rem', marginTop: '8px' }}>
                    The equation couldn't be plotted. Try a simpler expression.
                </p>
            </div>
        )
    }

    // Clean display text - remove LaTeX backslashes for user readability
    const cleanForDisplay = (text) => {
        return text
            // Functions
            .replace(/\\sin/g, 'sin')
            .replace(/\\cos/g, 'cos')
            .replace(/\\tan/g, 'tan')
            .replace(/\\log/g, 'log')
            .replace(/\\ln/g, 'ln')
            .replace(/\\sqrt/g, 'sqrt')
            .replace(/\\frac/g, 'frac')
            // Greek letters
            .replace(/\\pi/g, 'π')
            .replace(/\\theta/g, 'θ')
            .replace(/\\alpha/g, 'α')
            .replace(/\\beta/g, 'β')
            .replace(/\\gamma/g, 'γ')
            .replace(/\\lambda/g, 'λ')
            .replace(/\\mu/g, 'μ')
            .replace(/\\sigma/g, 'σ')
            .replace(/\\phi/g, 'φ')
            .replace(/\\omega/g, 'ω')
            // Inequalities
            .replace(/\\le/g, '≤')
            .replace(/\\ge/g, '≥')
            .replace(/\\leq/g, '≤')
            .replace(/\\geq/g, '≥')
            .replace(/\\ne/g, '≠')
            .replace(/\\neq/g, '≠')
            // Text/mathrm (remove wrapper, keep content)
            .replace(/\\text\{([^}]+)\}/g, '$1')
            .replace(/\\mathrm\{([^}]+)\}/g, '$1')
            // Only remove remaining backslashes that are NOT followed by known commands
            .replace(/\\(?![a-zA-Z])/g, ''); // Remove backslash only if not followed by letters
    };

    // Get display title from expression
    const getDisplayTitle = () => {
        const cleaned = cleanForDisplay(expression);
        // Limit length for very long equations
        if (cleaned.length > 80) {
            return cleaned.substring(0, 77) + '...';
        }
        return cleaned;
    };

    // Dynamic font size based on equation length
    const getTitleFontSize = () => {
        const len = expression.length;
        if (len > 100) return '0.75rem';
        if (len > 60) return '0.9rem';
        if (len > 40) return '1rem';
        return '1.1rem';
    };

    return (
        <div className="tool-container desmos-grapher" style={{
            margin: '20px 0',
            padding: '10px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #eee'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid #eee',
                gap: '10px'
            }}>
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <i className="fas fa-function" style={{
                        color: '#FE4F30',
                        fontSize: '1.2rem',
                        flexShrink: 0
                    }}></i>
                    <h4 style={{
                        margin: 0,
                        color: '#333',
                        fontSize: getTitleFontSize(),
                        fontFamily: 'monospace',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {getDisplayTitle()}
                    </h4>
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    color: '#888',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                }}>
                    Desmos
                </span>
            </div>

            <div
                ref={elementRef}
                style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }}
            ></div>

            <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                Interactive graphing calculator
            </p>
        </div>
    );
};

export default DesmosGrapher;
