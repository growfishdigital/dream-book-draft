## Goal

Replace the flat-color emoji thumbnails on Step 6 (the art-style picker) with real AI-generated example illustrations — one per style. The prompt used to generate each example becomes the **single source of truth** for that style and is fed directly into the cover-generation prompt later, so what the user picks visually is what the cover model is told to paint.

This also fixes a current bug: the cover edge function checks for style values (`cartoon`, `pastel`, `realistic`) that don't exist in the picker (which uses `cozy-sketch`, `bold-bright`, `dreamy-pastel`), so 3 of 4 styles silently fall back to a generic prompt.

## What changes

### 1. Single source of truth for art styles

Create `src/lib/artStyles.ts` exporting the 4 styles with everything needed in one place:

| value | label | example prompt (also used in cover prompt) |
|---|---|---|
| `watercolor` | Watercolor Storybook | "soft watercolor children's book illustration, hand-painted texture, gentle washes, warm muted palette, paper grain visible, classic storybook feel" |
| `cozy-sketch` | Cozy Sketch | "charming hand-drawn children's book illustration, visible pencil and ink linework, light watercolor wash fill, warm earthy tones, sketchbook feel" |
| `bold-bright` | Bold & Bright | "modern vibrant children's book illustration, bold black outlines, flat saturated colors, playful punchy palette, contemporary cartoon style" |
| `dreamy-pastel` | Dreamy Pastel | "dreamy pastel children's book illustration, soft glowing light, gentle pinks lavenders and creams, ethereal and calm, bedtime story feel" |

### 2. Generate the 4 example images (one-off)

Use a one-off script (Lovable AI, `google/gemini-3.1-flash-image-preview`) to render one 2:3 example per style. Same neutral subject in each so the user is comparing **style only**, not subject:

> "A cheerful young child standing in a small magical meadow holding a glowing lantern, soft sky in background, [STYLE PROMPT], portrait 2:3, no text."

Saved as static assets:
```
public/art-styles/watercolor.webp
public/art-styles/cozy-sketch.webp
public/art-styles/bold-bright.webp
public/art-styles/dreamy-pastel.webp
```

### 3. Update Step 6 picker (`src/pages/steps/Step7.tsx`)

- Import the styles from `src/lib/artStyles.ts` (remove the inline `ART_STYLES` array).
- Replace each thumbnail's flat color block with `<img src="/art-styles/{value}.webp" alt={label} />` rendered at 2:3 aspect with rounded corners.
- Keep the emoji + label + description below each thumbnail.
- Selected state: same primary-color border treatment as today.

### 4. Wire the prompt into cover generation

- Edge function `supabase/functions/generate-cover/index.ts`: import (inline copy is fine — edge functions can't import from `src/`) the same 4-entry map keyed by value, and replace the broken if/else chain at lines 35–44 with a lookup. Falls back to the watercolor prompt if value is unknown.
- The matched style prompt is interpolated into the existing `Children's book cover illustration in ${styleHint}.` line, so the cover model now receives the exact same descriptor the example image was generated with.

### 5. Memory

Add a small entry under "Memories" describing the shared art-styles source of truth and where the previews live.

## File map

```text
src/lib/artStyles.ts                              new — shared constants
src/pages/steps/Step7.tsx                         use shared styles, render images
supabase/functions/generate-cover/index.ts        replace styleHint lookup
public/art-styles/{watercolor,cozy-sketch,        new — 4 generated previews
                   bold-bright,dreamy-pastel}.webp
mem://style/art-styles                            new memory file
```

## Notes

- Generating the 4 previews uses ~4 image-generation calls against the user's Lovable AI balance (one-time, at build time).
- Previews are static assets — fast load, no per-session generation cost for end users.
- If a style is later added or its prompt is tweaked, regenerating its preview keeps the picker thumbnail and the cover output consistent.
