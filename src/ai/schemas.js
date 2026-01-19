import { z } from "zod";

// Define the schema for media objects
const MediaSchema = z.object({
    image: z.string().url().optional(),
    video: z.string().url().optional(),
});

// Define the schema for embedded content
const EmbedSchema = z.object({
    type: z.enum(["iframe"]),
    src: z.string().url(),
    width: z.string().optional(),
    height: z.string().optional(),
    title: z.string().optional(),
});

// Define the schema for interactive tools
const ToolSchema = z.object({
    type: z.enum([
        "molecule-viewer",
        "graph-viewer",
        "desmos-grapher",
        "concept-graph",
        "physics-sandbox",
        "historical-map",
        "model-viewer",
        "video-explainer",
        "volume-viewer",
        "process-flow",
    ]),
    data: z.any().optional(), // Flexible: { shapes: [...] } or { url: "..." }
    title: z.string().optional(),
    chartType: z.enum(["line", "bar", "area"]).optional(),
    xKey: z.string().optional(),
    dataKey: z.string().optional(),
});

// Define the Crumb schema
const CrumbSchema = z.object({
    text: z.string().min(1, "Crumb text cannot be empty"),
    media: MediaSchema.optional(),
    embed: EmbedSchema.optional(),
    code: z.string().optional(),
    tool: ToolSchema.optional(),
});

// Define Quiz Schema
const QuestionSchema = z.object({
    question: z.string(),
    options: z.array(z.string()).min(2, "Must have at least 2 options"),
    correctAnswer: z.string(), // Must match one of the options
    explanation: z.string().optional()
});

// Define the full Lesson schema (Output from AI)
export const LessonSchema = z.object({
    title: z.string(),
    lessonNumber: z.string(),
    topic: z.string(),
    crumbs: z.array(CrumbSchema).min(1, "Lesson must have at least one crumb"),
    quiz: z.object({
        questions: z.array(QuestionSchema).min(1),
        tools: z.array(z.string()).optional() // List of tool types e.g. ["molecule-viewer"]
    }).optional() // Active Recall
});
