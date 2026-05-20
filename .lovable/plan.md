# Background portrait of the main character (anchor for cover)

## Goal
When the user uploads the first photo of the protagonist on the Character step (`/step/7`, component `Step6.tsx`), immediately kick off a full-body portrait of the protagonist in the currently selected art style. The work happens in the background while the user keeps filling in the wizard. The finished portrait then:
1. Appears above the story summary on `/step/8` (`Step10Summary.tsx`).
2. Becomes the **canonical likeness anchor** passed to `generate-cover` (and later `generate-book`), replacing the raw uploaded photos as the primary visual reference.

## UX behavior

- **Trigger**: `protagonist.photos` goes from 0 → 1 in `Step6.tsx`.
- **Re-trigger conditions** (staleness guard via a `sourceHash`):
  - Art style changes.
  - The first photo slot changes.
  - Manual "Refresh portrait" from `Step10Summary`.
- **State stored in `WizardContext`** under a new `characterPortrait` answer:
  ```ts
  {
    status: "idle" | "loading" | "ready" | "error",
    dataUrl?: string,
    error?: string,
    sourceHash?: string,    // hash(firstPhoto + artStyle)
  }
  ```
- **Step10Summary** renders a portrait slot above the title/summary card:
  - `loading` → soft skeleton with warm rotating copy ("Sketching {name}…").
  - `ready` → rounded image, ~200px tall, centered, small "Refresh portrait" button.
  - `error` → inline message + retry.
  - `idle` (never had a photo) → slot omitted, no layout shift.

## Technical pieces

### 1. New edge function `generate-character-portrait`
- File: `supabase/functions/generate-character-portrait/index.ts`
- Config: `[functions.generate-character-portrait] verify_jwt = false` in `supabase/config.toml`.
- Input: `{ brief }` — reuses `proto.photos`, `proto.appearance`, `proto.special`, `brief.artStyle`.
- New prompt template `CHARACTER_PORTRAIT_PROMPT_TEMPLATE` added to `supabase/functions/_shared/prompts.ts` (single source of truth, alongside `COVER_PROMPT_TEMPLATE`).
  - Full-body portrait, plain neutral/cream background, centered, hero only, no text, art-style fragment from `getArtStylePrompt(brief.artStyle)`, woven appearance bits.
- Calls Lovable AI Gateway with `MODELS.cover` (`google/gemini-2.5-flash-image`), `modalities: ["image", "text"]`, attaches the uploaded photos as `image_url` parts.
- Returns `{ imageDataUrl }`. Same 429/402/AI-error handling as `generate-cover`.

### 2. Hook `useCharacterPortrait`
- File: `src/hooks/useCharacterPortrait.ts`
- Watches first photo + art style; computes `sourceHash`.
- When `photos.length >= 1` AND hash changed AND not already loading, invokes `generate-character-portrait` and writes status transitions into `answers.characterPortrait`.
- Aborts in-flight calls on re-trigger (AbortController).
- Returns `{ status, dataUrl, error, regenerate }`.

### 3. Wire-up in `Step6.tsx`
- Mount `useCharacterPortrait()` once at the top — purely background, no visible UI change.

### 4. Rendering in `Step10Summary.tsx`
- Mount `useCharacterPortrait()` again (idempotent — won't refire if hash matches) to expose `regenerate` to the refresh button.
- New portrait block above the `<h1>Here's {name}'s story</h1>`, styled with the same `hsl(var(--wizard-primary) / 0.18)` border treatment as the summary card.
- New `portraitMessages(name)` array in `src/lib/loadingMessages.ts` for the loading copy.

### 5. Portrait → cover anchor (the new bit)
- **`generate-cover` edge function** changes:
  - Accept new optional input `characterPortraitDataUrl?: string` in the request body.
  - When present, attach it FIRST in the user-content image list (before the raw hero photos) and update `COVER_PROMPT_TEMPLATE` to label it as "Image #1: canonical character reference — match this exact rendition of the hero, including face, body, and outfit. Treat the other photos only as supplemental likeness cues."
  - Adjust the existing image-order comment so it reads `[styleRef?] [characterPortrait?] [heroPhotos…]` and the prompt's "Image #N" indices stay in sync.
  - Behavior with no portrait is unchanged (back-compat).
- **`Step10.tsx` (Generating step)** — wherever it currently invokes `generate-cover`, also pass `characterPortraitDataUrl: answers.characterPortrait?.dataUrl`. If the portrait is still `loading` when the user hits Approve, wait for it (short await with a timeout, falls back to photo-only after ~15s).
- Same hook-up applies for `generate-book` in a follow-up (out of scope here, but flagged in the function comment).

### 6. Persistence
- Image stays in `WizardContext` memory (base64) — same pattern already used for uploaded photos. No new storage bucket.

## Out of scope
- Wiring the portrait into the full-book engine (`generate-book`). Easy follow-up once cover results look good.
- Server-side caching / dedupe — we rely on the client `sourceHash` for now.
