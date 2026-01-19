import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const GraphViewer = ({ type = "line", data, title = "Data Visualization", xKey = "name", dataKey = "value" }) => {

    // Default demo data if none provided
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
    const color = "#FE4F30"; // App theme color

    // Auto-detect keys if defaults don't exist in data
    let activeXKey = xKey;
    let activeDataKey = dataKey;

    if (chartData.length > 0) {
        const firstItem = chartData[0];
        if (!firstItem.hasOwnProperty(activeXKey)) {
            // Try common alternatives
            if (firstItem.hasOwnProperty('x')) activeXKey = 'x';
            else if (firstItem.hasOwnProperty('label')) activeXKey = 'label';
            else if (firstItem.hasOwnProperty('year')) activeXKey = 'year';
            else activeXKey = Object.keys(firstItem)[0]; // Fallback to first key
        }
        if (!firstItem.hasOwnProperty(activeDataKey)) {
            // Try common alternatives
            if (firstItem.hasOwnProperty('y')) activeDataKey = 'y';
            else if (firstItem.hasOwnProperty('value')) activeDataKey = 'value';
            else if (firstItem.hasOwnProperty('count')) activeDataKey = 'count';
            else activeDataKey = Object.keys(firstItem)[1] || Object.keys(firstItem)[0];
        }
    }

    const renderChart = () => {
        switch (type.toLowerCase()) {
            case 'area':
                return (
                    <AreaChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey={activeXKey} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Area type="monotone" dataKey={activeDataKey} stroke={color} fill={color} fillOpacity={0.2} />
                    </AreaChart>
                );
            case 'bar':
                return (
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey={activeXKey} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: '#f5f5f5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey={activeDataKey} fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                );
            default: // Line
                return (
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis dataKey={activeXKey} stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend />
                        <Line type="monotone" dataKey={activeDataKey} stroke={color} strokeWidth={3} dot={{ r: 4, fill: color }} activeDot={{ r: 6 }} />
                    </LineChart>
                );
        }
    };

    return (
        <div className="tool-container graph-viewer" style={{
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
                marginBottom: '20px',
            }}>
                <h4 style={{ margin: 0, color: '#333', fontSize: '1.1rem', display: 'flex', alignItems: 'center' }}>
                    <i className="fas fa-chart-line" style={{ marginRight: '10px', color: '#FE4F30' }}></i>
                    {title}
                </h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', padding: '4px 8px', background: '#f5f5f5', borderRadius: '6px', color: '#666' }}>
                        Interactive
                    </span>
                </div>
            </div>

            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    {renderChart()}
                </ResponsiveContainer>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '15px', textAlign: 'center' }}>
                Hover over data points to see details.
            </p>
        </div>
    );
};

export default GraphViewer;
