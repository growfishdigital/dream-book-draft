# Central Prompt Config

## Goal
One file you (or anyone) can open to tweak every prompt that affects story generation and cover art. Changes deploy automatically with the next push and apply to all users immediately — no database, no admin UI, no auth needed (which fits this prototype).

## Why a config file (not a database / admin panel)

I considered three options:

1. **Shared config file in the repo** ← recommended
   - Edit in one place, redeploys instantly, version-controlled (you can see what changed and when), zero new infra.
2. **Database table + admin page**
   - Overkill for a prototype with no auth. Would need an admin role, RLS, a UI, and a fetch on every generation. Worth it only if non-developers need to tweak prompts live in production.
3. **Edge function env vars / secrets**
   - Awful for multi-line prompts, no diffing, no history. Bad fit.

Given this is a prototype and you're the one tweaking, **option 1** gives the best speed-to-iteration with zero downside. We can graduate to option 2 later if needed (the config file becomes the default, the DB overrides it).

## What gets built

### New file: `supabase/functions/_shared/prompts.ts`
Single source of truth for every tunable prompt string. Exports:

- `STORY_SYSTEM_PROMPT` — system message for the summary model
- `STORY_USER_TEMPLATE(ctx)` — function that builds the user prompt from the brief (title rules, length, voice, lesson handling, regeneration nudge)
- `TITLE_RETRY_INSTRUCTION(name)` — the re-prompt used when the title contains the child's name
- `COVER_PROMPT_TEMPLATE(ctx)` — function that builds the cover image prompt (style hint, hero description, scene, composition rules, no-text rules)
- `ART_STYLE_PROMPTS` — the 4 style fragments (moved out of the inline map)
- `MODELS` — `{ summary: "openai/gpt-5-mini", cover: "google/gemini-3-pro-image-preview" }` so model choice is tweakable too
- `STORY_LENGTH` — `{ min: 80, target: 100, max: 130 }` knobs

Each export gets a short `//` comment explaining what it controls and any "don't break this" notes (e.g. "must instruct the model to call the tool", "must forbid child name in title").

### Edits to `supabase/functions/generate-summary/index.ts`
- Remove the inline `userPrompt` array and system string
- Import from `../_shared/prompts.ts` and call `STORY_USER_TEMPLATE({...})`
- Use `MODELS.summary` instead of hardcoded model name
- Title-name retry uses `TITLE_RETRY_INSTRUCTION(firstName)`

### Edits to `supabase/functions/generate-cover/index.ts`
- Remove the inline `ART_STYLE_PROMPTS` map and inline `promptText` array
- Import from `../_shared/prompts.ts` and call `COVER_PROMPT_TEMPLATE({...})`
- Use `MODELS.cover` instead of hardcoded model name

### Edits to `src/lib/artStyles.ts`
Keep the frontend `ART_STYLES` array (it also holds labels, emojis, preview paths used by the picker), but add a comment pointing to `supabase/functions/_shared/prompts.ts` as the canonical place for the prompt fragment. The two stay in sync manually — same as today, just documented.

### Memory update
Add a one-liner to `mem://index.md` Core: "All AI prompts live in `supabase/functions/_shared/prompts.ts` — edit there to affect all users."

## How you'll use it

Open `supabase/functions/_shared/prompts.ts`, change a string or a knob (e.g. bump target word count, soften the tone line, change the cover composition rule), and on next deploy every user gets the new prompt. No code changes needed in the function bodies.

## Out of scope
- Per-user prompt overrides
- A/B testing different prompts
- An in-app admin UI for editing prompts (can add later if you want non-devs to tweak)
