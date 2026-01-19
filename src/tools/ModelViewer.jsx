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

// ... (existing imports)

// ... inside DynamicShape ...
// LABEL Handling
// ... inside DynamicShape ...
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

const EngineeringScene = ({ type, data }) => {
    return (
        <group>
            <ambientLight intensity={0.8} />
            <hemisphereLight intensity={0.5} groundColor="#444" />
            <directionalLight position={[10, 10, 5]} intensity={2} castShadow />
            <pointLight position={[-10, -10, -10]} color="blue" intensity={1} />

            <group position={[0, 0, 0]}>
                {/* MODE A: DYNMAIC LEGO */}
                {data?.shapes && <DynamicModel shapes={data.shapes} />}

                {/* MODE B: EXTERNAL URL */}
                {data?.url && <ExternalModel url={data.url} />}

                {/* MODE C: LEGACY FALLBACKS */}
                {!data?.shapes && !data?.url && type === 'DRILL' && <ProceduralDrill params={data} />}
                {!data?.shapes && !data?.url && type === 'PUMP' && <ProceduralPump />}
                {!data?.shapes && !data?.url && (type === 'ROCK' || !type) && <ProceduralRock type={data?.topic || 'rock'} />}
            </group>
            <ContactShadows position={[0, -2, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
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
