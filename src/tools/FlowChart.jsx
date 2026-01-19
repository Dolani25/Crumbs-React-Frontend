import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

const nodeTypes = {};
const edgeTypes = {};

const FlowChart = ({ data, title }) => {
    // data is expected to be { nodes: [], edges: [] }
    // If AI provides simplified format, we might need to parse it.

    // Memoize nodes and edges to prevent invalidation
    // Memoize nodes and edges to prevent invalidation
    // Validate that data.nodes and data.edges are actually arrays to prevent crashes
    const nodes = useMemo(() => {
        if (data?.nodes && Array.isArray(data.nodes)) return data.nodes;
        return [
            { id: '1', position: { x: 0, y: 0 }, data: { label: 'Start Process' } },
            { id: '2', position: { x: 0, y: 100 }, data: { label: 'Step 1' } },
        ];
    }, [data]);

    const edges = useMemo(() => {
        if (data?.edges && Array.isArray(data.edges)) return data.edges;
        return [
            { id: 'e1-2', source: '1', target: '2', animated: true },
        ];
    }, [data]);

    return (
        <div style={{ width: '100%', height: '400px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc' }}>
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #e2e8f0', background: 'white', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                <h4 style={{ margin: 0, color: '#475569' }}>{title || "Process Flow"}</h4>
            </div>
            <div style={{ width: '100%', height: '360px' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    fitView
                    attributionPosition="bottom-right"
                >
                    <Background color="#cbd5e1" gap={16} />
                    <Controls />
                    <MiniMap />
                </ReactFlow>
            </div>
        </div>
    );
};

export default FlowChart;
