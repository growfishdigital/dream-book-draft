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
  // Full-book engine. Long context + strong reasoning. Swappable to
  // "anthropic/claude-sonnet-4-5" once an Anthropic key is wired in.
  book: "google/gemini-2.5-pro",
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
  /** Story output language (e.g. "english", "español"). */
  language?: string;
  genre?: string;
  mood?: string;
  lesson?: string;
  /** Pre-joined "interest1, interest2, …". */
  interestsLine?: string;
  /** Pre-joined "trait1, trait2, …" describing the hero's personality. */
  personalityLine?: string;
  /** Pre-joined "Name (relationship) — trait, trait. Description." */
  supportingLine?: string;
  /** Pre-joined detailed special-thing line, e.g.
   *  "stuffed-animal — bear named Floppy, purple with a pink belly". */
  specialThing?: string;
  /** Free-text appearance quirk for the hero (e.g. "lost a front tooth"). */
  heroQuirk?: string;
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
    language,
    genre,
    mood,
    lesson,
    interestsLine,
    personalityLine,
    supportingLine,
    specialThing,
    heroQuirk,
    previousSummary,
  } = ctx;

  const langLabel = (language || "").trim().toLowerCase();
  const langLine =
    langLabel && langLabel !== "english"
      ? `Write the title AND the summary in ${language}. Do not include any English.`
      : "";

  return [
    `Write a single, complete story summary for a personalized children's book.`,
    ``,
    `Hero: ${childName} (age band: ${ageBand})${gender ? `, gender: ${gender}` : ""}`,
    personalityLine ? `Hero's personality: ${personalityLine}` : "",
    heroQuirk ? `Hero's signature detail: ${heroQuirk}` : "",
    genre ? `Genre: ${genre}` : "",
    mood ? `Mood: ${mood}` : "",
    lesson ? `Lesson / theme: ${lesson}` : "",
    interestsLine ? `Interests woven in: ${interestsLine}` : "",
    supportingLine ? `Supporting characters: ${supportingLine}` : "",
    specialThing ? `Special object/companion to feature: ${specialThing}` : "",
    ``,
    `Requirements:`,
    `- Title: short, warm, kid-appropriate (≤ 60 chars). NEVER include the child's name (${childName}) or any first name in the title — focus on the adventure, object, place, or theme instead.`,
    `- Summary: ONE paragraph, target ~${STORY_LENGTH.target} words (hard min ${STORY_LENGTH.min}, hard max ${STORY_LENGTH.max}).`,
    `- Use ${childName}'s name as the hero IN THE SUMMARY ONLY. Mention supporting characters by name where natural.`,
    `- Reflect the hero's personality traits in their actions and choices.`,
    `- Weave at least one of the listed interests naturally into the plot.`,
    specialThing ? `- Give the special object/companion a meaningful cameo.` : "",
    `- Voice: warm, gentle, magical — like a parent reading aloud.`,
    `- Hint at the lesson; do NOT spoil the ending.`,
    `- No headings, no bullet lists, no quotation marks around the summary.`,
    langLine,
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
  /** Pre-joined "hair: brown, skin: medium, …". May be empty. */
  protoDesc: string;
  /** Style fragment from ART_STYLE_PROMPTS. */
  styleHint: string;
  /** True if a style reference image is attached. */
  hasStyleReference: boolean;
  /** Number of hero likeness photos attached (0 if none). */
  heroPhotoCount: number;
}

// Builds the cover image prompt.
// DON'T BREAK:
//  - The "no visible name on the cover" and "no author byline" rules
//    (Step 11 renders "written for: <child>" client-side instead).
//  - HERO ONLY: the cover features just the hero child in a scene from the
//    story. Supporting characters NEVER appear on the cover (they still show
//    up in the story summary and inside the book). Do not reintroduce
//    supporting-character text or photos here.
export function COVER_PROMPT_TEMPLATE(ctx: CoverPromptCtx): string {
  const {
    title,
    summary,
    childName,
    protoDesc,
    styleHint,
    hasStyleReference,
    heroPhotoCount,
  } = ctx;

  // Build a positional reference guide so the model knows which image is which.
  const refParts: string[] = [];
  let pos = 0;
  if (hasStyleReference) {
    pos++;
    refParts.push(
      `Image #${pos} is a STYLE REFERENCE — match its illustration technique, line quality, color palette, and finish. Do NOT copy its subject, pose, or composition; only mimic its style.`,
    );
  }
  if (heroPhotoCount > 0) {
    const start = pos + 1;
    const end = pos + heroPhotoCount;
    refParts.push(
      heroPhotoCount === 1
        ? `Image #${start} is a LIKENESS REFERENCE for the hero child (face shape, hair, skin tone). Render them in the chosen art style — not photo-realistically. Keep it kind, warm, and age-appropriate.`
        : `Images #${start}–#${end} are LIKENESS REFERENCES for the hero child from different angles. Use them together to capture face shape, hair, and skin tone. Render in the chosen art style — not photo-realistically.`,
    );
  }

  return [
    `Children's book cover illustration in ${styleHint}.`,
    ...refParts,
    `Title to display on the cover: "${title}". Render this title text exactly as given — do NOT add the child's name or any first name to the title.`,
    `Subject: ONLY the hero child — ${childName} — alone in a single evocative scene drawn from the story. Do NOT depict any other people, friends, family members, pets, or supporting characters; the cover features the hero solo.${protoDesc ? ` Character details — ${protoDesc}.` : ""}`,
    `Scene inspired by: ${summary.slice(0, 600)}`,
    `Composition: portrait orientation (2:3), the title clearly readable at the top or centered, no extra text, no author byline, no watermarks. Do NOT include "${childName}" or any name as visible text on the cover.`,
    `Tone: magical, hopeful, suitable for young children.`,
  ]
    .filter(Boolean)
    .join(" ");
}

