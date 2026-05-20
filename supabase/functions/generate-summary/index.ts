// Generate a framework-aware kid-friendly story concept.
// Returns legacy { title, summary } plus hidden planning metadata for the full-book engine.

import {
  MODELS,
  STORY_LENGTH,
  TITLE_RETRY_INSTRUCTION,
} from "../_shared/prompts.ts";
import {
  selectSummaryFramework,
  STORY_CONCEPT_SYSTEM_PROMPT,
  STORY_CONCEPT_USER_TEMPLATE,
  type SummaryFrameworkId,
} from "../_shared/storyConceptPrompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Brief {
  child?: { name?: string; ageRange?: string; gender?: string; language?: string };
  story?: {
    genre?: string;
    mood?: string;
    lesson?: string;
    interests?: string[];
    personality?: string[];
    thingsAlreadyGoodAt?: string;
    thingsCurrentlyTricky?: string;
    recentMeaningfulMoment?: string;
  };
  protagonist?: { special?: string; [k: string]: unknown };
  supportingCharacters?: Array<{
    name?: string;
    relationship?: string;
    description?: string;
    traits?: string[];
    gender?: string;
    ageRange?: string;
  }>;
  artStyle?: string;
  specialThing?:
    | string
    | { category?: string; details?: Record<string, string> };
  buyer_relationship?: string;
  buyerRelationship?: string;
  occasion?: string;
}

interface StoryConceptResult {
  title?: string;
  user_visible_summary?: string;
  summary?: string;
  framework_id?: SummaryFrameworkId;
  framework_reason?: string;
  story_seed?: {
    core_conflict?: string;
    emotional_arc?: string;
    visual_world?: string;
    recurring_motif?: string;
    ending_feeling?: string;
    image_opportunities?: string[];
  };
  personalization_notes?: {
    personality_through_action?: string;
    interests_used?: string;
    cast_and_companion_use?: string;
    avoid_as_obstacle?: string;
  };
  full_book_instruction?: string;
}

const TRAIT_ACTION_MAP: Record<string, string> = {
  adventurous: "choosing to explore, stepping toward the unknown, or trying a new route",
  brave: "steady choices when something feels hard, uncertain, or a little scary",
  calm: "slow breaths, careful pauses, or steady hands during a busy moment",
  caring: "noticing needs, gentle help, or small acts of comfort",
  cheerful: "bright reactions, hopeful words, or finding a spark of fun",
  clever: "spotting patterns, testing ideas, or solving a problem in an unexpected way",
  confident: "standing tall, speaking clearly, or trusting a practiced skill",
  creative: "making something new, trying an unusual idea, or finding another way",
  curious: "asking questions, investigating clues, or leaning closer to understand",
  determined: "trying again, staying focused, or refusing to quit after a setback",
  energetic: "motion, quick decisions, eager movement, or restless tinkering",
  funny: "playful timing, goofy observations, or making others laugh kindly",
  gentle: "careful touch, soft words, or protecting something small",
  goofy: "playful mistakes, funny faces, or surprising choices",
  helpful: "pitching in, offering a tool, or looking for what someone needs",
  imaginative: "pretend ideas, invented worlds, or seeing new possibilities",
  joyful: "delighted reactions, happy movement, or contagious excitement",
  kind: "thoughtful choices, including others, or helping without being asked",
  loving: "warm gestures, loyal attention, or making someone feel safe",
  playful: "games, teasing ideas, or turning a problem into fun",
  quiet: "careful watching, thoughtful pauses, or noticing details others miss",
  resilient: "recovering after disappointment, trying again, or adapting the plan",
  sensitive: "noticing small emotional changes, caring deeply, or responding tenderly",
  shy: "hesitating at first, watching closely, or finding a small way to join in",
  silly: "playful choices, surprising ideas, or physical comedy",
  smart: "asking sharp questions, connecting clues, or planning the next step",
  thoughtful: "pausing to consider others, remembering details, or choosing carefully",
  warm: "noticing feelings, gentle encouragement, or welcoming gestures",
};

const GENERIC_SUMMARY_TERMS = [
  "magical",
  "wonderful",
  "whimsical",
  "gentle riddles",
  "what makes a companion",
  "hints at how friendship grows",
  "a tale about how friendship grows",
];

function describeSpecialThing(
  s: Brief["specialThing"],
): string | undefined {
  if (!s) return undefined;
  if (typeof s === "string") return s;
  const cat = s.category?.replace(/-/g, " ");
  const d = s.details || {};
  const bits = Object.entries(d)
    .filter(([k, v]) =>
      v && typeof v === "string" && k !== "photo" && !v.startsWith("data:"),
    )
    .map(([k, v]) => {
      if (k === "name") return `named "${v}"`;
      if (k === "color") return `${v} colored`;
      return v;
    });
  if (!cat && !bits.length) return undefined;
  return [cat, bits.join(", ")].filter(Boolean).join(" — ");
}

function cleanTrait(t: unknown): string | null {
  if (typeof t !== "string") return null;
  const clean = t.trim().toLowerCase();
  if (!clean) return null;
  return clean.replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, " ");
}

function uniqueTraits(traits: unknown[]): string[] {
  return Array.from(new Set((traits || []).map(cleanTrait).filter(Boolean) as string[]));
}

function traitActionPhrase(trait: string): string {
  return TRAIT_ACTION_MAP[trait] || "specific actions, choices, gestures, or responses";
}

function buildHeroBehaviorNotes(traits: string[]): string | undefined {
  if (!traits.length) return undefined;
  return [
    "Hero behavior notes:",
    "Use these only to decide actions. Do not repeat these words in the visible summary:",
    ...traits.map((trait) => `- ${trait} should appear as ${traitActionPhrase(trait)}.`),
  ].join("\n");
}

function buildSupportingBehaviorNotes(characters: Brief["supportingCharacters"]): string | undefined {
  const lines = (characters || [])
    .map((c) => {
      const name = c.name?.trim() || c.relationship?.trim();
      const traits = uniqueTraits(c.traits || []);
      if (!name || !traits.length) return "";
      const traitList = traits.join(" or ");
      const actionHints = traits.map(traitActionPhrase).join("; ");
      return `${name}'s traits are private direction only. Show them through what ${name} notices, offers, fixes, asks, chooses, or how ${name} responds. Useful behavior cues: ${actionHints}. Do not describe ${name} as ${traitList}.`;
    })
    .filter(Boolean);
  if (!lines.length) return undefined;
  return ["Supporting character behavior notes:", ...lines].join("\n");
}

function collectForbiddenTraitWords(brief: Brief): string[] {
  const heroTraits = uniqueTraits(brief.story?.personality || []);
  const castTraits = (brief.supportingCharacters || []).flatMap((c) => uniqueTraits(c.traits || []));
  return Array.from(new Set([...heroTraits, ...castTraits]));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findSummaryQualityIssues(summary: string, forbiddenTraits: string[], childName: string): string[] {
  const issues: string[] = [];
  const lower = summary.toLowerCase();
  for (const term of GENERIC_SUMMARY_TERMS) {
    if (lower.includes(term)) issues.push(`generic phrase: ${term}`);
  }

  for (const trait of forbiddenTraits) {
    const word = escapeRegExp(trait);
    const traitRe = new RegExp(`\\b${word}\\b`, "i");
    if (traitRe.test(summary)) issues.push(`visible trait word: ${trait}`);
  }

  const firstName = childName.trim().split(/\s+/)[0];
  if (firstName) {
    const name = escapeRegExp(firstName);
    const directDescriptor = new RegExp(`\\b${name}\\s+(?:is|was)\\s+(?:an?\\s+)?[^.]{0,45}\\b(?:kid|child|boy|girl|person)\\b`, "i");
    if (directDescriptor.test(summary)) {
      issues.push("direct hero descriptor pattern");
    }
  }

  const appositiveTraitPattern = /\b[A-Z][a-z]+,\s+(?:the\s+)?[^,.]{0,45}\b(?:kid|child|boy|girl|person|friend)\b/i;
  if (appositiveTraitPattern.test(summary)) {
    issues.push("appositive character descriptor pattern");
  }

  return Array.from(new Set(issues));
}

function conceptToolSchema(firstName: string) {
  return {
    type: "object",
    properties: {
      title: {
        type: "string",
        description: `Short, kid-friendly working title (max 60 chars). MUST NOT contain the child's first name${firstName ? ` "${firstName}"` : ""}.`,
      },
      user_visible_summary: {
        type: "string",
        description: `Single paragraph, ~${STORY_LENGTH.target} words (${STORY_LENGTH.min}–${STORY_LENGTH.max}), narrative concept summary shown to the customer.`,
      },
      framework_id: {
        type: "string",
        enum: [
          "curiosity_journey",
          "bedtime_wind_down",
          "brave_choice",
          "generous_heart",
          "silly_escalation",
        ],
        description: "Framework used as the hidden narrative shape.",
      },
      framework_reason: {
        type: "string",
        description: "Brief internal explanation for why this framework fits the inputs.",
      },
      story_seed: {
        type: "object",
        properties: {
          core_conflict: { type: "string" },
          emotional_arc: { type: "string" },
          visual_world: { type: "string" },
          recurring_motif: {
            type: "string",
            description: "Age-aware recurring verbal motif: a phrase, question, sound, image, or sentence pattern that can echo through the full book without feeling like a forced chorus.",
          },
          ending_feeling: { type: "string" },
          image_opportunities: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: [
          "core_conflict",
          "emotional_arc",
          "visual_world",
          "recurring_motif",
          "ending_feeling",
          "image_opportunities",
        ],
        additionalProperties: false,
      },
      personalization_notes: {
        type: "object",
        properties: {
          personality_through_action: { type: "string" },
          interests_used: { type: "string" },
          cast_and_companion_use: { type: "string" },
          avoid_as_obstacle: { type: "string" },
        },
        required: [
          "personality_through_action",
          "interests_used",
          "cast_and_companion_use",
          "avoid_as_obstacle",
        ],
        additionalProperties: false,
      },
      full_book_instruction: {
        type: "string",
        description: "2–4 sentence instruction for the full-book engine, including motif usage guidance.",
      },
    },
    required: [
      "title",
      "user_visible_summary",
      "framework_id",
      "framework_reason",
      "story_seed",
      "personalization_notes",
      "full_book_instruction",
    ],
    additionalProperties: false,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const brief: Brief = body.brief || {};
    const previousSummary: string | undefined = body.previousSummary;

    const childName = brief.child?.name || "the child";
    const ageBand = brief.child?.ageRange || "young";
    const heroTraits = uniqueTraits(brief.story?.personality || []);
    const forbiddenTraitWords = collectForbiddenTraitWords(brief);

    const supporting = (brief.supportingCharacters || [])
      .map((c: any) => {
        const rel = c.relationship?.trim();
        const nm = c.name?.trim();
        const desc = c.description?.trim()
          ? `. ${c.description.trim()}`
          : "";
        const base = nm && rel ? `${nm} (${rel})` : nm || rel;
        return base ? `${base}${desc}` : "";
      })
      .filter(Boolean)
      .join("; ");

    const interestsLine = (brief.story?.interests || [])
      .filter(Boolean)
      .join(", ");

    const personalityLine = heroTraits.join(", ");

    const conceptCtx = {
      childName,
      ageBand,
      gender: brief.child?.gender,
      language: brief.child?.language,
      genre: brief.story?.genre,
      mood: brief.story?.mood,
      lesson: brief.story?.lesson,
      interestsLine,
      personalityLine,
      heroBehaviorNotes: buildHeroBehaviorNotes(heroTraits),
      supportingLine: supporting,
      supportingBehaviorNotes: buildSupportingBehaviorNotes(brief.supportingCharacters || []),
      forbiddenTraitWords: forbiddenTraitWords.join(", "),
      specialThing: describeSpecialThing(brief.specialThing),
      heroQuirk: brief.protagonist?.special as string | undefined,
      thingsAlreadyGoodAt: brief.story?.thingsAlreadyGoodAt,
      thingsCurrentlyTricky: brief.story?.thingsCurrentlyTricky,
      recentMeaningfulMoment: brief.story?.recentMeaningfulMoment,
      buyerRelationship: brief.buyer_relationship || brief.buyerRelationship,
      occasion: brief.occasion,
      previousSummary,
    };

    const selectedFrameworkId = selectSummaryFramework(conceptCtx);
    const userPrompt = STORY_CONCEPT_USER_TEMPLATE({
      ...conceptCtx,
      frameworkId: selectedFrameworkId,
    });

    const firstName = String(childName).trim().split(/\s+/)[0];
    const nameRe = firstName
      ? new RegExp(`\\b${firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:'s|s')?\\b`, "i")
      : null;
    const titleHasName = (t: string) => !!(nameRe && nameRe.test(t));

    const callModel = async (extraInstruction?: string) => {
      const messages = [
        { role: "system", content: STORY_CONCEPT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ];
      if (extraInstruction) {
        messages.push({ role: "user", content: extraInstruction });
      }

      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODELS.summary,
          messages,
          tools: [
            {
              type: "function",
              function: {
                name: "return_story_concept",
                description: "Return a framework-aware story concept with a user-visible title/summary and hidden planning metadata.",
                parameters: conceptToolSchema(firstName),
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_story_concept" },
          },
        }),
      });
    };

    let parsed: StoryConceptResult | null = null;
    let lastBadTitle: string | null = null;
    let lastQualityIssues: string[] = [];
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const feedbackParts: string[] = [];
      if (lastBadTitle) feedbackParts.push(TITLE_RETRY_INSTRUCTION(lastBadTitle, firstName));
      if (lastQualityIssues.length) {
        feedbackParts.push([
          "The previous summary failed quality checks:",
          ...lastQualityIssues.map((issue) => `- ${issue}`),
          "Rewrite the user_visible_summary so personality is shown only through action, not direct descriptors.",
          forbiddenTraitWords.length
            ? `Do not use these exact trait words in the visible summary: ${forbiddenTraitWords.join(", ")}.`
            : "",
          "Avoid generic pitch language. Use concrete, visual behavior instead.",
        ].filter(Boolean).join("\n"));
      }
      const feedback = feedbackParts.length ? feedbackParts.join("\n\n") : undefined;

      const aiResp = await callModel(feedback);

      if (!aiResp.ok) {
        if (aiResp.status === 429) {
          return new Response(
            JSON.stringify({ error: "We're a bit busy — please try again in a moment." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        if (aiResp.status === 402) {
          return new Response(
            JSON.stringify({
              error: "Out of AI credits. Please add credits in Settings → Workspace → Usage.",
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        const t = await aiResp.text();
        console.error("AI gateway error", aiResp.status, t);
        return new Response(JSON.stringify({ error: "AI gateway error" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await aiResp.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      const argsStr = toolCall?.function?.arguments;
      if (!argsStr) {
        console.error("No tool call in AI response", JSON.stringify(data));
        return new Response(
          JSON.stringify({ error: "Model did not return a structured story concept." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const candidate = JSON.parse(argsStr) as StoryConceptResult;
      const candidateTitle = String(candidate.title || "").slice(0, 80).trim();
      const candidateSummary = String(candidate.user_visible_summary || candidate.summary || "").trim();
      const qualityIssues = findSummaryQualityIssues(candidateSummary, forbiddenTraitWords, childName);
      const badTitle = titleHasName(candidateTitle);

      parsed = {
        ...candidate,
        title: candidateTitle,
        framework_id: candidate.framework_id || selectedFrameworkId,
      };

      if (!badTitle && qualityIssues.length === 0) {
        console.log(`Summary validated on attempt ${attempt}: "${candidateTitle}"`);
        break;
      }

      if (badTitle) {
        console.warn(`Attempt ${attempt}: title "${candidateTitle}" contains "${firstName}" — re-prompting.`);
        lastBadTitle = candidateTitle;
      }
      if (qualityIssues.length) {
        console.warn(`Attempt ${attempt}: summary failed quality checks: ${qualityIssues.join("; ")}`);
        lastQualityIssues = qualityIssues;
      }
    }

    let cleanTitle = String(parsed?.title || "").slice(0, 80);
    if (nameRe && titleHasName(cleanTitle)) {
      console.warn(`All ${MAX_ATTEMPTS} attempts violated title rule. Scrubbing "${cleanTitle}".`);
      const stripRe = new RegExp(`\\b${firstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:'s|s')?\\b`, "gi");
      cleanTitle = cleanTitle
        .replace(stripRe, "")
        .replace(/\s+(and|&)\s+the\b/i, " The")
        .replace(/^\s*(and|&|the)\s+/i, "")
        .replace(/\s{2,}/g, " ")
        .replace(/\s+([,.!?;:])/g, "$1")
        .trim();
      if (!cleanTitle) cleanTitle = "A Brave Little Spark";
    }

    const userVisibleSummary = String(parsed?.user_visible_summary || parsed?.summary || "");

    return new Response(
      JSON.stringify({
        title: cleanTitle,
        summary: userVisibleSummary,
        user_visible_summary: userVisibleSummary,
        framework_id: parsed?.framework_id || selectedFrameworkId,
        framework_reason: parsed?.framework_reason || "Selected from wizard story preferences.",
        story_seed: parsed?.story_seed,
        personalization_notes: parsed?.personalization_notes,
        full_book_instruction: parsed?.full_book_instruction,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-summary error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
