const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET api/posts
// @desc    Get all posts (Feed)
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/posts
// @desc    Create a new post
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const newPost = new Post({
            user: req.user.id,
            username: user.username || 'Anonymous',
            content: req.body.content,
            type: req.body.type || 'general',
            context: req.body.context || {}
        });

        const post = await newPost.save();
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        if (post.likes.includes(req.user.id)) {
            // Unlike
            post.likes = post.likes.filter(id => id.toString() !== req.user.id);
        } else {
            post.likes.unshift(req.user.id);
        }

        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
