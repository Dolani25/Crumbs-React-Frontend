
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- DATABASE CONNECTION ---
// Global Connection Mode Tracker
global.connectionMode = 'mock'; // default

const connectDB = async () => {
    // 1. Try Remote URI (Prioritize Environment Variable)
    if (process.env.MONGO_URI) {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000
            });
            console.log(`✅ MongoDB Connected (Remote): ${conn.connection.host}`);
            global.connectionMode = 'remote';
            return;
        } catch (err) {
            console.error(`❌ Remote DB Connection Failed: ${err.message}`);
            // In Production, we might want to exit: process.exit(1);
            // But for resilience, we'll fall back to mock if needed, or just log error.
        }
    } else {
        console.warn("⚠️ No MONGO_URI found. Database features will not work.");
    }

    // 2. Fallback (Only useful for local dev, but safe to keep)
    global.connectionMode = 'mock';
};

connectDB();

// --- ROUTES ---

// Import Routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');

// API Routes (Must be before static files)
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        mode: global.connectionMode || 'mock',
        dbState: mongoose.connection.readyState
    });
});

// --- STATIC FILES (PRODUCTION) ---
// Serve static assets in production
// Note: We assume the build output is in ../dist relative to this file
// Project Structure:
// /backend/server2.js
// /dist/index.html

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Catch-All Route: Send index.html for any request not matching API or static files
app.get('*', (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
});

// --- ERROR HANDLERS ---
process.on('unhandledRejection', (reason, promise) => {
    console.warn('⚠️ [Server] Unhandled Rejection:', reason.message || reason);
});

process.on('uncaughtException', (error) => {
    console.warn('⚠️ [Server] Uncaught Exception:', error.message);
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Production Server running on port ${PORT}`);
    console.log(`📂 Serving Static Files from: ${distPath}`);
});
