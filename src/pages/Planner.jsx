import React, { useState, useEffect } from 'react';
import { getPlanner, syncPlanner, updatePlannerItem, togglePlanComplete } from '../api';
import './Planner.css';

const Planner = () => {
    const [plans, setPlans] = useState([]);
    const [newPlan, setNewPlan] = useState({
        title: '',
        date: '',
        time: '',
        priority: 'medium',
        category: 'study',
        reminderTime: 15
    });
    const [permission, setPermission] = useState(Notification.permission);
    const [filter, setFilter] = useState('all'); // all, today, upcoming, completed
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    useEffect(() => {
        const loadPlans = async () => {
            try {
                const data = await getPlanner();
                setPlans(data || []);
            } catch (err) {
                console.error("Failed to load planner", err);
            }
        };
        loadPlans();
    }, []);

    const requestNotification = async () => {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        if (perm === 'granted') {
            new Notification("Notifications Enabled!", { body: "We'll remind you to study." });
        }
    };

    const handleAddPlan = async (e) => {
        e.preventDefault();
        if (!newPlan.title || !newPlan.date) {
            alert("Please fill in title and date!");
            return;
        }

        // Validate not in the past
        const fullDate = new Date(`${newPlan.date}T${newPlan.time || '09:00'}`);
        if (fullDate < new Date()) {
            alert("Cannot schedule tasks in the past!");
            return;
        }

        const item = {
            title: newPlan.title,
            date: fullDate.toISOString(),
            isCompleted: false,
            priority: newPlan.priority,
            category: newPlan.category,
            reminderTime: parseInt(newPlan.reminderTime)
        };

        const updated = [...plans, item];
        setPlans(updated);
        setNewPlan({ title: '', date: '', time: '', priority: 'medium', category: 'study', reminderTime: 15 });

        try {
            await syncPlanner(updated);
        } catch (err) {
            console.error("Sync failed", err);
        }
    };

    const handleDelete = async (index) => {
        const updated = plans.filter((_, i) => i !== index);
        setPlans(updated);
        await syncPlanner(updated);
    };

    const handleToggleComplete = async (plan, index) => {
        try {
            if (plan._id) {
                // Use API for backend items
                const updatedPlanner = await togglePlanComplete(plan._id);
                setPlans(updatedPlanner);
            } else {
                // Fallback for local-only items
                const updated = [...plans];
                updated[index] = { ...updated[index], isCompleted: !updated[index].isCompleted };
                setPlans(updated);
                await syncPlanner(updated);
            }
        } catch (err) {
            console.error("Toggle failed", err);
        }
    };

    const startEdit = (plan, index) => {
        setEditingId(index);
        setEditForm({
            title: plan.title,
            date: new Date(plan.date).toISOString().split('T')[0],
            time: new Date(plan.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
            priority: plan.priority || 'medium',
            category: plan.category || 'study',
            reminderTime: plan.reminderTime || 15
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async (plan, index) => {
        const fullDate = new Date(`${editForm.date}T${editForm.time}`);

        try {
            if (plan._id) {
                // Use API
                const updatedPlanner = await updatePlannerItem(plan._id, {
                    title: editForm.title,
                    date: fullDate.toISOString(),
                    priority: editForm.priority,
                    category: editForm.category,
                    reminderTime: parseInt(editForm.reminderTime)
                });
                setPlans(updatedPlanner);
            } else {
                // Local update
                const updated = [...plans];
                updated[index] = {
                    ...updated[index],
                    title: editForm.title,
                    date: fullDate.toISOString(),
                    priority: editForm.priority,
                    category: editForm.category,
                    reminderTime: parseInt(editForm.reminderTime)
                };
                setPlans(updated);
                await syncPlanner(updated);
            }
            setEditingId(null);
        } catch (err) {
            console.error("Edit failed", err);
        }
    };

    // Filter logic
    const getFilteredPlans = () => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        switch (filter) {
            case 'today':
                return plans.filter(p => {
                    const planDate = new Date(p.date);
                    return planDate >= today && planDate < tomorrow && !p.isCompleted;
                });
            case 'upcoming':
                return plans.filter(p => new Date(p.date) >= now && !p.isCompleted);
            case 'completed':
                return plans.filter(p => p.isCompleted);
            default:
                return plans;
        }
    };

    const filteredPlans = getFilteredPlans();

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return '#ef4444';
            case 'low': return '#10b981';
            default: return '#f59e0b';
        }
    };

    const getCategoryLabel = (category) => {
        const labels = {
            study: '📚 Study',
            exam: '📝 Exam',
            project: '💼 Project',
            reading: '📖 Reading',
            other: '📌 Other'
        };
        return labels[category] || labels.other;
    };

    return (
        <div className="planner-page">
            <div className="planner-header">
                <h1>Study Planner</h1>
                <div className="header-actions">
                    {permission !== 'granted' && (
                        <button className="perm-btn" onClick={requestNotification}>Enable Notifications 🔔</button>
                    )}
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="planner-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({plans.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'today' ? 'active' : ''}`}
                    onClick={() => setFilter('today')}
                >
                    Today
                </button>
                <button
                    className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setFilter('upcoming')}
                >
                    Upcoming
                </button>
                <button
                    className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </button>
            </div>

            <div className="planner-content">
                {/* Form */}
                <div className="planner-form">
                    <h3>Add New Task</h3>
                    <form onSubmit={handleAddPlan}>
                        <input
                            type="text"
                            placeholder="Task title (e.g. Study Calculus)"
                            value={newPlan.title}
                            onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                            required
                        />
                        <div className="time-inputs">
                            <input
                                type="date"
                                value={newPlan.date}
                                onChange={e => setNewPlan({ ...newPlan, date: e.target.value })}
                                required
                            />
                            <input
                                type="time"
                                value={newPlan.time}
                                onChange={e => setNewPlan({ ...newPlan, time: e.target.value })}
                            />
                        </div>

                        <select
                            value={newPlan.priority}
                            onChange={e => setNewPlan({ ...newPlan, priority: e.target.value })}
                            className="priority-select"
                        >
                            <option value="low">Low Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="high">High Priority</option>
                        </select>

                        <select
                            value={newPlan.category}
                            onChange={e => setNewPlan({ ...newPlan, category: e.target.value })}
                            className="category-select"
                        >
                            <option value="study">📚 Study</option>
                            <option value="exam">📝 Exam</option>
                            <option value="project">💼 Project</option>
                            <option value="reading">📖 Reading</option>
                            <option value="other">📌 Other</option>
                        </select>

                        <select
                            value={newPlan.reminderTime}
                            onChange={e => setNewPlan({ ...newPlan, reminderTime: e.target.value })}
                            className="reminder-select"
                        >
                            <option value="5">Remind 5 min before</option>
                            <option value="15">Remind 15 min before</option>
                            <option value="30">Remind 30 min before</option>
                            <option value="60">Remind 1 hour before</option>
                        </select>

                        <button type="submit">Add to Schedule</button>
                    </form>
                </div>

                {/* List */}
                <div className="planner-list">
                    {filteredPlans.length === 0 ? (
                        <p className="empty">
                            {filter === 'all' ? "No tasks yet. Create one to get started!" :
                                filter === 'today' ? "No tasks scheduled for today." :
                                    filter === 'upcoming' ? "No upcoming tasks." :
                                        "No completed tasks."}
                        </p>
                    ) : (
                        filteredPlans.sort((a, b) => new Date(a.date) - new Date(b.date)).map((plan, i) => {
                            const actualIndex = plans.indexOf(plan);
                            const isPast = new Date(plan.date) < new Date();
                            const isEditing = editingId === actualIndex;

                            if (isEditing) {
                                return (
                                    <div key={actualIndex} className="plan-item editing">
                                        <div className="edit-form">
                                            <input
                                                type="text"
                                                value={editForm.title}
                                                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                                placeholder="Task title"
                                            />
                                            <div className="time-inputs">
                                                <input
                                                    type="date"
                                                    value={editForm.date}
                                                    onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                                />
                                                <input
                                                    type="time"
                                                    value={editForm.time}
                                                    onChange={e => setEditForm({ ...editForm, time: e.target.value })}
                                                />
                                            </div>
                                            <select
                                                value={editForm.priority}
                                                onChange={e => setEditForm({ ...editForm, priority: e.target.value })}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                            <select
                                                value={editForm.category}
                                                onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                                            >
                                                <option value="study">📚 Study</option>
                                                <option value="exam">📝 Exam</option>
                                                <option value="project">💼 Project</option>
                                                <option value="reading">📖 Reading</option>
                                                <option value="other">📌 Other</option>
                                            </select>
                                            <div className="edit-actions">
                                                <button onClick={() => saveEdit(plan, actualIndex)} className="save-btn">Save</button>
                                                <button onClick={cancelEdit} className="cancel-btn">Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={actualIndex}
                                    className={`plan-item ${plan.isCompleted ? 'completed' : ''}`}
                                    style={{ borderLeftColor: getPriorityColor(plan.priority || 'medium'), borderLeftWidth: '4px' }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={plan.isCompleted || false}
                                        onChange={() => handleToggleComplete(plan, actualIndex)}
                                        className="complete-checkbox"
                                    />
                                    <div className="plan-date-box">
                                        <span className="day">{new Date(plan.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                        <span className="time">{new Date(plan.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="plan-info">
                                        <h4>{plan.title}</h4>
                                        <div className="plan-meta">
                                            <span className="category-badge">{getCategoryLabel(plan.category || 'study')}</span>
                                            <span className={`status-badge ${isPast && !plan.isCompleted ? 'past' : 'upcoming'}`}>
                                                {plan.isCompleted ? "✓ Completed" : isPast ? "Overdue" : "Upcoming"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="plan-actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() => startEdit(plan, actualIndex)}
                                            title="Edit Task"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            className="del-btn"
                                            onClick={() => handleDelete(actualIndex)}
                                            title="Delete Task"
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                                <line x1="6" y1="6" x2="18" y2="18"></line>
                                            </svg>
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

export default Planner;
