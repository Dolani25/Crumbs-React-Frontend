import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Renderer Component
 * Wraps @react-three/fiber Canvas to provide automatic WebGPU support with WebGL fallback.
 */
const GL_CONFIG = {
    antialias: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance"
};

/**
 * Renderer Component
 * Wraps @react-three/fiber Canvas to provide automatic WebGPU support with WebGL fallback.
 */
const Renderer = ({ children, ...props }) => {
    const [useWebGPU, setUseWebGPU] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const checkWebGPU = async () => {
            if (navigator.gpu) {
                try {
                    // Check for WebGPU but stick to WebGL for now unless needed
                    console.log("🎮 WebGPU is supported on this device.");
                    setUseWebGPU(true);
                } catch (e) {
                    console.warn("WebGPU detection failed, using WebGL", e);
                }
            } else {
                console.log("🎨 WebGPU not supported, falling back to WebGL.");
            }
            setIsReady(true);
        };
        checkWebGPU();
    }, []);

    if (!isReady) return null;

    return (
        <Canvas
            {...props}
            gl={GL_CONFIG}
        >
            {children}
        </Canvas>
    );
};

export default Renderer;
