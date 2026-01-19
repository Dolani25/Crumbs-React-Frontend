import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RigidBody, CylinderCollider, CuboidCollider } from '@react-three/rapier';
import { OrbitControls, Stars, Text } from '@react-three/drei';
import * as THREE from 'three';

// --- Particle Component for Convection ---
const ThermalParticle = ({ position, color: initialColor }) => {
    const api = useRef();
    const mesh = useRef();
    // Start mostly cold
    const [isHot, setIsHot] = useState(false);

    useFrame((state, delta) => {
        if (!api.current || !mesh.current) return;

        const pos = api.current.translation();

        // Heat Source at Bottom (y < -1)
        if (pos.y < -1.5 && !isHot) {
            setIsHot(true);
            api.current.applyImpulse({ x: (Math.random() - 0.5) * 0.01, y: 0.05, z: (Math.random() - 0.5) * 0.01 }, true);
        }

        // Cooling Zone at Top (y > 3)
        if (pos.y > 3 && isHot) {
            setIsHot(false);
        }

        // Apply Buoyancy if Hot
        if (isHot) {
            // Upward force counteracting gravity + extra lift
            api.current.applyImpulse({ x: 0, y: 0.02 * delta * 60, z: 0 }, true);
            mesh.current.material.color.lerp(new THREE.Color("#ef4444"), 0.1); // Turn Red
        } else {
            // Gravity takes over
            mesh.current.material.color.lerp(new THREE.Color("#3b82f6"), 0.1); // Turn Blue
        }
    });

    return (
        <RigidBody ref={api} position={position} colliders="ball" restitution={0.2} friction={0.1} linearDamping={0.5}>
            <mesh ref={mesh}>
                <sphereGeometry args={[0.25, 16, 16]} />
                <meshStandardMaterial color={initialColor} />
            </mesh>
        </RigidBody>
    );
};

// --- SCENE 1: Convection Lab ---
const ConvectionScene = () => {
    // Generate 50 particles
    const particles = useMemo(() => {
        const p = [];
        for (let i = 0; i < 60; i++) {
            p.push({
                id: i,
                position: [(Math.random() - 0.5) * 3, Math.random() * 5, (Math.random() - 0.5) * 3],
                color: "#3b82f6" // Start Blue
            });
        }
        return p;
    }, []);

    return (
        <>
            <Physics gravity={[0, -9.81, 0]}>
                {/* The "Pot" (Glass Container) */}
                <RigidBody type="fixed" colliders="trimesh">
                    {/* Bottom */}
                    <CylinderCollider args={[0.2, 2.5]} position={[0, -2, 0]} rotation={[0, 0, 0]} />
                    {/* Walls implies by physics constraint or visible mesh? 
                         Let's just use invisible colliders to keep them in a "jar" */}
                    <CuboidCollider args={[3, 5, 0.2]} position={[0, 2.5, 2.6]} /> {/* Back */}
                    <CuboidCollider args={[3, 5, 0.2]} position={[0, 2.5, -2.6]} /> {/* Front */}
                    <CuboidCollider args={[0.2, 5, 3]} position={[2.6, 2.5, 0]} /> {/* Right */}
                    <CuboidCollider args={[0.2, 5, 3]} position={[-2.6, 2.5, 0]} /> {/* Left */}

                    {/* Visible Glass Jar */}
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[2.5, 2.5, 6, 32, 1, true]} />
                        <meshPhysicalMaterial
                            roughness={0.1} transmission={0.9} thickness={0.5} color="white" transparent opacity={0.3} side={THREE.DoubleSide}
                        />
                    </mesh>
                </RigidBody>

                {/* Heat Source Visual */}
                <mesh position={[0, -2.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[5, 5]} />
                    <meshBasicMaterial color="#ef4444" />
                </mesh>
                <Text position={[0, -2.5, 2]} fontSize={0.5} color="#ef4444">HEAT SOURCE</Text>

                {/* Particles */}
                {particles.map(p => <ThermalParticle key={p.id} {...p} />)}
            </Physics>
        </>
    );
};

// --- SCENE 2: Generic Sandbox (Default) ---
const SandboxScene = () => {
    const [boxes, setBoxes] = useState([]);

    const spawnBox = () => {
        setBoxes([...boxes, {
            id: Date.now(),
            position: [Math.random() * 2 - 1, 5, Math.random() * 2 - 1],
            color: `hsl(${Math.random() * 360}, 70%, 50%)`
        }]);
    };

    return (
        <Physics gravity={[0, -9.81, 0]}>
            <RigidBody type="fixed" position={[0, -2, 0]} friction={2}>
                <mesh>
                    <boxGeometry args={[20, 0.5, 20]} />
                    <meshStandardMaterial color="#334155" />
                </mesh>
            </RigidBody>
            <RigidBody position={[-2, 5, 0]} colliders="cuboid"><mesh><boxGeometry /><meshStandardMaterial color="orange" /></mesh></RigidBody>
            {boxes.map(box => (
                <RigidBody key={box.id} position={box.position} colliders="cuboid">
                    <mesh><boxGeometry /><meshStandardMaterial color={box.color} /></mesh>
                </RigidBody>
            ))}
            <mesh position={[0, 0, 0]} visible={false} onClick={spawnBox}>
                <planeGeometry args={[100, 100]} />
            </mesh>
        </Physics>
    );
};

const PhysicsSandbox = ({ data }) => {
    const mode = data?.mode || 'sandbox';

    return (
        <div style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', position: 'relative', background: '#0f172a' }}>
            <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
                <OrbitControls />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Stars />

                {mode === 'convection-lab' ? <ConvectionScene /> : <SandboxScene />}

            </Canvas>

            <div style={{ position: 'absolute', top: 20, left: 20, pointerEvents: 'none', color: 'white' }}>
                <h3 style={{ margin: 0 }}>RAPIER PHYSICS ENGINE</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                    Mode: {mode === 'convection-lab' ? 'Thermal Convection' : 'Sandbox (Gravity)'}
                </p>
            </div>

            {mode === 'convection-lab' && (
                <div style={{ position: 'absolute', bottom: 20, width: '100%', textAlign: 'center', pointerEvents: 'none', color: '#94a3b8' }}>
                    <p>Red particles are hot & buoyant. Blue particles are cool & dense.</p>
                </div>
            )}
        </div>
    );
};

export default PhysicsSandbox;
