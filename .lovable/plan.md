# Refresh the 4 illustration styles

Replace all four art-style options on Step 6 with new names, slugs, descriptions, emojis, and detailed prompts. Generate fresh thumbnails from the new prompts. Add a legacy alias map so any in-flight wizard state (or the existing `storybook-soft` backend default) keeps working.

## The four new styles

| Slot | Old slug → New slug | New label | Emoji |
|---|---|---|---|
| 1 | `watercolor` → `cozy-gouache` | Cozy Gouache | 🎨 |
| 2 | `cozy-sketch` → `geometric-pop` | Geometric Pop | 🔷 |
| 3 | `bold-bright` → `papercraft-collage` | Papercraft Collage | 📜 |
| 4 | `dreamy-pastel` → `hand-drawn-charm` | Hand-Drawn Charm | ✏️ |

Each gets the full descriptive prompt you sent (medium, palette, texture, character features, negatives) wired in as a single fragment string — that fragment is what `generate-cover`, `generate-character-portrait`, and `generate-book-images` inject into their image prompts.

## Files to change

1. **`src/lib/artStyles.ts`** — replace the `ART_STYLES` array with the four new entries (label, value=new slug, emoji, desc, prompt, preview path).
2. **`supabase/functions/_shared/prompts.ts`** — replace the four entries in `ART_STYLE_PROMPTS` with the new slugs + matching prompts. Keep `storybook-soft` (backend-only fallback). Update the `getArtStylePrompt` default fallback from `watercolor` → `cozy-gouache`.
3. **Legacy alias map** (new, small) — in `prompts.ts` and mirrored in `artStyles.ts`:
   - `watercolor` → `cozy-gouache`
   - `cozy-sketch` → `geometric-pop`
   - `bold-bright` → `papercraft-collage`
   - `dreamy-pastel` → `hand-drawn-charm`
   - `storybook-soft` → `cozy-gouache` (closest match for the backend fallback)
   `getArtStylePrompt(value)` resolves through the alias map before lookup so any stored state, default mapping, or in-flight book still renders.
4. **`src/pages/steps/Step6ArtStyle.tsx`** — update `getDefaultArtStyle(genre)` to point at the new slugs (same genre buckets):
   - adventure / superhero / sports → `geometric-pop`
   - bedtime / everyday → `hand-drawn-charm`
   - fantasy / fairy-tale → `cozy-gouache`
   - default → `papercraft-collage`
5. **`public/art-styles/*.jpg`** — generate four new 2:3 thumbnails (one per style) using each new prompt with a consistent subject ("a small child sitting under a tree with a small animal companion") so the picker shows true differentiation. Saved as:
   - `public/art-styles/cozy-gouache.jpg`
   - `public/art-styles/geometric-pop.jpg`
   - `public/art-styles/papercraft-collage.jpg`
   - `public/art-styles/hand-drawn-charm.jpg`
   Old files (`watercolor.jpg`, etc.) get deleted to avoid stale references.

## Out of scope

- No changes to Step 6 UI/layout, the 2-column grid, or the "we pre-selected the best style" copy.
- No changes to `generate-cover` / `generate-character-portrait` / `generate-book-images` — they consume `getArtStylePrompt()` and pick up the new prompts automatically.
- No DB migration needed (art style is a wizard-state string, not a stored column with a check constraint).

## Verification

- Load `/step/6-art-style` and confirm all four new cards render with new labels, emojis, descriptions, and the freshly generated thumbnails.
- Click each card → continue → confirm the brief carries the new slug.
- Spot-check `getArtStylePrompt("watercolor")` resolves to the `cozy-gouache` prompt (alias works).
- Trigger a cover gen on one new style and confirm the image visibly matches the new prompt direction.
