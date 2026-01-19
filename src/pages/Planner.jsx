import React, { useState, useEffect } from 'react';
import { getPlanner, syncPlanner } from '../api';
import './Planner.css';

const Planner = () => {
    const [plans, setPlans] = useState([]);
    const [newPlan, setNewPlan] = useState({ title: '', date: '', time: '' });
    const [permission, setPermission] = useState(Notification.permission);

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
        if (!newPlan.title || !newPlan.date) return;

        // Combine date/time
        const fullDate = new Date(`${newPlan.date}T${newPlan.time || '09:00'}`);

        const item = {
            title: newPlan.title,
            date: fullDate.toISOString(),
            isCompleted: false
        };

        const updated = [...plans, item];
        setPlans(updated);
        setNewPlan({ title: '', date: '', time: '' });

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

    return (
        <div className="planner-page">
            <div className="planner-header">
                <h1>Study Planner</h1>
                {permission !== 'granted' && (
                    <button className="perm-btn" onClick={requestNotification}>Enable Notifications 🔔</button>
                )}
            </div>

            <div className="planner-content">
                {/* Form */}
                <div className="planner-form">
                    <h3>Add Goal</h3>
                    <form onSubmit={handleAddPlan}>
                        <input
                            type="text"
                            placeholder="What to study? (e.g. Drilling)"
                            value={newPlan.title}
                            onChange={e => setNewPlan({ ...newPlan, title: e.target.value })}
                        />
                        <div className="time-inputs">
                            <input
                                type="date"
                                value={newPlan.date}
                                onChange={e => setNewPlan({ ...newPlan, date: e.target.value })}
                            />
                            <input
                                type="time"
                                value={newPlan.time}
                                onChange={e => setNewPlan({ ...newPlan, time: e.target.value })}
                            />
                        </div>
                        <button type="submit">Add to Schedule</button>
                    </form>
                </div>

                {/* List */}
                <div className="planner-list">
                    {plans.length === 0 ? (
                        <p className="empty">No study plans yet. Set a goal above to get started!</p>
                    ) : (
                        plans.sort((a, b) => new Date(a.date) - new Date(b.date)).map((plan, i) => {
                            const isPast = new Date(plan.date) < new Date();
                            return (
                                <div key={i} className="plan-item">
                                    <div className="plan-date-box">
                                        <span className="day">{new Date(plan.date).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                                        <span className="time">{new Date(plan.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="plan-info">
                                        <h4>{plan.title}</h4>
                                        <span className={`status-badge ${isPast ? 'past' : 'upcoming'}`}>
                                            {isPast ? "Completed / Past" : "Upcoming Session"}
                                        </span>
                                    </div>
                                    <button className="del-btn" onClick={() => handleDelete(i)} title="Remove Plan">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default Planner;
