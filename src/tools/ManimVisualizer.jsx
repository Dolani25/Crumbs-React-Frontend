import React, { useEffect, useRef, useState } from 'react';

const ManimVisualizer = ({ scriptContent }) => {
    const containerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadScripts = async () => {
            const scripts = [
                '/src/tools/manim/lib/p5/p5.min.js', // Corrected path from clone
                // Manim Libs (Order matters!)
                '/src/tools/manim/src/globals.js',
                '/src/tools/manim/src/utils.js',
                '/src/tools/manim/src/graphics.js',
                '/src/tools/manim/src/text.js',
                '/src/tools/manim/src/timer.js',
                '/src/tools/manim/src/proto.js',
                '/src/tools/manim/src/math.js',
                '/src/tools/manim/src/3d.js', // Added 3d support
                '/src/tools/manim/src/brain.js',
            ];

            try {
                for (const src of scripts) {
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
                setIsLoaded(true);
            } catch (err) {
                console.error("Manim Load Error:", err);
                setError(err.message);
            }
        };

        // We need P5.js first. If not in project, we might need to add it to index.html or download it.
        // For now, assuming p5 is available or user adds it.
        // Actually, let's use a CDN for p5 to be safe if local missing.
        if (!window.p5) {
            const p5Script = document.createElement('script');
            p5Script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js';
            p5Script.async = false;
            p5Script.onload = loadScripts;
            document.body.appendChild(p5Script);
        } else {
            loadScripts();
        }

    }, []);

    useEffect(() => {
        if (isLoaded && containerRef.current) {
            // Initialize Manim/P5 sketch here
            // The Manim.js lib typically looks for a canvas or creates one.
            // We need to see how to trigger the animation.
            // Usually it uses a 'setup' and 'draw' global function or instance mode.

            // For now, we just indicate readiness.
            console.log("Manim Environment Loaded");

            if (scriptContent) {
                // Remove existing user script if any
                const existingScript = document.getElementById('manim-user-script');
                if (existingScript) existingScript.remove();

                const script = document.createElement('script');
                script.id = 'manim-user-script';
                script.text = scriptContent;
                document.body.appendChild(script);

                console.log("Manim Script Injected");
            }
        }
    }, [isLoaded, scriptContent]);

    if (error) return <div style={{ color: 'red' }}>Error loading Manim Engine: {error}</div>;
    if (!isLoaded) return <div>Loading Physics Engine...</div>;

    return (
        <div
            id="manim-canvas-container"
            ref={containerRef}
            className="manim-container"
            style={{ width: '100%', height: '100%', minHeight: '400px', background: '#000', position: 'relative' }}
        >
            {/* Canvas will be injected here by p5/manim */}
        </div>
    );
};

export default ManimVisualizer;
