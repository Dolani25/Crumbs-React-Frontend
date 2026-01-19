
// Use Puter.js for AI Parsing (No API Key needed)
export const parseCourseWithGemini = async (text) => {
    if (!window.puter) {
        throw new Error("Puter.js is not loaded.");
    }

    try {
        const prompt = `
        You are an expert curriculum developer. 
        Analyze the following text extracted from a course outline PDF. 
        Your goal is to extract **ALL Courses** detected in the text.
        
        For each course, extract its **Name** (e.g., "PGG 221 - Intro to Petroleum") and a list of **Subtopics** (Units, Modules, or Topics).
        For each subtopic, suggest a relevant **Line Awesome icon class** (e.g., "las la-book", "las la-atom", "las la-calculator").
        
        Return ONLY a valid JSON object with this structure:
        {
            "courses": [
                {
                    "name": "Course 1 Title",
                    "subtopics": [
                        { "title": "Subtopic 1", "icon": "las la-book" }
                    ]
                },
                {
                    "name": "Course 2 Title",
                    "subtopics": [ ... ]
                }
            ]
        }
        
        Rules:
        1. Extract EVERY course listed (e.g., if there are 8 courses, return 8 objects).
        2. Ignore administrative details (dates, office hours).
        3. Ensure the JSON is valid and strictly follows the schema.

        Text to analyze:
        ${text.substring(0, 30000)}
        `;

        // Puter.js call - Using Gemini 2.5 Flash for speed/context
        const response = await window.puter.ai.chat(prompt, { model: 'gemini-2.5-flash' });

        // Extract content
        let jsonString = response.message.content;
        jsonString = jsonString.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();

        const parsedData = JSON.parse(jsonString);

        // Transform to our app's internal structure
        // Helper to map a single course node
        const mapCourse = (c, idx) => ({
            id: Date.now() + idx, // Unique-ish ID
            name: c.name || "Extracted Course",
            progress: 0,
            image: { url: `https://picsum.photos/seed/${JSON.stringify(c.name)}/200/300` },
            subtopics: (c.subtopics || []).map((sub, sIdx) => ({
                id: sIdx + 1,
                title: sub.title,
                icon: sub.icon || "las la-book",
                image: { url: `https://picsum.photos/seed/${sIdx}-${sub.title}/50/50` }
            }))
        });

        // Handle both single-object return (hallucination safeguard) and array wrapper
        if (parsedData.courses && Array.isArray(parsedData.courses)) {
            return parsedData.courses.map((c, i) => mapCourse(c, i));
        } else if (parsedData.name && parsedData.subtopics) {
            // AI returned just one course despite instructions
            return [mapCourse(parsedData, 0)];
        } else {
            console.warn("Unexpected AI JSON structure:", parsedData);
            return [];
        }

    } catch (error) {
        console.error("Puter AI Parsing Error:", error);
        throw error;
    }
};
