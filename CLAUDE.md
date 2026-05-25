# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

A 10-step wizard that collects details about a child (name, interests, appearance, art style preference) and generates a personalized children's book — summary, cover illustration, and full page-by-page content with illustrations. The stack is React + TypeScript (Vite) on the frontend and Supabase Edge Functions (Deno) on the backend.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm test             # Vitest single run
npm run test:watch   # Vitest watch mode
```

To run a single test file: `npx vitest run src/path/to/file.test.ts`

## Architecture

### Wizard state

All wizard answers live in `WizardContext` (`src/contexts/WizardContext.tsx`) as a flat `Record<string, any>`. Key fields written by each step are documented in `src/lib/buildBrief.ts`, which is the canonical mapping of wizard answers → `StoryBrief` sent to edge functions.

`WizardContext` also carries two boolean flags:
- `canContinue` — gates the Continue button in `WizardShell`
- `isGenerating` — disables progress-bar step-jumping while a generation is in-flight

### Step routing

The single source of truth for step order and URL paths is `src/lib/wizardSteps.ts`. Always use `pathForStep(n)` for navigation and `stepNumFromSlug()` for reverse lookup. Never hardcode `/step/N` paths — legacy numeric redirects (`/step/1` → `/step/1-name`) are wired in `App.tsx` but the canonical paths are slug-based.

Steps 1–7 render inside `WizardShell` (`src/components/WizardShell.tsx`), which provides the standard back/continue bottom bar. Steps 8–10 implement their own bottom bars because they have custom CTAs (approve, retry, pipeline triggers).

### AI generation pipeline

All AI is invoked through Supabase Edge Functions. The frontend never calls any AI API directly.

**Edge functions** (`supabase/functions/`):
| Function | Purpose | Returns |
|---|---|---|
| `generate-summary` | ~100-word story summary | `{title, summary}` |
| `generate-cover` | Book cover illustration | `{imageDataUrl}` |
| `generate-character-portrait` | Protagonist portrait | `{imageDataUrl}` |
| `extract-appearance-traits` | Vision pre-pass on uploaded photo | `{traits}` |
| `generate-book` | Full 32-page book engine (V2) | persists to `generated_books`, returns `{id}` |
| `generate-book-images` | Per-page illustrations | persists to `book_images` |
| `export-book-to-drive` / `export-book-images-to-drive` | Google Drive export | |

All edge functions call through the Lovable AI Gateway (`ai.gateway.lovable.dev`) using `LOVABLE_API_KEY` (a Supabase function secret). Frontend env vars are `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.

**Model config** lives in `MODELS` in `supabase/functions/_shared/prompts.ts` — swap model IDs there to upgrade/downgrade. `summary` uses an OpenAI model, `cover` uses a Gemini image model, `book` uses Gemini with long context.

### Single source of truth: prompts

**`supabase/functions/_shared/prompts.ts`** is the canonical location for every AI prompt, model ID, and generation config. All edge functions import from it. When changing prompt copy, change it there only.

**Exception — art style fragments**: The `prompt` strings in `src/lib/artStyles.ts` (used by the Step 6 picker) are intentionally duplicated in `ART_STYLE_PROMPTS` in `prompts.ts`. When editing art style prompts, update both files and regenerate the corresponding `public/art-styles/{value}.jpg` preview thumbnail.

**Exception — page layouts**: `src/lib/pageLayouts.ts` is a client-side mirror of `supabase/functions/_shared/layouts.ts`. They share the same `id`, `textPlacement`, and `illustrationCoverage` fields and must stay in sync by hand.

### Character portrait hook

`useCharacterPortrait` (`src/hooks/useCharacterPortrait.ts`) fires `extract-appearance-traits` then `generate-character-portrait` as soon as the user uploads a photo. It stores status in `WizardContext` under `answers.characterPortrait` so it survives remounts without double-firing. The portrait appears on Step 8 and is passed to `generate-cover` as a likeness anchor.

### Database

Two tables in Supabase Postgres:
- `generated_books` — full book output (V2 parsed JSON, brief, model, Drive export links, pipeline status)
- `book_images` — per-page images with `(book_id, kind, slot)` unique key

Both tables currently use open RLS policies (prototype phase — no auth enforced yet).

### Dev-only features

- `?dev=1` appended to the Step 8 URL skips the normal Step 9 flow and instead calls `generate-book` directly, routing to `/dev/story-preview/:id`.
- `/dev/story-preview/:id` is an unlinked route that renders the full V2 book output (and legacy V1) with per-page copy buttons and JSON/CSV downloads for manual layout review.
- `WizardShell` renders a "⚙ dev: skip step" button below the Continue button that bypasses `canContinue` validation.
