import React, { useEffect, useRef, useState } from 'react';

const ManimVisualizer = ({ scriptContent }) => {
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadScripts = async () => {
            const scripts = [
                '/manim/lib/p5/p5.min.js', // P5.js core only
            ];

            try {
                for (const src of scripts) {
                    // Check if already loaded by tag to prevent duplicates
                    if (!document.querySelector(`script[src="${src}"]`)) {
                        await new Promise((resolve, reject) => {
                            const script = document.createElement('script');
                            script.src = src;
                            script.async = false;
                            script.onload = resolve;
                            script.onerror = () => reject(new Error(`Failed to load ${src}`));
                            document.body.appendChild(script);
                        });
                    }
                }
                // Small delay to ensure p5 global namespace is ready
                setTimeout(() => setIsLoaded(true), 100);
            } catch (err) {
                console.error("Manim Load Error:", err);
                setError(err.message);
            }
        };

        loadScripts();

    }, []);

    useEffect(() => {
        if (isLoaded && containerRef.current) {
            console.log("Manim Environment Loaded. ScriptContent length:", scriptContent ? scriptContent.length : "N/A");

            if (scriptContent) {
                console.log("ManimVisualizer: Original Script:", scriptContent);

                // ====== CODE VALIDATION & AUTO-FIX ======
                const validateAndFixManimCode = (code) => {
                    let fixed = code;
                    const warnings = [];

                    // 1. Remove ALL comments (most critical fix)
                    const commentsBefore = (fixed.match(/\/\/|\/\*/g) || []).length;
                    fixed = fixed.replace(/\/\/.*$/gm, ''); // Single-line comments
                    fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments
                    if (commentsBefore > 0) {
                        warnings.push(`⚠️  Removed ${commentsBefore} comment(s) - comments break script execution`);
                    }

                    // 2. Balance braces
                    const openBraces = (fixed.match(/\{/g) || []).length;
                    const closeBraces = (fixed.match(/\}/g) || []).length;
                    if (openBraces > closeBraces) {
                        const missing = openBraces - closeBraces;
                        fixed += '\n}'.repeat(missing);
                        warnings.push(`⚠️  Added ${missing} missing closing brace(s)`);
                    } else if (closeBraces > openBraces) {
                        warnings.push(`❌ More closing braces than opening ones - code may be malformed`);
                    }

                    // 3. Balance parentheses
                    const openParens = (fixed.match(/\(/g) || []).length;
                    const closeParens = (fixed.match(/\)/g) || []).length;
                    if (openParens !== closeParens) {
                        warnings.push(`❌ Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
                    }

                    // 4. Check setup() and draw() exist (ONLY for non-Scene patterns)
                    const hasScenePattern = fixed.includes('const Scene =') || fixed.includes('let Scene =') || fixed.includes('var Scene =');

                    if (!hasScenePattern) {
                        // Legacy P5.js global mode - needs global setup/draw
                        if (!fixed.includes('function setup')) {
                            warnings.push(`❌ Missing setup() function - adding stub`);
                            fixed = 'function setup() { createCanvas(800, 450); }\n' + fixed;
                        }
                        if (!fixed.includes('function draw')) {
                            warnings.push(`❌ Missing draw() function - adding stub`);
                            fixed += '\nfunction draw() { background(0); }';
                        }
                    } else {
                        // Manim.js Scene pattern - verify s.setup and s.draw exist
                        if (!fixed.includes('s.setup =')) {
                            warnings.push(`❌ Scene missing s.setup - add: s.setup = function() {...}`);
                        }
                        if (!fixed.includes('s.draw =')) {
                            warnings.push(`❌ Scene missing s.draw - add: s.draw = function() {...}`);
                        }
                    }

                    // 5. Text collision detection & auto-fix
                    const textMatches = [...fixed.matchAll(/text\([^,]+,\s*[^,]+,\s*(\d+)/g)];
                    if (textMatches.length > 1) {
                        const yCoords = textMatches.map(m => parseInt(m[1]));
                        const uniqueYs = new Set(yCoords);
                        if (uniqueYs.size < yCoords.length) {
                            warnings.push(`⚠️  Text elements may overlap - auto-spacing with 40px gaps`);
                            let yOffset = 50;
                            fixed = fixed.replace(/text\(([^)]+)\)/g, (match) => {
                                const result = match.replace(/,\s*\d+\s*\)/, `, ${yOffset})`);
                                yOffset += 40;
                                return result;
                            });
                        }
                    }

                    // 6. Log all warnings
                    if (warnings.length > 0) {
                        console.warn("🔧 Manim Code Auto-Fix Applied:");
                        warnings.forEach(w => console.warn(w));
                    } else {
                        console.log("✅ Manim Code Validation Passed");
                    }

                    return fixed;
                };

                // Apply validation
                let modifiedScript = validateAndFixManimCode(scriptContent);

                // 1. Force Parenting & Sizing via Regex
                // Replaces: createCanvas(w, h) OR s.createCanvas(w, h)
                // With:    createCanvas(w, h).parent('manim-canvas-container')
                // This ensures both Global Mode and Instance Mode (s.createCanvas) are parented correctly.
                modifiedScript = modifiedScript.replace(
                    /createCanvas\s*\(([^)]+)\)/g,
                    "createCanvas($1).parent('manim-canvas-container')"
                ).replace(/`/g, '\\`'); // Escape backticks to prevent template string breakage

                console.log("ManimVisualizer: Modified Script:", modifiedScript);

                // Remove existing user script if any
                const existingScript = document.getElementById('manim-user-script');
                if (existingScript) {
                    console.log("ManimVisualizer: Removing previous script...");
                    existingScript.remove();
                }

                // Reset p5 instance if possible
                if (window.currentP5) {
                    console.log("ManimVisualizer: Removing previous P5 instance...");
                    window.currentP5.remove();
                    window.currentP5 = null;
                }

                // Clear any previous Scene definition
                if (typeof window.Scene !== 'undefined') {
                    console.log("ManimVisualizer: Clearing previous Scene...");
                    window.Scene = undefined;
                }

                // Create the execution logic
                const executionLogic = `
                    console.log("ManimVisualizer: Executing P5.js script...");
                    setTimeout(() => {
                        if (window.currentP5) {
                            console.log("ManimVisualizer: Removing previous P5 instance...");
                            window.currentP5.remove();
                        }
                        
                        if (typeof setup === 'function' && typeof draw === 'function') {
                            console.log("ManimVisualizer: Found global setup/draw. Launching P5...");
                            window.currentP5 = new p5();
                        } else {
                            console.error("ManimVisualizer: No setup() or draw() functions found.");
                        }
                    }, 100);
                `;

                // Combine strict processing: User Code + Newline + Logic
                const finalCode = modifiedScript + "\n\n" + executionLogic;

                try {
                    const blob = new Blob([finalCode], { type: 'application/javascript' });
                    const scriptUrl = URL.createObjectURL(blob);

                    const script = document.createElement('script');
                    script.id = 'manim-user-script';
                    script.src = scriptUrl;

                    script.onload = () => {
                        console.log("ManimVisualizer: Blob Script Loaded");
                        URL.revokeObjectURL(scriptUrl); // Cleanup memory
                    };

                    script.onerror = (e) => {
                        console.error("ManimVisualizer: Blob Script Error", e);
                        URL.revokeObjectURL(scriptUrl);
                    };

                    document.body.appendChild(script);

                } catch (e) {
                    console.error("ManimVisualizer: Injection Error:", e);
                }
            }
        }
    }, [isLoaded, scriptContent]);

    if (error) return <div style={{ color: 'red' }}>Error loading Manim Engine: {error}</div>;
    if (!isLoaded) return <div>Loading Physics Engine...</div>;

    if (!scriptContent) {
        return (
            <div style={{
                width: '100%', height: '100%', minHeight: '400px', background: '#111',
                color: '#666', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'monospace', textAlign: 'center', padding: '20px'
            }}>
                <i className="las la-code" style={{ fontSize: '3rem', marginBottom: '10px', opacity: 0.5 }}></i>
                <p>No visualization script found.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '10px', color: '#fbbf24' }}>
                    Click "Regenerate" to create a new animation.
                </p>
            </div>
        );
    }

    return (
        <div
            id="manim-canvas-container"
            ref={containerRef}
            className="manim-container"
            style={{
                width: '100%',
                height: '100%',
                background: '#000',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}
        >
            <style>{`
                #manim-canvas-container canvas {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: contain !important;
                }
            `}</style>
            {/* Canvas will be injected here by p5/manim */}
        </div>
    );
};

export default ManimVisualizer;
