// generate-book — full hardcover-book story generation engine.
//
// V1 status: hidden behind /dev/story-preview/:id. Not used in the normal user
// flow. Designed to be wired into the post-purchase flow later without a
// signature change (`revision_note` is accepted from day one).
//
// Input: { brief: StoryBrief, revision_note?: string, modelOverride?: string }
// Output: { id, parsed, raw, framework_id, model, generation_ms }
//
// All prompt text lives in ../_shared/prompts.ts — edit there to change for
// every user on the next deploy.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  ageToBand,
  BookEngineInput,
  BUYER_RELATIONSHIP_LABEL,
  formatCastSummary,
  FrameworkId,
  GeneratedBook,
  grammaticalJoin,
  KernelVars,
  MODELS,
  OCCASION_LABEL,
  parseBookOutput,
  pronounsFor,
  selectFramework,
  SPREAD_COUNT_BY_AGE_AND_FRAMEWORK,
  STORY_BOOK_USER_MESSAGE,
  STORY_FRAMEWORKS,
  STORY_KERNEL,
  validateBook,
  VOCAB_TIER_BY_AGE,
  WORD_COUNT_BY_AGE,
} from "../_shared/prompts.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ---------- Wizard brief -> engine input mapping ----------------------------

const AGE_BAND_TO_INT: Record<string, number> = {
  "0-2": 2,
  "3-5": 4,
  "6-8": 7,
  "9-12": 10,
};

const GENDER_TO_PRONOUN: Record<string, "he" | "she" | "they"> = {
  girl: "she",
  boy: "he",
  "non-binary": "they",
  surprise: "they",
};

const LESSON_TO_VALUE: Record<string, BookEngineInput["value"]> = {
  courage: "courage",
  kindness: "kindness",
  resilience: "resilience",
  friendship: "friendship",
  curiosity: "curiosity",
  "self-confidence": "self_confidence",
  self_confidence: "self_confidence",
  "sharing-generosity": "sharing",
  sharing: "sharing",
  "caring-for-nature": "nature",
  nature: "nature",
  empathy: "empathy",
  "just-for-fun": "just_for_fun",
  just_for_fun: "just_for_fun",
};

const GENRE_PASSTHROUGH = new Set([
  "adventure", "fantasy", "sci_fi", "mystery", "everyday",
  "bedtime", "sports", "fairy_tale", "animals", "superhero",
]);

const COMPANION_CATEGORIES = new Set([
  "pet", "stuffed-animal", "stuffed_animal", "toy", "doll", "toy_vehicle",
]);

function mapGenre(g?: string): BookEngineInput["genre"] {
  if (!g) return "everyday";
  const k = g.toLowerCase().replace(/-/g, "_");
  return (GENRE_PASSTHROUGH.has(k) ? k : "everyday") as BookEngineInput["genre"];
}

function mapValue(lesson?: string): BookEngineInput["value"] {
  if (!lesson) return "curiosity";
  return LESSON_TO_VALUE[lesson] ?? "curiosity";
}

function flattenSpecialThing(s: any): { type?: string; detail?: string } {
  if (!s) return {};
  const cat = (s.category || "").toString().replace(/-/g, " ").trim();
  const d = s.details || {};
  const bits = Object.entries(d)
    .filter(([k, v]) => v && typeof v === "string" && k !== "photo" && !(v as string).startsWith("data:"))
    .map(([k, v]) => {
      if (k === "name") return `named "${v}"`;
      if (k === "color") return `${v} colored`;
      return v as string;
    });
  return {
    type: cat || undefined,
    detail: [cat, bits.join(", ")].filter(Boolean).join(" — ") || undefined,
  };
}

function inferRole(rel?: string, category?: string): "character" | "companion" {
  const r = (rel || "").toLowerCase();
  const c = (category || "").toLowerCase();
  if (COMPANION_CATEGORIES.has(c)) return "companion";
  if (/dog|cat|pet|fish|bird|hamster|rabbit/.test(r)) return "companion";
  if (/stuffed|toy|teddy|doll/.test(r)) return "companion";
  return "character";
}

function joinAppearance(a: any): string | null {
  if (!a) return null;
  const bits = [
    a.hairColor && `hair ${a.hairColor}`,
    a.hairStyle && `${a.hairStyle} hair`,
    a.skinTone && `${a.skinTone} skin`,
    a.glasses && `wears glasses`,
    a.features,
  ].filter(Boolean);
  return bits.length ? bits.join(", ") : null;
}

function ageRangeMidpoint(band?: string): number {
  if (!band) return 5;
  return AGE_BAND_TO_INT[band] ?? 5;
}

function mapBriefToEngineInput(brief: any): BookEngineInput {
  const child = brief.child || {};
  const story = brief.story || {};
  const proto = brief.protagonist || {};
  const cast: any[] = Array.isArray(brief.supportingCharacters)
    ? brief.supportingCharacters
    : [];
  const special = flattenSpecialThing(brief.specialThing);

  // The brief's `mood_tags` is an array; our wizard collects a single mood.
  const moodTags: string[] = Array.isArray(story.mood)
    ? story.mood
    : story.mood
      ? [story.mood]
      : [];

  const childAge = Number.isFinite(brief.child_age_int)
    ? brief.child_age_int
    : ageRangeMidpoint(child.ageRange);

  return {
    child_name: (child.name || "the child").toString().trim(),
    child_age: childAge,
    child_pronouns: GENDER_TO_PRONOUN[(child.gender || "").toLowerCase()] ?? "they",
    child_appearance_notes: joinAppearance(proto.appearance),
    child_special: proto.special || null,
    personality_traits: Array.isArray(story.personality)
      ? story.personality.slice(0, 3)
      : [],

    buyer_relationship: (brief.buyer_relationship || undefined) as
      BookEngineInput["buyer_relationship"],
    occasion: (brief.occasion || null) as BookEngineInput["occasion"],
    include_belongs_to_page: brief.bookBelongsTo !== false,

    genre: mapGenre(story.genre),
    mood_tags: moodTags,
    value: mapValue(story.lesson),

    interests: Array.isArray(story.interests) ? story.interests : [],
    cameo_type: special.type ?? null,
    cameo_detail: special.detail ?? null,

    supporting_cast: cast.map((c) => ({
      name: c.name || "Friend",
      role: inferRole(c.relationship, c.category),
      relationship: c.relationship,
      age: typeof c.age === "number" ? c.age : undefined,
      description: c.description,
      personality_traits: Array.isArray(c.traits) ? c.traits.slice(0, 2) : [],
    })),

    art_style: brief.artStyle,

    things_already_good_at: brief.things_already_good_at ?? null,
    things_currently_tricky: brief.things_currently_tricky ?? null,
    recent_meaningful_moment: brief.recent_meaningful_moment ?? null,
  };
}

// ---------- Variable bag from engine input ----------------------------------

function buildKernelVars(input: BookEngineInput, framework_id: FrameworkId): KernelVars {
  const age_band = ageToBand(input.child_age);
  const [wmin, wmax] = WORD_COUNT_BY_AGE[age_band];
  const spread_count = SPREAD_COUNT_BY_AGE_AND_FRAMEWORK[age_band][framework_id];
  const vocab_tier = VOCAB_TIER_BY_AGE[age_band];
  const p = pronounsFor(input.child_pronouns);
  const cast_summary = formatCastSummary(input.supporting_cast);

  return {
    child_name: input.child_name,
    child_age: input.child_age,
    child_pronouns: input.child_pronouns,
    child_pronouns_subject: p.subject,
    child_pronouns_object: p.object,
    child_pronouns_possessive: p.possessive,
    child_pronouns_subject_capitalized: p.subject_capitalized,
    buyer_relationship: BUYER_RELATIONSHIP_LABEL[input.buyer_relationship || "other"] || "loved one",
    personality_traits: (input.personality_traits || []).join(", ") || undefined,
    child_special: input.child_special || undefined,
    child_appearance_notes: input.child_appearance_notes || undefined,
    interest_phrase: grammaticalJoin(input.interests),
    cameo_detail: input.cameo_detail || undefined,
    cameo_type: input.cameo_type || undefined,
    things_already_good_at: input.things_already_good_at || undefined,
    things_currently_tricky: input.things_currently_tricky || undefined,
    recent_meaningful_moment: input.recent_meaningful_moment || undefined,
    cast_summary: cast_summary || undefined,
    framework_id,
    value: input.value,
    mood_tags: (input.mood_tags || []).join(", ") || "warm",
    occasion: input.occasion ? (OCCASION_LABEL[input.occasion] || "none specified") : "none specified",
    bedtime_setting_modifier: input.genre === "bedtime" && framework_id !== "bedtime_wind_down",
    word_count_target: `${wmin}-${wmax}`,
    spread_count,
    vocab_tier,
    age_band,
    include_belongs_to_page: input.include_belongs_to_page,
  };
}

// ---------- Tiny stable hash for prompt versioning --------------------------
async function shortHash(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .slice(0, 6)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------- Handler ---------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const brief = body.brief || {};
    const revision_note: string | undefined = body.revision_note || undefined;
    const model: string = body.modelOverride || MODELS.book;

    const engineInput = mapBriefToEngineInput(brief);
    const framework_id = selectFramework({
      value: engineInput.value,
      genre: engineInput.genre,
      mood_tags: engineInput.mood_tags,
    });
    const vars = buildKernelVars(engineInput, framework_id);

    const systemPrompt =
      STORY_KERNEL(vars) + "\n\n---\n\n" + STORY_FRAMEWORKS[framework_id](vars);
    const promptHash = await shortHash(systemPrompt);

    const userMessage = revision_note
      ? `${STORY_BOOK_USER_MESSAGE}\n\nRevision note: ${revision_note}`
      : STORY_BOOK_USER_MESSAGE;

    const startedAt = Date.now();

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.8,
          max_tokens: 2500,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
        }),
      },
    );

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
      console.error("AI gateway error (book)", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";
    if (!raw.trim()) {
      console.error("Empty book content", JSON.stringify(data).slice(0, 600));
      return new Response(JSON.stringify({ error: "Model returned no content." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsedCore = parseBookOutput(raw, framework_id);
    const generation_ms = Date.now() - startedAt;
    const parsed: GeneratedBook = {
      ...parsedCore,
      generated_at: new Date().toISOString(),
      model,
      prompt_version: promptHash,
      generation_time_ms: generation_ms,
    };

    // Stub validation (always valid in v1).
    const validation = validateBook(parsed, engineInput);

    // Persist. We use the publishable env vars — RLS allows open insert by design.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon);

    const { data: row, error: insertErr } = await supabase
      .from("generated_books")
      .insert({
        framework_id,
        brief: { ...brief, _engine_input: engineInput },
        raw_output: raw,
        parsed,
        model,
        prompt_hash: promptHash,
        generation_ms,
        status: validation.valid ? "ok" : "needs_review",
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("DB insert failed", insertErr);
      // Still return the book so the dev route works even if persistence fails.
      return new Response(
        JSON.stringify({
          id: null,
          parsed,
          raw,
          framework_id,
          model,
          generation_ms,
          warning: `Persisted failed: ${insertErr.message}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        id: row?.id ?? null,
        parsed,
        raw,
        framework_id,
        model,
        generation_ms,
        validation,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-book error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
