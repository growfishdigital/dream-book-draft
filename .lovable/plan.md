## Goal

Force **1:1 square at 2K** for the **cover** and **interior pages**. Keep **character portraits at 2:3 portrait** at 2K. Modalities: **cover** = `["image","text"]` (needs to render the title text on the artwork), **pages and portraits** = `["image"]` only. Update cover + page-layout prompts for square format.

## Gateway changes

All three image functions call the gateway with `MODELS.cover` (`google/gemini-3-pro-image-preview`).

### 1. `generate-cover/index.ts`

```ts
{
  model: MODELS.cover,
  messages: [{ role: "user", content: userContent }],
  modalities: ["image", "text"],          // unchanged — cover renders title text
  image_config: { aspect_ratio: "1:1", image_size: "2K" },
}
```

### 2. `generate-character-portrait/index.ts`

```ts
{
  model: MODELS.cover,
  messages: [{ role: "user", content: userContent }],
  modalities: ["image"],                   // image-only
  image_config: { aspect_ratio: "2:3", image_size: "2K" },
}
```

### 3. `generate-book-images/index.ts` → `callImageModel`

Used for retry/sweep of both portraits and pages. Add an `imageConfig` parameter so callers pick the ratio:

```ts
async function callImageModel(
  apiKey: string,
  userContent: any[],
  imageConfig: { aspect_ratio: "1:1" | "2:3"; image_size: "2K" },
): Promise<string> {
  // body:
  {
    model: MODELS.cover,
    messages: [{ role: "user", content: userContent }],
    modalities: ["image"],                  // pages + portrait retries are image-only
    image_config: imageConfig,
  }
}
```

Call sites:
- portrait retries → `{ aspect_ratio: "2:3", image_size: "2K" }`
- page generations + `finalSweepGenerations` → `{ aspect_ratio: "1:1", image_size: "2K" }`
- If the sweep ever picks up a `kind === 'cover'` row, branch on `row.kind` and pass `{ aspect_ratio: "1:1" }` (and switch that one call to `modalities: ["image","text"]`). Simplest: keep the sweep skipping `cover` (cover lives in its own function), document the assumption.

### Response parsing

Already only reads `data.choices[0].message.images[0].image_url.url` — unaffected by modality changes.

## Prompt changes

### Cover (`_shared/prompts.ts` → `COVER_PROMPT_TEMPLATE`, ~line 225)

Replace `"Composition: portrait orientation (2:3), the title clearly readable at the top or centered, …"` with:

`"Composition: square format (1:1), the title clearly readable across the upper third or centered, with comfortable margin on all four sides, no extra text, no author byline, no watermarks. Do NOT include \"${childName}\" or any name as visible text on the cover."`

### Character portrait (`_shared/prompts.ts` → `CHARACTER_PORTRAIT_PROMPT_TEMPLATE`)

**Unchanged.** Keeps `"Composition: portrait orientation (2:3), the child centered with comfortable margin on all sides."` to match the 2:3 gateway hint.

### Interior page layouts (`_shared/layouts.ts` → `compositionCue`)

| layout id | new cue |
|---|---|
| `full-bleed` | "square 1:1 full-bleed illustration; no text overlay so the composition can fill the entire canvas" |
| `text-bottom-third` | "square 1:1 canvas — keep the lower third visually quiet (open sky, water, soft ground, or out-of-focus foreground) so text can overlay cleanly" |
| `text-top-third` | "square 1:1 canvas — keep the upper third visually quiet (open sky, plain ceiling, soft wall) so text can overlay cleanly" |
| `text-left-half` | "square 1:1 canvas — compose the scene on the right half; left half is a plain, gently textured backdrop reserved for text" |
| `text-right-half` | "square 1:1 canvas — compose the scene on the left half; right half is a plain, gently textured backdrop reserved for text" |
| `dedication-spot` | "square 1:1 canvas — small, centered decorative spot motif on a clean cream background, single motif, no full scene" |
| `title` | unchanged (reuses cover artwork, no prompt sent) |

Client mirror `src/lib/pageLayouts.ts` has no `compositionCue` field — no update needed.

## Files touched

1. `supabase/functions/generate-cover/index.ts` — add `image_config: 1:1 / 2K`; modality stays `["image","text"]`.
2. `supabase/functions/generate-character-portrait/index.ts` — modality → `["image"]`, `image_config: 2:3 / 2K`.
3. `supabase/functions/generate-book-images/index.ts` — `callImageModel` signature + call sites; modality → `["image"]` for pages/portraits; per-kind `image_config`.
4. `supabase/functions/_shared/prompts.ts` — rewrite cover composition line only.
5. `supabase/functions/_shared/layouts.ts` — 6 `compositionCue` strings.

## Out of scope

- Model swap.
- Client `pageLayouts.ts` mirror.
- Downstream PDF / Drive layout.
