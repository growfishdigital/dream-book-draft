// Shared AI model and lightweight summary settings.
// Keep this file dependency-free so pre-purchase summary does not import the full book engine.

export const MODELS = {
  // Lightweight pre-purchase concept step. Keep this fast and cheap.
  summary: "openai/gpt-5-mini",
  cover: "google/gemini-3-pro-image-preview",
  // Full-book engine. Long context + strong reasoning. Runs after purchase / async.
  book: "openai/gpt-5",
  // Post-payment blueprint planner. Can be heavier than summary.
  bookPlan: "openai/gpt-5",
} as const;

export const STORY_LENGTH = {
  min: 65,
  target: 75,
  max: 90,
} as const;
