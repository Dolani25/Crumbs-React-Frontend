import React from 'react';

const MoleculeViewer = ({ compound = "water" }) => {
    // Normalize input
    const query = compound.toLowerCase();

    // Map common names to what the HTML viewer supports
    // The HTML viewer supports: water, methane, ethanol, co2, caffeine, glucose, aspirin, gold, salt, TCDD
    // We can just pass the query directly as the HTML viewer handles fallbacks or just won't render if invalid.

    // Construct local URL with query param
    const url = `/3DmoleculeViewer.html?molecule=${encodeURIComponent(query)}`;

    return (
        <div className="tool-container molecule-viewer" style={{
            margin: '20px 0',
            padding: '10px',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #eee'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                paddingBottom: '10px',
                borderBottom: '1px solid #eee'
            }}>
                <h4 style={{ margin: 0, color: '#FE4F30' }}>
                    <i className="fas fa-atom" style={{ marginRight: '8px' }}></i>
                    Molecule Visualizer: {compound.charAt(0).toUpperCase() + compound.slice(1)}
                </h4>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>Interactive 3D</span>
            </div>

            <div style={{ position: 'relative', height: '400px', width: '100%' }}>
                <iframe
                    title={`Molecule: ${compound}`}
                    src={url}
                    width="100%"
                    height="100%"
                    style={{ border: 'none', borderRadius: '8px' }}
                    loading="lazy"
                ></iframe>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px', textAlign: 'center' }}>
                Interact: Click and drag to rotate. Scroll to zoom.
            </p>
        </div>
    );
};

export default MoleculeViewer;
