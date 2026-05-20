import { STORY_LENGTH } from "./prompts.ts";

export type SummaryFrameworkId =
  | "curiosity_journey"
  | "bedtime_wind_down"
  | "brave_choice"
  | "generous_heart"
  | "silly_escalation";

export type SummaryPatternId =
  | "discovery_trail"
  | "softening_ritual"
  | "hard_but_safe_test"
  | "need_noticed"
  | "escalating_absurd_rule";

export type TitlePatternId =
  | "wonder_object_place"
  | "soft_ritual_goodnight_object"
  | "hard_thing_brave_object"
  | "shared_thing_room_making"
  | "absurd_rule_funny_problem";

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

export const SUMMARY_PATTERNS: Record<SummaryFrameworkId, {
  id: SummaryPatternId;
  name: string;
  formula: string;
  rules: string[];
}> = {
  curiosity_journey: {
    id: "discovery_trail",
    name: "The Discovery Trail",
    formula: "When [child] notices/finds/follows [one intriguing clue or possibility], it leads into [a larger world or chain of discoveries]. But when [the discovery becomes overwhelming or someone needs help], [child] must use curiosity in a new way: not just to explore, but to understand, notice, or act.",
    rules: [
      "Use one discovery object, place, or clue.",
      "Do not list all interests.",
      "Do not say 'goes on a magical journey.'",
      "The emotional arc is wonder → overwhelm → deeper understanding.",
    ],
  },
  bedtime_wind_down: {
    id: "softening_ritual",
    name: "The Softening Ritual",
    formula: "As [day/evening/world] grows quiet, [child] moves through [familiar beloved things, places, people, or small memories]. One little worry, burst of energy, or unfinished feeling remains. With each gentle step, [child] settles closer to [comfort, belonging, love, or rest].",
    rules: [
      "No big conflict.",
      "No fast chase.",
      "No 'must save the day.'",
      "Use sensory details: light, sound, softness, warmth, breath.",
      "The emotional arc is active/worried → soothed → held/safe.",
    ],
  },
  brave_choice: {
    id: "hard_but_safe_test",
    name: "The Hard-But-Safe Test",
    formula: "When [something important goes wrong], [child] tries to solve it using what already feels safe or familiar. But [specific obstacle] makes that impossible. To move forward, [child] must choose a different kind of bravery: [ask for help / tell the truth / try again / share control / face a feeling].",
    rules: [
      "Use one challenge.",
      "The challenge must not be something the child is already good at.",
      "Do not say 'learns to be brave.'",
      "Show the brave choice through the situation.",
      "The emotional arc is confidence/control → difficulty → brave inner choice.",
    ],
  },
  generous_heart: {
    id: "need_noticed",
    name: "The Need Noticed",
    formula: "When [child] has/wants [something personally important], [child] notices [someone else’s need, wish, fear, or problem]. Helping may cost [attention, control, spotlight, object, comfort, or time]. As [child] chooses what to offer, the story opens toward belonging.",
    rules: [
      "Do not moralize.",
      "Do not say 'learns kindness.'",
      "The child should give, make room, help, invite, listen, or include.",
      "The emotional arc is wanting/holding → noticing → giving/making room.",
    ],
  },
  silly_escalation: {
    id: "escalating_absurd_rule",
    name: "The Escalating Absurd Rule",
    formula: "When [child] tries [one funny plan/object/rule], it works for about three seconds — until [absurd complication]. Each fix makes the problem bigger, stranger, or funnier. The only way out is a final unexpected choice, twist, or reversal.",
    rules: [
      "Use one absurd premise.",
      "No moral explanation in the summary.",
      "No interest pileup.",
      "No 'friendship is the best victory' ending.",
      "The emotional arc is funny idea → escalating mess → snap reversal.",
    ],
  },
};

export const TITLE_PATTERNS: Record<SummaryFrameworkId, {
  id: TitlePatternId;
  name: string;
  shapes: string[];
  examples: string[];
  avoid: string[];
}> = {
  curiosity_journey: {
    id: "wonder_object_place",
    name: "The Wonder Object / Wonder Place",
    shapes: [
      "The [Mysterious/Quiet/Hidden] [Object]",
      "Where the [Strange Thing] [Does Something]",
      "The [Place] Beyond the [Place/Object]",
      "The [Object] That [Unexpected Action]",
    ],
    examples: ["The Lantern in the Grass", "Where the Hoofprints Glowed", "The Door Beneath the Willow", "The Map That Hummed"],
    avoid: ["Aria’s Magical Forest Adventure", "A Curious Journey with Horses and Flowers"],
  },
  bedtime_wind_down: {
    id: "soft_ritual_goodnight_object",
    name: "The Soft Ritual / Goodnight Object",
    shapes: [
      "Goodnight, [Specific Object/Place]",
      "The [Soft/Quiet/Little] [Object]",
      "When the [Place] Went Quiet",
      "The Last [Sound/Light/Step]",
    ],
    examples: ["Goodnight, Skateboard", "The Last Little Bounce", "When the Room Grew Quiet", "The Guitar’s Sleepy Song"],
    avoid: ["Corey’s Cozy Bedtime Adventure", "The Calm and Wonderful Night"],
  },
  brave_choice: {
    id: "hard_thing_brave_object",
    name: "The Hard Thing / Brave Object",
    shapes: [
      "The [Object] Beyond the [Barrier]",
      "The [Thing] That Wouldn’t [Action]",
      "One [Small/Big] [Choice]",
      "The [Object] at the Edge",
    ],
    examples: ["The Sketchbook Beyond the Fence", "The Bridge That Wobbled", "One More Step Back", "The Hill Aria Couldn’t Climb Alone"],
    avoid: ["Aria Learns to Be Brave", "A Story About Confidence"],
  },
  generous_heart: {
    id: "shared_thing_room_making",
    name: "The Shared Thing / The Room-Making Title",
    shapes: [
      "Room for [Someone/Something]",
      "The [Object] We Shared",
      "The [Gift/Seat/Spot] for [Someone]",
      "One [Object] for Two",
    ],
    examples: ["Room on the Rocket", "The Last Seat on the Sled", "One Goal for Two", "The Hat We Found"],
    avoid: ["Corey Learns Friendship", "The Warm Creative Friend", "A Kindness Adventure"],
  },
  silly_escalation: {
    id: "absurd_rule_funny_problem",
    name: "The Absurd Rule / Funny Problem",
    shapes: [
      "Don’t Let the [Character/Object] [Action]",
      "If You Give a [Character] a [Object]",
      "The [Object] That Wouldn’t [Action]",
      "[Funny Creature/Object] Love [Unexpected Thing]",
    ],
    examples: ["Don’t Let the Robot Shoot", "The Ball That Wouldn’t Score", "If You Give Corey a Whistle", "The Day the Goal Ran Away"],
    avoid: ["Strum, Skate, and a Silly Goal", "Corey’s Funny Soccer Skateboard Guitar Day"],
  },
};

export function summaryPatternForFramework(id: SummaryFrameworkId) {
  return SUMMARY_PATTERNS[id];
}

export function titlePatternForFramework(id: SummaryFrameworkId) {
  return TITLE_PATTERNS[id];
}

function includesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n));
}

export function selectSummaryFramework(ctx: StoryConceptPromptCtx): SummaryFrameworkId {
  const combined = [ctx.genre, ctx.mood, ctx.lesson, ctx.interestsLine, ctx.thingsCurrentlyTricky]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (includesAny(combined, ["bedtime", "sleep", "calm", "wind down", "rest"])) return "bedtime_wind_down";
  if (includesAny(combined, ["funny", "silly", "humor", "comedy", "joke", "chaos", "ridiculous"])) return "silly_escalation";
  if (includesAny(combined, ["kind", "kindness", "share", "sharing", "generous", "empathy", "friendship", "helping others", "belonging"])) return "generous_heart";
  if (includesAny(combined, ["confidence", "self-confidence", "brave", "courage", "resilience", "anxiety", "trying", "hard", "ask for help", "asking for help", "help"])) return "brave_choice";
  return "curiosity_journey";
}

export function STORY_CONCEPT_USER_TEMPLATE(ctx: StoryConceptPromptCtx): string {
  const frameworkId = ctx.frameworkId || selectSummaryFramework(ctx);
  const fw = SUMMARY_FRAMEWORKS[frameworkId];
  const summaryPattern = summaryPatternForFramework(frameworkId);
  const titlePattern = titlePatternForFramework(frameworkId);
  const langLabel = (ctx.language || "").trim().toLowerCase();
  const langLine = langLabel && langLabel !== "english"
    ? `Write the title and user_visible_summary in ${ctx.language}. Keep internal planning fields in English unless impossible.`
    : "";

  return [
    `Create ONE personalized children's picture book concept from the inputs below.`,
    ``,
    `This is the FIRST concept step after the wizard. Do not write the full book yet. Create a strong concept that can later expand into a 30-page illustrated book.`,
    ``,
    `# Most important instruction`,
    `You are not proving that every wizard input was used. Most inputs are background context. Use only the details that create the strongest version of the selected summary pattern.`,
    `The visible summary should feel like the back cover of a popular picture book, not a receipt of the wizard answers.`,
    `Use fewer than half of the available personalized details. Unused details are reserved for the full book.`,
    ``,
    `# Child`,
    `Name: ${ctx.childName}`,
    `Age band: ${ctx.ageBand}`,
    ctx.gender ? `Gender/pronouns: ${ctx.gender}` : "",
    ctx.heroQuirk ? `Appearance/signature detail: ${ctx.heroQuirk}` : "",
    ``,
    `# Background context menu`,
    ctx.genre ? `Genre: ${ctx.genre}` : "",
    ctx.mood ? `Mood: ${ctx.mood}` : "",
    ctx.lesson ? `Lesson/theme: ${ctx.lesson}` : "",
    ctx.interestsLine ? `Interests available as optional texture, max two in visible summary: ${ctx.interestsLine}` : "",
    ctx.thingsAlreadyGoodAt ? `Things already good at, do not make this the weakness: ${ctx.thingsAlreadyGoodAt}` : "",
    ctx.thingsCurrentlyTricky ? `Things currently tricky, good source for the emotional choice: ${ctx.thingsCurrentlyTricky}` : "",
    ctx.recentMeaningfulMoment ? `Recent meaningful moment: ${ctx.recentMeaningfulMoment}` : "",
    ``,
    `# Cast context`,
    ctx.supportingLine ? `Supporting characters available if they strengthen the premise: ${ctx.supportingLine}` : "Supporting characters: none provided",
    ctx.specialThing ? `Companion/object/pet/toy available if it strengthens the premise: ${ctx.specialThing}` : "",
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
    `# Selected story framework`,
    `Framework ID: ${frameworkId}`,
    `Framework name: ${fw.label}`,
    `Framework shape: ${fw.shape}`,
    `Best for: ${fw.bestFor}`,
    `Avoid: ${fw.avoid}`,
    `Use this framework as the hidden narrative shape. Do not mention the framework name to the user.`,
    ``,
    `# Required summary pattern for this framework`,
    `summary_pattern: ${summaryPattern.id}`,
    `Pattern name: ${summaryPattern.name}`,
    `Exact formula to follow: ${summaryPattern.formula}`,
    `Rules:\n- ${summaryPattern.rules.join("\n- ")}`,
    ``,
    `# Required title pattern for this framework`,
    `title_pattern: ${titlePattern.id}`,
    `Pattern name: ${titlePattern.name}`,
    `Use one of these exact title shapes, adapted naturally to the story:`,
    ...titlePattern.shapes.map((shape) => `- ${shape}`),
    `Good example direction: ${titlePattern.examples.join("; ")}`,
    `Avoid this kind of title: ${titlePattern.avoid.join("; ")}`,
    ``,
    `# Title rules`,
    `Use 2–7 words unless the exact comedy shape needs a few more words.`,
    `Do not use the child's name (${ctx.childName}).`,
    `Do not use personality traits.`,
    `Do not list multiple hobbies/interests.`,
    `Use at most one personalized object, place, creature, or problem.`,
    `Prefer concrete nouns over abstract values.`,
    `Avoid words like adventure, journey, magical, wonderful, special, brave, confidence, friendship, kindness unless they are truly unavoidable and natural.`,
    ``,
    `# Visible summary rules`,
    `Use the exact summary pattern above.`,
    `Write one paragraph, ${STORY_LENGTH.min}–${STORY_LENGTH.max} words, target ~${STORY_LENGTH.target}.`,
    `Use ${ctx.childName}'s name in the summary.`,
    `Pick ONE clear story engine.`,
    `Use at most TWO user-provided interests as concrete story elements.`,
    `Do not directly list personality adjectives from the wizard.`,
    `Do not describe supporting characters with adjectives. Give them a story job.`,
    `Do not use a list title or list summary.`,
    `Do not explain the moral. Let the emotional choice imply the growth.`,
    ``,
    `# Recurring verbal motif`,
    `Plan a recurring verbal motif for the full book. This may be a repeated phrase, repeated question, recurring sound, sensory image, or sentence pattern. It should connect to the core conflict, visual world, or emotional arc.`,
    `Age guidance: ages 0–5 may use a clear read-aloud refrain; ages 6–8 may use a repeated question or sentence pattern; ages 9–12 should use a subtler recurring line, image, sound, or emotional phrase. Do not make it feel like a slogan. Do not force sing-song repetition for older children.`,
    `Store this in story_seed.recurring_motif.`,
    ``,
    `# Structured output requirements`,
    `- framework_id must be exactly ${frameworkId}.`,
    `- summary_pattern must be exactly ${summaryPattern.id}.`,
    `- title_pattern must be exactly ${titlePattern.id}.`,
    `- title must follow one of the exact title shapes listed above.`,
    `- user_visible_summary must follow the exact summary formula listed above.`,
    `- story_seed: give the full book engine a clear core_conflict, emotional_arc, visual_world, recurring_motif, ending_feeling, and 5–8 image_opportunities.`,
    `- personalization_notes: explain how personality becomes action, which 1–2 interests were used in the visible summary, which details were intentionally saved for the full book, and what NOT to make the obstacle if it would feel inauthentic.`,
    `- full_book_instruction: 2–4 sentences telling the later full-book engine how to expand this concept into a 30-page picture book, including tone, pacing, emotional direction, summary pattern, title pattern, and motif usage guidance.`,
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
