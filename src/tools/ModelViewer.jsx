/* eslint-disable react/no-unknown-property */
import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    OrbitControls,
    PerspectiveCamera,
    Environment,
    ContactShadows,
    Float,
    Text,
    Billboard
} from "@react-three/drei";
import * as THREE from "three";

// --- PROCEDURAL COMPONENTS ---

const ProceduralDrill = ({ params }) => {
    const group = useRef();
    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y += (params?.rpm || 60) * 0.002;
            group.current.position.y =
                Math.sin(state.clock.elapsedTime * 15) * 0.02; // Vibration
        }
    });

    return (
        <group ref={group}>
            {/* Drill String */}
            <mesh position={[0, 2, 0]}>
                <cylinderGeometry args={[0.3, 0.3, 4, 32]} />
                <meshStandardMaterial color="#4a5568" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Connector */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[0.4, 0.4, 0.5, 32]} />
                <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* The Bit Head */}
            <group position={[0, -0.5, 0]}>
                <mesh>
                    <coneGeometry args={[0.5, 1, 32]} />
                    <meshStandardMaterial color="#ecc94b" metalness={0.6} roughness={0.3} />
                </mesh>
                {/* Teeth */}
                {Array.from({ length: 8 }).map((_, i) => (
                    <mesh
                        key={i}
                        position={[
                            Math.sin((i / 8) * Math.PI * 2) * 0.3,
                            -0.2,
                            Math.cos((i / 8) * Math.PI * 2) * 0.3,
                        ]}
                        rotation={[0.5, (i / 8) * Math.PI * 2, 0]}
                    >
                        <coneGeometry args={[0.08, 0.3, 8]} />
                        <meshStandardMaterial color="#1a202c" />
                    </mesh>
                ))}
            </group>
        </group>
    );
};

const ProceduralPump = () => {
    return (
        <group>
            <mesh position={[0, -1.5, 0]}>
                <boxGeometry args={[4, 0.2, 2]} />
                <meshStandardMaterial color="#2d3748" />
            </mesh>
            <group position={[-1, 0, 0]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.8, 0.8, 2.5, 32]} />
                    <meshStandardMaterial color="#3182ce" metalness={0.5} />
                </mesh>
                {Array.from({ length: 5 }).map((_, i) => (
                    <mesh key={i} position={[i * 0.4 - 0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.85, 0.85, 0.05, 32]} />
                        <meshStandardMaterial color="#2c5282" />
                    </mesh>
                ))}
            </group>
            <group position={[1, 0, 0]}>
                <mesh rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.8, 0.3, 16, 100, Math.PI * 1.5]} />
                    <meshStandardMaterial color="#a0aec0" metalness={0.8} />
                </mesh>
                <mesh position={[0.8, 1, 0]}>
                    <cylinderGeometry args={[0.3, 0.3, 1, 32]} />
                    <meshStandardMaterial color="#a0aec0" />
                </mesh>
            </group>
        </group>
    );
};

const ProceduralRock = ({ type }) => {
    const isSandstone = type && type.toLowerCase().includes("sand");
    const color = isSandstone ? "#d69e2e" : "#4a5568";
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh>
                <dodecahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial color={color} roughness={isSandstone ? 1 : 0.4} flatShading={true} />
            </mesh>
        </Float>
    );
};

// --- DYNAMIC MODEL COMPONENT (The "Lego" Protocol) ---
const DynamicShape = ({ shapeConfig }) => {
    const meshRef = useRef();
    const {
        shape,
        args,
        position,
        rotation,
        scale,
        color,
        material,
        animation,
        text
    } = shapeConfig;

    // Helper to sanitize array of numbers
    const safeVec3 = (vec, fallback) => {
        if (!Array.isArray(vec)) return fallback;
        return vec.map((v, i) => {
            const num = parseFloat(v);
            return isNaN(num) ? fallback[i] : num;
        });
    };

    const cleanPosition = safeVec3(position, [0, 0, 0]);
    const cleanRotation = safeVec3(rotation, [0, 0, 0]);
    const cleanScale = safeVec3(scale, [1, 1, 1]);

    // Animation Loop
    useFrame((state) => {
        if (!meshRef.current || !animation) return;
        const time = state.clock.elapsedTime;
        const speed = animation.speed || 1;

        if (animation.type === 'spin') {
            const axis = safeVec3(animation.axis, [0, 1, 0]);
            meshRef.current.rotation.x += axis[0] * 0.01 * speed;
            meshRef.current.rotation.y += axis[1] * 0.01 * speed;
            meshRef.current.rotation.z += axis[2] * 0.01 * speed;
        } else if (animation.type === 'float') {
            meshRef.current.position.y = cleanPosition[1] + Math.sin(time * speed) * 0.2;
        } else if (animation.type === 'pulse') {
            const scaleVal = 1 + Math.sin(time * speed * 2) * 0.1;
            meshRef.current.scale.set(scaleVal, scaleVal, scaleVal);
        }
    });

    // LABEL Handling
    if (shape === 'label') {
        return (
            <group position={position || [0, 0, 0]}>
                <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
                    <Text
                        fontSize={args?.[0] || 0.5}
                        color={color || 'white'}
                        anchorX="center"
                        anchorY="middle"
                        outlineWidth={0.05}
                        outlineColor="#000000"
                    >
                        {text || "Label"}
                    </Text>
                </Billboard>
            </group>
        );
    }

    // Geometry Handling
    const safeArgs = (args || []).map(val => {
        const num = parseFloat(val);
        return isNaN(num) ? 1 : num;
    });

    const getGeometry = () => {
        switch (shape) {
            case 'box': return <boxGeometry args={safeArgs.length ? safeArgs : [1, 1, 1]} />;
            case 'cylinder': return <cylinderGeometry args={safeArgs.length ? safeArgs : [1, 1, 1, 32]} />;
            case 'cone': return <coneGeometry args={safeArgs.length ? safeArgs : [1, 1, 32]} />;
            case 'sphere': return <sphereGeometry args={safeArgs.length ? safeArgs : [1, 32, 16]} />;
            case 'torus': return <torusGeometry args={safeArgs.length ? safeArgs : [1, 0.4, 16, 100]} />;
            case 'capsule': return <capsuleGeometry args={safeArgs.length ? safeArgs : [0.5, 1, 4, 8]} />;
            default: return <boxGeometry args={[1, 1, 1]} />;
        }
    };

    // Material Handling
    const getMaterial = () => {
        const matType = material?.type || 'standard';
        const baseColor = material?.color || color || "#888";

        switch (matType) {
            case 'glass':
                return <meshPhysicalMaterial
                    color={baseColor}
                    transmission={0.9}
                    opacity={material?.opacity || 0.5}
                    transparent
                    roughness={0.1}
                    thickness={1} // Refraction
                />;
            case 'metal':
                return <meshStandardMaterial
                    color={baseColor}
                    metalness={material?.metalness ?? 0.8}
                    roughness={material?.roughness ?? 0.2}
                />;
            case 'glow':
                return <meshStandardMaterial
                    color={baseColor}
                    emissive={material?.emissive || baseColor}
                    emissiveIntensity={material?.emissiveIntensity || 2}
                    toneMapped={false}
                />;
            case 'plastic':
                return <meshStandardMaterial
                    color={baseColor}
                    roughness={0.1}
                    metalness={0.0}
                />;
            default: // Standard
                return <meshStandardMaterial
                    color={baseColor}
                    roughness={0.5}
                    metalness={0.5}
                />;
        }
    };

    return (
        <mesh
            ref={meshRef}
            position={cleanPosition}
            rotation={cleanRotation}
            scale={cleanScale}
        >
            {getGeometry()}
            {getMaterial()}
        </mesh>
    );
};

const DynamicModel = ({ shapes }) => {
    const group = useRef();

    // Slow global rotation for the whole model presentation
    useFrame(() => {
        if (group.current) group.current.rotation.y += 0.002;
    });

    return (
        <group ref={group}>
            {shapes.map((s, i) => (
                <DynamicShape key={i} shapeConfig={s} />
            ))}
        </group>
    )
};

const ExternalModel = ({ url }) => {
    return (
        <Float>
            <group>
                <mesh>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#F472B6" />
                </mesh>
            </group>
        </Float>
    )
};

// --- HIGH FIDELITY PRESETS ---
const ProceduralAtom = () => {
    return (
        <group>
            {/* Nucleus */}
            <Float floatIntensity={2} speed={3}>
                <mesh>
                    <sphereGeometry args={[0.8, 32, 32]} />
                    <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.5} />
                </mesh>
                <mesh position={[0.5, 0.5, 0]}>
                    <sphereGeometry args={[0.6, 32, 32]} />
                    <meshStandardMaterial color="#3b82f6" emissive="#1e3a8a" emissiveIntensity={0.5} />
                </mesh>
            </Float>
            {/* Electrons */}
            {[0, 1, 2].map((i) => (
                <group key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
                    <mesh>
                        <torusGeometry args={[3 + i * 0.5, 0.05, 16, 100]} />
                        <meshStandardMaterial color="#cbd5e1" opacity={0.3} transparent />
                    </mesh>
                    <mesh position={[3 + i * 0.5, 0, 0]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshStandardMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={2} toneMapped={false} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

const ProceduralDNA = () => {
    const count = 20;
    return (
        <group position={[0, -4, 0]}>
            {Array.from({ length: count }).map((_, i) => {
                const y = i * 0.4;
                const rotation = i * 0.5;
                return (
                    <group key={i} position={[0, y, 0]} rotation={[0, rotation, 0]}>
                        {/* Backbone 1 */}
                        <mesh position={[1, 0, 0]}>
                            <sphereGeometry args={[0.15, 16, 16]} />
                            <meshStandardMaterial color="#e11d48" />
                        </mesh>
                        {/* Backbone 2 */}
                        <mesh position={[-1, 0, 0]}>
                            <sphereGeometry args={[0.15, 16, 16]} />
                            <meshStandardMaterial color="#3b82f6" />
                        </mesh>
                        {/* Rungs */}
                        <mesh rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
                            <meshStandardMaterial color="#fff" />
                        </mesh>
                    </group>
                );
            })}
        </group>
    );
};

const ProceduralEngine = () => {
    const pistonRef = useRef();
    useFrame((state) => {
        if (pistonRef.current) {
            pistonRef.current.position.y = Math.sin(state.clock.elapsedTime * 10) * 0.5;
        }
    });
    return (
        <group>
            {/* Block */}
            <mesh position={[0, -0.5, 0]}>
                <boxGeometry args={[2, 2.5, 2]} />
                <meshPhysicalMaterial color="#64748b" metalness={0.9} roughness={0.2} clearcoat={1} />
            </mesh>
            {/* Cylinder Hole Visual (Top) */}
            <mesh position={[0, 0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.8, 32]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            {/* Piston */}
            <group ref={pistonRef} position={[0, 0, 0]}>
                <mesh position={[0, 1.2, 0]}>
                    <cylinderGeometry args={[0.75, 0.75, 1, 32]} />
                    <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.2} />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[0.1, 0.1, 2, 16]} />
                    <meshStandardMaterial color="#94a3b8" />
                </mesh>
            </group>
        </group>
    );
};

const ProceduralSolarSystem = () => {
    const planets = [
        { r: 0.4, dist: 2, speed: 2, color: "#9ca3af" }, // Mercury
        { r: 0.6, dist: 3, speed: 1.5, color: "#fbbf24" }, // Venus
        { r: 0.7, dist: 4.5, speed: 1, color: "#3b82f6" }, // Earth
        { r: 0.5, dist: 6, speed: 0.8, color: "#ef4444" }, // Mars
        { r: 1.2, dist: 8.5, speed: 0.4, color: "#d97706" }, // Jupiter
    ];

    return (
        <group>
            {/* Sun */}
            <mesh>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshStandardMaterial color="#fcd34d" emissive="#f59e0b" emissiveIntensity={2} toneMapped={false} />
            </mesh>
            <pointLight intensity={2} color="#fcd34d" distance={20} decay={2} />

            {planets.map((p, i) => (
                <Planet key={i} {...p} />
            ))}
        </group>
    );
};

const Planet = ({ r, dist, speed, color }) => {
    const ref = useRef();
    useFrame((state) => {
        if (ref.current) {
            const t = state.clock.elapsedTime * speed * 0.5;
            ref.current.position.x = Math.cos(t) * dist;
            ref.current.position.z = Math.sin(t) * dist;
        }
    });
    return (
        <mesh ref={ref}>
            <sphereGeometry args={[r, 32, 32]} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
};


const EngineeringScene = ({ type, data }) => {
    // Determine Preset
    const preset = data?.preset || (typeof data === 'string' ? data : null);

    return (
        <group>
            {/* Studio Lighting Rig */}
            <hemisphereLight intensity={0.6} groundColor="#1a202c" color="#ffffff" />

            {/* Main Key Light */}
            <directionalLight position={[10, 10, 10]} intensity={2} castShadow >
                <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10]} />
            </directionalLight>

            {/* Fill Light (Softens shadows) */}
            <directionalLight position={[-10, 0, 10]} intensity={1} color="#bfdbfe" />

            {/* Rim Light (Separates object from background) */}
            <spotLight position={[0, 10, -10]} intensity={2} angle={0.5} penumbra={1} color="#a855f7" />

            {/* Legacy Lights (Keep for fallback but adjust) */}
            <ambientLight intensity={0.4} />

            <group position={[0, 0, 0]}>
                {/* PRESETS */}
                {preset === 'ATOM' && <ProceduralAtom />}
                {preset === 'DNA' && <ProceduralDNA />}
                {preset === 'ENGINE' && <ProceduralEngine />}
                {preset === 'SOLAR_SYSTEM' && <ProceduralSolarSystem />}

                {/* DYNAMIC SHAPES (Fallback to LEGO mode) */}
                {!preset && data?.shapes && <DynamicModel shapes={data.shapes} />}

                {/* MODE B: EXTERNAL URL */}
                {data?.url && <ExternalModel url={data.url} />}

                {/* LEGACY FALLBACKS */}
                {!preset && !data?.shapes && type === 'DRILL' && <ProceduralDrill params={data} />}
                {!preset && !data?.shapes && type === 'PUMP' && <ProceduralPump />}
                {!preset && !data?.shapes && (type === 'ROCK' || !type) && <ProceduralRock type={data?.topic || 'rock'} />}
            </group>

            <ContactShadows position={[0, -2.5, 0]} opacity={0.6} scale={20} blur={2} far={4} />
        </group>
    );
};

const ModelViewer = ({ type, data, title }) => {
    return (
        <div className="model-viewer-container" style={{
            width: '100%',
            height: '400px',
            borderRadius: '16px',
            overflow: 'hidden',
            background: 'linear-gradient(to bottom right, #111827, #1f2937)',
            position: 'relative',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            {/* Header Badge */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
            }}>
                <div style={{
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e5e7eb',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }}></div>
                    {title || "3D Interactive Model"}
                </div>
                <div style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    color: '#93c5fd',
                    fontSize: '0.7rem',
                    fontFamily: 'monospace',
                    width: 'fit-content'
                }}>
                    MODE: PROCEDURAL_ENGINE
                </div>
            </div>

            <Canvas shadows dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[4, 4, 6]} fov={45} />
                <OrbitControls minDistance={2} maxDistance={15} autoRotate autoRotateSpeed={0.5} />
                <EngineeringScene type={type} data={data} />
            </Canvas>
        </div>
    );
};

export default ModelViewer;
