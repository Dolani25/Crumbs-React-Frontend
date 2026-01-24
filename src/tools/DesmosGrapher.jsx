import React, { useEffect, useRef, useState } from 'react';
import { validateDesmosExpression, isValidDesmosExpression } from '../utils/latexValidator';

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

                    // 🔧 Validate and sanitize expression before setting
                    const validatedExpr = validateDesmosExpression(expression);

                    try {
                        calculatorRef.current.setExpression({
                            id: 'graph1',
                            latex: validatedExpr
                        });
                        setIsValidated(true);
                    } catch (desmosErr) {
                        console.error("Desmos setExpression failed:", desmosErr);
                        // Try a fallback expression
                        if (validatedExpr !== 'y=x') {
                            console.warn("Falling back to y=x");
                            calculatorRef.current.setExpression({
                                id: 'graph1',
                                latex: 'y=x'
                            });
                        }
                        if (mounted) {
                            setError(`Failed to parse equation: "${expression}". Using default.`);
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
                script.src = "https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
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
        if (calculatorRef.current) {
            // 🔧 Validate before updating
            const validatedExpr = validateDesmosExpression(expression);

            try {
                calculatorRef.current.setExpression({
                    id: 'graph1',
                    latex: validatedExpr
                });

                // Auto-Detect and Inject Sliders for Variables
                const commonVars = [
                    '\\sigma', '\\mu', '\\alpha', '\\beta', '\\gamma', '\\lambda', '\\theta', '\\phi',
                    'a', 'b', 'c', 'd', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't'
                ];

                commonVars.forEach(v => {
                    const escV = v.replace(/\\/g, '\\\\');
                    const regex = new RegExp(`(^|[^a-zA-Z\\\\])${escV}([^a-zA-Z]|$)`);

                    if (regex.test(validatedExpr)) {
                        calculatorRef.current.setExpression({
                            id: `slider_${v.replace(/\\/g, '')}`,
                            latex: `${v}=1`
                        });
                    }
                });
            } catch (err) {
                console.error("Failed to update Desmos expression:", err);
                if (mounted) setError(`Invalid equation syntax: ${err.message}`);
            }
        }
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
                borderBottom: '1px solid #eee'
            }}>
                <h4 style={{ margin: 0, color: '#FE4F30' }}>
                    <i className="fas fa-calculator" style={{ marginRight: '8px' }}></i>
                    {title}
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>Powered by Desmos</span>
            </div>

            <div
                ref={elementRef}
                style={{ width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }}
            ></div>

            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                Type equations to explore the graph!
            </p>
        </div>
    );
};

export default DesmosGrapher;
