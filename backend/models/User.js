
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    // Progress Tracking
    enrolledCourses: [{
        courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        progress: { type: Number, default: 0 }, // Percent
        completedSubtopics: [{ type: String }] // IDs of subtopics
    }],
    // Gamification
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    theme: { type: String, default: 'dark' },
    // Planner / Schedule
    planner: [{
        title: String,
        date: Date, // ISO timestamp for the scheduled reading time
        courseId: String, // Optional link to course
        isCompleted: { type: Boolean, default: false }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
