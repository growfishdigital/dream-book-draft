# Cover prompt: hero only

Per product decision, the cover should depict **only** the hero child in a single scene from the story. Supporting characters never appear on the cover (they still appear in the story summary and inside the book).

## Changes

### `supabase/functions/_shared/prompts.ts`
- Remove `supportingDesc` and `supportingPhotoCount` from `CoverPromptCtx`.
- Drop the "Also depict supporting characters" line.
- Replace the "Hero (depicted in the art only…)" line with explicit solo wording:
  > "Subject: ONLY the hero child — {name} — alone in a single evocative scene drawn from the story. Do NOT depict any other people, friends, family members, or supporting characters; the cover features the hero solo."
- Drop the supporting-photo entry from the positional image legend.
- Add a comment at the top of `COVER_PROMPT_TEMPLATE` documenting the "hero only" rule so it isn't reintroduced.

### `supabase/functions/generate-cover/index.ts`
- Stop collecting `supportingPhotos` and stop building `supportingDesc`.
- Stop appending supporting-character images to `userContent` — only the style reference (if any) and hero photos are sent.
- Remove the now-unused `supportingPhotoCount` argument from the template call.

### Memory
- Add a one-line core memory: "Cover art is hero-only — supporting characters appear in the story but never on the cover."

## What stays the same
- Story summary still uses supporting characters (name, relationship, traits, description).
- Inside-book illustrations (future work) are unaffected — this rule is cover-only.
- Hero appearance, photos, art style, title, summary scene seed, composition rules, and "no visible name" rule are unchanged.
