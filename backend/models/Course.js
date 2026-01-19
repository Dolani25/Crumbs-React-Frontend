
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: 'fas fa-book'
    },
    color: {
        type: String,
        default: '#6366f1'
    },
    image: {
        url: { type: String, default: '' }
    },
    progress: {
        type: Number,
        default: 0
    },
    // Hierarchy: Course -> Topics (Modules) -> Subtopics
    // Note: We are embedding Topics for simplicity as they rarely change independently
    topics: [{
        title: String,
        icon: String,
        subtopics: [{
            title: String,
            icon: String,
            icon: String,
            image: {
                url: { type: String, default: '' }
            },
            // Embedded lesson content for easy sync (SaaS MVP)
            lesson: {
                type: mongoose.Schema.Types.Mixed,
                default: null
            },
            // Metadata for list view
            duration: String,
            isCompleted: { type: Boolean, default: false }
        }]
    }],
    isPublic: {
        type: Boolean,
        default: false // Default to private until published
    },
    authorName: { type: String }, // Cache for easy display
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    views: { type: Number, default: 0 },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
