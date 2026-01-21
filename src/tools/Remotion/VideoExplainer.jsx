import React from 'react';
// import { Player } from '@remotion/player'; // DEPRECATED: Remotion
// import { VideoComposition } from './Composition'; // DEPRECATED: Remotion
// import RuntimePlayer from '../MotionCanvas/RuntimePlayer';
import ManimVisualizer from '../ManimVisualizer';

const VideoExplainer = ({ data }) => {
    // Data contains: { title, scenes: [...] }

    return (
        <div style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <i className="las la-film" style={{ fontSize: '2rem', color: '#fbbf24' }}></i>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{data?.title || "Video Lesson"}</h3>
                    <div style={{
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{
                            background: '#fbbf24', color: 'black',
                            padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold'
                        }}>
                            AI Generated
                        </span>
                        <span>• Manim JS Engine 📐</span>
                    </div>
                </div>
            </div>

            <div style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                aspectRatio: '16/9',
                background: 'black'
            }}>
                {/* <RuntimePlayer data={data} /> */}
                <ManimVisualizer scriptContent={data?.script || ""} />
            </div>

            <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <p>Watch this step-by-step procedural animation.</p>
            </div>
        </div>
    );
};

export default VideoExplainer;
