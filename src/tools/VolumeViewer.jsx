import React, { useRef, useEffect, useState } from 'react';
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';

const VolumeViewer = ({ title = "Reservoir Saturation" }) => {
    const vtkContainerRef = useRef(null);
    const context = useRef(null);
    const [loading, setLoading] = useState(true);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [error, setError] = useState(null);

    // 🔧 MOBILE DETECTION EFFECT
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🔧 VTK INITIALIZATION WITH MOBILE SUPPORT
    useEffect(() => {
        if (!vtkContainerRef.current) return;
        if (isMobile) {
            setLoading(false);
            return; // Skip 3D rendering on mobile
        }

        try {
            // Initialize VTK Render Window
            const genericRenderWindow = vtkGenericRenderWindow.newInstance({
                background: [0.95, 0.95, 0.95],
            });
            genericRenderWindow.setContainer(vtkContainerRef.current);

            // 🔧 Handle container sizing for responsive layout
            const container = vtkContainerRef.current;
            const width = container.clientWidth || window.innerWidth - 40;
            const height = Math.min(400, window.innerHeight * 0.6); // Responsive height
            container.style.width = `${width}px`;
            container.style.height = `${height}px`;

            genericRenderWindow.resize();

            const renderer = genericRenderWindow.getRenderer();
            const renderWindow = genericRenderWindow.getRenderWindow();

            // 1. Create Procedural Volumetric Data
            const dim = 50;
            const imageData = vtkImageData.newInstance();
            imageData.setDimensions(dim, dim, dim);
            imageData.setSpacing(1.0, 1.0, 1.0);
            imageData.setOrigin(0, 0, 0);

            const values = new Float32Array(dim * dim * dim);
            let i = 0;
            for (let z = 0; z < dim; z++) {
                for (let y = 0; y < dim; y++) {
                    for (let x = 0; x < dim; x++) {
                        const layer = Math.sin(x * 0.1) + Math.cos(z * 0.15) * 2;
                        const noise = Math.random() * 0.5;
                        const saturation = (y * 0.2 + layer + noise) / (dim * 0.3);
                        values[i] = Math.max(0, Math.min(1, saturation));
                        i++;
                    }
                }
            }

            const dataArray = vtkDataArray.newInstance({
                name: 'Saturation',
                values: values,
            });
            imageData.getPointData().setScalars(dataArray);

            // 2. Setup Volume Rendering Pipeline
            const actor = vtkVolume.newInstance();
            const mapper = vtkVolumeMapper.newInstance();
            mapper.setInputData(imageData);
            actor.setMapper(mapper);

            // 3. Define Appearance
            const ctf = vtkColorTransferFunction.newInstance();
            ctf.addRGBPoint(0.0, 0.0, 0.0, 1.0); // Blue
            ctf.addRGBPoint(0.5, 0.0, 1.0, 0.0); // Green
            ctf.addRGBPoint(1.0, 1.0, 0.0, 0.0); // Red

            const of = vtkPiecewiseFunction.newInstance();
            of.addPoint(0.0, 0.0);
            of.addPoint(0.2, 0.1);
            of.addPoint(0.8, 0.8);
            of.addPoint(1.0, 0.9);

            actor.getProperty().setRGBTransferFunction(0, ctf);
            actor.getProperty().setScalarOpacity(0, of);
            actor.getProperty().setInterpolationTypeToLinear();

            renderer.addVolume(actor);
            renderer.resetCamera();
            renderer.getActiveCamera().azimuth(30);
            renderer.getActiveCamera().elevation(20);

            renderWindow.render();
            setLoading(false);

            // Save context
            context.current = { genericRenderWindow, actor, mapper, ctf, of };

            // 🔧 IMPROVED RESIZE HANDLER
            let resizeTimeout;
            const handleResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (vtkContainerRef.current && context.current?.genericRenderWindow) {
                        try {
                            context.current.genericRenderWindow.resize();
                            renderWindow.render();
                        } catch (e) {
                            console.warn("VTK resize failed:", e);
                        }
                    }
                }, 300);
            };

            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
                clearTimeout(resizeTimeout);
                if (context.current) {
                    try {
                        context.current.genericRenderWindow.delete();
                        context.current.actor.delete();
                        context.current.mapper.delete();
                        context.current.ctf.delete();
                        context.current.of.delete();
                    } catch (e) {
                        console.warn("VTK cleanup error:", e);
                    }
                }
            };

        } catch (err) {
            console.error("VolumeViewer initialization failed:", err);
            setError(err.message || "Failed to initialize 3D viewer");
            setLoading(false);
        }

    }, [isMobile]);

    // 🔧 MOBILE FALLBACK UI
    if (isMobile) {
        return (
            <div className="tool-container volume-viewer" style={{
                margin: '20px 0',
                padding: '20px',
                background: '#fff5e6',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: '2px solid #fbbf24'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                }}>
                    <h4 style={{ margin: 0, color: '#333', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-layer-group" style={{ marginRight: '10px', color: '#f59e0b' }}></i>
                        {title}
                    </h4>
                </div>

                <div style={{
                    padding: '20px',
                    background: '#fff9f0',
                    borderRadius: '12px',
                    textAlign: 'center',
                    color: '#92400e'
                }}>
                    <i className="fas fa-desktop" style={{ fontSize: '2.5rem', marginBottom: '15px', display: 'block' }}></i>

                    <p style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '10px' }}>
                        📱 This 3D visualization works best on desktop
                    </p>

                    <p style={{ fontSize: '0.95rem', color: '#b45309', marginBottom: '15px' }}>
                        The interactive 3D volume viewer requires a larger screen and more processing power.
                        For the best experience, view this lesson on a desktop or tablet.
                    </p>

                    <div style={{
                        background: '#fef3c7',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        marginBottom: '15px'
                    }}>
                        <strong>📚 What you're seeing:</strong><br />
                        A 3D volumetric model showing reservoir saturation (blue = water, red = oil)
                    </div>

                    <details style={{
                        cursor: 'pointer',
                        marginTop: '10px',
                        padding: '10px',
                        background: '#fef9f3',
                        borderRadius: '8px',
                        fontSize: '0.9rem'
                    }}>
                        <summary style={{ fontWeight: 'bold', marginBottom: '10px' }}>
                            💡 What would you see on desktop?
                        </summary>
                        <ul style={{ textAlign: 'left', paddingLeft: '20px', color: '#92400e' }}>
                            <li>Drag to rotate the 3D volume</li>
                            <li>Scroll to zoom in/out</li>
                            <li>Interactive color mapping showing saturation levels</li>
                            <li>Real-time rendering of internal structure</li>
                        </ul>
                    </details>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '10px', textAlign: 'center' }}>
                    💻 Try this on a desktop or tablet for the full experience
                </p>
            </div>
        );
    }

    // 🔧 ERROR STATE
    if (error) {
        return (
            <div className="tool-container volume-viewer" style={{
                margin: '20px 0',
                padding: '20px',
                background: '#fee2e2',
                borderRadius: '16px',
                border: '2px solid #ef4444'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem', color: '#ef4444' }}></i>
                    <div>
                        <h4 style={{ margin: 0, color: '#7f1d1d' }}>3D Viewer Error</h4>
                        <p style={{ color: '#9f1239', fontSize: '0.95rem', margin: '5px 0 0 0' }}>
                            {error}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // DESKTOP RENDERING
    return (
        <div className="tool-container volume-viewer" style={{
            margin: '20px 0',
            padding: '20px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '15px',
            }}>
                <h4 style={{ margin: 0, color: '#333', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-layer-group" style={{ marginRight: '10px', color: '#0ea5e9' }}></i>
                    {title}
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#e0f2fe', borderRadius: '6px', color: '#0284c7' }}>
                        Volumetric View
                    </span>
                </div>
            </div>

            <div
                ref={vtkContainerRef}
                style={{
                    width: '100%',
                    minHeight: '400px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#f5f5f5',
                    position: 'relative'
                }}
            >
                {loading && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#999' }}>
                        Loading 3D Engine...
                    </div>
                )}
            </div>

            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '10px', textAlign: 'center' }}>
                🖱️ Desktop: Drag to rotate • Scroll to zoom
            </p>
        </div>
    );
};

export default VolumeViewer;
