const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Unique filename: fieldname-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filter (Optional: restrict to PDF, Images, Text)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|jpeg|jpg|png|text|plain/;
    // Check ext and mime
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images, PDFs, and text files are allowed!'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    // fileFilter: fileFilter // Disable strict filter for now to allow variety
});

// @route   POST api/library/upload
// @desc    Upload a file to user library
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const newFile = {
            filename: req.file.originalname, // Display name
            storedName: req.file.filename,   // Disk name
            path: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
        };

        user.library.push(newFile);
        await user.save();

        res.json(newFile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/library
// @desc    Get all user files
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('library');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user.library);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/library/:id
// @desc    Delete a file
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const fileIndex = user.library.findIndex(f => f._id.toString() === req.params.id);

        if (fileIndex === -1) {
            return res.status(404).json({ msg: 'File not found' });
        }

        const file = user.library[fileIndex];

        // Remove from disk
        // Using file.path directly might be risky if path format differs, 
        // construct from uploads dir is safer but let's try file.path first or fallback.
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch (fsErr) {
            console.error("Failed to delete file from disk:", fsErr);
            // Continue to remove from DB anyway
        }

        user.library.splice(fileIndex, 1);
        await user.save();

        res.json({ msg: 'File removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route  GET api/library/content/:id
// @desc   Get file content (text) for Context
// @access Private
router.get('/content/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const file = user.library.id(req.params.id);

        if (!file) return res.status(404).json({ msg: 'File not found' });

        // Simple text reading for now
        // For PDF/Images, this endpoint would need to do OCR/Extraction
        // Returning raw path for now so frontend processing or specialized backend processing can handle it

        res.json({
            path: file.path,
            mimetype: file.mimetype,
            filename: file.filename
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
