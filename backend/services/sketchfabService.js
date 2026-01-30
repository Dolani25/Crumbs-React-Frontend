const axios = require('axios');

class SketchfabService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.sketchfab.com/v3';
    }

    /**
     * Search for 3D models on Sketchfab
     * @param {string} query - Search query (e.g., "human heart")
     * @param {object} options - Additional filters
     * @returns {Promise<Array>} - Array of model objects
     */
    async searchModels(query, options = {}) {
        try {
            const params = {
                q: query,
                // downloadable: options.downloadable === true, // Fixed: Default to ALL models (view-only is fine for embeds)
                type: 'models',
                count: options.count || 5,
                sort_by: options.sortBy || 'relevance' // Changed default to relevance for better keyword matching
            };

            if (options.downloadable) params.downloadable = true;

            const response = await axios.get(`${this.baseUrl}/search`, {
                params,
                headers: {
                    'Authorization': `Token ${this.apiKey}`
                }
            });

            if (!response.data || !response.data.results) {
                return [];
            }

            // Transform to simpler format
            return response.data.results.map(model => ({
                uid: model.uid,
                name: model.name,
                description: model.description,
                thumbnailUrl: model.thumbnails?.images?.[0]?.url || null,
                embedUrl: `https://sketchfab.com/models/${model.uid}/embed`,
                viewUrl: model.viewerUrl,
                isDownloadable: model.isDownloadable,
                likeCount: model.likeCount,
                author: model.user?.displayName || 'Unknown'
            }));

        } catch (error) {
            console.error('Sketchfab API Error:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Get embed URL for a specific model
     * @param {string} modelId - Sketchfab model UID
     * @returns {string} - Embed URL
     */
    getEmbedUrl(modelId, options = {}) {
        const params = new URLSearchParams({
            autostart: options.autostart ? '1' : '0',
            preload: '1',
            ui_stop: '0',
            ui_infos: options.showInfo ? '1' : '0',
            ui_inspector: '0',
            ui_watermark_link: '1',
            ui_watermark: '1',
            ui_help: '0',
            ui_settings: '0',
            ui_vr: '0',
            ui_ar: '0'
        });

        return `https://sketchfab.com/models/${modelId}/embed?${params.toString()}`;
    }

    /**
     * Get model details
     * @param {string} modelId - Sketchfab model UID
     * @returns {Promise<Object>} - Model details
     */
    async getModelDetails(modelId) {
        try {
            const response = await axios.get(`${this.baseUrl}/models/${modelId}`, {
                headers: {
                    'Authorization': `Token ${this.apiKey}`
                }
            });

            return response.data;
        } catch (error) {
            console.error('Sketchfab API Error:', error.response?.data || error.message);
            return null;
        }
    }
}

module.exports = SketchfabService;
