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

    useEffect(() => {
        if (!vtkContainerRef.current) return;

        // Initialize VTK Render Window
        const genericRenderWindow = vtkGenericRenderWindow.newInstance({
            background: [0.95, 0.95, 0.95],
        });
        genericRenderWindow.setContainer(vtkContainerRef.current);
        genericRenderWindow.resize();

        const renderer = genericRenderWindow.getRenderer();
        const renderWindow = genericRenderWindow.getRenderWindow();

        // 1. Create Procedural Volumetric Data (The "Rock" Block)
        // Dimensions: 50x50x50 voxels
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
                    // Create graphical "strata" layers and noise
                    const layer = Math.sin(x * 0.1) + Math.cos(z * 0.15) * 2;
                    const noise = Math.random() * 0.5;
                    const saturation = (y * 0.2 + layer + noise) / (dim * 0.3);
                    values[i] = Math.max(0, Math.min(1, saturation)); // 0..1 scale
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

        // 3. Define Appearance (Color & Opacity)
        // Color Transfer: Blue (Water) -> Red (Oil)
        const ctf = vtkColorTransferFunction.newInstance();
        ctf.addRGBPoint(0.0, 0.0, 0.0, 1.0); // Blue (Water)
        ctf.addRGBPoint(0.5, 0.0, 1.0, 0.0); // Green/Mix
        ctf.addRGBPoint(1.0, 1.0, 0.0, 0.0); // Red (Oil)

        // Opacity: Transparent low values, Opaque high values
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

        // Initial Spin
        renderer.getActiveCamera().azimuth(30);
        renderer.getActiveCamera().elevation(20);

        renderWindow.render();
        setLoading(false);

        // Save context for cleanup
        context.current = { genericRenderWindow, actor, mapper, ctf, of };

        // Handle resize
        const handleResize = () => genericRenderWindow.resize();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (context.current) {
                // vtk.js cleanup is manual
                genericRenderWindow.delete();
                actor.delete();
                mapper.delete();
                ctf.delete();
                of.delete();
            }
        };
    }, []);

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
                    height: '400px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#f5f5f5',
                    position: 'relative'
                }}
            >
                {loading && (
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#999' }}>
                        Loading X-Ray Engine...
                    </div>
                )}
            </div>

            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '10px', textAlign: 'center' }}>
                Interactive 3D Volume. Drag to rotate. Visualizing internal structure.
            </p>
        </div>
    );
};

export default VolumeViewer;
