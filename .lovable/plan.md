# Make Cozy Gouache more painterly and colorful

The current prompt is overcorrecting toward "muted desaturated earth tones" and "sepia-toned ink outlines visible throughout every element" — that produces the washed-out, brown-dominant result you're seeing. The reference image actually has gently saturated reds/blues/greens, loose painterly brush strokes, and only minimal linework. We rewrite the prompt to match that.

## What changes in the prompt

**Loosen the palette** (was: strict muted earth tones only)
→ "warm, gently saturated storybook palette — soft reds, mustard yellows, bright leaf greens, sky blues, terracotta, warm browns — anchored by a warm cream/butter paper ground. Avoid neon and over-saturation, but the image should read as colorful and inviting, not sepia or washed out."

**Add explicit painterly direction** (was barely mentioned)
→ "loose visible gouache and watercolor brush strokes, dappled leaf dabs, painterly washes with soft expressive edges, hand-painted texture throughout backgrounds and clothing, brushwork clearly visible — not flat or digitally smooth."

**Soften the linework rule** (was: visible throughout every element)
→ "minimal soft brown linework only where needed for character features and a few key edges; most forms are defined by painted shape and color, not outline. No bold black ink outlines and no heavy sepia overlay."

**Keep what's working**: cold-pressed paper grain, soft pigment bleeds, character recipe (rounded contours, tiny widely-spaced dot eyes, subtle curved mouth, symmetrical rosy cheek patches), vintage rustic clothing, nostalgic mood.

## Files to update

1. `src/lib/artStyles.ts` — replace the `cozy-gouache` entry's `prompt` field.
2. `supabase/functions/_shared/prompts.ts` — replace `ART_STYLE_PROMPTS["cozy-gouache"]` with the exact same string (the two must stay in sync).
3. `public/art-styles/cozy-gouache.jpg` — regenerate the thumbnail with the new prompt (same subject: child + sleeping cat under a tree) so the Step 6 picker matches what the model will actually paint.
4. Deploy `generate-cover`, `generate-character-portrait`, `generate-book-images`, and `generate-book` so the new fragment takes effect for both the wizard preview cover and any full-book run.

## Out of scope

- No code/logic changes — only the prompt string and the thumbnail.
- The other three styles (Geometric Pop, Papercraft Collage, Hand-Drawn Charm) are not touched.
- No changes to the alias map or default-by-genre mapping.

## Verification

- Open `/step/6-art-style` and confirm the Cozy Gouache card shows the new, more colorful and painterly thumbnail.
- Generate a cover with Cozy Gouache selected and confirm it reads as painterly + warm + gently colorful (not sepia-washed).
