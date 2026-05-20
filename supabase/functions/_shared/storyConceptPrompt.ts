import { STORY_LENGTH } from "./prompts.ts";

export type SummaryFrameworkId =
  | "curiosity_journey"
  | "bedtime_wind_down"
  | "brave_choice"
  | "generous_heart"
  | "silly_escalation";

export interface StoryConceptPromptCtx {
  childName: string;
  ageBand: string;
  gender?: string;
  language?: string;
  genre?: string;
  mood?: string;
  lesson?: string;
  interestsLine?: string;
  personalityLine?: string;
  heroBehaviorNotes?: string;
  supportingLine?: string;
  supportingBehaviorNotes?: string;
  forbiddenTraitWords?: string;
  specialThing?: string;
  heroQuirk?: string;
  thingsAlreadyGoodAt?: string;
  thingsCurrentlyTricky?: string;
  recentMeaningfulMoment?: string;
  buyerRelationship?: string;
  occasion?: string;
  previousSummary?: string;
  frameworkId?: SummaryFrameworkId;
}

export const STORY_CONCEPT_SYSTEM_PROMPT =
  "You are a senior children's picture book concept editor. Create framework-aware personalized story concepts. Always call the provided tool to return structured output — never reply in plain text.";

export const SUMMARY_FRAMEWORKS: Record<SummaryFrameworkId, {
  label: string;
  shape: string;
  bestFor: string;
  avoid: string;
}> = {
  curiosity_journey: {
    label: "Curiosity Journey",
    shape: "A wonder/discovery story where the child follows curiosity through linked discoveries, briefly feels overwhelmed, then returns with a larger sense of the world.",
    bestFor: "curiosity, discovery, nature, animals, learning, exploring, wonder",
    avoid: "real danger, fear, heavy conflict, moral lectures",
  },
  bedtime_wind_down: {
    label: "Bedtime Wind-Down",
    shape: "A soft ritual story where the child's world slowly quiets, naming beloved people, objects, places, or interests before ending in rest and love.",
    bestFor: "bedtime, comfort, belonging, calm, parent keepsake, rest",
    avoid: "conflict, fast pacing, cliffhangers, high-energy stakes",
  },
  brave_choice: {
    label: "Brave Choice",
    shape: "A courage story where the child leaves a safe familiar world, faces a hard-but-safe challenge, makes a brave choice, and returns changed.",
    bestFor: "confidence, resilience, trying something hard, anxiety, self-belief, asking for help",
    avoid: "making the challenge something the child has already mastered; adult rescues that remove the child's agency",
  },
  generous_heart: {
    label: "Generous Heart",
    shape: "A connection story where the child has something they value, notices a need, gives or helps, and discovers that sharing creates belonging.",
    bestFor: "kindness, friendship, empathy, sharing, family love, service",
    avoid: "adult lectures, shame, material rewards for generosity",
  },
  silly_escalation: {
    label: "Silly Escalation",
    shape: "A comedy story where a tiny absurd premise keeps escalating until a funny snap ending and final wink.",
    bestFor: "funny books, animals, vehicles, dinosaurs, chaotic interests, read-aloud silliness",
    avoid: "moralizing, big emotional lessons, slow reflective pacing",
  },
};

function includesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n));
}

export function selectSummaryFramework(ctx: StoryConceptPromptCtx): SummaryFrameworkId {
  const combined = [ctx.genre, ctx.mood, ctx.lesson, ctx.interestsLine, ctx.thingsCurrentlyTricky]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (includesAny(combined, ["bedtime", "sleep", "calm", "wind down", "rest"])) {
    return "bedtime_wind_down";
  }
  if (includesAny(combined, ["funny", "silly", "humor", "comedy", "joke", "chaos", "ridiculous"])) {
    return "silly_escalation";
  }
  if (includesAny(combined, ["kind", "kindness", "share", "sharing", "generous", "empathy", "friendship", "helping others", "belonging"])) {
    return "generous_heart";
  }
  if (includesAny(combined, ["confidence", "self-confidence", "brave", "courage", "resilience", "anxiety", "trying", "hard", "ask for help", "asking for help", "help"])) {
    return "brave_choice";
  }
  return "curiosity_journey";
}

export function STORY_CONCEPT_USER_TEMPLATE(ctx: StoryConceptPromptCtx): string {
  const frameworkId = ctx.frameworkId || selectSummaryFramework(ctx);
  const fw = SUMMARY_FRAMEWORKS[frameworkId];
  const langLabel = (ctx.language || "").trim().toLowerCase();
  const langLine = langLabel && langLabel !== "english"
    ? `Write the title and user_visible_summary in ${ctx.language}. Keep internal planning fields in English unless impossible.`
    : "";

  return [
    `Create ONE personalized children's picture book concept from the inputs below.`,
    ``,
    `This is the FIRST concept step after the wizard. Do not write the full book yet. Create a strong concept that can later expand into a 30-page illustrated book.`,
    ``,
    `# Child`,
    `Name: ${ctx.childName}`,
    `Age band: ${ctx.ageBand}`,
    ctx.gender ? `Gender/pronouns: ${ctx.gender}` : "",
    ctx.heroQuirk ? `Appearance/signature detail: ${ctx.heroQuirk}` : "",
    ``,
    `# Story preferences`,
    ctx.genre ? `Genre: ${ctx.genre}` : "",
    ctx.mood ? `Mood: ${ctx.mood}` : "",
    ctx.lesson ? `Lesson/theme: ${ctx.lesson}` : "",
    ctx.interestsLine ? `Interests to weave in: ${ctx.interestsLine}` : "",
    ctx.thingsAlreadyGoodAt ? `Things already good at: ${ctx.thingsAlreadyGoodAt}` : "",
    ctx.thingsCurrentlyTricky ? `Things currently tricky: ${ctx.thingsCurrentlyTricky}` : "",
    ctx.recentMeaningfulMoment ? `Recent meaningful moment: ${ctx.recentMeaningfulMoment}` : "",
    ``,
    `# Cast`,
    ctx.supportingLine ? `Supporting characters: ${ctx.supportingLine}` : "Supporting characters: none provided",
    ctx.specialThing ? `Companion/object/pet/toy: ${ctx.specialThing}` : "",
    ``,
    `# Private behavior notes`,
    ctx.heroBehaviorNotes || ctx.personalityLine
      ? (ctx.heroBehaviorNotes || `Hero behavior notes:\nUse these only to decide actions. Do not repeat these words in the visible summary: ${ctx.personalityLine}`)
      : "Hero behavior notes: none provided",
    ctx.supportingBehaviorNotes || "Supporting character behavior notes: none provided",
    ctx.forbiddenTraitWords
      ? `Forbidden visible trait words: Do not use these exact words in title, summary, or user_visible_summary: ${ctx.forbiddenTraitWords}. You may use them only inside hidden planning fields if needed.`
      : "",
    ``,
    `# Book context`,
    ctx.buyerRelationship ? `Buyer relationship: ${ctx.buyerRelationship}` : "",
    ctx.occasion ? `Occasion: ${ctx.occasion}` : "",
    langLine,
    ``,
    `# Story framework`,
    `Framework ID: ${frameworkId}`,
    `Framework name: ${fw.label}`,
    `Framework shape: ${fw.shape}`,
    `Best for: ${fw.bestFor}`,
    `Avoid: ${fw.avoid}`,
    `Use this framework as the hidden narrative shape. Do not mention the framework name to the user. Do not write a page-by-page outline.`,
    ``,
    `# Personality handling`,
    `Treat personality traits as hidden casting notes, not words to paste into the user_visible_summary.`,
    `Do not describe any character with direct trait labels from the wizard.`,
    `Do not write patterns like "Name is a silly, energetic kid", "Name, the warm, creative girl", "curious and joyful", "warm and brave", "kind and creative", or "fiery, creative, determined."`,
    `Never place personality adjectives directly after a character name.`,
    `Never use "is a [trait] kid/person/girl/boy" phrasing.`,
    `Instead, show personality through one concrete action, choice, gesture, habit, or response.`,
    `Bad: "Corey is a silly, energetic kid who zips through the neighborhood."`,
    `Better: "Corey rockets through the neighborhood on his skateboard, braking only long enough to tighten one more bolt on the robot rattling in his backpack."`,
    `Bad: "Topanga, the warm, creative girl he likes..."`,
    `Better: "When Topanga notices the robot's crooked aim, she crouches beside Corey and offers a softer idea."`,
    `The visible summary should never read like it is listing attributes from the wizard.`,
    ``,
    `# Recurring verbal motif`,
    `Plan a recurring verbal motif for the full book. This may be a repeated phrase, repeated question, recurring sound, sensory image, or sentence pattern. It should connect to the core conflict, visual world, or emotional arc.`,
    `Age guidance: ages 0–5 may use a clear read-aloud refrain; ages 6–8 may use a repeated question or sentence pattern; ages 9–12 should use a subtler recurring line, image, sound, or emotional phrase. Do not make it feel like a slogan. Do not force sing-song repetition for older children.`,
    `Store this in story_seed.recurring_motif.`,
    ``,
    `# Requirements`,
    `- title: short, warm, kid-appropriate, max 60 characters. NEVER include the child's name (${ctx.childName}) or any first name. Focus on the central object, place, feeling, question, or image.`,
    `- user_visible_summary: one paragraph, ${STORY_LENGTH.min}–${STORY_LENGTH.max} words, target ~${STORY_LENGTH.target}. Use ${ctx.childName}'s name in the summary. Explain the premise clearly, hint at emotional growth, and do not spoil the exact ending.`,
    `- user_visible_summary must show personality through action. Do not directly list personality adjectives from the wizard.`,
    `- story_seed: give the full book engine a clear core_conflict, emotional_arc, visual_world, recurring_motif, ending_feeling, and 5–8 image_opportunities.`,
    `- personalization_notes: explain how the personality, interests, cast, and companion/object are used; include what NOT to make the obstacle if it would feel inauthentic.`,
    `- full_book_instruction: 2–4 sentences telling the later full-book engine how to expand this concept into a 30-page picture book, including tone, pacing, emotional direction, and how the recurring verbal motif should echo without becoming repetitive.`,
    ``,
    `# Quality bar`,
    `The concept should feel like a real picture book pitch, not a generic personalized template. Keep it specific but not overcomplicated.`,
    `Avoid these words in the title and user-visible summary unless the user specifically provided them: magical, adventure, wonderful, journey, special, whimsical.`,
    `Avoid generic closing lines like "a tale about how friendship grows" or "discovers what makes a companion."`,
    `Prefer warm, concrete, sensory language.`,
    `Do not invent family, location, pets, or personal details not provided.`,
    ctx.previousSummary
      ? `\n# Previous attempt to avoid\nWrite something distinctly different. Do not repeat the setting, twist, title pattern, or opening line.\nPrevious summary:\n${ctx.previousSummary}`
      : "",
  ].filter(Boolean).join("\n");
}
