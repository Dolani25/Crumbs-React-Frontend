import React, { useState, useRef, useEffect } from 'react';
import D3LineChart from './d3-charts/LineChart';
import D3BarChart from './d3-charts/BarChart';
import D3Treemap from './d3-charts/Treemap';
import D3Sunburst from './d3-charts/Sunburst';

const GraphViewer = ({ type = "line", data, title = "Data Visualization", xKey, dataKey }) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // 1. Responsive Logic
    useEffect(() => {
        const observeTarget = containerRef.current;
        if (!observeTarget) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (!entries || entries.length === 0) return;
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });

        resizeObserver.observe(observeTarget);
        return () => resizeObserver.unobserve(observeTarget);
    }, []);

    // 2. Default Data & Key Logic
    const defaultData = [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 300 },
        { name: 'Mar', value: 600 },
        { name: 'Apr', value: 800 },
        { name: 'May', value: 500 },
        { name: 'Jun', value: 900 },
        { name: 'Jul', value: 1000 },
    ];
    const chartData = data || defaultData;

    // 3. Render Chart Switch
    const renderChart = () => {
        const { width, height } = dimensions;
        if (width === 0 || height === 0) return null;

        const commonProps = {
            data: chartData,
            width,
            height,
            color: "#FE4F30"
        };

        switch (type.toLowerCase()) {
            case 'treemap':
                return <D3Treemap {...commonProps} />;
            case 'sunburst':
            case 'pie': // Sunburst handles circular hierarchy
            case 'donut':
                return <D3Sunburst {...commonProps} />;
            case 'bar':
            case 'column':
                return <D3BarChart {...commonProps} />;
            case 'area':
            case 'line':
            default:
                return <D3LineChart {...commonProps} />;
        }
    };

    return (
        <div className="tool-container graph-viewer" style={{
            margin: '20px 0',
            padding: '20px',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #f0f0f0',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
            }}>
                <h4 style={{ margin: 0, color: '#333', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-chart-line" style={{ marginRight: '10px', color: '#FE4F30' }}></i>
                    {title}
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#f5f5f5', borderRadius: '6px', color: '#666', fontWeight: 500 }}>
                        Powered by D3.js 🚀
                    </span>
                </div>
            </div>

            <div ref={containerRef} style={{ width: '100%', height: 320 }}>
                {renderChart()}
            </div>

            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '15px', textAlign: 'center' }}>
                Interactive Visualization
            </p>
        </div>
    );
};

export default GraphViewer;
