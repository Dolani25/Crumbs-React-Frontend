
const mongoose = require('mongoose');

// The "Crumb" is the atomic unit of learning content
const crumbSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    // Rich Content Structure
    content: {
        // Array of HTML paragraphs/blocks
        text: [{ type: String }],
        // Code snippet if applicable
        code: { type: String, default: null },
        // Media attachments
        media: {
            image: String, // URL
            video: String  // URL
        },
        // External embeds (YouTube, etc)
        embed: {
            type: { type: String }, // 'iframe'
            src: String,
            title: String,
            width: Number,
            height: Number
        }
    },
    // Interactive Tool Configuration
    tool: {
        type: {
            type: String,
            enum: ['none', 'molecule-viewer', 'graph-viewer', 'desmos-grapher', 'concept-graph', 'physics-sandbox', 'historical-map'],
            default: 'none'
        },
        // Configuration data for the tool (JSON)
        data: { type: mongoose.Schema.Types.Mixed },
        title: String,
        // Graph specific
        chartType: String,
        xKey: String,
        dataKey: String
    },
    // AI Generation Metadata
    generatedBy: {
        type: String,
        enum: ['human', 'davinci-ai'],
        default: 'human'
    },
    relatedCrumbs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Crumb' }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Crumb', crumbSchema);
