const express = require('express');
const router = express.Router();
const axios = require('axios');

// Proxy Route for Puter AI
router.post('/generate', async (req, res) => {
    try {
        const { prompt, model, mimeType, puterToken, puterAppId } = req.body;

        console.log(`📡 AI Proxy Request: Length ${prompt?.length}, Model ${model}`);
        console.log(`🔑 Tokens received: Token=${puterToken ? 'Yes (' + puterToken.length + ' chars)' : 'NO'}, AppID=${puterAppId ? 'Yes' : 'NO'}`);

        // Construct the payload for Puter's driver API
        // Based on typical Puter v2 driver calls
        // We'll mimic the structure seen in network logs or standard Puter protocol

        // Option 1: Using 'googleapis' if we had a key, but we want Keyless via Puter
        // Option 2: Mimic the Puter client-side call

        // Let's try to target the exact endpoint user saw: https://api.puter.com/drivers/call
        const payload = {
            interface: "puter-chat-completion-interface-v1",
            driver: model || 'gemini-2.5-flash',
            method: "chat",
            args: [prompt, { responseInfo: { mimeType } }]
        };

        const headers = {
            'Content-Type': 'application/json',
            // Important: Puter might validate Origin. 
            // We'll try setting it to a generic one or localhost if allowed, 
            // but usually "Keyless" assumes a browser environment on puter.com or allowed domains.
            // If this fails, we might need a fallback or real API key.
            'Origin': 'https://puter.com',
            'Referer': 'https://puter.com/',
        };

        // 🔐 Inject Forwarded Credentials
        if (puterToken) {
            // Sanitize: Remove wrapping quotes if they exist (common with localStorage JSON)
            const cleanToken = puterToken.replace(/^"|"$/g, '');
            headers['Authorization'] = `Bearer ${cleanToken}`;
            // Try sending as Cookie too, just in case
            headers['Cookie'] = `token=${cleanToken}; puter_auth_token=${cleanToken}`;
        }
        if (puterAppId) {
            const cleanAppId = puterAppId.replace(/^"|"$/g, '');
            headers['X-Puter-App-Id'] = cleanAppId;
        }

        // Try using the actual client origin instead of spoofing puter.com, 
        // in case the token is bound to localhost.
        headers['Origin'] = 'http://localhost:5173';
        headers['Referer'] = 'http://localhost:5173/';
        headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

        console.log("📤 Sending Headers:", JSON.stringify({ ...headers, Authorization: headers.Authorization ? 'Bearer [HIDDEN]' : 'None' }, null, 2));

        const response = await axios.post('https://api.puter.com/drivers/call', payload, { headers });

        // The response structure from Puter's driver
        res.json(response.data);

    } catch (err) {
        console.error("❌ AI Proxy Error Status:", err.response?.status);
        console.error("❌ AI Proxy Error Data:", JSON.stringify(err.response?.data || err.message, null, 2));

        // Pass the actual Puter error back to frontend
        res.status(err.response?.status || 500).json(err.response?.data || { error: "AI Proxy Failed", details: err.message });
    }
});

module.exports = router;
