
# Goal

The book is now a fixed 32-page structure (1 title + 1 dedication + 30 story pages), but `prompts.ts` still talks like the old 8–14 "spread" engine. The KERNEL tells the model "Spread count: exactly 30 spreads," the framework files only show beat allocations for 10 or 12 spreads, and the per-page word budgets are a single hardcoded constant that doesn't scale with the age-band total. The model has been making it work, but we're leaving a lot of quality on the table.

This plan rewrites the prompt layer so the 32-page structure is the source of truth, beat allocations scale to 30 pages, and per-page word counts derive cleanly from the age-band total.

---

# 1. Switch terminology from "spread" to "page" on the V2 path

Right now the system prompt (KERNEL) and all 5 framework files say "spread" everywhere, while the V2 user message says "page." The model gets contradictory signals.

Two viable approaches:

- **A. In-place rename** — Edit KERNEL + frameworks so every "spread" becomes "page." Cleaner long-term, but deletes the legacy V1 path (which we don't use anymore — `generate-book` only calls V2).
- **B. Add a V2 KERNEL + V2 framework variants** — Keep the originals untouched as historical reference. More code, no real benefit.

**Recommendation: A.** V1 spread parsing (`parseBookOutput`, `GeneratedBook` interface) can stay for any old DB rows, but the prompt strings should reflect what we actually ship.

Specifically:
- KERNEL: drop the `[COVER TEXT]/[OUTFIT]/[SPREAD N]` text-format block at the bottom (lines ~547–569). V2 uses tool-calling JSON; that block actively misleads the model.
- KERNEL: change "Spread count: exactly N spreads" → "Page count: exactly N story pages (the book also has a title page and a dedication page handled separately)."
- KERNEL rules that say "per spread" become "per page" (name usage rule, opening variation rule, micro-cliffhanger rule). Soften "every page ends on a cliffhanger" — at 30 pages, that's too much. Make it "most pages end with a hook; quiet pages may settle."
- Frameworks: rename "spreads" → "pages" in the beat headers and bodies.

# 2. Dynamic beat allocation for 30 pages

Currently each framework hardcodes "For 12 spreads: …" / "For 10 spreads: …" mappings. With V2 always passing `spread_count = 30`, the model has no map to follow.

Two ways to handle this:

- **Percentage-based (recommended)** — Each framework declares beats with a `weight` (fraction of the story). A helper distributes 30 pages across the beats using largest-remainder rounding. The framework prose then renders the resulting page ranges inline: e.g., for `curiosity_journey`, "THE SPARK: pages 3–5 (3 pages), THE FIRST DISCOVERY: pages 6–8, THE CHAIN: pages 9–22 (the engine, ~14 pages)…"
- **Hardcoded 30-page tables** — Simpler, but if we ever change page count (40-page deluxe?) we redo all five.

Recommended structure in `prompts.ts`:

```ts
type BeatSpec = { id: StoryBeat; label: string; weight: number; body: (v) => string };
const FRAMEWORK_BEATS: Record<FrameworkId, BeatSpec[]> = { … };

function allocateBeats(beats: BeatSpec[], storyPageCount: number,
                       firstStoryPage: number): BeatAllocation[] { … }
```

The framework function then renders the rendered allocation table at the top, followed by the per-beat prose bodies. This makes 30-page allocations self-documenting and lets us change `STORY_LENGTH_BOOK.pageCount` in one place.

# 3. Age-scaled per-page word budgets

Today: `STORY_LENGTH_BOOK.perPageTarget = 16`, `perPageMin/Max = 4/28` — fixed regardless of age.

At the 0–2 band the total is 250 words. 250 / 30 ≈ **8 words/page** — the model is being told target 16 (2× too high) and floor 4 (fine). At the 11+ band the total is 900 / 30 = **30 words/page**, which exceeds the current per-page max of 28. So the model gets contradictory bounds at both ends of the age range.

Fix by deriving per-page bounds from the band's total:

```ts
function perPageWordBounds(age_band: AgeBand) {
  const target = totalByAgeBand[age_band] / pageCount; // e.g. 16.7
  return {
    target: Math.round(target),
    min: Math.max(2, Math.round(target * 0.35)),  // quiet pages allowed
    max: Math.round(target * 2.2),                // climax can be ~2× target
  };
}
```

For the 0–2 band specifically (250 / 30 = ~8 words/page), explicitly tell the model that **many pages can be 0–3 words** (single sound, single label) or even image-only — and bias `layout_id` toward `full-bleed` / `caption-only` (we'd need a caption-only layout if it doesn't exist). The whole point of 0–2 books is that text is a garnish.

The V2 user message (`buildBookUserMessageV2`) already prints these numbers. Wire the new helper in and replace the constants.

# 4. Image prompt updates

The per-page image-prompt builder (`buildPageImagePrompt`) is structurally fine — it composes art style + scene + appearance blocks + layout cue + "no text" rule. What's missing for a 30-page run:

- **Continuity discipline.** Add a sentence to the V2 user message reminding the model that `continuity_notes` is critical at 30 pages (time of day, outfit, location carryover between consecutive pages).
- **Beat-aware composition hints.** When the model picks `layout_id`, give it stronger guidance: opening beats favor establishing wides; climax beats favor `full-bleed`; resolution beats favor warm mid-shots; closing beats favor calm/symmetric. This is a 4-line table added to the layouts section of the user message — no schema change.
- **Hero outfit lock.** V1's KERNEL had an `[OUTFIT]` field we're now dropping. We should preserve the spirit: tell the model in the V2 user message to mention the hero's outfit in `continuity_notes` on page 3, then carry it forward unchanged. Optionally add an explicit `book_outfit` field at the `meta` level so the server can inject "wearing {outfit}" into every appearance block. Cheap consistency win.

# 5. Cleanup of stale references

- `SPREAD_COUNT_BY_AGE_AND_FRAMEWORK` is computed in `generate-book/index.ts` but then overwritten with 30. Either delete it (and `KernelVars.spread_count`) or rename to `legacySpreadCount` and keep for the V1 parser. Recommend delete.
- `STORY_LENGTH` (80/100/130 words) at the top of `prompts.ts` is for the *summary* (Step 9 wizard), not the book — leave it alone but add a comment so future-me doesn't conflate it with the book length.
- "Each supporting character should appear in 1–3 spreads" → "1–3 pages" (and probably bump to "2–6 pages" at 30 pages, otherwise supporting cast feels like cameos).

# 6. Files touched

- `supabase/functions/_shared/prompts.ts` — main work (KERNEL rewrite, framework refactor, per-page bound helper, V2 user message tweaks).
- `supabase/functions/generate-book/index.ts` — drop `SPREAD_COUNT_BY_AGE_AND_FRAMEWORK` import + the legacy `spread_count` override block; pass the new per-page bounds into the V2 user message helper if I move that logic.
- `supabase/functions/_shared/layouts.ts` — possibly add a `caption-only` / `text-minimal` layout for the 0–2 age band (optional, can ship later).

# Open questions for you

1. **Confirm 30 pages is fixed for v1 of the product.** If a deluxe 40-page tier is on the horizon, I'll keep `pageCount` as the single knob and make sure everything downstream reads it (no new constants to chase).
2. **0–2 band:** are you OK with many image-only / 1–word pages for that age group? It's the right answer pedagogically but worth confirming before I encode it as a hard rule.
3. **Hero outfit lock:** want me to add an explicit `meta.book_outfit` field to the JSON schema so the server can stitch it into every page's appearance prompt? It's the single highest-leverage move for visual consistency across 30 illustrations.
