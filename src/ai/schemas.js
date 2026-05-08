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
        "manim-visualizer",
    ]),
    data: z.any().optional(), // Flexible: { shapes: [...] } or { url: "..." }
    title: z.string().optional(),
    chartType: z.enum(["line", "bar", "area"]).optional(),
    xKey: z.string().optional(),
    dataKey: z.string().optional(),
});

// Define the CrumbSchema
const CrumbSchema = z.object({
    text: z.string().optional(),
    math: z.string().optional(),
    media: MediaSchema.optional(),
    embed: EmbedSchema.optional(),
    code: z.string().optional(),
    tool: ToolSchema.optional(),
}).catchall(z.any());

// Define Quiz Schema
const QuestionSchema = z.object({
    question: z.string().optional(),
    options: z.array(z.string()).min(2, "Must have at least 2 options").optional(),
    correctAnswer: z.string().optional(), // Must match one of the options
    explanation: z.string().optional()
}).catchall(z.any());

// Define the full Lesson schema (Output from AI)
export const LessonSchema = z.object({
    title: z.string().optional(),
    lessonNumber: z.string().optional(),
    topic: z.string().optional(),
    crumbs: z.array(CrumbSchema).min(1, "Lesson must have at least one crumb"),
    quiz: z.object({
        questions: z.array(QuestionSchema).min(1),
        tools: z.array(z.union([z.string(), z.record(z.any())])).optional()
    }).optional() // Active Recall
}).catchall(z.any());
