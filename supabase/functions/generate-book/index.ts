// generate-book — full hardcover-book story generation engine (V2).
//
// V2 = fixed 32-page structure (title + dedication + 30 story pages), word
// total scaled by reader age (~500 default), and a per-page illustration
// prompt baked in server-side from the chosen layout + canonical character
// appearance blocks. Persisted to public.generated_books (parsed jsonb).
//
// Layout types live in ../_shared/layouts.ts. Adding a new layout = pushing
// one entry there; the prompt table, JSON schema enum, image-prompt
// composition cue, and dev preview renderer all pick it up automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  ageToBand,
  BookEngineInput,
  BookOutputV2,
  bookWordTotalRange,
  buildAppearanceBlocks,
  buildBookJsonSchema,
  buildBookUserMessageV2,
  buildPageImagePrompt,
  BUYER_RELATIONSHIP_LABEL,
  countWords,
  formatCastSummary,
  FrameworkId,
  getArtStylePrompt,
  grammaticalJoin,
  KernelVars,
  MODELS,
  OCCASION_LABEL,
  parseBookPagesOutput,
  pronounsFor,
  selectFramework,
  SPREAD_COUNT_BY_AGE_AND_FRAMEWORK,
  STORY_FRAMEWORKS,
  STORY_KERNEL,
  STORY_LENGTH_BOOK,
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
  "gender-neutral": "they",
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
    personality_traits: Array.isArray(story.personality) ? story.personality.slice(0, 3) : [],

    buyer_relationship: (brief.buyer_relationship || undefined) as BookEngineInput["buyer_relationship"],
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
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

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
    const age_band = vars.age_band;

    // Override the kernel's word target with the V2 book-level total so the
    // model targets ~500 across 30 pages instead of the legacy spread totals.
    const wordRange = bookWordTotalRange(age_band);
    const v2Vars: KernelVars = {
      ...vars,
      word_count_target: `${wordRange.min}-${wordRange.max}`,
      spread_count: STORY_LENGTH_BOOK.pageCount,
    };

    const systemPrompt =
      STORY_KERNEL(v2Vars) + "\n\n---\n\n" + STORY_FRAMEWORKS[framework_id](v2Vars);
    const promptHash = await shortHash(systemPrompt);

    const userMessage = buildBookUserMessageV2({
      age_band,
      include_belongs_to_page: engineInput.include_belongs_to_page,
      buyer_relationship_label: vars.buyer_relationship,
      occasion_label: vars.occasion,
      child_name: engineInput.child_name,
    }) + (revision_note ? `\n\nRevision note: ${revision_note}` : "");

    const startedAt = Date.now();
    const schema = buildBookJsonSchema();

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.8,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_book",
              description: "Return the complete printed book as structured JSON.",
              parameters: schema,
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_book" } },
      }),
    });

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
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error("No tool_call returned", JSON.stringify(data).slice(0, 800));
      return new Response(JSON.stringify({ error: "Model did not return structured book payload." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rawArgs = typeof argsStr === "string" ? argsStr : JSON.stringify(argsStr);
    const parsedRaw = parseBookPagesOutput(rawArgs);

    // Validate page count.
    if (parsedRaw.pages.length !== STORY_LENGTH_BOOK.totalPageCount) {
      console.error(`Expected ${STORY_LENGTH_BOOK.totalPageCount} pages, got ${parsedRaw.pages.length}`);
      // We continue rather than fail — the dev preview will surface the gap.
    }

    // Build canonical appearance blocks once, reuse on every page's image prompt.
    const appearance = buildAppearanceBlocks(brief);
    const artStyleFragment = getArtStylePrompt(engineInput.art_style);

    // Bake the per-page image prompts and assemble the cover prompt.
    const pages = parsedRaw.pages.map((p) => ({
      ...p,
      image_prompt:
        p.role === "title"
          ? null
          : buildPageImagePrompt(p, appearance, artStyleFragment),
    }));

    const coverImagePrompt = [
      `${artStyleFragment}.`,
      `Children's book cover illustration.`,
      `Characters: ${appearance.hero.description}. HERO ONLY — no other people, friends, family, or supporting characters.`,
      parsedRaw.cover.image_scene ? `Scene: ${parsedRaw.cover.image_scene}.` : "",
      parsedRaw.cover.setting ? `Setting: ${parsedRaw.cover.setting}.` : "",
      parsedRaw.cover.mood ? `Mood: ${parsedRaw.cover.mood}.` : "",
      `Composition: portrait orientation (2:3), the title rendered clearly at the top or centered.`,
      `Title text to render on the cover: "${parsedRaw.cover.title}". Render ONLY this title — do not add the child's name, an author byline, or any other text.`,
    ].filter(Boolean).join(" ");

    const generation_ms = Date.now() - startedAt;
    const storyPageWords = pages
      .filter((p) => p.role === "story")
      .reduce((acc, p) => acc + countWords(p.text), 0);

    const parsed: BookOutputV2 = {
      schema_version: "v2",
      meta: {
        title: parsedRaw.meta.title,
        framework_id,
        word_count_total: storyPageWords,
        page_count: pages.length,
        age_band,
        art_style: engineInput.art_style || null,
        repeating_phrase: parsedRaw.meta.repeating_phrase,
        generated_at: new Date().toISOString(),
        model,
        prompt_version: promptHash,
        generation_time_ms: generation_ms,
      },
      cover: {
        title: parsedRaw.cover.title,
        subtitle: parsedRaw.cover.subtitle,
        image_prompt: coverImagePrompt,
      },
      pages,
    };

    const validation = validateBook(parsed, engineInput);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnon);

    const { data: row, error: insertErr } = await supabase
      .from("generated_books")
      .insert({
        framework_id,
        brief: { ...brief, _engine_input: engineInput },
        raw_output: rawArgs,
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
      return new Response(
        JSON.stringify({
          id: null,
          parsed,
          raw: rawArgs,
          framework_id,
          model,
          generation_ms,
          warning: `Persist failed: ${insertErr.message}`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        id: row?.id ?? null,
        parsed,
        raw: rawArgs,
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
