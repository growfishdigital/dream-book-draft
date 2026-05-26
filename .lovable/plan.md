## Goal

Change the pre-purchase story summary from a back-cover-style teaser into a **full beginning-to-end synopsis** of the story.

## Why this needs more than a single edit

The current behavior is enforced in three coordinated places, all of which actively push the model toward "teaser":

1. **System prompt** says "be brief and selective."
2. **User-prompt editorial guide** explicitly says: "not the full story, not a plot outline", "Do not reveal every gag, plot beat, or ending. Save page-level details for the full book", and "Include at most two specific plot/gag beats. Do not summarize the whole book."
3. **Length cap** (`STORY_LENGTH` = 130/150/170 words) is too short to fit a real arc.
4. **Validators** in `generate-summary/index.ts` warn when the model exceeds that length or mentions "twist/reversal/the only way out" — which a true synopsis legitimately needs.
5. **Few-shot examples** in `SUMMARY_EXAMPLES_BY_FRAMEWORK` are all teaser-shaped (open hook, withheld ending), so the model will mimic them.

## Changes (all in `supabase/functions/_shared/`)

### 1. `prompts.ts`

- **`STORY_LENGTH`**: raise to roughly `{ min: 220, target: 270, max: 320 }` so a full arc (setup → inciting event → 1–2 escalations → climax → resolution) actually fits.
- **`SUMMARY_SYSTEM_PROMPT`**: drop "be brief and selective"; replace with language framing the output as a **full synopsis from beginning to end, including how the story resolves**, while keeping the existing hard rules (no profanity/nudity/crude humor, age-appropriate, buyer/occasion ignored, interests are seasoning).

### 2. `storyConceptPrompt.ts` — `STORY_CONCEPT_USER_TEMPLATE`

Rewrite the **Editorial style guide** and **Visible summary rules** sections to flip teaser → synopsis:

- Replace "This is a customer-facing concept blurb, not the full story, not a plot outline" with: "This is a complete plot synopsis of the picture book from beginning to end. It should describe the setup, the inciting moment, the main attempts/escalations, the climactic choice, and how the story resolves."
- Remove "Do not reveal every gag, plot beat, or ending. Save page-level details for the full book."
- Remove "Include at most two specific plot/gag beats. Do not summarize the whole book."
- Replace it with: "Cover the full arc. Include the ending and the emotional resolution. Aim for 4–7 concrete story beats."
- Keep all existing guardrails that are still valid: no name in title, no trait adjectives in visible text, no formula-leak phrases, no list summary, no in-illustration label text, framework/pattern stay invisible scaffolding, interests as seasoning, etc.
- Update the wording about examples so the model treats them as **tone references only** and understands the new output is longer and covers the whole arc (the existing few-shots stay in place; we don't need to rewrite them, just relabel their role).
- Adjust the word-count line to use the new `STORY_LENGTH` values.

### 3. `generate-summary/index.ts`

- Update the `lightConceptToolSchema` description for `user_visible_summary` to say "full beginning-to-end synopsis, ~`STORY_LENGTH.target` words, includes the ending."
- In `summaryIssues`:
  - Length check already uses `STORY_LENGTH.max + 12`, so it auto-follows the new cap — no code change needed there.
  - Remove `"twist or reversal"`, `"final unexpected choice"`, `"the only way out"`, and `"emotional arc"` from `GENERIC_SUMMARY_TERMS` (a real synopsis is allowed to describe the climax/turn in plain language). Keep the more obviously meta phrases like `"invisible structure"` and `"works for about three seconds"`.
  - Loosen the "explains moral instead of implying growth" check: a full synopsis legitimately describes what changes for the child by the end. Drop the `learns that / discovers that` flags (or narrow them to only flag the most lecture-y phrasings — happy to keep this minimal and just drop the check).
- Leave `framework_id` / pattern selection, trait-word bans, in-illustration label check, and title rules untouched.

### Out of scope

- Frontend (`Step8Summary.tsx`): no changes. It already shows a live word count and has no hard cap, so a longer synopsis renders fine.
- Full-book engine, image prompts, schema, frameworks, title rules.
- No changes to the few-shot example summaries (they continue to anchor tone/voice).

## Technical summary

| File | Change |
|---|---|
| `supabase/functions/_shared/prompts.ts` | Bump `STORY_LENGTH` to 220/270/320. Rewrite `SUMMARY_SYSTEM_PROMPT` to ask for a full synopsis. |
| `supabase/functions/_shared/storyConceptPrompt.ts` | In `STORY_CONCEPT_USER_TEMPLATE`, replace teaser-oriented "Editorial style guide" + "Visible summary rules" lines with synopsis-oriented ones; relabel examples as tone references. |
| `supabase/functions/generate-summary/index.ts` | Update tool-schema description for `user_visible_summary`; trim `GENERIC_SUMMARY_TERMS` and the moral/`learns that` warning so they don't fight a legitimate full synopsis. |
