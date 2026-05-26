# Add story-writing guardrails

All edits in `supabase/functions/_shared/prompts.ts`. No UI, no schema, no API changes. The summary prompt (`SUMMARY_USER_TEMPLATE`) already treats interests as "Optional background interests" and doesn't push buyer/occasion into the plot, so the main work is in the full-book engine path (`STORY_KERNEL` + `buildBookUserMessageV2`).

## Background — current behavior

- `STORY_KERNEL` currently injects `Buyer relationship` and `Occasion` as plain context lines, which lets the model lean on them.
- Interests are described as "background texture, not a checklist" but with no explicit rule that they are flavoring only, must still appear, and may be skipped per page.
- There is no content-safety clause and no explicit age-tone clause anywhere in the writing prompts.
- 5 frameworks in `STORY_FRAMEWORKS` already define plot shape — we'll reinforce that the framework owns structure and interests don't.

## Changes

### 1. New shared "writing rules" block

Add a single exported constant `STORY_WRITING_RULES` with four rule groups:

- **Content safety**: no profanity, no nudity or sexual content of any kind, no crude or bathroom humor, no scary imagery beyond age-appropriate mild tension, no violence beyond cartoon slapstick suitable for the age band.
- **Age appropriateness**: vocabulary, sentence length, themes, emotional intensity, and humor must match the given `age_band` (reuse `VOCAB_TIER_BY_AGE` wording). Concepts beyond the age band (romance, death-as-plot, real-world hazards, complex moral ambiguity for under-6) are off-limits unless explicitly part of the chosen value.
- **Gifter / occasion neutrality**: buyer relationship and occasion are internal metadata only. They must not appear in story text, must not shape the plot, setting, or characters, and must not be referenced in the dedication beyond a single soft mention if `include_belongs_to_page` is true.
- **Interests = seasoning, present but not dominant**:
  - The chosen framework owns the plot arc. Interests never drive the main conflict, resolution, or structure.
  - Interests must still show up somewhere — every listed interest should appear at least once across the 30 story pages as flavor (setting detail, supporting character, prop, sensory beat, background activity).
  - Appearance is natural and uneven: not every page needs an interest, weights don't have to be equal, and an interest should be skipped on any page where it doesn't fit rather than forced in.
  - Interests change the texture of the world, not the shape of the story.

### 2. Wire the rules into `STORY_KERNEL`

- Append `STORY_WRITING_RULES` to the kernel string so every framework run includes them.
- Rephrase the existing interests line from "Interests are background texture, not a checklist" to "Interests are seasoning — present somewhere across the 30 pages but never plot drivers. See writing rules." to avoid duplication.
- Remove the `Buyer relationship: ... Occasion: ...` line from the kernel entirely (it's still available to the dedication-only message in `buildBookUserMessageV2`).
- Keep `things_already_good_at` / `things_currently_tricky` / `recent_meaningful_moment` lines as-is.

### 3. Tighten `buildBookUserMessageV2`

- Keep buyer relationship + occasion in the dedication context line (their only legitimate use).
- Add one explicit sentence: "Buyer relationship and occasion are for the dedication only — they must not influence story pages 3–32 in any way."

### 4. Lightweight summary alignment

In `SUMMARY_USER_TEMPLATE`, add a single short line:
"Hard rules: no profanity, no sexual content, no crude humor; tone must match the age band; ignore buyer relationship and occasion for plot; interests are flavor only."

This keeps the pre-purchase teaser consistent with the full book.

## Out of scope

- No changes to image prompts, frameworks list, schema, validators, or wizard UI.
- No changes to `generate-summary` / `generate-book` edge function code — they just re-import the updated prompt strings.
- No new safety post-processing or moderation pass; we're relying on prompt-level rules for now.

## Files touched

- `supabase/functions/_shared/prompts.ts` (single file)
