
import React, { useRef, useMemo, useEffect } from "react";
import ForceGraph3D from "react-force-graph-3d";
import * as THREE from "three";

// --- Mock Data: A "Universe" of Knowledge ---
// In a real app, this would come from your backend parsing logic.
const generateData = () => {
    const nodes = [
        // Math Cluster
        { id: "Math", group: 1, val: 20 },
        { id: "Calculus", group: 1, val: 10 },
        { id: "Algebra", group: 1, val: 10 },
        { id: "Geometry", group: 1, val: 10 },
        { id: "Quadratic Functions", group: 1, val: 5 },
        { id: "Derivatives", group: 1, val: 5 },
        { id: "Integrals", group: 1, val: 5 },

        // Physics Cluster (Connected to Math)
        { id: "Physics", group: 2, val: 20 },
        { id: "Mechanics", group: 2, val: 10 },
        { id: "Thermodynamics", group: 2, val: 10 },
        { id: "Quantum", group: 2, val: 15 },
        { id: "Gravity", group: 2, val: 8 },
        { id: "Motion", group: 2, val: 8 },

        // History Cluster
        { id: "History", group: 3, val: 20 },
        { id: "Ancient Rome", group: 3, val: 10 },
        { id: "Renaissance", group: 3, val: 10 },
        { id: "World War II", group: 3, val: 10 },

        // Cross-Disciplinary Connections
        { id: "Philosophy", group: 4, val: 12 },
        { id: "Logic", group: 4, val: 8 }
    ];

    const links = [
        // Math Internal
        { source: "Math", target: "Calculus" },
        { source: "Math", target: "Algebra" },
        { source: "Math", target: "Geometry" },
        { source: "Algebra", target: "Quadratic Functions" },
        { source: "Calculus", target: "Derivatives" },
        { source: "Calculus", target: "Integrals" },

        // Physics Internal
        { source: "Physics", target: "Mechanics" },
        { source: "Physics", target: "Thermodynamics" },
        { source: "Physics", target: "Quantum" },
        { source: "Mechanics", target: "Gravity" },
        { source: "Mechanics", target: "Motion" },

        // History Internal
        { source: "History", target: "Ancient Rome" },
        { source: "History", target: "Renaissance" },
        { source: "History", target: "World War II" },

        // The "Brain" Connections (Cross-Disciplinary)
        { source: "Calculus", target: "Physics" }, // Calculus invented for Physics
        { source: "Geometry", target: "Ancient Rome" }, // Engineering
        { source: "Philosophy", target: "Math" }, // Logic roots
        { source: "Philosophy", target: "History" },
        { source: "Logic", target: "Algebra" },
        { source: "Quantum", target: "Derivatives" }
    ];

    return { nodes, links };
};

const ConceptGraph = ({ width, height }) => {
    const fgRef = useRef();
    const data = useMemo(() => generateData(), []);

    // Auto-rotate camera
    useEffect(() => {
        let hover = false;
        const distance = 400; // Orbit distance
        let angle = 0;

        const interval = setInterval(() => {
            if (fgRef.current) {
                // Simple horizontal orbit
                angle += 0.003;
                fgRef.current.cameraPosition({
                    x: distance * Math.sin(angle),
                    z: distance * Math.cos(angle)
                });
            }
        }, 10);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            width: '100%',
            height: '500px',
            background: '#000010', // Deep space black
            borderRadius: '12px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.8)'
        }}>
            <div style={{
                position: 'absolute',
                top: 20,
                left: 20,
                color: 'rgba(255,255,255,0.7)',
                zIndex: 10,
                pointerEvents: 'none'
            }}>
                <h3 style={{ margin: 0, fontWeight: 300, letterSpacing: '2px' }}>NEURAL KNOWLEDGE GRAPH</h3>
                <p style={{ margin: '5px 0', fontSize: '0.8rem', opacity: 0.6 }}>interactive_mode: active</p>
            </div>

            <ForceGraph3D
                ref={fgRef}
                graphData={data}
                width={width}
                height={500}
                backgroundColor="#000010"

                // Nodes
                nodeLabel="id"
                nodeVal="val"
                nodeResolution={16}
                nodeColor={node => {
                    const colors = ["#ffffff", "#6366f1", "#10b981", "#f43f5e", "#f59e0b"];
                    return colors[node.group] || "#ffffff";
                }}

                // Node "Glow" Effect using Sprites
                nodeThreeObject={node => {
                    // Create a glowing orb
                    const colors = ["#ffffff", "#6366f1", "#10b981", "#f43f5e", "#f59e0b"];
                    const color = colors[node.group] || "#ffffff";

                    // Sphere geometry for core
                    const geometry = new THREE.SphereGeometry(node.val / 2, 16, 16);
                    const material = new THREE.MeshLambertMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.9,
                        emissive: color,
                        emissiveIntensity: 0.6
                    });
                    const sphere = new THREE.Mesh(geometry, material);

                    return sphere;
                }}

                // Links
                linkColor={() => "rgba(255,255,255,0.2)"}
                linkWidth={1}
                linkDirectionalParticles={2} // Particles moving along links
                linkDirectionalParticleWidth={2}
                linkDirectionalParticleSpeed={0.005} // Slow flow

                // Interaction
                onNodeClick={node => {
                    // Aim at node from outside it
                    const distance = 40;
                    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

                    fgRef.current.cameraPosition(
                        { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio }, // new position
                        node, // lookAt ({ x, y, z })
                        3000  // ms transition duration
                    );
                }}
            />
        </div>
    );
};

export default ConceptGraph;
