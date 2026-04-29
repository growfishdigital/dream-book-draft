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
  summary: "openai/gpt-5-mini",
  cover: "google/gemini-3-pro-image-preview",
} as const;

// ---- Story length knobs -----------------------------------------------------
// Used inside the user prompt and as a soft target the model aims for.
export const STORY_LENGTH = {
  min: 80,
  target: 100,
  max: 130,
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

// System message for the summary model. Must keep the "always call the tool"
// instruction or structured output breaks.
export const STORY_SYSTEM_PROMPT =
  "You write personalized children's book summaries. Always call the provided tool to return your output — never reply in plain text.";

export interface StoryPromptCtx {
  childName: string;
  ageBand: string;
  gender?: string;
  genre?: string;
  mood?: string;
  lesson?: string;
  /** Pre-joined "interest1, interest2, customInterest". */
  interestsLine?: string;
  /** Pre-joined "Name (relationship) — trait, trait, …". */
  supportingLine?: string;
  specialThing?: string;
  /** Previous summary text when user asked for a refresh. */
  previousSummary?: string;
}

// Builds the user prompt for the summary model.
// DON'T BREAK: the "NEVER include the child's name in the title" rule — the
// retry loop in generate-summary depends on the model trying to obey it.
export function STORY_USER_TEMPLATE(ctx: StoryPromptCtx): string {
  const {
    childName,
    ageBand,
    gender,
    genre,
    mood,
    lesson,
    interestsLine,
    supportingLine,
    specialThing,
    previousSummary,
  } = ctx;

  return [
    `Write a single, complete story summary for a personalized children's book.`,
    ``,
    `Hero: ${childName} (age band: ${ageBand})${gender ? `, gender: ${gender}` : ""}`,
    genre ? `Genre: ${genre}` : "",
    mood ? `Mood: ${mood}` : "",
    lesson ? `Lesson / theme: ${lesson}` : "",
    interestsLine ? `Interests woven in: ${interestsLine}` : "",
    supportingLine ? `Supporting characters: ${supportingLine}` : "",
    specialThing ? `Special object/companion: ${specialThing}` : "",
    ``,
    `Requirements:`,
    `- Title: short, warm, kid-appropriate (≤ 60 chars). NEVER include the child's name (${childName}) or any first name in the title — focus on the adventure, object, place, or theme instead.`,
    `- Summary: ONE paragraph, target ~${STORY_LENGTH.target} words (hard min ${STORY_LENGTH.min}, hard max ${STORY_LENGTH.max}).`,
    `- Use ${childName}'s name as the hero IN THE SUMMARY ONLY. Mention supporting characters by name where natural.`,
    `- Voice: warm, gentle, magical — like a parent reading aloud.`,
    `- Hint at the lesson; do NOT spoil the ending.`,
    `- No headings, no bullet lists, no quotation marks around the summary.`,
    previousSummary
      ? `\nThe previous attempt is below — write something distinctly DIFFERENT (different setting, twist, or framing). Do not repeat its opening line.\nPrevious:\n${previousSummary}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// Re-prompt nudge when the model returns a title containing the child's name.
// DON'T BREAK: the function loops up to 3 times with this feedback.
export function TITLE_RETRY_INSTRUCTION(
  badTitle: string,
  firstName: string,
): string {
  return `Your previous title was: "${badTitle}". It violated the rule because it contains the child's first name${firstName ? ` "${firstName}"` : ""}. Generate a NEW title that does NOT contain any first names — focus on the adventure, object, place, theme, or feeling instead. Keep the same summary style.`;
}

// =============================================================================
//  COVER ART — generate-cover edge function
// =============================================================================

export interface CoverPromptCtx {
  title: string;
  summary: string;
  childName: string;
  /** Pre-joined "hair: brown, eyes: hazel, …". May be empty. */
  protoDesc: string;
  /** Style fragment from ART_STYLE_PROMPTS. */
  styleHint: string;
  /** True if a style reference image is attached. */
  hasStyleReference: boolean;
  /** True if a child likeness photo is attached. */
  hasPhoto: boolean;
}

// Builds the cover image prompt.
// DON'T BREAK: the "no visible name on the cover" and "no author byline"
// rules — Step 11 renders "written for: <child>" client-side instead.
export function COVER_PROMPT_TEMPLATE(ctx: CoverPromptCtx): string {
  const {
    title,
    summary,
    childName,
    protoDesc,
    styleHint,
    hasStyleReference,
    hasPhoto,
  } = ctx;

  return [
    `Children's book cover illustration in ${styleHint}.`,
    hasStyleReference
      ? `The FIRST attached image is a STYLE REFERENCE — match its illustration technique, line quality, color palette, and overall finish exactly. Do NOT copy its subject, pose, or composition; only mimic its visual style.`
      : "",
    `Title to display on the cover: "${title}". Render this title text exactly as given — do NOT add the child's name or any first name to the title.`,
    `Hero (depicted in the art only, NOT named in any visible text): ${childName}.${protoDesc ? ` Character details — ${protoDesc}.` : ""}`,
    hasPhoto
      ? `The ${hasStyleReference ? "SECOND" : "attached"} image is a likeness reference for the child (face shape, hair, skin tone) — render the child in the chosen art style, not photo-realistically. Keep it kind, warm, and age-appropriate.`
      : "",
    `Scene inspired by: ${summary.slice(0, 600)}`,
    `Composition: portrait orientation (2:3), the title clearly readable at the top or centered, no extra text, no author byline, no watermarks. Do NOT include "${childName}" or any name as visible text on the cover.`,
    `Tone: magical, hopeful, suitable for young children.`,
  ]
    .filter(Boolean)
    .join(" ");
}
