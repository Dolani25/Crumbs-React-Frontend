
import React from 'react';
import Sketch from 'react-p5';

// The AI generates a P5.js script content (setup/draw functions).
// We need to wrap them so react-p5 can use them.
// Challenge: The AI output is a string like "function setup() {...} function draw() {...}"
// We need to evaluate this safe-ishly or parse it.
// Simpler approach: The AI generates code that uses global p5 functions (standard mode).
// We can use Function(p5) to inject scope or just perform string manipulation to attach them to 'p5' instance.

const VideoExplainer = ({ data, title }) => {
    // data.script contains the raw code string.

    const setupSketch = (p5, canvasParentRef) => {
        // We need to execute the user's script in a context where 'p5' methods are available
        // BUT standard p5 code (setup/draw) relies on globals or specific 'p' instance in instance mode

        // Strategy: We will create a Function that takes 'p' (the p5 instance) 
        // and maps all p5 methods to it for compatibility with "global mode" style code

        // 1. Clean the script
        // Remove 'function setup() {' and 'function draw() {' wrappers if possible 
        // and replace with p.setup = () => ...
        try {
            let script = data.script || "";

            // Hacky but effective for AI code:
            // Replace "function setup()" with "p.setup = function()"
            script = script.replace(/function\s+setup\s*\(\s*\)/g, "p.setup = function()");
            script = script.replace(/function\s+draw\s*\(\s*\)/g, "p.draw = function()");

            // Replace standard P5 globals with p. prefixes
            const p5Globals = ['createCanvas', 'background', 'fill', 'stroke', 'noFill', 'noStroke', 'rect', 'ellipse', 'circle', 'line', 'text', 'textSize', 'translate', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 'box', 'sphere', 'cylinder', 'torus', 'cone', 'beginShape', 'endShape', 'vertex', 'sin', 'cos', 'tan', 'PI', 'TWO_PI', 'width', 'height', 'frameCount', 'lerp', 'strokeWeight', 'orbitControl', 'WEBGL'];

            p5Globals.forEach(g => {
                // negative lookbehind/ahead checks would be better but simple replace works for now
                // We strictly replace word boundaries
                // Note: This is fragile. 'width' -> 'p.width'
                const regex = new RegExp(`\\b${g}\\b`, 'g');
                script = script.replace(regex, `p.${g}`);
            });

            // Execute the script
            // eslint-disable-next-line no-new-func
            const runner = new Function('p', script);
            runner(p5);

            // Ensure canvas is parented correctly if the script uses p.createCanvas
            // react-p5 handles this mostly, but p.createCanvas might append to body if not careful.
            // Actually react-p5's setup passes canvasParentRef. 
            // We need to intercept the setup call or ensure p.createCanvas uses parent.

            // Override p.createCanvas to use the parent
            const originalCreateCanvas = p5.createCanvas;
            p5.createCanvas = (w, h, mode) => {
                const c = originalCreateCanvas.call(p5, w, h, mode);
                c.parent(canvasParentRef);
                return c;
            };

        } catch (err) {
            console.error("VideoExplainer: Script Error", err);
        }
    };

    return (
        <div style={{
            width: '100%',
            background: '#000',
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            border: '1px solid #333'
        }}>
            <div style={{
                position: 'absolute', top: 20, left: 20, zIndex: 10,
                color: 'white', textShadow: '0 2px 4px black'
            }}>
                <h3 style={{ margin: 0 }}>{title || "Concept Visualizer"}</h3>
                <span style={{ fontSize: '0.8rem', color: '#cyan', fontFamily: 'monospace' }}>
                    ENGINE: MANIM_JS_LITE
                </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Sketch setup={setupSketch} draw={(p) => { /* already handled by injection */ }} />
            </div>
        </div>
    );
};

export default VideoExplainer;
