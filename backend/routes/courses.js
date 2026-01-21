
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Course = require('../models/Course');
const Crumb = require('../models/Crumb');
const ContentEngine = require('../services/ContentEngine');

// @route   GET api/courses
// @desc    Get all courses (public or enrolled)
// @access  Public
router.get('/', async (req, res) => {
    // STRICT MODE: We rely on standard DB connection.
    try {
        const courses = await Course.find({ isPublic: true }).select('-topics.subtopics.crumbId'); // Light payload
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/courses/:id
// @desc    Get course by ID with full hierarchy
// @access  Public (for now)
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   POST api/courses
// @desc    Create a new course
// @access  Private
router.post('/', auth, async (req, res) => {
    const { title, description, icon, color } = req.body;

    // MOCK MODE: Return generic success if DB is down
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
        return res.json({
            _id: 'mock-id-' + Date.now(),
            title,
            description,
            icon,
            color,
            createdBy: 'mock-user-id',
            topics: [],
            isMock: true
        });
    }

    try {
        const newCourse = new Course({
            title,
            description,
            icon,
            color,
            createdBy: req.user.id,
            topics: []
        });

        const course = await newCourse.save();
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/courses/:id/topics
// @desc    Add a topic (Module) to a course
// @access  Private
router.post('/:id/topics', auth, async (req, res) => {
    const { title, icon } = req.body;

    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        // Check ownership (Optional for demo)
        // if (course.createdBy.toString() !== req.user.id) {
        //   return res.status(401).json({ msg: 'User not authorized' });
        // }

        const newTopic = { title, icon, subtopics: [] };
        course.topics.push(newTopic);

        await course.save();
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/courses/:id/topics/:topicId/subtopics
// @desc    Add a subtopic (Lesson) and create the Crumb content
// @access  Private
router.post('/:id/topics/:topicId/subtopics', auth, async (req, res) => {
    const { title, icon, content, tool } = req.body;

    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        // HYBRID ENGINE INTEGRATION
        // If no content is provided, ask the Content Engine to generate it (RAG + AI)
        let finalContent = content;
        let finalTool = tool;

        if (!finalContent) {
            // "The Google Approach": Generate based on Ground Truths
            const generated = await ContentEngine.generateLesson(title);
            finalContent = generated.content;
            finalTool = generated.tool; // AI might suggest a tool!
        }

        // 1. Create the heavy content "Crumb" first
        const newCrumb = new Crumb({
            title,
            content: finalContent || { text: ["New lesson content..."] },
            tool: finalTool || { type: 'none' },
            generatedBy: !content ? 'hybrid-engine-v1' : 'human'
        });
        const crumb = await newCrumb.save();

        // 2. Link it in the Course hierarchy
        const topicIndex = course.topics.findIndex(t => t._id.toString() === req.params.topicId);
        if (topicIndex === -1) return res.status(404).json({ msg: 'Topic not found' });

        course.topics[topicIndex].subtopics.push({
            title,
            icon,
            crumbId: crumb._id
        });

        await course.save();
        res.json({ course, crumb });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/crumbs/:id
// @desc    Get specific lesson content (Crumb)
// @access  Public
router.get('/crumb/:id', async (req, res) => {
    try {
        const crumb = await Crumb.findById(req.params.id);
        if (!crumb) return res.status(404).json({ msg: 'Crumb not found' });
        res.json(crumb);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/courses/sync
// @desc    Sync local courses to cloud (Upsert)
// @access  Private
router.post('/sync', auth, async (req, res) => {
    const { courses } = req.body;
    const mongoose = require('mongoose');

    if (!Array.isArray(courses)) {
        return res.status(400).json({ msg: 'Courses must be an array' });
    }

    // STRICT SYNC: If DB is not connected, fail. Do not fake it.
    if (mongoose.connection.readyState !== 1) { // 1 = Connected
        console.warn("⚠️ [Sync] DB offline. Rejecting sync request.");
        return res.status(503).json({ msg: 'Database disconnected. Cannot sync.' });
    }

    try {
        const userId = req.user.id;

        // 1. Fetch existing courses to compare timestamps
        const existingCourses = await Course.find({ createdBy: userId }).select('title updatedAt');
        const existingMap = new Map(existingCourses.map(c => [c.title, c]));

        const operations = [];

        courses.forEach(course => {
            const { _id, ...courseData } = course;

            // SAFETY CHECK: Do not sync courses that belong to another user
            // This prevents "Data Contamination" if LocalStorage was shared
            if (course.createdBy && course.createdBy.toString() !== userId) {
                console.warn(`⚠️ Skipping sync for foreign course: "${course.title}" (Owner: ${course.createdBy})`);
                return;
            }

            const existing = existingMap.get(course.title);

            // CONFLICT RESOLUTION: Last Write Wins
            let shouldUpdate = false;

            if (!existing) {
                // New Course: Always Insert
                shouldUpdate = true;
            } else {
                // Existing Course: Compare Timestamps
                const incomTime = new Date(course.updatedAt || 0).getTime();
                const dbTime = new Date(existing.updatedAt || 0).getTime();

                if (incomTime > dbTime) {
                    shouldUpdate = true; // Incoming is newer
                }
            }

            if (shouldUpdate) {
                operations.push({
                    updateOne: {
                        filter: { title: course.title, createdBy: userId },
                        update: {
                            $set: {
                                ...courseData,
                                createdBy: userId
                            }
                        },
                        upsert: true
                    }
                });
            }
        });

        if (operations.length > 0) {
            await Course.bulkWrite(operations);
        }

        // Return latest from DB
        const syncedCourses = await Course.find({ createdBy: userId });
        res.json(syncedCourses);

    } catch (err) {
        console.error("Sync Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- COMMUNITY FEATURES ---

// Publish/Unpublish a Course
router.put('/publish/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        // Ensure owner
        if (course.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        course.isPublic = !course.isPublic;
        // Cache author name if publishing for first time
        if (course.isPublic && !course.authorName) {
            const user = await User.findById(req.user.id);
            course.authorName = user.username;
        }

        await course.save();
        res.json(course);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Get Public Feed (Community)
router.get('/public', async (req, res) => {
    try {
        // Mock Mode Check
        if (mongoose.connection.readyState === 0) {
            return res.json([]);
        }

        const courses = await Course.find({ isPublic: true })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('-topics'); // Lightweight feed (no heavy nested data)
        res.json(courses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Like/Unlike a Course
router.put('/like/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ msg: 'Course not found' });

        // Check if already liked
        if (course.likes.includes(req.user.id)) {
            // Unlike
            course.likes = course.likes.filter(id => id.toString() !== req.user.id);
        } else {
            // Like
            course.likes.push(req.user.id);
        }

        await course.save();
        res.json(course.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Delete a Course
router.delete('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);

        if (!course) {
            return res.status(404).json({ msg: 'Course not found' });
        }

        // Check user
        if (course.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await course.deleteOne();

        res.json({ msg: 'Course removed' });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Course not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
