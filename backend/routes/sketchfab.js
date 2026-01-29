const express = require('express');
const router = express.Router();
const SketchfabService = require('../services/sketchfabService');

// Initialize service with API key from env
const sketchfabService = new SketchfabService(process.env.SKETCHFAB_API_KEY);

/**
 * Search for 3D models
 * GET /api/sketchfab/search?q=human+heart&count=5
 */
router.get('/search', async (req, res) => {
    try {
        const { q, count, sortBy } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        if (!process.env.SKETCHFAB_API_KEY) {
            return res.status(500).json({ error: 'Sketchfab API key not configured' });
        }

        const models = await sketchfabService.searchModels(q, {
            count: parseInt(count) || 5,
            sortBy
        });

        res.json(models);

    } catch (error) {
        console.error('Sketchfab search error:', error);
        res.status(500).json({ error: 'Failed to search Sketchfab' });
    }
});

/**
 * Get embed URL for a model
 * GET /api/sketchfab/embed/:modelId
 */
router.get('/embed/:modelId', (req, res) => {
    try {
        const { modelId } = req.params;
        const { autostart, showInfo } = req.query;

        const embedUrl = sketchfabService.getEmbedUrl(modelId, {
            autostart: autostart === 'true',
            showInfo: showInfo === 'true'
        });

        res.json({ embedUrl });

    } catch (error) {
        console.error('Sketchfab embed error:', error);
        res.status(500).json({ error: 'Failed to generate embed URL' });
    }
});

/**
 * Get model details
 * GET /api/sketchfab/model/:modelId
 */
router.get('/model/:modelId', async (req, res) => {
    try {
        const { modelId } = req.params;

        if (!process.env.SKETCHFAB_API_KEY) {
            return res.status(500).json({ error: 'Sketchfab API key not configured' });
        }

        const details = await sketchfabService.getModelDetails(modelId);

        if (!details) {
            return res.status(404).json({ error: 'Model not found' });
        }

        res.json(details);

    } catch (error) {
        console.error('Sketchfab model details error:', error);
        res.status(500).json({ error: 'Failed to fetch model details' });
    }
});

module.exports = router;
