const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: String, // Cache username for speed
    type: {
        type: String,
        enum: ['general', 'question', 'thought', 'course_publish'],
        default: 'general'
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    // Contextual Data (Optional)
    context: {
        courseId: String,
        courseTitle: String,
        crumbId: String, // subtopic title/id
        lineContent: String // "a line in crumbs"
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Post', postSchema);
