// Vanilla Canvas Renderer for "Motion Canvas" style animations
// This replaces the actual @motion-canvas library for runtime safety

const FPS = 30;

// Easing functions
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

export const renderAnimation = (ctx, frame, data) => {
    // Handle High-DPI scaling: Convert physical pixels to logical CSS pixels
    const dpr = window.devicePixelRatio || 1;
    const width = ctx.canvas.width / dpr;
    const height = ctx.canvas.height / dpr;

    // Clear Background
    ctx.fillStyle = '#0f172a'; // Slate-900
    ctx.fillRect(0, 0, width, height);

    const scenes = data?.scenes || [];
    if (scenes.length === 0) return;

    // Determine Active Scene
    let accumulatedFrames = 0;
    let activeScene = null;
    let localFrame = 0;

    for (const scene of scenes) {
        const duration = scene.durationFrames || 90; // Default 3s
        if (frame >= accumulatedFrames && frame < accumulatedFrames + duration) {
            activeScene = scene;
            localFrame = frame - accumulatedFrames;
            break;
        }
        accumulatedFrames += duration;
    }

    if (!activeScene) {
        // End of animation
        drawEndScreen(ctx, width, height);
        return;
    }

    // Render Scene Types
    ctx.save();

    // Universal Scene Setup
    const progress = localFrame / (activeScene.durationFrames || 90);
    const fadeIn = Math.min(1, localFrame / 20); // 20 frames fade in

    // Scale from center
    ctx.translate(width / 2, height / 2);

    if (activeScene.type === 'INTRO') {
        const scale = easeOutCubic(Math.min(1, localFrame / 30));
        ctx.scale(scale, scale);

        ctx.fillStyle = '#f8fafc'; // White
        ctx.font = 'bold 60px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = fadeIn;

        wrapText(ctx, activeScene.text_overlay || "Intro", 0, 0, width * 0.8, 70);
    }
    else if (activeScene.type === 'FORMULA') {
        const scale = 1 + (Math.sin(localFrame * 0.05) * 0.05); // Gentle pulse
        ctx.scale(scale, scale);

        ctx.fillStyle = '#6366f1'; // Indigo-500
        ctx.font = 'italic bold 50px "Times New Roman", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = fadeIn;

        // Simulating LaTeX with serif font
        const text = activeScene.formula_latex || activeScene.text_overlay || "E = mc^2";
        ctx.fillText(text, 0, 0);

        // Subtext
        ctx.font = '20px "Inter", sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText("Mathematical Relationship", 0, 60);
    }
    else if (activeScene.type === '3D_MODEL' || activeScene.type === 'VISUAL') {
        // Draw shapes
        const t = localFrame * 0.05;

        // Rotate
        ctx.rotate(t);

        // Draw Shape
        ctx.fillStyle = activeScene.highlight_var || '#fbbf24'; // Amber
        ctx.beginPath();
        const size = 100 * easeOutCubic(Math.min(1, localFrame / 20));
        ctx.rect(-size / 2, -size / 2, size, size);
        ctx.fill();

        // Overlay text (reset rotation)
        ctx.rotate(-t);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px "Inter", sans-serif';
        ctx.globalAlpha = 1;
        ctx.fillText(activeScene.text_overlay || "Visual", 0, 150);
    }

    ctx.restore();

    // Progress Bar
    const totalFrames = scenes.reduce((acc, s) => acc + (s.durationFrames || 90), 0);
    const globalProgress = Math.min(1, frame / totalFrames);
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(0, height - 5, width * globalProgress, 5);
};

function drawEndScreen(ctx, w, h) {
    ctx.fillStyle = 'white';
    ctx.font = '30px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText("↺ Replay", w / 2, h / 2);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(' ');
    let line = '';

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, y);
            line = words[n] + ' ';
            y += lineHeight;
        }
        else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, y);
}
