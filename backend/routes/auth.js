
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   POST api/auth/signup
// @desc    Register user
// @access  Public
router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    const mongoose = require('mongoose');

    // MOCK MODE check removed

    try {
        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({
            username,
            email,
            passwordHash: password // Will hash below
        });

        // 2. Encrypt password
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);

        await user.save();

        // 3. Return JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret_crumbs_key_dev',
            { expiresIn: '7d' }, // 1 week session
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const mongoose = require('mongoose');

    // MOCK MODE check removed

    try {
        // 1. Check if user exists
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 2. Match password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // 3. Return JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret_crumbs_key_dev',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.post('/google', async (req, res) => {
    const { token } = req.body;
    const { OAuth2Client } = require('google-auth-library');
    // Using the same Client ID for verification
    const client = new OAuth2Client("541014598474-sa1cc0v0alu4br0afvq7h9h3of71j399.apps.googleusercontent.com");

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: "541014598474-sa1cc0v0alu4br0afvq7h9h3of71j399.apps.googleusercontent.com",
        });
        const { name, email, picture } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (!user) {
            // Create new user
            // Generate a random password since they use Google
            const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

            user = new User({
                username: name,
                email,
                passwordHash: password, // Will hash below
                avatar: picture // If schema supports it
            });

            const salt = await bcrypt.genSalt(10);
            user.passwordHash = await bcrypt.hash(password, salt);
            await user.save();
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret_crumbs_key_dev',
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } catch (err) {
        console.error("Google Auth Error:", err.message);
        res.status(400).send('Invalid Google Token');
    }
});

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    const mongoose = require('mongoose');

    // MOCK MODE: Return fake user if DB down
    // (Removed per user request)

    try {
        const user = await User.findById(req.user.id).select('-passwordHash');
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Append connection status for frontend UI
        const userData = user.toObject();

        res.json(userData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/preferences
// @desc    Update user preferences (theme, etc)
// @access  Private
router.put('/preferences', auth, async (req, res) => {
    const { theme } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (theme) user.theme = theme;
        await user.save();
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/xp
// @desc    Add XP to user and update streak
// @access  Private
router.post('/xp', auth, async (req, res) => {
    const { amount, action } = req.body;
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        // Update XP
        user.xp = (user.xp || 0) + (amount || 0);

        // Streak Logic: If action is LOGIN and lastActive was yesterday, +1 streak
        // Simple logic for now: just update lastActive
        user.lastActive = Date.now();

        await user.save();
        res.json({ xp: user.xp, streak: user.streak, msg: `+${amount} XP` });
    } catch (err) {
        console.error(err.message);
        // Mock fallback check
        // Mock fallback check removed
        res.status(500).send('Server Error');
    }
});
// @route   PUT api/auth/planner
// @desc    Sync user planner
// @access  Private
router.put('/planner', auth, async (req, res) => {
    try {
        const { planner } = req.body; // Expects array of plan objects
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.planner = planner;
        await user.save();
        res.json(user.planner);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/auth/planner
// @desc    Get user planner
// @access  Private
router.get('/planner', auth, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        res.json(user.planner || []);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
