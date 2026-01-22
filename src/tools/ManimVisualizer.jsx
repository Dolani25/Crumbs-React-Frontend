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

            if (scriptContent) {
                console.log("ManimVisualizer: Original Script:", scriptContent);

                // 1. Force Parenting & Sizing via Regex
                // Replaces: createCanvas(w, h) 
                // With:    createCanvas(w, h).parent('manim-canvas-container')
                // This handles various spacing: createCanvas ( 400, 400 )
                let modifiedScript = scriptContent.replace(
                    /createCanvas\s*\(([^)]+)\)/g,
                    "createCanvas($1).parent('manim-canvas-container')"
                );

                // Fallback: If AI generated invalid p5 (e.g. no createCanvas), this won't break anything, just might not parent.

                console.log("ManimVisualizer: Modified Script:", modifiedScript);

                // Remove existing user script if any
                const existingScript = document.getElementById('manim-user-script');
                if (existingScript) existingScript.remove();

                // Reset p5 instance if possible
                if (window.remove) window.remove();

                try {
                    const script = document.createElement('script');
                    script.id = 'manim-user-script';
                    script.text = `
                        try {
                            ${modifiedScript}
                            console.log("ManimVisualizer: Script executed successfully");
                            // Try to manually trigger p5 setup if it hasn't run
                            if (typeof setup === 'function') {
                                console.log("ManimVisualizer: Found setup(). Triggering P5...");
                                new p5(); // Re-init global mode p5
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
