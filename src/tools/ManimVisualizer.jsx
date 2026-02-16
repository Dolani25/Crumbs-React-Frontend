import React, { useEffect, useRef, useState } from 'react';

const ManimVisualizer = ({ scriptContent }) => {
    const containerRef = useRef(null);
    const [iframeSrc, setIframeSrc] = useState(null);
    const [error, setError] = useState(null);

    // IFrame Generation Effect
    useEffect(() => {
        if (scriptContent) {
            console.groupCollapsed("Manim Script (Generated)");
            console.log(scriptContent);
            console.groupEnd();

            // ====== CODE VALIDATION & AUTO-FIX ======
            const validateAndFixManimCode = (code) => {
                let fixed = code;
                const warnings = [];

                // 1. Remove ALL comments
                const commentsBefore = (fixed.match(/\/\/|\/\*/g) || []).length;
                fixed = fixed.replace(/\/\/.*$/gm, ''); // Single-line comments
                fixed = fixed.replace(/\/\*[\s\S]*?\*\//g, ''); // Multi-line comments
                if (commentsBefore > 0) warnings.push(`⚠️ Removed ${commentsBefore} comments`);

                // 2. Balance braces (DISABLED: Breaks LaTeX strings)
                /*
                const openBraces = (fixed.match(/\{/g) || []).length;
                const closeBraces = (fixed.match(/\}/g) || []).length;
                if (openBraces > closeBraces) {
                    fixed += '\n}'.repeat(openBraces - closeBraces);
                    warnings.push(`⚠️ Added missing closing braces`);
                }
                */

                // 2.5. Validate function braces specifically (safer than global brace balancing)
                const validateFunctionBraces = (code) => {
                    // Find all function declarations
                    const functionPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{/g;
                    let match;
                    let validatedCode = code;

                    while ((match = functionPattern.exec(code)) !== null) {
                        const funcName = match[1];
                        const startPos = match.index + match[0].length;

                        // Count braces from start of function body
                        let braceCount = 1;
                        let pos = startPos;
                        let foundEnd = false;

                        while (pos < code.length && braceCount > 0) {
                            const char = code[pos];
                            if (char === '{') braceCount++;
                            else if (char === '}') {
                                braceCount--;
                                if (braceCount === 0) {
                                    foundEnd = true;
                                    break;
                                }
                            }
                            pos++;
                        }

                        // If function not properly closed, add closing brace at end
                        if (!foundEnd && braceCount > 0) {
                            validatedCode += '\n}'.repeat(braceCount);
                            warnings.push(`⚠️ Closed incomplete ${funcName}() function`);
                        }
                    }

                    return validatedCode;
                };

                fixed = validateFunctionBraces(fixed);

                // 4. Setup/Draw Stubs for Legacy Modes
                const hasScene = fixed.includes('Scene =');
                if (!hasScene) {
                    // Logic moved to main effect to handle inferred WEBGL
                    if (!fixed.includes('function draw')) fixed += '\nfunction draw() { background(0); }';
                }

                if (warnings.length > 0) console.warn("Manim Auto-Fix:", warnings);
                return fixed;
            };

            let modifiedScript = validateAndFixManimCode(scriptContent);

            // Force Full Window Canvas in Iframe
            // Force Full Window Canvas in Iframe (Preserving WEBGL if used, or inferring it)
            // Force Full Window Canvas in Iframe (Preserving WEBGL if used, or inferring it)
            // 'translate' is common in 2D too, so remove it to avoid forcing WEBGL mode.
            const threeDKeywords = ['WEBGL', 'rotateX', 'rotateY', 'rotateZ', 'sphere', 'box', 'cylinder', 'cone', 'torus', 'plane', 'ellipsoid', 'orbitControl', 'ambientLight', 'directionalLight', 'pointLight'];
            const inferredWebgl = threeDKeywords.some(kw => modifiedScript.includes(kw));

            // Polyfill 'circle' if missing (older p5 versions or scope issues)
            const circlePolyfill = `
                if (typeof circle === 'undefined') {
                    window.circle = function(x, y, r) {
                        if (typeof ellipse === 'function') {
                            ellipse(x, y, r, r);
                        }
                    };
                }
            `;

            // Add Polyfill to Setup
            if (modifiedScript.includes('function setup')) {
                modifiedScript = modifiedScript.replace('function setup() {', 'function setup() { ' + circlePolyfill);
            } else {
                // It will be wrapped later if setup missing
            }

            // Force Full Window Canvas DISABLED
            // (Use CSS scaling instead to handle mobile. This preserves absolute coordinates.)
            /*
            if (modifiedScript.match(/createCanvas\s*\(/)) {
                modifiedScript = modifiedScript.replace(
                    /createCanvas\s*\(([^)]+)\)/g,
                    (match, args) => {
                        if (args.includes('WEBGL') || inferredWebgl) {
                            return "createCanvas(windowWidth, windowHeight, WEBGL)";
                        }
                        return "createCanvas(windowWidth, windowHeight)";
                    }
                );
            } else {
                 // Inject setup if missing
                 if (!modifiedScript.includes('function setup')) {
                     const mode = inferredWebgl ? 'WEBGL' : '';
                     // Default to standard HD size if no createCanvas provided, CSS will scale it down.
                     modifiedScript = `function setup() { \n${circlePolyfill}\ncreateCanvas(800, 450${mode ? ', ' + mode : ''}); }\n` + modifiedScript;
                 }
            }
            */

            // Inject setup if missing (Still needed, but default to 800x450 for scaling)
            if (!modifiedScript.includes('function setup')) {
                const mode = inferredWebgl ? 'WEBGL' : '';
                modifiedScript = `function setup() { \n${circlePolyfill}\ncreateCanvas(800, 450${mode ? ', ' + mode : ''}); }\n` + modifiedScript;
            } else {
                // Force Resolution in existing setup
                // This regex finds createCanvas(...) and replaces it with createCanvas(800, 450, WEBGL?)
                if (modifiedScript.includes('createCanvas')) {
                    modifiedScript = modifiedScript.replace(/createCanvas\s*\(([^)]+)\)/, (match, args) => {
                        // Check if WEBGL was already there or needs to be added
                        const hasWebgl = args.includes('WEBGL') || inferredWebgl;
                        return `createCanvas(800, 450${hasWebgl ? ', WEBGL' : ''})`;
                    });
                }
            }

            // Escape for Template String embedding
            const safeScript = modifiedScript.replace(/`/g, '\\`').replace(/<\/script>/g, '<\\/script>');

            // Construct IFrame HTML
            const iframeHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { margin: 0; padding: 0; overflow: hidden; background: #000; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; }
                        canvas { 
                            box-shadow: 0 4px 30px rgba(0,0,0,0.5); 
                            /* Fix Mobile Cutoff: max-width/height ensures canvas scales down to fit viewport without clipping */
                            max-width: 100%;
                            max-height: 100%;
                            width: auto !important;
                            height: auto !important;
                            object-fit: contain;
                            display: block;
                        }
                    </style>
                    <script>
                        // Global error handler
                        window.onerror = function(msg, url, line) {
                            window.parent.postMessage({ type: 'MANIM_ERROR', msg: msg }, '*');
                        };

                        function startP5() {
                            console.log("Manim: P5 Library Loaded via onload");
                            if (window.p5) {
                                console.log("Manim: Starting P5...");
                                new p5();
                            } else {
                                console.error("Manim: P5 loaded but window.p5 is undefined");
                            }
                        }
                    </script>
                    <script src="${window.location.origin}/manim/lib/p5/p5.min.js" onload="startP5()" onerror="console.error('Manim: Failed to load P5 library')"></script>
                </head>
                <body>
                    <script>
                        // --- FONT LOADING SHIM ---
                        let _manimFont;
                        
                        // Hook into window.preload
                        const _userPreload = window.preload;
                        window.preload = function() {
                            console.log("Manim: Preload started");
                            // Use absolute URL for font too
                            _manimFont = loadFont('${window.location.origin}/manim/lib/katex/fonts/KaTeX_SansSerif-Regular.ttf', 
                                () => console.log("Manim: Font loaded success"),
                                (err) => console.error("Manim: Font load failed", err)
                            );
                            if (typeof _userPreload === 'function') _userPreload();
                        };

                         // Hook Setup
                        const _userSetup = window.setup;
                        window.setup = function() {
                            console.log("Manim: Setup started");
                            if (typeof _userSetup === 'function') _userSetup();
                            if (_manimFont) textFont(_manimFont);
                            console.log("Manim: Setup finished");
                        };

                        // Hook Draw
                        const _userDraw = window.draw;
                        let _firstDraw = true;
                        window.draw = function() {
                             if (_firstDraw) {
                                 console.log("Manim: First Draw Frame");
                                 _firstDraw = false;
                             }
                             if (typeof _userDraw === 'function') _userDraw();
                        }
                        
                        window.windowResized = function() {
                            // Don't modify canvas size here for responsiveness, CSS handles visualization scaling.
                            // Only resize if P5 logic specifically depends on window size.
                            // But usually Manim scripts are fixed size.
                            // resizeCanvas(windowWidth, windowHeight);
                        }
                    </script>

                    <script>
                        // --- GLOBAL SHIMS ---
                        // FIX: Force fixed resolution for Manim logic so it doesn't scale down computations
                        window.width = 800;
                        window.height = 450;
                        window.innerWidth = 800;
                        window.innerHeight = 450;

                        // --- USER SCRIPT INJECTION ---
                        ${safeScript}
                    </script>
                </body>
                </html>
            `;

            const blob = new Blob([iframeHtml], { type: 'text/html' });
            const blobUrl = URL.createObjectURL(blob);
            setIframeSrc(blobUrl);

            return () => URL.revokeObjectURL(blobUrl);
        }
    }, [scriptContent]);

    // Handle Iframe Errors
    useEffect(() => {
        const handler = (e) => {
            if (e.data && e.data.type === 'MANIM_ERROR') console.error("Manim Iframe Error:", e.data.msg);
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    if (!scriptContent) return <div style={{ color: '#666', padding: '20px', textAlign: 'center' }}>No script content</div>;

    return (
        <div
            ref={containerRef}
            className="manim-container"
            style={{
                width: '100%',
                height: '100%',
                minHeight: '400px',
                background: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative'
            }}
        >
            {iframeSrc ? (
                <iframe
                    src={iframeSrc}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="Manim Visualization"
                // Sandbox removed to prevent 'allow-scripts' + 'allow-same-origin' console warning.
                />
            ) : (
                <div style={{ color: '#fff', textAlign: 'center', paddingTop: '50px' }}>Loading Visualizer...</div>
            )}
        </div>
    );
};

export default ManimVisualizer;
