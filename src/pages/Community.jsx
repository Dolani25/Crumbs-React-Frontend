import React, { useState, useEffect } from 'react';
import { getPublicCourses, likeCourse } from '../api';
import './Community.css'; // We'll create this next

const Community = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const data = await getPublicCourses();
                setCourses(data);
            } catch (err) {
                console.error("Failed to load community feed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeed();
    }, []);

    const handleLike = async (id) => {
        // Optimistic Update
        setCourses(prev => prev.map(c => {
            if (c._id === id) {
                // Toggle logic for UI (simplified)
                const newCount = c.likes ? c.likes.length + 1 : 1;
                // Note: Real toggle needs user ID check, but for MVP UI just increment
                return { ...c, likes: Array(newCount).fill('mock') };
            }
            return c;
        }));

        try {
            await likeCourse(id);
            // Ideally re-fetch to get accurate state
        } catch (err) {
            console.error("Like failed");
        }
    };

    return (
        <div className="community-page">
            <div className="community-header">
                <h1>Explore Crumbs</h1>
                <p>Discover courses created by the community.</p>
            </div>

            {loading ? (
                <div className="loader">Loading...</div>
            ) : (
                <div className="community-grid">
                    {courses.map(course => (
                        <div key={course._id} className="course-card">
                            <div className="card-icon" style={{ background: course.color || '#6366f1' }}>
                                <i className={course.icon || 'fas fa-book'}></i>
                            </div>
                            <div className="card-content">
                                <h3>{course.title}</h3>
                                <p className="author">by @{course.authorName || 'Anonymous'}</p>
                                <div className="card-stats">
                                    <span>❤️ {course.likes ? course.likes.length : 0}</span>
                                </div>
                            </div>
                            <button className="like-btn" onClick={() => handleLike(course._id)}>
                                Like
                            </button>
                        </div>
                    ))}

                    {courses.length === 0 && (
                        <div className="empty-state">
                            <p>No public courses yet. Be the first to publish!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Community;
