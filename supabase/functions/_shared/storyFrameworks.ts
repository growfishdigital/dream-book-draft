import type { FrameworkId, KernelVars, SummaryPatternId, TitlePatternId } from "./bookTypes.ts";

export const FRAMEWORK_IDS: FrameworkId[] = [
  "curiosity_journey",
  "bedtime_wind_down",
  "brave_choice",
  "generous_heart",
  "silly_escalation",
];

export const SUMMARY_FRAMEWORKS: Record<FrameworkId, { label: string; shape: string; bestFor: string; avoid: string }> = {
  curiosity_journey: {
    label: "Curiosity Journey",
    shape: "A wonder/discovery story where the child follows one clue into linked discoveries, briefly feels overwhelmed, then returns with a larger sense of the world.",
    bestFor: "curiosity, discovery, nature, animals, learning, exploring, wonder",
    avoid: "real danger, fear, heavy conflict, moral lectures",
  },
  bedtime_wind_down: {
    label: "Bedtime Wind-Down",
    shape: "A soft ritual story where the child's world slowly quiets around familiar beloved things before ending in rest and love.",
    bestFor: "bedtime, comfort, belonging, calm, parent keepsake, rest",
    avoid: "conflict, fast pacing, cliffhangers, high-energy stakes",
  },
  brave_choice: {
    label: "Brave Choice",
    shape: "A courage story where the child faces a hard-but-safe problem and must choose a different kind of bravery.",
    bestFor: "confidence, resilience, trying something hard, anxiety, self-belief, asking for help",
    avoid: "making the challenge something the child has already mastered; adult rescues that remove the child's agency",
  },
  generous_heart: {
    label: "Generous Heart",
    shape: "A connection story where the child notices a need and makes room for someone else in a personally meaningful way.",
    bestFor: "kindness, friendship, empathy, sharing, family love, service",
    avoid: "adult lectures, shame, material rewards for generosity",
  },
  silly_escalation: {
    label: "Silly Escalation",
    shape: "A comedy story where one tiny absurd premise escalates until a simple reversal or snap ending.",
    bestFor: "funny books, animals, vehicles, dinosaurs, chaotic interests, read-aloud silliness",
    avoid: "moralizing, big emotional lessons, slow reflective pacing",
  },
};

export const SUMMARY_PATTERNS: Record<FrameworkId, { id: SummaryPatternId; name: string; internalShape: string; rules: string[] }> = {
  curiosity_journey: {
    id: "discovery_trail",
    name: "The Discovery Trail",
    internalShape: "One clue or possibility opens into a larger discovery; the discovery becomes too much or reveals a need; the child responds by noticing, understanding, or acting differently.",
    rules: ["Use one discovery object, place, or clue.", "Do not list all interests.", "Do not say 'goes on a magical journey.'"],
  },
  bedtime_wind_down: {
    id: "softening_ritual",
    name: "The Softening Ritual",
    internalShape: "The day or world quiets through familiar sensory details; one worry or unfinished feeling remains; each step brings the child closer to comfort, belonging, or rest.",
    rules: ["No big conflict.", "No fast chase.", "Use light, sound, softness, warmth, or breath."],
  },
  brave_choice: {
    id: "hard_but_safe_test",
    name: "The Hard-But-Safe Test",
    internalShape: "Something important goes wrong; the child first uses what feels familiar; that is not enough; the child must choose a different kind of courage through action.",
    rules: ["Use one challenge.", "Do not make the challenge something the child is already good at.", "Do not say 'learns to be brave.'"],
  },
  generous_heart: {
    id: "need_noticed",
    name: "The Need Noticed",
    internalShape: "The child wants or holds something personally important; someone else has a need; helping costs attention, control, spotlight, comfort, or time; the choice opens room for belonging.",
    rules: ["Do not moralize.", "Do not say 'learns kindness.'", "Keep it specific and concrete."],
  },
  silly_escalation: {
    id: "escalating_absurd_rule",
    name: "The Escalating Absurd Rule",
    internalShape: "One funny plan, object, or rule goes wrong; one or two attempted fixes make it worse; the ending comes from a simple reversal or unexpected practical choice.",
    rules: ["Use one absurd premise.", "No moral explanation in the summary.", "No interest pileup.", "Include at most two escalation beats in the visible summary."],
  },
};

export const TITLE_PATTERNS: Record<FrameworkId, { id: TitlePatternId; name: string; shapes: string[]; examples: string[]; avoid: string[] }> = {
  curiosity_journey: {
    id: "wonder_object_place",
    name: "The Wonder Object / Wonder Place",
    shapes: ["The [Mysterious/Quiet/Hidden] [Object]", "Where the [Strange Thing] [Does Something]", "The [Place] Beyond the [Place/Object]", "The [Object] That [Unexpected Action]"],
    examples: ["The Lantern in the Grass", "Where the Hoofprints Glowed", "The Door Beneath the Willow", "The Map That Hummed"],
    avoid: ["Aria’s Magical Forest Adventure", "A Curious Journey with Horses and Flowers"],
  },
  bedtime_wind_down: {
    id: "soft_ritual_goodnight_object",
    name: "The Soft Ritual / Goodnight Object",
    shapes: ["Goodnight, [Specific Object/Place]", "The [Soft/Quiet/Little] [Object]", "When the [Place] Went Quiet", "The Last [Sound/Light/Step]"],
    examples: ["Goodnight, Skateboard", "The Last Little Bounce", "When the Room Grew Quiet", "The Guitar’s Sleepy Song"],
    avoid: ["Corey’s Cozy Bedtime Adventure", "The Calm and Wonderful Night"],
  },
  brave_choice: {
    id: "hard_thing_brave_object",
    name: "The Hard Thing / Brave Object",
    shapes: ["The [Object] Beyond the [Barrier]", "The [Thing] That Wouldn’t [Action]", "One [Small/Big] [Choice]", "The [Object] at the Edge"],
    examples: ["The Sketchbook Beyond the Fence", "The Bridge That Wobbled", "One More Step Back", "The Hill Aria Couldn’t Climb Alone"],
    avoid: ["Aria Learns to Be Brave", "A Story About Confidence"],
  },
  generous_heart: {
    id: "shared_thing_room_making",
    name: "The Shared Thing / The Room-Making Title",
    shapes: ["Room for [Someone/Something]", "The [Object] We Shared", "The [Gift/Seat/Spot] for [Someone]", "One [Object] for Two"],
    examples: ["Room on the Rocket", "The Last Seat on the Sled", "One Goal for Two", "The Hat We Found"],
    avoid: ["Corey Learns Friendship", "The Warm Creative Friend", "A Kindness Adventure"],
  },
  silly_escalation: {
    id: "absurd_rule_funny_problem",
    name: "The Absurd Rule / Funny Problem",
    shapes: ["Don’t Let the [Character/Object] [Action]", "If You Give a [Character] a [Object]", "The [Object] That Wouldn’t [Action]", "[Funny Creature/Object] Loves [Unexpected Thing]"],
    examples: ["Don’t Let the Robot Fish", "The Ball That Wouldn’t Score", "If You Give a Machine a Mission", "The Day the Goal Ran Away"],
    avoid: ["Strum, Skate, and a Silly Goal", "Corey’s Funny Soccer Skateboard Guitar Day", "The Skatepark Fishing Machine"],
  },
};

export function summaryPatternForFramework(id: FrameworkId) { return SUMMARY_PATTERNS[id]; }
export function titlePatternForFramework(id: FrameworkId) { return TITLE_PATTERNS[id]; }

function includesAny(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n));
}

export function isFrameworkId(value: unknown): value is FrameworkId {
  return typeof value === "string" && FRAMEWORK_IDS.includes(value as FrameworkId);
}

export function selectFramework(ctx: { value?: string; genre?: string; mood_tags?: string[]; lesson?: string; interestsLine?: string; personalityLine?: string; thingsCurrentlyTricky?: string }): FrameworkId {
  const combined = [ctx.value, ctx.genre, ctx.lesson, ctx.interestsLine, ctx.personalityLine, ctx.thingsCurrentlyTricky, ...(ctx.mood_tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (includesAny(combined, ["bedtime", "sleep", "calm", "wind down", "rest"])) return "bedtime_wind_down";
  if (includesAny(combined, ["funny", "silly", "goofy", "playful", "humor", "comedy", "joke", "chaos", "ridiculous", "robot", "robots", "machine", "dinosaur", "vehicle"])) return "silly_escalation";
  if (includesAny(combined, ["confidence", "self-confidence", "self_confidence", "brave", "courage", "resilience", "anxiety", "trying", "hard", "ask for help", "asking for help", "apologizing", "apologize"])) return "brave_choice";
  if (includesAny(combined, ["kind", "kindness", "share", "sharing", "generous", "empathy", "friendship", "making friends", "helping others", "belonging"])) return "generous_heart";
  return "curiosity_journey";
}

export const STORY_FRAMEWORKS: Record<FrameworkId, (vars: KernelVars) => string> = {
  curiosity_journey: (v) => `Framework: Curiosity Journey. ${v.child_name} follows one concrete clue into linked discoveries. Keep stakes safe, wondrous, and emotionally clear. End with larger understanding, not a lecture.`,
  bedtime_wind_down: (v) => `Framework: Bedtime Wind-Down. The story softens scene by scene through sound, light, texture, and familiar objects. Keep conflict tiny and comforting. End with rest and love.`,
  brave_choice: (v) => `Framework: Brave Choice. ${v.child_name} faces one hard-but-safe challenge. Do not make the obstacle something already listed as a strength. The brave action should be specific and child-led.`,
  generous_heart: (v) => `Framework: Generous Heart. ${v.child_name} notices a need and makes room for someone else in a concrete way. Avoid moralizing. The generous choice should cost attention, control, spotlight, comfort, or time.`,
  silly_escalation: (v) => `Framework: Silly Escalation. Start with one absurd premise and let it escalate through funny cause-and-effect. Keep the pace read-aloud friendly and resolve with a simple reversal or practical choice.`,
};

export function STORY_KERNEL(vars: KernelVars): string {
  return [
    "You are writing a personalized children's picture book as structured JSON.",
    `Child: ${vars.child_name}. Age band: ${vars.age_band}. Vocabulary tier: ${vars.vocab_tier}.`,
    `Pronouns: ${vars.hero_pronouns.subject}/${vars.hero_pronouns.object}/${vars.hero_pronouns.possessive}.`,
    `Theme/value: ${vars.value_label}. Genre: ${vars.genre}. Mood: ${vars.mood_label}.`,
    `Interests/background texture: ${vars.interests}.`,
    vars.special_item ? `Special item/companion: ${vars.special_item}.` : "",
    `Supporting cast: ${vars.cast_summary}.`,
    `Buyer relationship: ${vars.buyer_relationship}. Occasion: ${vars.occasion}.`,
    vars.things_already_good_at ? `Already good at: ${vars.things_already_good_at}. Do not make this the weakness.` : "",
    vars.things_currently_tricky ? `Currently tricky: ${vars.things_currently_tricky}. This can inform the emotional choice.` : "",
    vars.recent_meaningful_moment ? `Recent meaningful moment: ${vars.recent_meaningful_moment}.` : "",
    `Write ${vars.spread_count} story pages plus title/dedication, with total story text around ${vars.word_count_target} words.`,
    "Do not explain the moral. Show growth through action. Do not list wizard inputs. Keep character agency with the child.",
  ].filter(Boolean).join("\n");
}
