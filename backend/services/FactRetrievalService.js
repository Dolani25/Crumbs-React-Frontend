
/**
 * [MOCK / TOY SCRIPT] - STEM Knowledge Graph
 * 
 * In Production: This would connect to WolframAlpha API, Google Knowledge Graph, 
 * or a Vector Database (RAG) containing verified textbooks.
 * 
 * Current State: Hardcoded JSON dictionary of "Exact Truths".
 */

const KNOWLEDGE_GRAPH = {
    "Projectile Motion": {
        formulas: [
            "Range R = (v^2 * sin(2θ)) / g",
            "Height H = (v^2 * sin^2(θ)) / 2g"
        ],
        constants: {
            "g": "9.81 m/s^2 (Standard Gravity)",
            "v": "Initial Velocity (m/s)",
            "θ": "Launch Angle (degrees)"
        },
        definitions: [
            "Projectile: An object upon which the only force is gravity.",
            "Trajectory: The path followed by a projectile flying or an object moving under the action of given forces."
        ]
    },
    "Photosynthesis": {
        formulas: [
            "6CO2 + 6H2O + Light Energy -> C6H12O6 + 6O2"
        ],
        constants: {
            "ATP": "Adenosine Triphosphate",
            "NADPH": "Nicotinamide Adenine Dinucleotide Phosphate"
        },
        definitions: [
            "Photosynthesis: The process by which green plants and some other organisms use sunlight to synthesize foods from carbon dioxide and water."
        ]
    },
    "Calculus": {
        formulas: [
            "Derivative: f'(x) = lim(h->0) (f(x+h) - f(x)) / h",
            "Power Rule: d/dx (x^n) = n*x^(n-1)"
        ],
        constants: {},
        definitions: [
            "Limit: The value that a function (or sequence) approaches as the input (or index) approaches some value."
        ]
    }
};

class FactRetrievalService {
    /**
     * Retrieves verified facts for a given topic.
     * @param {string} topic 
     * @returns {object} Verified facts or null
     */
    static getFacts(topic) {
        console.log(`[KnowledgeGraph] Querying facts for: "${topic}"...`);

        // Simple fuzzy match for the toy script
        const key = Object.keys(KNOWLEDGE_GRAPH).find(k =>
            topic.toLowerCase().includes(k.toLowerCase()) ||
            k.toLowerCase().includes(topic.toLowerCase())
        );

        if (key) {
            console.log(`[KnowledgeGraph] FOUND verified data for "${key}"`);
            return KNOWLEDGE_GRAPH[key];
        }

        console.log(`[KnowledgeGraph] No verified data found. Proceeding with caution.`);
        return null;
    }
}

module.exports = FactRetrievalService;
