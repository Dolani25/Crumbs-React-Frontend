import React, { useEffect, useRef, useState } from 'react';
import { renderAnimation } from './Interpreter.jsx';

const RuntimePlayer = ({ data }) => {
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const [frame, setFrame] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !data) return;

        const ctx = canvas.getContext('2d');

        // Handle High-DPI
        const dpr = window.devicePixelRatio || 1;
        // Reset transform to avoid accumulation on hot reload
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const animate = () => {
            if (isPlaying) {
                setFrame(prev => {
                    const nextFrame = prev + 1;
                    renderAnimation(ctx, nextFrame, data);
                    // Check for end? Interpreter handles it visually
                    return nextFrame;
                });
            } else {
                renderAnimation(ctx, frame, data);
            }
            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [data, isPlaying]);

    const handleReplay = () => {
        setFrame(0);
        setIsPlaying(true);
    };

    return (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#0f172a', borderRadius: '12px', overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                style={{ width: '100%', height: '100%', display: 'block' }}
                onClick={() => setIsPlaying(!isPlaying)}
            />

            <div style={{
                position: 'absolute', bottom: 10, right: 10,
                display: 'flex', gap: '8px'
            }}>
                <button
                    onClick={handleReplay}
                    style={{
                        background: 'rgba(255,255,255,0.2)',
                        border: 'none',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        backdropFilter: 'blur(4px)',
                        fontSize: '0.8rem'
                    }}
                >
                    ↺ Replay
                </button>
            </div>
        </div>
    );
};

export default RuntimePlayer;
