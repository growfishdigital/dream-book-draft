
# Thistlebook Story Engine — Adapted Plan

This plan adapts the supplied Build Brief + Story Template to our prototype. It honors every prompt-content decision in the template (frameworks, banned words, voice rules, validation rules) but replaces every infrastructure assumption (Next.js, Anthropic, file-on-disk, orders table, admin auth) with the equivalent in our toolkit.

---

## 1. What stays exactly as the brief specifies

The following are **prompt content** and transplant verbatim with no adaptation:

- The KERNEL block, all 5 FRAMEWORK blocks (Curiosity Journey, Bedtime Wind-Down, Brave Choice, Generous Heart, Silly Escalation).
- The framework-selection decision matrix (value wins; bedtime is a setting modifier).
- All voice/prose rules, banned words, repeating-phrase rules, age calibration table, authenticity rules.
- The output format (`[COVER TEXT]`, `[OUTFIT]`, `[DEDICATION]`, `[REPEATING PHRASE]`, `[BELONGS TO PAGE]`, `[SPREAD N] [BEAT: ...]`).
- `bedtime_setting_modifier` flag pattern.
- Pronoun helpers (subject/object/possessive/Subject_capitalized).
- WORD_COUNT_BY_AGE, VOCAB_TIER_BY_AGE, SPREAD_COUNT_BY_AGE_AND_FRAMEWORK lookup tables.
- The Aria worked example (kept as a fixture for manual QA).

---

## 2. What gets adapted to our toolkit

### Stack swaps

| Brief assumes | We do |
|---|---|
| Next.js API route | Supabase **edge function** `generate-book` (matches our `generate-summary`/`generate-cover` pattern) |
| Anthropic Claude Sonnet 4.5 via `@anthropic-ai/sdk` + `ANTHROPIC_API_KEY` | **Lovable AI Gateway** with a single `MODELS.book` constant in `_shared/prompts.ts`. Default `google/gemini-2.5-pro` (best reasoning + long context for 8–14 spreads). Switching to Claude later = swap one constant + add a secret. |
| Template stored as `.md` file, read at runtime | TypeScript module: extend `supabase/functions/_shared/prompts.ts` with a new `STORY_KERNEL`, `STORY_FRAMEWORKS` map, `STORY_USER_TEMPLATE_BOOK` — all type-safe, deploys atomically with the function, single tweak point per our existing convention. |
| `orders` table + `customer_id` + Stripe | No orders. Engine takes the existing `WizardContext` brief as input, returns the book. |
| `/admin/story-preview/:orderId` with auth guard | `/dev/story-preview/:bookId` route, **no auth**, hidden from main nav, gated behind a `?dev=1` query flag in the wizard finish flow. Acceptable because there's no PII, no payment, no public link to it. |
| Stage 3 validator + 2 retries | **Skipped for v1.** Validator function is stubbed (returns `{valid: true, issues: []}`) so adding it later is one file edit. Operator inspects in the dev route. |

### Persistence (minimal)

One new table in Lovable Cloud:

```text
generated_books
├─ id            uuid pk default gen_random_uuid()
├─ created_at    timestamptz default now()
├─ framework_id  text not null
├─ brief         jsonb not null   -- snapshot of the wizard input used
├─ raw_output    text             -- exactly what the model returned
├─ parsed        jsonb            -- the GeneratedBook object
├─ model         text not null
├─ prompt_hash   text             -- short hash of kernel+framework version
└─ generation_ms int
```

No RLS, no auth — this is a closed prototype. The dev route reads any row by id. (We'll add RLS the moment the project gets auth.)

### Wizard data → engine input mapping

The brief's `Order` shape maps to our `Brief` (from `buildBrief.ts`) like this:

| Brief.Order field | Source in our wizard | Notes |
|---|---|---|
| `child_name` | `child.name` | direct |
| `child_age` (int) | `child.ageRange` | **midpoint mapping**: 0-2→2, 3-5→4, 6-8→7, 9-12→10. Acceptable for v1; revisit if validation says word counts feel off. |
| `child_pronouns` | `child.gender` | girl→she, boy→he, non-binary→they, surprise→they |
| `child_appearance_notes` | `protagonist.appearance.*` | join non-null fields into one sentence (we already do this for cover) |
| `child_special` | `protagonist.special` | direct |
| `personality_traits` | `story.personality[]` | slice to 3 |
| `buyer_relationship` | **NEW STEP** (see §3) | parent/grandparent/teacher/friend/other |
| `occasion` | **NEW STEP** | birthday/christmas/easter/new_sibling/first_day/graduation/baptism/just_because/other |
| `include_belongs_to_page` | `bookBelongsTo` | direct |
| `genre` | `story.genre` | enum remap table in code |
| `mood_tags[]` | `[story.mood]` | wrap single→array |
| `value` | `story.lesson` | key remap: `self-confidence`→`self_confidence`, `caring-for-nature`→`nature`, `sharing-generosity`→`sharing` |
| `interests[]` | `interestsList[].word` | direct |
| `cameo_type` / `cameo_detail` | `specialThing.{category, details}` | flatten `details` (skip photo/data: keys) into one descriptive string |
| `supporting_cast[]` | our supporting characters | infer `role: "character"\|"companion"` from category (pet/stuffed → companion) |
| `art_style` | `artStyle` | enum keys already match |
| `things_already_good_at` / `things_currently_tricky` / `recent_meaningful_moment` | not collected | send `null`; template ignores absent optional fields |

---

## 3. New wizard step: "Who's this for?" (slot after Step 1)

Per your direction — quick, encouraging, on-brand. Not a friction step.

- **Headline:** something like "Beautiful — let's make this personal." (warm Playfair, our standard.)
- **Two questions on one screen:**
  1. *"Who's making this book?"* — 5 chip-style options: I'm their parent / grandparent / teacher / friend / someone else. (Single select, FIFO replacement per our existing pattern.)
  2. *"Is there a special occasion?"* — 9 chips + "just because" default selected: birthday / Christmas / Easter / new sibling / first day / graduation / baptism / just because / other. (Single select.)
- **Continue gate:** both must be set; "just because" satisfies the second. Encouraging microcopy under the button ("This will make the dedication unforgettable.").
- Wizard becomes 11 steps. Update `WizardContext`, progress bar, and the `mem://project/wizard-steps` memory.

---

## 4. The engine — `supabase/functions/generate-book/index.ts`

Architecture mirrors our existing `generate-summary` function:

1. **Receive** `{ brief, devOverride?: boolean }` from the client. In v1, this endpoint is **only invoked from the dev route or with `devOverride: true`**. The normal user flow (Steps 8–10) is unchanged.
2. **Map** brief → engine input (using mapping table above).
3. **Compute derived vars**: `framework_id` (decision matrix), `age_band`, `word_count_target`, `spread_count`, `vocab_tier`, `cast_summary`, `interest_phrase`, `bedtime_setting_modifier`, all four pronoun helpers.
4. **Assemble system prompt** = `STORY_KERNEL` + `STORY_FRAMEWORKS[framework_id]`, then run our existing template-literal substitution (same pattern as `COVER_PROMPT_TEMPLATE`). Conditional blocks for optional fields are simple ternaries — no Handlebars dependency.
5. **Call Lovable AI Gateway** at `MODELS.book` with `temperature: 0.8`, `max_tokens: 2500`, `messages: [{system}, {user: "Write the book according to the framework above. Output in the exact format specified."}]`. Surface 429/402 errors per our existing pattern.
6. **Parse** the `[SECTION]` + `[SPREAD N] [BEAT: ...]` output into `GeneratedBook`. Defensive parser per the brief.
7. **Persist** to `generated_books`. Return `{ id, parsed, raw }`.

Validator is a single exported function `validateBook()` that returns `{valid: true, issues: []}` for v1 (so we can wire Stage 3 in later without changing call sites).

The function signature accepts `revision_note?: string` from day one (per the brief's "build for it, don't build it") so the future refine loop works without a signature change.

---

## 5. Dev-only admin preview — `/dev/story-preview/:bookId`

A React Router route, no auth, not linked from anywhere. Renders:

- Header: brief snapshot (child name, age, framework_id, model, generation time).
- Cover text (large, Playfair).
- Dedication (italic).
- Repeating phrase (highlighted).
- Belongs-to (if present).
- Each spread as a card: "Spread N — Beat label" header, then the prose.
- "View raw output" expandable.
- "Regenerate" button (re-fires the engine with the same brief, creates a new row).

Also add a small `?dev=1` toggle on the final wizard step that, when present, fires `generate-book` instead of (or in addition to) the existing summary/cover flow and routes to `/dev/story-preview/:id`. **Without `?dev=1` the user flow is completely unchanged.**

---

## 6. Coexistence with the current summary flow

Per your direction:

- Steps 1–10 stay exactly as they are. `generate-summary` (Step 8 preview), `generate-cover` (Step 9), and the upsell preview (Step 10) are untouched.
- The full-book engine is **additive and hidden** in v1. It exists, is tested via the dev route, and is ready for Phase 2 when we wire it into the post-purchase flow.
- The summary prompt and the book prompt both read from the **same engine input shape** (the mapped brief), so improvements to the input mapping benefit both.

---

## 7. Deviations from the brief (and why)

| Brief says | We do | Why |
|---|---|---|
| Use Anthropic Claude Sonnet 4.5 | Default to Lovable AI (Gemini/GPT-5) | No Anthropic key in project; matches our existing prompt infrastructure. Designed to swap. |
| Template as `.md` file | Template as TS module in `_shared/prompts.ts` | Matches our convention; type-safe; atomic deploys. |
| Stage 3 validator + 2 retries | Skipped in v1, stub in place | Per your call. Adds back as one file edit when we see real failure modes. |
| `/admin` route with auth | `/dev` route, no auth, unlisted | No auth in this prototype; nothing sensitive in the data. |
| Persist orders + book per-customer | Persist book only, by uuid, no user link | No auth/orders model exists. |
| `child_age` is integer | Mapped from our age band via midpoint | Our wizard collects book-format band, not specific age. |
| `mood_tags` array | Single mood wrapped as `[mood]` | Our wizard is single-select. |
| Customer-facing preview = separate scope | Same — we keep our existing preview/upsell flow, full book stays hidden | Aligns. |

---

## 8. New memory entries (after implementation)

- `mem://features/story-engine` — "Full-book generation engine: hidden in v1, wired via `/dev/story-preview/:id` and `?dev=1`. Generates KERNEL + framework-specific prompts; output: cover_text, outfit, dedication, repeating phrase, spreads. Replace summary flow only when product is ready."
- Update `mem://project/wizard-steps` to reflect 11 steps (new Step 2: Who's this for?).
- Update Core: "Engine is model-agnostic via `MODELS.book` constant; default Lovable AI, swappable to Claude."

---

## 9. Out of scope (explicitly)

- No Stripe / payments / Lulu / fulfillment.
- No auth / RLS / user_roles table.
- No PDF composition.
- No image generation for spreads (cover stays as today).
- No replacement of the summary step.
- No customer-facing book preview UI (the existing 5-page upsell carousel stays).
- No streaming responses.
- No A/B framework versioning infrastructure (the brief flags this as future).

---

## 10. Acceptance for this build

1. New wizard step collects `buyer_relationship` and `occasion`; both flow into `WizardContext`; Continue gating works.
2. `generate-book` edge function deployed; given a valid brief returns a parsed `GeneratedBook` matching the brief's output schema.
3. The Aria fixture (from the template's worked example) can be passed in and produces a structurally valid book (right framework picked, ~12 spreads, repeating phrase present, no banned words in a hand-spot-check).
4. `/dev/story-preview/:id` renders any persisted book with all fields.
5. Normal user flow (Steps 1 → 11) reaches the existing preview screen with **no behavioral change**.
6. Switching the model is a one-line constant edit.
