const axios = require('axios');

async function testProxy() {
    console.log("🧪 Testing AI Proxy Endpoint...");
    try {
        // Direct call to Puter API to see raw error
        console.log("1. Direct Call to Puter...");
        const payload = {
            interface: "puter-chat-completion-interface-v1",
            driver: 'gemini-2.5-flash',
            method: "chat",
            args: ["Say hello!", { responseInfo: { mimeType: "application/json" } }]
        };

        try {
            const res1 = await axios.post('https://api.puter.com/drivers/call', payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'Origin': 'https://puter.com',
                    'Referer': 'https://puter.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            console.log("✅ Puter Direct Success:", res1.status);
            console.log(JSON.stringify(res1.data, null, 2));
        } catch (e) {
            console.log("❌ Puter Direct Failed:", e.message);
            if (e.response) {
                console.log("Status:", e.response.status);
                console.log("Data:", JSON.stringify(e.response.data, null, 2));
            }
        }

        // Call our local Proxy
        console.log("\n2. Call Local Proxy...");
        const res2 = await axios.post('http://localhost:5000/api/ai/generate', {
            prompt: "Say hello!",
            model: 'gemini-2.5-flash',
            mimeType: "application/json"
        });
        console.log("✅ Proxy Success:", res2.status);
        console.log(res2.data);

    } catch (err) {
        console.log("❌ Proxy Failed:", err.message);
        if (err.response) {
            console.log("Detailed:", err.response.data);
        }
    }
}

testProxy();
