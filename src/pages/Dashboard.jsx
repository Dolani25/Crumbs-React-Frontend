
import React, { useState } from 'react';
import Course from '../Course.jsx';
import CourseUploader from '../CourseUploader.jsx';

const Dashboard = ({ courses, onUploadComplete, onDelete }) => {
    const [showUploader, setShowUploader] = useState(false);

    // Remove any ghost/empty courses
    const validCourses = courses.filter(c => (c.id || c._id) && (c.name || c.title));

    return (
        <div className="courses-container">
            {validCourses.length > 0 ? (
                <>
                    {validCourses.map(course => (
                        <Course key={course.id || course._id} course={course} onDelete={onDelete} />
                    ))}

                    {/* Floating Add Button */}
                    <div
                        className="add-course-card"
                        onClick={() => setShowUploader(true)}
                    >
                        <i className="fas fa-plus"></i>
                        <h3>Add New Course</h3>
                    </div>

                    {/* Modal Overlay for Uploader */}
                    {showUploader && (
                        <div className="uploader-modal-overlay" style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0,0,0,0.8)',
                            zIndex: 1000,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <div style={{ width: '100%', maxWidth: '600px', background: 'transparent' }}>
                                <div style={{ textAlign: 'right', padding: '10px' }}>
                                    <button onClick={() => setShowUploader(false)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                                </div>
                                <CourseUploader
                                    onUploadComplete={(newCourses) => {
                                        onUploadComplete(newCourses);
                                        setShowUploader(false);
                                    }}
                                    initialStep="fileSource"
                                />
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <CourseUploader onUploadComplete={onUploadComplete} />
            )}
        </div>
    );
};

export default Dashboard;
