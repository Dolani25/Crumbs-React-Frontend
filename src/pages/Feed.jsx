import React, { useState, useEffect } from 'react';
import { getPublicCourses, likeCourse } from '../api';
import './Planner.css'; // Reusing Planner/Glass styles
import './Community.css'; // Reusing Community grid styles
import { MessageSquare, Heart, Share2, BookOpen, User, Quote } from 'lucide-react';
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
        <div key={post._id} className="plan-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px', background: 'rgba(30, 41, 59, 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User color="white" size={20} />
                </div>
                <div>
                    <h4 style={{ margin: 0, color: '#f8fafc' }}>{post.username}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {new Date(post.createdAt).toLocaleDateString()}
                        {post.type === 'question' && <span className="status-badge upcoming" style={{ marginLeft: '8px' }}>Question</span>}
                        {post.type === 'thought' && <span className="status-badge" style={{ marginLeft: '8px', background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe' }}>Thought</span>}
                    </span>
                </div>
            </div>

            {/* Context (Line/Lesson) */}
            {post.context && post.context.lineContent && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', borderLeft: '3px solid #6366f1', width: '100%', fontStyle: 'italic', color: '#cbd5e1' }}>
                    <Quote size={14} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                    "{post.context.lineContent}"
                    {post.context.courseTitle && <div style={{ fontSize: '0.75rem', marginTop: '5px', color: '#6366f1' }}>in {post.context.courseTitle}</div>}
                </div>
            )}

            <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.6' }}>{post.content}</p>

            <div style={{ display: 'flex', gap: '20px', marginTop: '5px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', width: '100%' }}>
                <button
                    onClick={() => handleLikePost(post._id)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                    <Heart size={18} /> {post.likes ? post.likes.length : 0}
                </button>
                <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={18} /> {post.comments ? post.comments.length : 0}
                </button>
            </div>
        </div>
    );

    const renderCourse = (course) => (
        <div key={course._id} className="course-card" style={{ maxWidth: '100%', marginBottom: '20px' }}>
            <div className="card-icon" style={{ background: course.color || '#6366f1' }}>
                <i className={course.icon || 'fas fa-book'}></i>
            </div>
            <div className="card-content">
                <h3>{course.title}</h3>
                <p className="author">Published by @{course.authorName || 'Anonymous'}</p>
                <div className="card-stats">
                    <span>❤️ {course.likes ? course.likes.length : 0}</span>
                    <span>📥 {Math.floor(Math.random() * 50) + 1} students</span>
                </div>
            </div>
            <button className="like-btn">View</button>
        </div>
    );

    return (
        <div className="planner-page">
            <div className="planner-header">
                <h1>Social Feed 🌍</h1>
                <p style={{ color: '#94a3b8' }}>See what everyone is learning and thinking!</p>
            </div>

            <div className="planner-content" style={{ flexDirection: 'row-reverse' }}>

                {/* Right Column: Trending / Filter */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                    <div className="planner-form" style={{ position: 'sticky', top: '20px', maxWidth: '100%' }}>
                        <h3>Filters</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button onClick={() => setView('all')} className={view === 'all' ? 'perm-btn' : 'secondary-cta'} style={{ width: '100%', textAlign: 'left', background: view === 'all' ? undefined : 'rgba(255,255,255,0.05)' }}>
                                All Activity
                            </button>
                            <button onClick={() => setView('discussions')} className={view === 'discussions' ? 'perm-btn' : 'secondary-cta'} style={{ width: '100%', textAlign: 'left', background: view === 'discussions' ? undefined : 'rgba(255,255,255,0.05)' }}>
                                <MessageSquare size={16} /> Discussions
                            </button>
                            <button onClick={() => setView('courses')} className={view === 'courses' ? 'perm-btn' : 'secondary-cta'} style={{ width: '100%', textAlign: 'left', background: view === 'courses' ? undefined : 'rgba(255,255,255,0.05)' }}>
                                <BookOpen size={16} /> Public Courses
                            </button>
                        </div>
                    </div>
                </div>

                {/* Left Column: Feed System */}
                <div className="planner-list" style={{ flex: 2 }}>

                    {/* Create Post */}
                    <div className="plan-item" style={{ display: 'block' }}>
                        <form onSubmit={handleCreatePost}>
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="Share a thought, question, or learning tip..."
                                style={{
                                    width: '100%',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '15px',
                                    color: 'white',
                                    resize: 'none',
                                    height: '80px',
                                    marginBottom: '10px'
                                }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <button type="submit" disabled={isPosting || !newPostContent} className="perm-btn" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
                                    {isPosting ? 'Posting...' : 'Post'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Feed Content */}
                    {loading ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>Loading feed...</p> : (
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
                            {view === 'courses' && (
                                <div className="community-grid" style={{ gridTemplateColumns: '1fr' }}>
                                    {courses.map(renderCourse)}
                                </div>
                            )}

                            {posts.length === 0 && courses.length === 0 && (
                                <div className="empty" style={{ margin: 0 }}>No activity yet. Be the first!</div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Feed;
