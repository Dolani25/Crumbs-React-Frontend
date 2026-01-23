import React, { useEffect, useRef, useState } from 'react';

const DesmosGrapher = ({ expression = "y=x^2", title = "Interactive Graph" }) => {
    const calculatorRef = useRef(null);
    const elementRef = useRef(null);
    const [error, setError] = useState(null);

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

                    calculatorRef.current.setExpression({ id: 'graph1', latex: expression });
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
                // Script exists but maybe not loaded yet?
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
            // 1. Clear previous state slightly? No, setExpression updates existing IDs.
            // But we should reset if expression changes drastically.
            calculatorRef.current.setExpression({ id: 'graph1', latex: expression });

            // 2. Auto-Detect and Inject Sliders for Variables
            // Common variables that need definitions
            const commonVars = [
                // Greek
                '\\sigma', '\\mu', '\\alpha', '\\beta', '\\gamma', '\\lambda', '\\theta', '\\phi',
                // Standard Params
                'a', 'b', 'c', 'd', 'k', 'm', 'n', 'p', 'q', 'r', 's', 't'
            ];

            // Exclude 'e' (Euler), 'x', 'y' (Axes), 'pi' (Constant) if simple check hits them

            commonVars.forEach(v => {
                // Simple substring check (Robust enough for this MVP)
                // Note: Check if it exists in expression AND isn't just part of a word?
                // Desmos latex usually separates vars. "\sigma" is distinct. "a" might be "tan".
                // Regex: Look for variable preceded by non-letter (or start) and followed by non-letter (or end)
                // Escape backslashes for regex
                const escV = v.replace(/\\/g, '\\\\');
                const regex = new RegExp(`(^|[^a-zA-Z\\\\])${escV}([^a-zA-Z]|$)`);

                if (regex.test(expression)) {
                    // Check if already defined? (Desmos handles overrides, but we default to 1)
                    // strictly speaking we should only add if not present, but here we just ensure they exist.
                    // Give them a unique ID so we don't overwrite the graph
                    calculatorRef.current.setExpression({
                        id: `slider_${v.replace('\\', '')}`,
                        latex: `${v}=1`
                    });
                }
            });
        }
    }, [expression]);

    if (error) {
        return (
            <div className="tool-container" style={{ padding: '20px', textAlign: 'center', background: '#fff0f0', borderRadius: '8px', color: 'red' }}>
                <p>⚠️ {error}</p>
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
