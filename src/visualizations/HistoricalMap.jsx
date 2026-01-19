
import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
// Note: In a real app we'd fix the default icon issue with Leaflet in React
import L from 'leaflet';

// --- Demo Data: Rome Expansion ---
const romeData = {
    "-753": { // Founding
        color: '#f43f5e',
        borders: [
            [[41.89, 12.48], [41.90, 12.50], [41.88, 12.51], [41.89, 12.48]] // Tiny Rome
        ],
        description: "The Founding of Rome (Legendary)"
    },
    "-264": { // Roman Republic
        color: '#e11d48',
        borders: [
            [[43.0, 10.0], [44.0, 12.0], [41.0, 16.0], [39.0, 17.0], [38.0, 15.0], [41.0, 12.0]] // Italy Boot (Approx)
        ],
        description: "Roman Republic controls Italy"
    },
    "117": { // Peak Empire
        color: '#be123c',
        borders: [
            [[54.0, -4.0], [52.0, 5.0], [45.0, 25.0], [36.0, 36.0], [31.0, 35.0], [30.0, 6.0], [36.0, -6.0], [45.0, -1.0]]
        ],
        description: "Height of the Roman Empire (Trajan)"
    }
};

// --- Demo Data: Oil & Gas Regions ---
const oilGasData = {
    "1900": {
        color: '#f59e0b',
        borders: [
            [[30, -98], [32, -94], [28, -94], [28, -98]] // Texas / Spindletop area
        ],
        description: "Early Boom: Spindletop & Pennsylvania"
    },
    "1970": {
        color: '#10b981',
        borders: [
            [[30, -98], [32, -94], [28, -94], [28, -98]], // USA
            [[15, 45], [30, 45], [30, 55], [15, 55]] // Middle East (Rough Box)
        ],
        description: "OPEC Era & North Sea Discovery"
    },
    "2023": {
        color: '#3b82f6',
        borders: [
            [[15, 45], [30, 45], [30, 55], [15, 55]], // Middle East
            [[50, -120], [60, -110], [55, -110], [50, -120]], // Canada Oil Sands
            [[-23, -45], [-20, -40], [-25, -40], [-25, -45]] // Brazil Pre-salt
        ],
        description: "Global Diversified Supply & Shale Revolution"
    }
};

const HistoricalMap = ({ data }) => {
    // Determine data source
    let sourceData = romeData; // Default

    if (data) {
        if (typeof data === 'string') {
            // Legacy/Demo Mode: Keyword matching
            if (/oil|gas|energy|petroleum/i.test(data)) {
                sourceData = oilGasData;
            }
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
            // Dynamic Mode: Real AI generated data
            // Verify it has at least one valid year entry
            if (Object.keys(data).length > 0) {
                sourceData = data;
            }
        }
    }

    const years = Object.keys(sourceData).map(Number).sort((a, b) => a - b);
    const initialYear = years[0];

    // Safety check: if somehow we have no years (empty default?), fallback safety
    if (years.length === 0) return <div style={{ padding: '20px', color: 'white' }}>Map data unavailable</div>;

    // State
    const [currentYear, setCurrentYear] = useState(initialYear);
    const [mapData, setMapData] = useState(sourceData[String(initialYear)] || sourceData[Object.keys(sourceData)[0]]);

    // Calculate dynamic center if possible
    const getInitialCenter = () => {
        try {
            if (!mapData) return [41.90, 12.50];
            // Look at the first year's first border polygon
            if (mapData.borders && mapData.borders.length > 0) {
                const polygon = mapData.borders[0];
                if (polygon && polygon.length > 0) {
                    return polygon[0];
                }
            }
        } catch (e) { return [41.90, 12.50]; }
        return [41.90, 12.50];
    };

    const initialCenter = getInitialCenter();

    // Defensive render
    if (!mapData) return <div className="error-message">Error loading map data</div>;

    const handleSliderChange = (e) => {
        const val = parseInt(e.target.value);
        const closest = years.reduce((prev, curr) => {
            return (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
        });
        setCurrentYear(closest);
        setMapData(sourceData[String(closest)]);
    };

    return (
        <div style={{ width: '100%', height: '500px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
            <MapContainer
                center={initialCenter}
                zoom={3}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {mapData.borders && mapData.borders.map((coords, i) => (
                    <Polygon
                        key={i}
                        positions={coords}
                        pathOptions={{
                            color: mapData.color || '#3b82f6',
                            fillColor: mapData.color || '#3b82f6',
                            fillOpacity: 0.4,
                            weight: 2
                        }}
                    >
                        <Popup>{mapData.description}</Popup>
                    </Polygon>
                ))}

            </MapContainer>

            {/* Timeline Controls */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                padding: '20px',
                zIndex: 1000,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: '0 0 10px 0', fontFamily: 'serif', fontSize: '2rem' }}>
                    {currentYear}
                </h2>
                <p style={{ margin: '0 0 15px 0', opacity: 0.8 }}>{mapData.description}</p>

                <input
                    type="range"
                    min={years[0]}
                    max={years[years.length - 1]}
                    step="1"
                    value={currentYear}
                    onChange={handleSliderChange}
                    style={{ width: '80%', cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '80%', fontSize: '0.8rem', opacity: 0.5, marginTop: '5px' }}>
                    <span>{years[0]}</span>
                    <span>{years[years.length - 1]}</span>
                </div>
            </div>
        </div>
    );
};

export default HistoricalMap;
