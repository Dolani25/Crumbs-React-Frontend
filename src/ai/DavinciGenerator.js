import { LessonSchema } from "./schemas";
import systemPrompt from "./davinci_prompt.md?raw";

export const generateCrumb = async (courseName, subtopicTitle) => {
    console.log(`🧠 Generating lesson for: ${courseName} - ${subtopicTitle}`);

    // Helper to wait for Puter (up to 5s)
    const waitForPuter = async () => {
        let attempts = 0;
        while (!window.puter && attempts < 20) { // 20 * 250ms = 5s
            await new Promise(r => setTimeout(r, 250));
            attempts++;
        }
        if (!window.puter) throw new Error("Puter.js not loaded. Cannot generate content.");
    };

    await waitForPuter();

    // 1. Construct the Prompt
    const fullPrompt = `
${systemPrompt}

User Request:
Course: ${courseName}
Topic: ${subtopicTitle}

Remember to return ONLY valid JSON matching the schema.
`;

    try {
        // 2. Call Puter Keyless AI with specific model
        const response = await window.puter.ai.chat(fullPrompt, { model: 'gemini-2.5-flash' });

        // 3. Extract JSON from potential Markdown formatting
        let cleanJson = response.message.content;

        // More robust JSON cleaning: Find first '{' and last '}'
        const jsonStartIndex = cleanJson.indexOf('{');
        const jsonEndIndex = cleanJson.lastIndexOf('}');

        if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            cleanJson = cleanJson.substring(jsonStartIndex, jsonEndIndex + 1);
        } else {
            // Fallback: simple markdown strip
            cleanJson = cleanJson.replace(/```json/g, "").replace(/```/g, "").trim();
        }

        // Remove conversational text if any remains before/after
        // (The substring usually handles it, but just in case)

        const parsedData = JSON.parse(cleanJson);

        // 4. Validate with Zod
        let validatedLesson = LessonSchema.parse(parsedData);
        console.log("✅ AI Response Validated Successfully");

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
                const data = await res.json();

                if (data.query && data.query.pages) {
                    const pageId = Object.keys(data.query.pages)[0];
                    const page = data.query.pages[pageId];
                    if (page.original && page.original.source) {
                        return page.original.source;
                    }
                }
                return null;
            } catch (err) {
                console.warn("Wikimedia search failed or timed out for:", query, err.name);
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
                    // Strategy: Search for "keyword diagram" first for scientific accuracy
                    // Fix: Add context to avoid generic keywords triggering irrelevant results
                    const contextSuffix = " scientific diagram";
                    const searchTerm = `${keyword}${contextSuffix}`;
                    console.log(`🔍 Searching Wikimedia for: ${searchTerm}`);

                    let realImageUrl = await searchWikimedia(searchTerm);

                    if (!realImageUrl) {
                        // Retry with "structure" or "engineering"
                        console.log(`⚠️ Retry: Searching for "${keyword} structure"`);
                        realImageUrl = await searchWikimedia(`${keyword} structure`);
                    }

                    if (realImageUrl) {
                        return {
                            ...crumb,
                            media: { ...crumb.media, image: realImageUrl }
                        };
                    } else {
                        // Fallback 2: Try searching for "scientific illustration"
                        // ... or just keep placeholder? Let's try one broad search.
                        const fallbackUrl = await searchWikimedia(keyword + " science");
                        if (fallbackUrl) {
                            return {
                                ...crumb,
                                media: { ...crumb.media, image: fallbackUrl }
                            };
                        }
                    }

                    // If all fails, remove the image media entirely to avoid confusion
                    const { media, ...rest } = crumb;
                    return rest;

                } catch (imgErr) {
                    console.error("Image retrieval failed:", imgErr);
                    // On error, also return without media
                    const { media, ...rest } = crumb;
                    return rest;
                }
            }
            return crumb;
        }));

        validatedLesson.crumbs = updatedCrumbs;

        return validatedLesson;

    } catch (error) {
        console.error("❌ AI Generation/Validation Failed:", error);

        // Return a fallback or rethrow
        throw new Error("Failed to generate valid lesson content. " + error.message);
    }
};

/**
 * ADAPTIVE LEARNING ENGINE
 * Generates a specific visual/interactive tool to remedy a failed concept.
 */
export const generateRemedialCrumb = async (courseName, failedConcept, userWeakness = "visual") => {
    console.log(`🚑 Generating Remedial Crumb for: ${failedConcept} (Mode: ${userWeakness})`);

    if (!window.puter) {
        // Simple internal wait if not loaded
        await new Promise(r => setTimeout(r, 1000));
        if (!window.puter) throw new Error("Puter not ready");
    }

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
        const response = await window.puter.ai.chat(remedialPrompt, { model: 'gemini-2.5-flash' });
        let cleanJson = response.message.content.replace(/```json/g, "").replace(/```/g, "").trim();
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
