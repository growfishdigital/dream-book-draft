Tighten the "interests = seasoning" rule in `supabase/functions/_shared/prompts.ts` so interests don't get pasted onto character clothing, accessories, or other identity-defining details.

## Change

Update rule 4 of `STORY_WRITING_RULES` (line 368) to add a clear "don't paint it on the characters" clause:

- Interests appear in the **world around** the characters (settings, props, supporting characters, sensory beats, background activity) — not stuck onto the main characters themselves.
- Specifically: do not put interests on a character's clothing, accessories, hair, jewelry, tattoos, named pets, room decor that defines them, or chosen name. A child who likes dinosaurs is not wearing a dinosaur shirt on every page; a child who likes space doesn't have rocket-print pajamas as their default outfit.
- Characters keep the appearance defined in their profile. Interests show up through what they encounter, notice, or do — not through costume.
- Still required: each interest appears at least once across the 30 pages as natural flavor; skip pages where it doesn't fit.

Also add one matching short line to `SUMMARY_SYSTEM_PROMPT` (line 62): "interests flavor the world, not the characters' clothing or appearance."

## Out of scope

No changes to image prompts, schema, frameworks, or UI. Only the two prompt strings above.