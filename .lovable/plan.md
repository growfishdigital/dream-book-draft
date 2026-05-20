# Fix portrait likeness drift

## Why the current portrait looks nothing like the photo

Three compounding issues:

1. **Weak likeness language.** The prompt says the photo is a "likeness reference for face shape, hair, skin tone" and immediately follows with "render in the chosen art style — not photo-realistically." The style hint (cute cartoon) overpowers the soft likeness ask. There is no hard rule like "hair color MUST match exactly."
2. **Empty appearance text.** `protoDesc` is built only from the manual "Adjust appearance" accordion on Step 6. Most users skip it after uploading a photo, so the prompt has zero textual reinforcement of "blonde hair, fair skin." The model defaults to brown.
3. **Invented outfit.** The prompt explicitly tells the model to *choose a charming outfit*, so the denim jacket is discarded. That further loosens the model's grip on the reference and contributes to the "wrong kid" feel.

## What to build (the three fixes)

### 1. Strengthen the portrait prompt — hard likeness rules

`supabase/functions/_shared/prompts.ts` → `CHARACTER_PORTRAIT_PROMPT_TEMPLATE`

- When `heroPhotoCount >= 1` and no anchor portrait, replace the soft "likeness reference" line with a hard, explicit rule:
  - "The attached photo is the CANONICAL LIKENESS for the hero. You MUST preserve, exactly as shown in the photo: hair color, hair length and shape, skin tone, eye color, eyebrow color, face shape, and any distinguishing features (freckles, dimples, etc.). Stylize ONLY the rendering — never invent or change these traits."
- Re-order the lines so the likeness rule appears BEFORE the style hint, not after, so the style instruction can't override it.
- Add a "Do NOT" clause: "Do not change hair color to brown/blonde unless that matches the photo. Do not add or remove glasses unless shown in the photo. Do not change skin tone."

### 2. Auto-extract appearance traits from the uploaded photo

New tiny edge function: `extract-appearance-traits` (or fold into existing `generate-character-portrait` as a pre-pass — see Tech notes).

- Input: first hero photo data URL.
- Calls Lovable AI Gateway with a cheap vision model (`google/gemini-3-flash-preview`) and a tight JSON schema:
  ```
  { hair_color, hair_length, hair_style, skin_tone, eye_color, glasses, distinguishing }
  ```
- Result is written back into `answers.protagonist.appearance` (only fields the user hasn't already filled — never overwrite manual input).
- Trigger: same place the portrait auto-fires (first photo upload). Runs once per photo source hash.
- The newly-populated appearance flows through `buildBrief` → `protoDesc` automatically, so the portrait prompt now contains explicit "hair color: Blonde, skin tone: fair" text reinforcing the photo.

### 3. Reuse the outfit from the photo

`CHARACTER_PORTRAIT_PROMPT_TEMPLATE` — the no-anchor branch:

- Replace "Choose a single charming outfit" with: "Outfit: recreate the outfit visible in the photo (e.g. jacket type, shirt, pants) in the chosen art style. This outfit becomes iconic and is reused on the cover and inside the book."
- Anchor branch keeps "REUSE the exact outfit from the anchor reference."
- Downstream cover + book-image prompts already say "match the anchor portrait," so iconic outfit will carry through automatically.

## Tech notes

- **Where to host the trait extractor:** Cheapest is a new edge function `extract-appearance-traits` invoked from `useCharacterPortrait` before `generate-character-portrait`. Keeps responsibilities clean and lets us cache its result in `answers.appearanceAutofill`.
- **Race condition:** Portrait should wait for trait extraction to finish before firing, so `protoDesc` is populated. Implement as: trait-extract → then portrait, sequentially, in `useCharacterPortrait.run`.
- **User precedence:** If the user has manually set `appearance.hairColor` (etc.), DO NOT overwrite. Only fill blanks.
- **No schema changes**, no UI changes, no business logic changes outside the portrait pipeline.
- **Files touched:**
  - `supabase/functions/_shared/prompts.ts` (rewrite portrait template body)
  - `supabase/functions/extract-appearance-traits/index.ts` (new)
  - `src/hooks/useCharacterPortrait.ts` (sequence trait-extract → portrait, merge results into `answers.protagonist.appearance`)
- **Out of scope:** Cover prompt rewording, book-image prompt rewording, model swap, schema migrations.

## Verification

After implementing, re-run Step 6 with the Macaulay photo:
- Expect: blonde hair, fair skin, denim jacket + white tee.
- Check edge logs for `extract-appearance-traits` returning expected JSON.
- Inspect `protoDesc` in `generate-character-portrait` logs to confirm "hair color: Blonde" is present.
