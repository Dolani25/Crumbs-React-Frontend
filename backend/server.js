
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Config
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Parse JSON bodies (Increased for course data)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
// In a real scenario, use process.env.MONGO_URI. 
// For scaffolding, we'll assume a local or standard Atlas URI
// Global Connection Mode Tracker
global.connectionMode = 'mock'; // default

const connectDB = async () => {
    // 1. Try Remote URI (if exists)
    if (process.env.MONGO_URI) {
        try {
            const conn = await mongoose.connect(process.env.MONGO_URI, {
                serverSelectionTimeoutMS: 5000 // Fail fast
            });
            console.log(`✅ MongoDB Connected (Remote): ${conn.connection.host}`);
            global.connectionMode = 'remote';
            setupConnectionHandlers();
            return;
        } catch (err) {
            console.warn(`⚠️ Remote DB failed: ${err.message}. Trying Localhost...`);
        }
    }

    // 2. Try Localhost
    try {
        const localUri = 'mongodb://localhost:27017/crumbs_db';
        const conn = await mongoose.connect(localUri, {
            serverSelectionTimeoutMS: 2000
        });
        console.log(`✅ MongoDB Connected (Local): ${conn.connection.host}`);
        global.connectionMode = 'local';
        setupConnectionHandlers();
    } catch (err) {
        // 3. Fallback to Mock
        console.warn(`❌ Local DB failed: ${err.message}`);
        console.warn("\n☁️ [MOCK MODE] Starting server in purely local/mock mode. Requests will return dummy data.\n");
        global.connectionMode = 'mock';
    }
};

const setupConnectionHandlers = () => {
    mongoose.connection.on('error', err => {
        console.warn(`[DB Error] ${err.message}`);
        global.connectionMode = 'mock';
    });
    mongoose.connection.on('disconnected', () => {
        console.warn('[DB Disconnected] Switching to Mock Mode');
        global.connectionMode = 'mock';
    });
    mongoose.connection.on('reconnected', () => {
        console.log('[DB Reconnected]');
        global.connectionMode = process.env.MONGO_URI ? 'remote' : 'local';
    });
};

// Routes Placeholder
app.get('/', (req, res) => {
    res.send('Crumbs API is running...');
});

// Health Check / Status Endpoint
app.get('/api/health', (req, res) => {
    // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    res.json({
        status: 'ok',
        mode: global.connectionMode || 'mock',
        dbState: mongoose.connection.readyState
    });
});

// Import Routes
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);

// Start Server
// Global Error Handlers to prevent crash on transient DB errors
process.on('unhandledRejection', (reason, promise) => {
    console.warn('⚠️ [Mock Server] Unhandled Rejection:', reason.message || reason);
    // Do not exit the process
});

process.on('uncaughtException', (error) => {
    console.warn('⚠️ [Mock Server] Uncaught Exception:', error.message);
    // Do not exit the process
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
