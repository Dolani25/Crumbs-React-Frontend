import React, { useRef } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { BlockMath } from 'react-katex';
import { Canvas, useFrame } from '@react-three/fiber';
import * as LucideIcons from 'lucide-react';

// --- Components ---

// Dynamic Icon Renderer
const IconRenderer = ({ name, color, size = 120 }) => {
    const IconComponent = LucideIcons[name] || LucideIcons.Zap; // Fallback to Zap
    return <IconComponent size={size} color={color} strokeWidth={1.5} />;
};

// 3D Mesh
const SpinningMesh = ({ shape = "box", color }) => {
    const meshRef = useRef();
    const rawFrame = useCurrentFrame();
    const frame = Number.isFinite(rawFrame) ? rawFrame : 0; // Prevent NaN
    const rotation = frame * 0.02;

    // Normalize shape input
    const safeShape = (shape || "box").toLowerCase().trim();

    return (
        <mesh rotation={[rotation, rotation * 0.8, 0]}>
            {safeShape.includes("sphere") && <sphereGeometry args={[2.5, 32, 32]} />}
            {safeShape.includes("torus") && <torusGeometry args={[1.8, 0.6, 16, 100]} />}
            {safeShape.includes("cone") && <coneGeometry args={[1.5, 3, 32]} />}
            {/* Default Box if nothing else matches (or if it's "box") */}
            {(!safeShape.includes("sphere") && !safeShape.includes("torus") && !safeShape.includes("cone")) && (
                <boxGeometry args={[2.5, 2.5, 2.5]} />
            )}
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.7} />
        </mesh>
    );
};

// Main Scene Component
const Scene = ({ type, text_overlay, visual_asset, formula_latex, background_color, highlight_var }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Cinematic Animations
    const opacity = Math.min(1, frame / (fps * 0.5)); // Fade in over 0.5s
    const yOffset = interpolate(frame, [0, 30], [50, 0], { extrapolateRight: "clamp" });
    const scale = spring({ frame, fps, config: { damping: 15 } });

    // Styles
    const containerStyle = {
        backgroundColor: background_color || '#1e293b',
        color: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        textAlign: 'center',
        padding: '60px'
    };

    const titleStyle = {
        fontSize: '3.5rem',
        fontWeight: 800,
        marginBottom: '40px',
        opacity: opacity,
        transform: `translateY(${yOffset}px)`,
        textShadow: '0 4px 20px rgba(0,0,0,0.3)'
    };

    return (
        <AbsoluteFill style={containerStyle}>
            {/* 1. VISUAL LAYER */}
            <div style={{ transform: `scale(${scale})`, marginBottom: '40px' }}>
                {type === '3D_MODEL' ? (
                    <div style={{ width: 500, height: 400 }}>
                        <Canvas camera={{ position: [0, 0, 6] }}>
                            <ambientLight intensity={0.8} />
                            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                            <pointLight position={[-10, -10, -10]} />
                            <SpinningMesh shape={visual_asset} color={highlight_var || "#fbbf24"} />
                        </Canvas>
                    </div>
                ) : type === 'FORMULA' ? (
                    <div style={{ fontSize: '2.5rem', background: 'rgba(255,255,255,0.1)', padding: '30px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                        <BlockMath math={formula_latex || ""} />
                    </div>
                ) : (
                    <IconRenderer name={visual_asset} color="white" size={180} />
                )}
            </div>

            {/* 2. TEXT LAYER */}
            <h1 style={titleStyle}>{text_overlay}</h1>

            {/* 3. TYPE BADGE */}
            <div style={{
                position: 'absolute', bottom: '40px', left: '40px',
                fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '2px', opacity: 0.6
            }}>
                {type}
            </div>
        </AbsoluteFill>
    );
};

export const VideoComposition = ({ scenes = [] }) => {
    // Default fallback if scenes is empty or undefined
    const validScenes = scenes && scenes.length > 0 ? scenes : [{ type: "INTRO", text_overlay: "Generative Video", background_color: "#000" }];

    // Ensure durationFrames exists, default to 90 (3s)
    let cumulativeFrame = 0;

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            {validScenes.map((scene, index) => {
                const duration = scene.durationFrames || 90;
                const from = cumulativeFrame;
                cumulativeFrame += duration;

                return (
                    <Sequence
                        key={index}
                        from={from}
                        durationInFrames={duration}
                    >
                        <Scene {...scene} />
                    </Sequence>
                );
            })}
        </AbsoluteFill>
    );
};
