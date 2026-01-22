import React, { useEffect, useRef, useState } from 'react';

const ManimVisualizer = ({ scriptContent }) => {
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadScripts = async () => {
            const scripts = [
                '/manim/lib/p5/p5.min.js', // Core dependency
                // Manim Libs
                '/manim/src/globals.js',
                '/manim/src/proto.js',
                '/manim/src/math.js',
                '/manim/src/graphics.js',
                '/manim/src/utils.js',
                '/manim/src/text.js',
                '/manim/src/timer.js',
                '/manim/src/3d.js',
                '/manim/src/brain.js',
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

            try {
                const script = document.createElement('script');
                script.id = 'manim-user-script';
                script.text = `
                        try {
                            // 1. Definition Phase
                            ${scriptContent}
                            console.log("ManimVisualizer: Script definition executed.");

                            // 2. Execution Phase
                            // Check if the user defined the "RequestGeneration" class (New Standard)
                            if (typeof RequestGeneration === 'function') {
                                console.log("ManimVisualizer: Found RequestGeneration class. Launching P5 Instance Mode...");
                                
                                if (window.currentP5) {
                                  window.currentP5.remove(); // Cleanup previous instance
                                }

                                window.currentP5 = new p5((s) => {
                                    let scene;
                                    s.setup = () => {
                                        console.log("P5 Instance Setup");
                                        // Instantiate the scene
                                        try {
                                            scene = new RequestGeneration(s);
                                        } catch(e) {
                                            console.error("Error creating RequestGeneration:", e);
                                        }
                                    };
                                    s.draw = () => {
                                        if (scene && scene.show) scene.show();
                                        else if (scene && scene.draw) scene.draw();
                                    };
                                }, 'manim-canvas-container');

                            } else {
                                // Fallback: Global Mode (Legacy/Simple Scripts)
                                console.log("ManimVisualizer: No class found. Assuming Global Mode.");
                                
                                // Clean previous global p5 if any
                                if (window.remove) window.remove();

                                // Manual trigger if setup is defined globally
                                if (typeof setup === 'function') {
                                    console.log("ManimVisualizer: Found global setup(). Triggering P5...");
                                    new p5(); 
                                    
                                    // Apply our canvas parenting hack for Global Mode
                                    if (window.createCanvas && !window.createCanvas.isWrapped) {
                                        const originalCreateCanvas = window.createCanvas;
                                         window.createCanvas = (...args) => {
                                            const cnv = originalCreateCanvas(...args);
                                            try { cnv.parent('manim-canvas-container'); } catch(e) {}
                                            return cnv;
                                        };
                                        window.createCanvas.isWrapped = true;
                                    }
                                }
                            }
                        } catch (e) {
                            console.error("ManimVisualizer: Runtime Script Error:", e);
                        }
                    `;
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
