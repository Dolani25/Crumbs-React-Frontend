import { LessonSchema } from "./schemas";
import systemPrompt from "./davinci_prompt.md?raw";
import { chatWithPuter } from './puterClient';

export const generateCrumb = async (courseName, subtopicTitle) => {
    console.log(`🧠 Generating lesson for: ${courseName} - ${subtopicTitle}`);

    // 1. Construct the Prompt
    const fullPrompt = `
${systemPrompt}

User Request:
Course: ${courseName}
Topic: ${subtopicTitle}

Remember to return ONLY valid JSON matching the schema.
`;

    // 2. Call Puter AI directly via official SDK (no backend proxy needed)
    const maxRetries = 2;
    let attempt = 0;
    let validatedLesson = null;

    while (attempt <= maxRetries) {
        try {
            console.log(`🧠 Attempt ${attempt + 1}: Generating lesson via Puter AI`);
            const response = await chatWithPuter(fullPrompt, { model: 'gemini-2.5-flash' });

            // Debug: Ensure the message structure exists
            if (!response || !response.message) {
                console.error("Unexpected AI API Response:", response);
                throw new Error(`Puter API Error: ${JSON.stringify(response)}`);
            }

            // 3. Raw Response (Should be valid JSON now)
            const cleanJson = response.message.content;

            // Helper: Aggressive JSON Repair
            const repairJson = (str) => {
                let clean = str.replace(/```json/gi, "").replace(/```/g, "").trim();
                
                try {
                    // First pass: Standard parse
                    return JSON.parse(clean);
                } catch (e1) {
                    console.warn("⚠️ JSON Parse failed. Input (first 200 chars):", clean.slice(0, 200));
                    try {
                        // Second pass: Fix invalid escape sequences (e.g., \s, \c, \alpha in LaTeX)
                        console.warn("⚠️ Repair attempt 2: Fixing escape sequences...");
                        const repaired = clean.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
                        return JSON.parse(repaired);
                    } catch (e2) {
                        try {
                            // Third pass: Catch unescaped control characters inside strings
                            console.warn("⚠️ Repair attempt 3: Fixing newlines in strings...");
                            let inString = false;
                            let out = "";
                            for (let i = 0; i < clean.length; i++) {
                                let c = clean[i];
                                let isEscape = false;
                                let b = i - 1;
                                while (b >= 0 && clean[b] === '\\') {
                                    isEscape = !isEscape;
                                    b--;
                                }
                                if (c === '"' && !isEscape) {
                                    inString = !inString;
                                }
                                if (inString) {
                                    if (c === '\n') out += "\\n";
                                    else if (c === '\r') out += "\\r";
                                    else if (c === '\t') out += "\\t";
                                    else out += c;
                                } else {
                                    out += c;
                                }
                            }
                            const repaired2 = out.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
                            return JSON.parse(repaired2);
                        } catch (e3) {
                            console.error("❌ Final JSON parse failed:", e3);
                            throw e3;
                        }
                    }
                }
            };

            const parsedData = repairJson(cleanJson);

            // 4. Validate with Zod
            validatedLesson = LessonSchema.parse(parsedData);
            console.log("✅ AI Response Validated Successfully");
            break; // Success, exit retry loop
            
        } catch (error) {
            console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error.message);
            attempt++;
            if (attempt > maxRetries) {
                console.error("❌ Max retries reached. Generation failed.");
                throw new Error("AI generation failed or was truncated. Please try again.");
            }
        }
    }

        // 5. Post-Process: Retrieve REAL Images from Wikimedia (ScholarLens Lite)
        console.log("🔍 ScholarLens: Searching for real scientific images...");

        // Helper to search Wikimedia with Timeout
        const searchWikimedia = async (query) => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            try {
                const endpoint = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=pageimages&piprop=original&format=json&origin=*`;
                const res = await fetch(endpoint, { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await Promise.race([
                    res.json(),
                    new Promise((_, rej) => setTimeout(() => rej(new Error("JSON Timeout")), 3000))
                ]);

                if (data.query && data.query.pages) {
                    const pageId = Object.keys(data.query.pages)[0];
                    const page = data.query.pages[pageId];
                    if (page.original && page.original.source) {
                        return page.original.source;
                    }
                }
                return null;
            } catch (err) {
                console.warn("Wikimedia search failed or timed out for:", query, err.message || err.name);
                return null; // Fail gracefully (no image)
            } finally {
                clearTimeout(timeoutId);
            }
        };

        const updatedCrumbs = await Promise.all(validatedLesson.crumbs.map(async (crumb) => {
            if (crumb.media && crumb.media.image && crumb.media.image.includes("picsum")) {
                try {
                    // Extract keyword
                    const urlParts = crumb.media.image.split('/');
                    let keyword = urlParts[urlParts.indexOf('seed') + 1] || "science_diagram";

                    // Clean keyword: Remove underscores, numbers
                    keyword = keyword.replace(/_/g, ' ').replace(/[0-9]/g, '').trim();

                    // Search for real image
                    const contextSuffix = " scientific diagram";
                    const searchTerm = `${keyword}${contextSuffix}`;
                    console.log(`🔍 Searching Wikimedia for: ${searchTerm}`);

                    let realImageUrl = await searchWikimedia(searchTerm);

                    if (!realImageUrl) {
                        console.log(`⚠️ Retry: Searching for "${keyword} structure"`);
                        realImageUrl = await searchWikimedia(`${keyword} structure`);
                    }

                    if (realImageUrl) {
                        return {
                            ...crumb,
                            media: { ...crumb.media, image: realImageUrl }
                        };
                    } else {
                        console.log(`⚠️ Fallback: Searching for "${keyword} science"`);
                        const fallbackUrl = await searchWikimedia(keyword + " science");
                        if (fallbackUrl) {
                            return {
                                ...crumb,
                                media: { ...crumb.media, image: fallbackUrl }
                            };
                        }
                    }

                    // If all fails, remove the image media entirely check
                    const { media, ...rest } = crumb;
                    return rest;

                } catch (imgErr) {
                    console.error("Image retrieval failed:", imgErr);
                    const { media, ...rest } = crumb;
                    return rest;
                }
            }
            return crumb;
        }));

        validatedLesson.crumbs = updatedCrumbs;

        // 6. Post-Process: Fetch Sketchfab 3D Models (if requested)
        // 6. Post-Process: Fetch Sketchfab 3D Models (if requested)
        try {
            // Check Data Saver Mode with explicit timeout in case IDB hangs
            const checkDataSaver = async () => {
                const storageModule = await import('../utils/secureStorage.js');
                return await storageModule.secureStorage.getItem('crumbs_data_saver');
            };
            
            const isSaverOn = await Promise.race([
                checkDataSaver(),
                new Promise(resolve => setTimeout(() => resolve(false), 2000)) // 2s timeout
            ]).catch(err => {
                console.warn("Data saver check failed or timed out, defaulting to false.", err);
                return false;
            });


            for (const crumb of validatedLesson.crumbs) {
                if (crumb.tool?.type === 'model-viewer' && crumb.tool.data?.sketchfab) {
                    // Check data saving mode
                    if (isSaverOn) {
                        console.warn('⚠️ Sketchfab disabled by data saving mode - using AI fallback');
                        // Preserve title from query
                        if (crumb.tool.data.query) {
                            crumb.tool.data.title = crumb.tool.data.title || crumb.tool.data.query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            delete crumb.tool.data.query;
                        }
                        delete crumb.tool.data.sketchfab;
                        // Convert to fallback procedural model
                        crumb.tool.data.shapes = [
                            { shape: 'box', args: [1, 1, 1], color: '#888' }
                        ];
                        continue;
                    }

                    // Fetch from Sketchfab API
                    const query = crumb.tool.data.query;
                    console.log(`🎨 Fetching Sketchfab model: "${query}"`);

                    try {
                        const response = await fetch(`/api/sketchfab/search?q=${encodeURIComponent(query)}&count=1`);

                        if (!response.ok) {
                            throw new Error(`Sketchfab API error: ${response.status}`);
                        }

                        const models = await response.json();

                        if (models && models.length > 0) {
                            // Use first result
                            const model = models[0];
                            console.log(`✅ Found Sketchfab model: "${model.name}"`);

                            crumb.tool.data = {
                                url: model.embedUrl,
                                attribution: model.name,
                                source: 'sketchfab',
                                author: model.author
                            };
                        } else {
                            console.warn(`⚠️ No Sketchfab models found for "${query}" - using AI fallback`);
                            console.warn(`⚠️ No Sketchfab models found for "${query}" - using AI fallback`);
                            crumb.tool.data.title = query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                            delete crumb.tool.data.sketchfab;
                            // Only overwrite shapes if none were provided by AI
                            if (!crumb.tool.data.shapes || crumb.tool.data.shapes.length === 0) {
                                crumb.tool.data.shapes = [
                                    { shape: 'sphere', args: [1, 32, 16], color: '#4a90e2' },
                                    { shape: 'label', text: 'Model Not Found', position: [0, 1.5, 0] }
                                ];
                            }
                        }
                    } catch (error) {
                        console.error(`❌ Sketchfab fetch failed for "${query}":`, error);
                        console.error(`❌ Sketchfab fetch failed for "${query}":`, error);
                        // Fallback to procedural
                        crumb.tool.data.title = query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        delete crumb.tool.data.sketchfab;
                        if (!crumb.tool.data.shapes || crumb.tool.data.shapes.length === 0) {
                            crumb.tool.data.shapes = [
                                { shape: 'sphere', args: [1, 32, 16], color: '#e74c3c' },
                                { shape: 'label', text: '3D Model Unavailable', position: [0, 1.5, 0] }
                            ];
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Sketchfab processing error:', error);
            // Continue even if Sketchfab fails
        }

        console.log("✅ DavinciGenerator Finished Successfully! Returning lesson:", validatedLesson.title);
        return validatedLesson;
};

/**
 * ADAPTIVE LEARNING ENGINE
 * Generates a specific visual/interactive tool to remedy a failed concept.
 */
export const generateRemedialCrumb = async (courseName, failedConcept, userWeakness = "visual") => {
    console.log(`🚑 Generating Remedial Crumb for: ${failedConcept} (Mode: ${userWeakness})`);

    const remedialPrompt = `
### ROLE
You are the "Learning DNA" Engine.
The student FAILED a text-based quiz on the concept: "${failedConcept}" in the course "${courseName}".
Your goal is to fix this misunderstanding using a VISUAL or INTERACTIVE tool.

### STRICT RULES
1. **NO TEXT CRUMBS**: Do not generate a simple text explanation.
2. **TOOL SELECTION**: You MUST use one of these tools:
   - "video-explainer" (Best for derivations/processes)
   - "volume-viewer" (Best for 3D internals/geology)
   - "physics-sandbox" (Best for forces/motion)
   - "model-viewer" (Best for structure)
3. **OUTPUT**: A SINGLE JSON object representing one "Crumb".
   - Schema: { "text": "Short intro...", "tool": { "type": "...", "data": ... } }
   - Escape all backslashes in JSON (\\frac).

### CONTEXT
Student seems to be a "${userWeakness}" learner.
Generate a specific interaction that makes "${failedConcept}" click.
`;

    try {
        const response = await chatWithPuter(remedialPrompt, { model: 'gemini-2.5-flash' });

        const cleanJson = response.message.content;
        const crumb = JSON.parse(cleanJson);
        // Minimal validation - check if tool exists
        if (!crumb.tool) throw new Error("AI failed to generate a tool.");
        return crumb;
    } catch (e) {
        console.error("Remediation Gen Failed", e);
        // Fallback static remediation
        return {
            text: "Let's visualize this simply.",
            tool: {
                type: "video-explainer",
                data: {
                    title: "Remedial Visualization",
                    scenes: [{ type: "INTRO", text_overlay: failedConcept, background_color: "#000" }]
                }
            }
        };
    }
};
