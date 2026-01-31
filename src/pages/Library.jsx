import React, { useState, useEffect } from 'react';
import './Library.css'; // New Styles
import { Upload, Trash2, FileText, File, CheckCircle, Image, HardDrive } from 'lucide-react';
import axios from 'axios';

const Library = () => {
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    // Fetch files on mount
    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const token = localStorage.getItem('crumbs_token');
            if (token) {
                const res = await axios.get('http://localhost:5000/api/library', {
                    headers: { 'x-auth-token': token }
                });
                setFiles(res.data);
            }
        } catch (err) {
            console.error("Failed to fetch files", err);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleUpload = async (file) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const token = localStorage.getItem('crumbs_token');
            await axios.post('http://localhost:5000/api/library/upload', formData, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data'
                }
            });
            // Refresh list
            fetchFiles();
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed! Only Images, PDFs, and Text files allowed (Max 10MB).");
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this file?")) return;
        try {
            const token = localStorage.getItem('crumbs_token');
            await axios.delete(`http://localhost:5000/api/library/${id}`, {
                headers: { 'x-auth-token': token }
            });
            fetchFiles();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const toggleContext = async (file) => {
        // Optimistic UI toggle (Actual backend toggle not fully implemented in route yet, 
        // but we can simulate it or just update local state if we want persistence later)
        // For now, let's just assume all files are active or just update UI.
        // Ideally we PATCH the file.isActive on backend.
        // Since I only made GET/POST/DELETE, I'll update local state for now.
        // Real implementation would need a PATCH endpoint. 
        // I'll skip backend toggle for this iteration and assume everything is context.
        alert("Toggle active context coming in next update!");
    };

    return (
        <div className="library-page">
            <div className="library-header">
                <div>
                    <h1>My Library 📚</h1>
                    <p style={{ color: '#94a3b8', marginTop: '5px' }}>Upload files to personalize your AI lessons!</p>
                </div>

                {/* Simulated Storage Widget */}
                <div className="storage-widget">
                    <HardDrive size={20} color="#94a3b8" />
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Storage</span>
                            <span>{files.length * 2}% Used</span>
                        </div>
                        <div className="storage-bar-bg">
                            <div className="storage-bar-fill" style={{ width: `${Math.min(files.length * 2, 100)}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="library-content">
                {/* Upload Zone */}
                <div
                    className={`upload-zone ${dragActive ? 'active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload').click()}
                >
                    <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleChange} />
                    <div className="upload-icon-wrapper">
                        <Upload size={32} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '10px' }}>Drag & Drop or Click to Upload</h3>
                    <p style={{ color: '#94a3b8' }}>Supports PDF, Images (Handwritten Notes), Text (Max 10MB)</p>
                    {isUploading && <p style={{ color: '#4ade80', fontWeight: 'bold', marginTop: '15px' }}>Uploading...</p>}
                </div>

                {/* File Grid */}
                <div className="library-grid">
                    {files.length === 0 ? (
                        <div className="empty-state">
                            <Upload size={48} style={{ opacity: 0.2, marginBottom: '15px' }} />
                            <p>Your library is empty. Upload a file to get started!</p>
                        </div>
                    ) : (
                        files.map(file => {
                            // Determine Icon & Color based on type
                            let Icon = FileText;
                            let typeClass = 'text';
                            if (file.mimetype.includes('image')) { Icon = Image; typeClass = 'image'; }
                            if (file.mimetype.includes('pdf')) { Icon = File; typeClass = 'pdf'; }

                            return (
                                <div key={file._id} className="file-card">
                                    <div>
                                        <div className="file-header">
                                            <div className={`file-icon-lg ${typeClass}`}>
                                                <Icon size={24} />
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', color: '#cbd5e1' }}>
                                                {file.mimetype.split('/')[1].toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="file-name" title={file.filename}>{file.filename}</div>
                                        <div className="file-meta">
                                            {file.size ? (file.size / 1024 / 1024).toFixed(2) : 0} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="file-actions">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleContext(file); }}
                                            className="action-btn context active"
                                            title="Context Active (Simulated)"
                                        >
                                            <CheckCircle size={14} /> Active
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(file._id); }}
                                            className="action-btn delete"
                                        >
                                            <Trash2 size={14} /> Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Library;
