
# Plan: 32-page book engine with per-page image prompts + extensible layout system

Same scope as before — fixed 32-page structure, ~500 words, paired image prompt per page, persisted JSON for manual layout. Updated so adding new layout types later is a one-file change.

## Page model (unchanged)

```text
page 1     — title page
page 2     — dedication page (+ belongs-to line if enabled)
pages 3–32 — story pages (30 pages, ~500 words total)
```

Total: 32 interior pages + cover. Word total scales by age band (350 / 500 / 650 / 850 for 0-2 / 3-5 / 6-8 / 9-12), page count stays 32.

## Extensible layout system — the key new piece

Layouts are first-class, registered objects. The model never invents one; it only picks from a registry. Adding a new layout = adding one entry to the registry. No engine, parser, or renderer code changes.

### New file: `supabase/functions/_shared/layouts.ts`

```ts
export interface PageLayout {
  id: string;                 // "full-bleed", "text-bottom-third", "spot-illustration", ...
  label: string;              // human label for the dev preview
  appliesTo: Array<"title"|"dedication"|"story">;
  /** Soft hint passed to the image model so it leaves space in the right place. */
  compositionCue: string;     // e.g. "leave the lower third visually calm — sky, water, or soft ground — for a text overlay"
  /** Renderer hint for the dev preview / future layout tool. */
  textPlacement: "none"|"top"|"bottom"|"left"|"right"|"overlay-center"|"facing-page";
  /** How much of the page the illustration occupies. */
  illustrationCoverage: "full"|"three-quarter"|"half"|"spot"|"none";
  /** Optional: which page roles this is *preferred* for, for the model's selection heuristic. */
  preferFor?: Array<"opening"|"rising"|"turn"|"climax"|"resolution"|"closing">;
}

export const PAGE_LAYOUTS: PageLayout[] = [
  { id: "title", appliesTo: ["title"], textPlacement: "overlay-center", illustrationCoverage: "full",
    compositionCue: "reuse the cover artwork; no new illustration prompt" , label: "Title page" },
  { id: "dedication-spot", appliesTo: ["dedication"], textPlacement: "top", illustrationCoverage: "spot",
    compositionCue: "small, centered decorative spot illustration — single motif on white background, no scene", label: "Dedication w/ spot" },
  { id: "full-bleed", appliesTo: ["story"], textPlacement: "none", illustrationCoverage: "full",
    compositionCue: "edge-to-edge illustration; no reserved text area — this page has no text overlay", label: "Full bleed (image only)", preferFor: ["climax","turn"] },
  { id: "text-bottom-third", appliesTo: ["story"], textPlacement: "bottom", illustrationCoverage: "three-quarter",
    compositionCue: "keep the lower third visually quiet (sky, water, soft ground) so text overlays cleanly", label: "Text bottom" },
  { id: "text-top-third", appliesTo: ["story"], textPlacement: "top", illustrationCoverage: "three-quarter",
    compositionCue: "keep the upper third visually quiet (sky, ceiling, plain wall) for a text overlay", label: "Text top" },
  { id: "text-left-half", appliesTo: ["story"], textPlacement: "left", illustrationCoverage: "half",
    compositionCue: "compose the scene on the right half of the canvas; left half is plain backdrop for text", label: "Text left / image right" },
  { id: "text-right-half", appliesTo: ["story"], textPlacement: "right", illustrationCoverage: "half",
    compositionCue: "compose the scene on the left half of the canvas; right half is plain backdrop for text", label: "Text right / image left" },
];
```

Adding a future layout (e.g. "vignette circular frame", "split-spread diptych", "all-caps single word overlay") = push a new object into `PAGE_LAYOUTS`. The engine, schema, parser, persistence, dev preview, and downloads all pick it up automatically.

### How the engine uses the registry

1. **Schema constraint** — `BookOutputSchema` (zod) declares `layout_id: z.enum([...PAGE_LAYOUTS.map(l => l.id)])`. The structured-output call physically can't return an unknown layout.
2. **Prompt** — `STORY_BOOK_USER_MESSAGE` is built by serializing the registry into a short table the model sees: `id — label — when to use — composition cue`. Updates flow automatically.
3. **Image prompt assembly** — when we bake the per-page image prompt, we look up `compositionCue` for the page's `layout_id` and append it. So a new layout's composition rule is honored without touching the engine.
4. **Renderer** — the dev preview iterates pages, calls `renderLayout(page)` which switches on `textPlacement` + `illustrationCoverage`. New layouts that fit those enums render with zero code change. Truly novel placements add a new enum value + one render branch.

## Per-page output schema (final)

```ts
{
  meta: { title, framework_id, word_count_total, page_count: 32, age_band, art_style, repeating_phrase, generated_at },
  cover: { title, subtitle, image_prompt },
  pages: [
    {
      page_number: 1..32,
      role: "title"|"dedication"|"story",
      beat?: "opening"|"rising"|"turn"|"climax"|"resolution"|"closing", // story pages only
      text: string,                       // 8–25 words for story pages; total 450–550 across all story pages (scaled by age band)
      image_prompt: string|null,          // null for title page only
      continuity_notes: string,           // short reminder of outfit/time/setting carried from previous page
      layout_id: string,                  // must be a registry id valid for this role
    },
    ...
  ]
}
```

Image prompts are server-assembled (model writes only the scene; we own the style + appearance + composition boilerplate) so character & style consistency holds across all 30 pages.

## Prompt changes (`supabase/functions/_shared/prompts.ts`)

1. New `STORY_LENGTH_BOOK` with per-age totals + `pageCount: 30` + per-page word range.
2. New `buildPageImagePromptTemplate(page, layout, briefBlocks)` helper.
3. New `buildAppearanceBlocks(brief)` — computes hero + named-supporter appearance blocks **once** for reuse across all 30 pages (single biggest lever for character consistency).
4. New `serializeLayoutRegistryForPrompt()` — turns `PAGE_LAYOUTS` into the markdown table the model sees, so adding a layout updates the prompt with no further edits.
5. Rewritten `STORY_BOOK_USER_MESSAGE` — enforces the rigid 32-page structure, total + per-page word ranges, and demands the model pick `layout_id` from the registry, varying it page-to-page so identical layouts don't repeat back-to-back.
6. New exported `BookOutputSchema` (zod) used directly by the engine's structured output call.

Old `SPREAD_COUNT_BY_AGE_AND_FRAMEWORK` and the bracket-format instructions stay in the file but are unused by the book path (kept for backward-compat with anything that imports them).

## Engine (`supabase/functions/generate-book/index.ts`)

- Drop the regex `[SPREAD N]` parser entirely.
- Switch to AI SDK `generateText` + `Output.object(BookOutputSchema)` against the Lovable AI Gateway (existing `MODELS.book` constant).
- Post-process pass:
  - validate page count = 32 and roles in expected slots; fix or fail loud
  - compute appearance blocks once
  - for each page: build final `image_prompt` = `artStyleFragment + scene (from model) + appearance blocks (filtered to characters in scene) + setting + mood + layout.compositionCue + "no text in image"`
  - compute `meta.word_count_total` and stamp `generated_at`
- Persist to `generated_books` unchanged (`parsed` jsonb already holds anything).

## Storage & access

No schema migration. Existing `generated_books` table; existing public-read RLS.

Three access paths on `/dev/story-preview/:id`:

1. **Rendered preview** — 32 page cards. Each card shows page number, role, layout label, text, image prompt (copyable `<pre>`), continuity notes. A small layout-aware preview block uses `textPlacement` + `illustrationCoverage` to show roughly where text/image sit. New layouts that fit those enums get a preview for free.
2. **Download `book.json`** — the full `parsed` object, ready to drop into a layout tool or pipeline.
3. **Download `pages.csv`** — one row per page: `page_number, role, beat, layout_id, text, image_prompt, continuity_notes`. Spreadsheet-friendly for InDesign data merge or hand layout.

Per-page "Copy JSON" and "Copy image prompt" buttons on each card.

## Build order

1. `supabase/functions/_shared/layouts.ts` — new file, the registry above.
2. `supabase/functions/_shared/prompts.ts` — add `STORY_LENGTH_BOOK`, appearance-block + image-prompt builders, registry serializer, new `STORY_BOOK_USER_MESSAGE`, exported `BookOutputSchema`.
3. `supabase/functions/generate-book/index.ts` — switch to AI SDK structured output, run post-process, persist.
4. `src/pages/DevStoryPreview.tsx` — render the new shape, copy buttons, JSON + CSV downloads, layout-aware page preview.
5. Update `mem://features/story-engine` to record: fixed 32 pages, ~500 words (scaled by age), registry-driven layouts, JSON/CSV export from dev preview.

## Defaults applied (you can override)

- Word total scales by age band: 350 / 500 / 650 / 850.
- Dedication stays auto-generated from `buyer_relationship` + `occasion`; no new wizard field.
- Layouts include the 7 in the registry above, with the model picking per page and avoiding back-to-back repeats.

If you want any of those three flipped, say so and I'll adjust before building. Otherwise approving this plan executes it end-to-end.
