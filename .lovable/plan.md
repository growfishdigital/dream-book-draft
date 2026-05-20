## Root cause

`generate-book-images` is one long invocation that needs ~31 pages × ~30s ≈ 15 min of work. The edge runtime kills it around the 150–400s wall-clock limit, the HTTP call returns 5xx, and the client surfaces **"Edge Function returned a non-2xx status code."**

DB confirms it: portraits 1–3 + pages 2–6 are persisted as `status: ok`, then nothing. The function was killed mid-loop, not crashed by a page error.

## Fix: resumable, self-chaining slices

The data model already supports this — `book_images` rows are upserted on `(book_id, kind, slot)` and both phases skip slots already marked `ok`. We just need each invocation to do a small slice and hand off.

### 1. `supabase/functions/generate-book-images/index.ts`

- Add a soft time budget `MAX_RUN_MS = 50_000` captured at handler start.
- In `generatePages`, check the budget before each page; break out of the loop when exceeded.
- After portrait + page phases return, recompute remaining work from `book_images`:
  - If any pages are still missing → **self-invoke** `generate-book-images` with `{ book_id }` (fire-and-forget, no `await`), set `pipeline_status = "pages"`, return `200 { ok: true, continued: true }`.
  - If all pages exist → run Drive export, set `pipeline_status = "done"`, return `200 { ok: true, done: true }`.
- Drop `seed_portrait_data_url` from the chained re-invocation body (portrait slot 1 is already in `book_images`).
- Failure containment: track consecutive page failures. After 3 in a row, set `pipeline_status = "failed"` with the last error and stop chaining. Single isolated failures keep going (current behavior).

### 2. `src/pages/steps/Step11.tsx`

- The fire-and-forget `.then` on `generate-book-images` currently flips the UI to `failed` on any invoke error. Change it to:
  - Log the error.
  - Only surface as failure if the DB poll *also* reports `pipeline_status === "failed"`.
- Add a stall watchdog in the existing poll effect: if `pipeline_progress.current` hasn't advanced in 60s and status isn't `failed` or `done`, fire one extra `generate-book-images` invocation to nudge a stuck chain. Reset the watchdog whenever progress advances.

That's it for the client — the DB-backed poller already drives the progress bar correctly across multiple invocations.

## Why this works

Every invocation fits inside the edge-runtime limit (~1–2 slices), persists progress, and hands itself the next slice. The progress bar advances continuously from 0 → 31 pages instead of hard-stopping around page 6.

## Out of scope

- No new queue table or background worker — the orchestrator is its own queue via `book_images`.
- No model swap, no prompt changes, no Drive flow changes.
- No "Regenerate failed pages" UI (future, once the happy path is solid).

## Files touched

- `supabase/functions/generate-book-images/index.ts`
- `src/pages/steps/Step11.tsx`
