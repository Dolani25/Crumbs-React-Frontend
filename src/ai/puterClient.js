/**
 * Puter.js Client — Single source of truth for all AI calls.
 * Uses the official @heyputer/puter.js npm package.
 * No backend proxy, no manual token forwarding.
 * Auth is handled automatically by the SDK via the browser.
 */

// The npm package exposes puter as the default export
import puter from '@heyputer/puter.js';

// Re-export the puter instance for direct access (auth, fs, etc.)
export { puter };

/**
 * Chat with Puter AI.
 * 
 * @param {string | Array} prompt - A string prompt or messages array
 * @param {Object} options - Options (model, stream, etc.)
 * @returns {Promise<{message: {role: string, content: string}}>} ChatResponse
 */
export async function chatWithPuter(prompt, options = {}) {
    const model = options.model || 'gemini-2.5-flash';
    
    // Remove our custom 'model' key and pass the rest as Puter options
    const { model: _m, ...rest } = options;

    const response = await puter.ai.chat(prompt, {
        model,
        ...rest
    });

    // puter.ai.chat() returns a ChatResponse: { message: { role, content } }
    // Normalize: sometimes the response is a plain string (test mode)
    if (typeof response === 'string') {
        return { message: { role: 'assistant', content: response } };
    }

    return response;
}
