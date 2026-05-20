// =============================================================================
//  PROMPT CONFIG — single source of truth for every AI prompt in the app.
// =============================================================================
//
//  Tweak any string in here to change the behavior for ALL users on the next
//  deploy. Both edge functions (generate-summary, generate-cover) import from
//  this file. Nothing else in the project should hardcode prompt text.
//
//  Tips:
//   - Keep instructions short and imperative ("Do X", "Never Y").
//   - Don't remove the rules marked "DON'T BREAK" — they prevent regressions
//     (the title-name retry, the no-text-on-cover rules, etc.).
//   - Art-style fragments are duplicated in src/lib/artStyles.ts because the
//     frontend picker needs them too. Keep them in sync by hand.
// =============================================================================

// ---- Models -----------------------------------------------------------------
// Swap to upgrade/downgrade. Keep cover on a multimodal image model.
export const MODELS = {
  // Lightweight pre-purchase concept step. Keep this fast and cheap.
  summary: "openai/gpt-5-mini",
  cover: "google/gemini-3-pro-image-preview",
  // Full-book engine. Long context + strong reasoning.
  book: "openai/gpt-5",
} as const;

// ---- Summary length knobs (Step 9 summary ONLY — not the full book) --------
// The full-book engine has its own length config (STORY_LENGTH_BOOK + the
// perPageWordBounds helper, both lower in this file). Don't conflate them.
export const STORY_LENGTH = {
  min: 65,
  target: 75,
  max: 90,
} as const;


// ---- Art style fragments ----------------------------------------------------
// Verbatim style descriptors fed to the cover image model. The frontend
// picker (src/lib/artStyles.ts) carries the same strings so the preview the
// user sees matches the cover they get. Edit both places when changing.
export const ART_STYLE_PROMPTS: Record<string, string> = {
  watercolor:
    "soft watercolor children's book illustration, hand-painted texture, gentle washes, warm muted palette, paper grain visible, classic storybook feel",
  "cozy-sketch":
    "charming hand-drawn children's book illustration, visible pencil and ink linework, light watercolor wash fill, warm earthy tones, sketchbook feel",
  "bold-bright":
    "modern vibrant children's book illustration, bold black outlines, flat saturated colors, playful punchy palette, contemporary cartoon style",
  "dreamy-pastel":
    "dreamy pastel children's book illustration, soft glowing light, gentle pinks lavenders and creams, ethereal and calm, bedtime story feel",
};

export function getArtStylePrompt(value: string | undefined): string {
  return (
    (value && ART_STYLE_PROMPTS[value]) || ART_STYLE_PROMPTS.watercolor
  );
}

// =============================================================================
//  STORY SUMMARY — generate-summary edge function
// =============================================================================

export const SUMMARY_SYSTEM_PROMPT =
  "You are a children's book author specializing in warm, specific, emotionally resonant personalized stories. Always call the provided tool to return structured output.";

export function SUMMARY_USER_TEMPLATE({
  childName,
  ageBand,
  genre,
  mood,
  lesson,
  interestsLine,
  personalityLine,
  specialThing,
  supportingLine,
  heroQuirk,
  buyerRelationship,
  occasion,
  previousSummary,
}: {
  childName: string;
  ageBand: string;
  genre?: string;
  mood?: string;
  lesson?: string;
  interestsLine?: string;
  personalityLine?: string;
  specialThing?: string;
  supportingLine?: string;
  heroQuirk?: string;
  buyerRelationship?: string;
  occasion?: string;
  previousSummary?: string;
}) {
  return [
    `Write a short customer-facing picture book concept for ${childName}.`,
    `This legacy template is deprecated. Keep it brief, concrete, and selective.`,
    `Use only one primary personalized detail. Do not list traits or interests.`,
    `Write ${STORY_LENGTH.min}-${STORY_LENGTH.max} words, target ${STORY_LENGTH.target}.`,
    `Child: ${childName}, ${ageBand}`,
    genre ? `Genre: ${genre}` : "",
    mood ? `Mood: ${mood}` : "",
    lesson ? `Theme: ${lesson}` : "",
    interestsLine ? `Optional interests: ${interestsLine}` : "",
    personalityLine ? `Private personality direction only: ${personalityLine}` : "",
    specialThing ? `Optional special thing: ${specialThing}` : "",
    supportingLine ? `Optional supporting characters: ${supportingLine}` : "",
    heroQuirk ? `Appearance/signature detail: ${heroQuirk}` : "",
    buyerRelationship ? `Buyer relationship: ${buyerRelationship}` : "",
    occasion ? `Occasion: ${occasion}` : "",
    previousSummary ? `Previous summary to avoid repeating: ${previousSummary}` : "",
  ].filter(Boolean).join("\n");
}

export const TITLE_RETRY_INSTRUCTION = (badTitle: string, childFirstName: string) =>
  `The title "${badTitle}" incorrectly includes the child's name (${childFirstName}). Rewrite the title without any first name or possessive name. Use a concrete object, place, or funny problem instead.`;

// =============================================================================
//  FULL BOOK ENGINE CONFIG CONTINUES BELOW
// =============================================================================
