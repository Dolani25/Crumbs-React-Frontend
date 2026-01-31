import React, { useState, useEffect } from 'react';
import { getPublicCourses, likeCourse } from '../api';
import './Feed.css'; // New Styles
import { MessageSquare, Heart, Share2, BookOpen, User, Quote, TrendingUp, Grid, Hash } from 'lucide-react';
import axios from 'axios';

const Feed = () => {
    const [view, setView] = useState('all'); // 'all', 'discussions', 'courses'
    const [posts, setPosts] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // New Post State
    const [newPostContent, setNewPostContent] = useState('');
    const [isPosting, setIsPosting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Parallel Fetch
            const [coursesData, postsRes] = await Promise.all([
                getPublicCourses().catch(err => []),
                axios.get('http://localhost:5000/api/posts', {
                    headers: { 'x-auth-token': localStorage.getItem('crumbs_token') }
                }).catch(err => ({ data: [] }))
            ]);

            setCourses(coursesData);
            setPosts(postsRes.data || []);
        } catch (err) {
            console.error("Failed to load feed", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePost = async (e) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        setIsPosting(true);
        try {
            const token = localStorage.getItem('crumbs_token');
            const res = await axios.post('http://localhost:5000/api/posts',
                { content: newPostContent, type: 'general' },
                { headers: { 'x-auth-token': token } }
            );

            // Add to top list
            setPosts(prev => [res.data, ...prev]);
            setNewPostContent('');
        } catch (err) {
            console.error("Post failed", err);
            alert("Failed to post");
        } finally {
            setIsPosting(false);
        }
    };

    const handleLikePost = async (postId) => {
        // Optimistic UI
        setPosts(prev => prev.map(p => {
            if (p._id === postId) {
                // Toggle logic isn't perfect without user ID check, but assumed +1 for feedback
                return { ...p, likes: [...p.likes, 'me'] };
            }
            return p;
        }));

        try {
            const token = localStorage.getItem('crumbs_token');
            await axios.put(`http://localhost:5000/api/posts/like/${postId}`, {}, {
                headers: { 'x-auth-token': token }
            });
        } catch (err) {
            console.error("Like failed");
        }
    };

    // Render Items
    const renderPost = (post) => (
        <div key={post._id} className="feed-item">
            <div className="post-header">
                <div className="user-avatar-sm">
                    <User size={20} />
                </div>
                <div className="post-meta">
                    <h4>{post.username}</h4>
                    <span>
                        {new Date(post.createdAt).toLocaleDateString()}
                        {post.type === 'question' && <span style={{ color: '#f59e0b', marginLeft: '8px' }}>• Asked a Question</span>}
                        {post.type === 'thought' && <span style={{ color: '#a855f7', marginLeft: '8px' }}>• Shared a Thought</span>}
                    </span>
                </div>
            </div>

            {/* Context (Line/Lesson) */}
            {post.context && post.context.lineContent && (
                <div className="context-box">
                    <Quote size={14} style={{ marginRight: '5px' }} />
                    "{post.context.lineContent}"
                    {post.context.courseTitle && <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#818cf8', fontWeight: '600' }}>in {post.context.courseTitle}</div>}
                </div>
            )}

            <div className="post-content">
                {post.content}
            </div>

            <div className="interaction-bar">
                <button
                    onClick={() => handleLikePost(post._id)}
                    className={`interaction-btn ${post.likes && post.likes.includes('me') ? 'liked' : ''}`}
                >
                    <Heart size={18} fill={post.likes && post.likes.includes('me') ? "currentColor" : "none"} />
                    {post.likes ? post.likes.length : 0}
                </button>
                <button className="interaction-btn">
                    <MessageSquare size={18} /> {post.comments ? post.comments.length : 0}
                </button>
                <button className="interaction-btn">
                    <Share2 size={18} /> Share
                </button>
            </div>
        </div>
    );

    const renderCourse = (course) => (
        <div key={course._id} className="feed-item" style={{ borderLeft: `4px solid ${course.color || '#6366f1'}` }}>
            <div className="post-header">
                <div className="course-icon-sm" style={{ background: course.color || '#6366f1', fontSize: '1.2rem', width: '40px', height: '40px' }}>
                    <i className={course.icon || 'fas fa-book'}></i>
                </div>
                <div className="post-meta">
                    <h4>{course.title}</h4>
                    <span>New Course by @{course.authorName || 'Anonymous'}</span>
                </div>
            </div>

            <p className="post-content" style={{ color: '#cbd5e1' }}>
                Currently learning with {Math.floor(Math.random() * 50) + 1} other students.
                Check out the new modules!
            </p>

            <div className="interaction-bar">
                <button className="interaction-btn" style={{ color: '#6366f1' }}>
                    <BookOpen size={18} /> View Course
                </button>
                <button className="interaction-btn">
                    <Heart size={18} /> {course.likes ? course.likes.length : 0}
                </button>
            </div>
        </div>
    );

    return (
        <div className="feed-page">
            <div className="feed-container">

                {/* 1. Left Sidebar: Navigation */}
                <aside className="left-sidebar">
                    <div className="filter-card">
                        <button onClick={() => setView('all')} className={`sidebar-btn ${view === 'all' ? 'active' : ''}`}>
                            <Grid size={20} /> All Activity
                        </button>
                        <button onClick={() => setView('discussions')} className={`sidebar-btn ${view === 'discussions' ? 'active' : ''}`}>
                            <MessageSquare size={20} /> Discussions
                        </button>
                        <button onClick={() => setView('courses')} className={`sidebar-btn ${view === 'courses' ? 'active' : ''}`}>
                            <BookOpen size={20} /> Public Courses
                        </button>
                        <button className="sidebar-btn">
                            <Hash size={20} /> Trending Tags
                        </button>
                    </div>
                </aside>

                {/* 2. Main Feed: Content */}
                <main className="main-feed">
                    {/* Create Post Widget */}
                    <div className="create-post-card">
                        <form onSubmit={handleCreatePost}>
                            <div className="create-input-area">
                                <div className="user-avatar-sm">
                                    <User size={24} />
                                </div>
                                <textarea
                                    className="post-textarea"
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="What are you learning today?"
                                />
                            </div>
                            <div className="post-actions">
                                <button type="submit" disabled={isPosting || !newPostContent} className="post-btn">
                                    {isPosting ? 'Posting...' : 'Post Update'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Feed Loading & List */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            <div className="loading-spinner"></div> Loading feed...
                        </div>
                    ) : (
                        <>
                            {view === 'all' && (
                                <>
                                    {[...posts, ...courses.map(c => ({ ...c, type: 'course_publish', createdAt: c.createdAt || new Date() }))]
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        .map(item => item.type === 'course_publish' ? renderCourse(item) : renderPost(item))
                                    }
                                </>
                            )}
                            {view === 'discussions' && posts.map(renderPost)}
                            {view === 'courses' && courses.map(renderCourse)}

                            {posts.length === 0 && courses.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                                    <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                    <p>No activity yet. Be the first to post!</p>
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* 3. Right Sidebar: Trending */}
                <aside className="right-sidebar">
                    <div className="trending-card">
                        <div className="trending-header">
                            <TrendingUp size={20} color="#f59e0b" />
                            <span>Popular Courses</span>
                        </div>

                        {courses.slice(0, 4).map(c => (
                            <div key={c._id} className="mini-course">
                                <div className="course-icon-sm" style={{ background: c.color || '#6366f1', fontSize: '1rem', width: '32px', height: '32px' }}>
                                    <i className={c.icon || 'fas fa-book'}></i>
                                </div>
                                <div className="course-info">
                                    <h5>{c.title}</h5>
                                    <span>{c.likes?.length || 0} Likes</span>
                                </div>
                            </div>
                        ))}

                        {courses.length === 0 && <span style={{ color: '#64748b', fontSize: '0.9rem' }}>No trending courses yet.</span>}
                    </div>
                </aside>

            </div>
        </div>
    );
};

export default Feed;
