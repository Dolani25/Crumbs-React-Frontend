import React, { useState, useEffect } from 'react';
import './Planner.css'; // Reusing Planner CSS for consistency for now
import { Upload, Trash2, FileText, File, CheckCircle, Circle } from 'lucide-react';
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
        <div className="planner-page">
            <div className="planner-header">
                <h1>My Library 📚</h1>
                <p style={{ color: '#94a3b8' }}>Upload files to personalize your AI lessons!</p>
            </div>

            <div className="planner-content" style={{ flexDirection: 'column', gap: '40px' }}>
                {/* Upload Zone */}
                <form
                    className="planner-form"
                    style={{ width: '100%', maxWidth: '100%', border: dragActive ? '2px dashed #6366f1' : '2px dashed rgba(255,255,255,0.1)', textAlign: 'center', cursor: 'pointer' }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-upload').click()}
                >
                    <input type="file" id="file-upload" style={{ display: 'none' }} onChange={handleChange} />
                    <Upload size={48} color="#6366f1" style={{ marginBottom: '20px' }} />
                    <h3 style={{ justifyContent: 'center' }}>Drag & Drop or Click to Upload</h3>
                    <p style={{ color: '#94a3b8' }}>Supports PDF, Images (Handwritten Notes), Text</p>
                    {isUploading && <p style={{ color: '#4ade80' }}>Uploading...</p>}
                </form>

                {/* File List */}
                <div className="planner-list" style={{ width: '100%' }}>
                    {files.length === 0 ? (
                        <div className="empty">Your library is empty.</div>
                    ) : (
                        files.map(file => (
                            <div key={file._id} className="plan-item">
                                <div className="plan-date-box" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                                    {file.mimetype.includes('image') ? <File size={24} /> : <FileText size={24} />}
                                    <span className="time">{file.mimetype.split('/')[1]?.toUpperCase().substring(0, 4)}</span>
                                </div>
                                <div className="plan-info">
                                    <h4>{file.filename}</h4>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>
                                        Added: {new Date(file.uploadedAt).toLocaleDateString()} • {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>

                                {/* Context Toggle (Visual Only for now) */}
                                <button onClick={(e) => { e.stopPropagation(); toggleContext(file); }} className="del-btn" style={{ borderColor: '#22c55e', color: '#22c55e', transform: 'none' }} title="Context Active">
                                    <CheckCircle size={18} />
                                </button>

                                <button onClick={(e) => { e.stopPropagation(); handleDelete(file._id); }} className="del-btn">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Library;
