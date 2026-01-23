
import React, { useState, useEffect, useRef } from 'react';
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
    const [sliderValue, setSliderValue] = useState(initialYear); // Immediate visual feedback
    const [mapYear, setMapYear] = useState(initialYear); // Debounced map update
    const [mapData, setMapData] = useState(sourceData[String(initialYear)] || sourceData[Object.keys(sourceData)[0]]);

    // Debounce Effect
    useEffect(() => {
        const timer = setTimeout(() => {
            // Find closest year
            const val = sliderValue;
            const closest = years.reduce((prev, curr) => {
                return (Math.abs(curr - val) < Math.abs(prev - val) ? curr : prev);
            });
            setMapYear(closest);
            setMapData(sourceData[String(closest)]);
        }, 100); // 100ms debounce for smoothness

        return () => clearTimeout(timer);
    }, [sliderValue, years, sourceData]);

    const getInitialCenter = () => {
        try {
            if (!mapData) return [41.90, 12.50];
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
        setSliderValue(parseInt(e.target.value));
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
                        key={`${mapYear}-${i}`} // Key change acts as animation trigger if supported
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
                padding: '20px 30px',
                zIndex: 1000,
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <h2 style={{ margin: '0 0 5px 0', fontFamily: 'serif', fontSize: '2.5rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {mapYear}
                    {/* Interpolation visual hint? optional */}
                </h2>
                <p style={{ margin: '0 0 20px 0', opacity: 0.9, textAlign: 'center', maxWidth: '80%' }}>{mapData.description}</p>

                {/* Custom Slider */}
                <div style={{ width: '90%', position: 'relative', height: '40px', display: 'flex', alignItems: 'center' }}>
                    {/* Track Line */}
                    <div style={{ position: 'absolute', left: 0, right: 0, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}></div>

                    {/* Visual Ticks for Years */}
                    {years.map(y => {
                        // Calculate position %
                        const range = years[years.length - 1] - years[0];
                        const percent = ((y - years[0]) / range) * 100;
                        return (
                            <div key={y} style={{
                                position: 'absolute',
                                left: `${percent}%`,
                                width: '2px',
                                height: '10px',
                                background: y === mapYear ? '#a855f7' : 'rgba(255,255,255,0.3)',
                                transform: 'translateX(-50%)',
                                transition: 'background 0.3s'
                            }}></div>
                        );
                    })}

                    <input
                        type="range"
                        min={years[0]}
                        max={years[years.length - 1]}
                        step="1" // Fine step for fluid dragging
                        value={sliderValue}
                        onChange={handleSliderChange}
                        style={{
                            width: '100%',
                            cursor: 'pointer',
                            zIndex: 2,
                            opacity: 0, // Invisible functional slider on top
                            height: '100%',
                            position: 'absolute'
                        }}
                    />

                    {/* Custom Thumb (Visual) */}
                    <div style={{
                        position: 'absolute',
                        left: `${((sliderValue - years[0]) / (years[years.length - 1] - years[0])) * 100}%`,
                        width: '20px',
                        height: '20px',
                        background: '#a855f7',
                        borderRadius: '50%',
                        boxShadow: '0 0 10px #a855f7',
                        transform: 'translateX(-50%)',
                        pointerEvents: 'none',
                        transition: 'left 0.1s linear' // Smooth visual movement
                    }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', width: '90%', fontSize: '0.8rem', opacity: 0.5, marginTop: '10px' }}>
                    <span>{years[0]}</span>
                    <span>{years[years.length - 1]}</span>
                </div>
            </div>
        </div>
    );
};

export default HistoricalMap;
