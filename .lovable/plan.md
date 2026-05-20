## Goal

At the end of the run, do a single final sweep that retries any **failed image generations** and any **failed Drive uploads** once. If after that pass any planned page (or portrait 1, or the cover when present) is still missing, the book is marked **failed**, not partially-done.

No second sweep, no per-row retry counter, no `completed_with_errors` state.

## Where the sweep runs

In `generate-book-images/index.ts`, inside the `remaining === 0` branch:

```text
1. ensurePortraits        (unchanged)
2. generatePages          (unchanged; may take multiple invocations)
3. when remaining === 0:
   a. finalSweepGenerations()      ← NEW, single pass
   b. invoke export-book-images-to-drive (existing, retries failed uploads)
   c. verifyComplete() → setPipeline("done") OR "failed"
```

## (3a) Generation retry sweep — single pass

- Query `book_images` for the book where `status='failed'` AND `kind IN ('portrait','page')`.
- For each failed row, exactly **one** retry attempt:
  - Reuse the stored `prompt` already on the row.
  - Rebuild `userContent`: text prompt + `references` (anchor portrait + alt portraits) as image_url parts. Same anchor-preamble logic `generatePages` already uses.
  - Call `callImageModel`. On success: upsert `status='ok'` and `scheduleDriveUpload(...)`. On failure: leave row as `failed` with updated `error`.
- Time budget: if `Date.now() > deadline` mid-loop, stop and self-chain via the existing `generate-book-images` invoke pattern with `pipeline_status='retry_generations'`. The next slice's `remaining === 0` will re-enter this branch and finish the sweep. Net effect is still "one retry per failed row" because successful ones drop out of the failed-set.

No schema change. No per-row attempt counter — if the single retry fails, that's the verdict.

## (3b) Upload retry sweep

`export-book-images-to-drive` already handles this: selects every `status='ok'` row missing `drive_file_id` and re-uploads via `uploadAndStampImage` (4-attempt jittered backoff + audit log). Runs after (3a) so freshly regenerated images get uploaded in the same pass.

## (3c) Completion verdict — strict

After cleanup, recompute against `parsed.pages`:

- Required pages = every `parsed.pages[i]` that has an `image_prompt`.
- Required portrait = portrait slot 1 only (slots 2/3 stay best-effort; they only affect page reference quality, not whether the book is shippable).

A page is **complete** when its `book_images` row has `status='ok'` AND `drive_file_id IS NOT NULL` (image generated AND uploaded to Drive). Same rule for portrait 1.

- If any required row is incomplete → `pipeline_status='failed'`, `pipeline_error` summarizes what's missing (e.g. `"Book incomplete: missing 2 page(s) (7, 19); cover not uploaded"`).
- Otherwise → `pipeline_status='done'`.

This makes "done" actually mean "every planned image was generated and is in Drive". A book missing pages is never silently shipped.

## Files touched

- `supabase/functions/generate-book-images/index.ts`:
  - New `finalSweepGenerations(supabase, bookId, parsed, references, apiKey, deadline, subfolderId)`.
  - New `verifyComplete(supabase, bookId, parsed)` returning `{ ok, missing[] }`.
  - Wire both into the `remaining === 0` branch; replace the current unconditional `setPipeline("done")` with the verdict.
- `_shared/driveUpload.ts`, `export-book-images-to-drive/index.ts`: unchanged.

## Out of scope

- Cover: today this function doesn't generate the cover (it's a separate `generate-cover` path). Verdict checks the cover row only if one exists in `book_images`.
- Surfacing `failed` to the UI beyond what's already on `generated_books.pipeline_status` / `pipeline_error`.
- Restarting/regenerating from the UI — the book stays `failed` until a manual re-run.