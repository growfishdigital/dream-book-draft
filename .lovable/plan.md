## Goal

Upload each generated image to Google Drive as soon as it's created (portraits + pages + cover), instead of waiting for a single batch at the very end. Add bounded retry with exponential backoff so transient Drive failures don't lose an image or stall the pipeline.

## Current behavior (recap)

- `generate-book-images` writes each image to `book_images` as base64, then at the end (when `remaining === 0`) invokes `export-book-images-to-drive` once to upload all 32+ rows in a single shot.
- Per-image upload logic + Drive folder/subfolder creation lives in `export-book-images-to-drive/index.ts`.
- No retries today: a single Drive 5xx / 429 on one image just stamps `error` on the row and moves on; the image never lands in Drive.

## New behavior

Each image becomes Drive-visible within a few seconds of being generated. The final batch export becomes a no-op cleanup pass that catches anything missed.

### 1. Shared upload helper (refactor, no behavior change)

Extract the Drive plumbing from `export-book-images-to-drive/index.ts` into `supabase/functions/_shared/driveUpload.ts`:

- `ensureBookImagesSubfolder(supabase, bookId) → { id, webViewLink }` — resolves `generated_books.drive_folder_id` (invoking `export-book-to-drive` if missing), then ensures `book_images_<bookId>/` exists. Caches in-memory per invocation.
- `uploadImageWithRetry(name, parentId, dataUrl) → { id, webViewLink }` — multipart upload with backoff (see §3).
- `uploadAndStampImage(supabase, imgRow, parentId)` — uploads, updates `book_images` row (`drive_file_id`, `drive_file_url`, clears `image_data_url`), returns success/failure.

`export-book-images-to-drive` is rewritten to call these helpers; its public contract (invoke with `{ book_id }`, returns `{ ok, folder_id, folder_url, uploaded_count }`) stays identical.

### 2. Progressive upload hooks in `generate-book-images`

Add a single fire-and-forget helper inside the function:

```text
scheduleDriveUpload(imgRow) {
  EdgeRuntime.waitUntil(uploadAndStampImage(supabase, imgRow, subfolderId))
}
```

Insertion points (right after each `upsertImage(..., status: "ok")`):

1. Anchor portrait (slot 1) — in `ensurePortraits`
2. Alt portraits (slots 2, 3) — in `ensurePortraits`
3. Each page — in `generatePages` after the successful `upsertImage`
4. Cover — wherever the cover image is currently saved (same pattern)

Subfolder is resolved **once** at the top of the handler (after the `parsed` check) via `ensureBookImagesSubfolder`. If that resolution fails (e.g. Drive transient), we log and set `subfolderId = null`; progressive uploads silently skip and the final batch export will catch up.

`EdgeRuntime.waitUntil` is already available in Supabase Edge Functions and keeps the upload alive past the HTTP response without blocking the response. If unavailable in this runtime, fall back to a bare `void uploadAndStampImage(...)` — uploads still get a few seconds before the next slice starts.

### 3. Retry / backoff policy

In `uploadImageWithRetry`:

- Max 4 attempts (1 + 3 retries).
- Retry on: network errors, HTTP 408, 429, 500, 502, 503, 504.
- Do **not** retry on: 400, 401, 403, 404 (auth/config — surface immediately).
- Backoff: 500 ms → 1.5 s → 4 s (jittered ±25%).
- Honor `Retry-After` header if present (cap at 10 s).
- Total worst-case time per image ≈ 6 s, well inside slice budget.

Same policy is reused by the final `export-book-images-to-drive` cleanup pass.

### 4. Final batch export = cleanup pass

`generate-book-images` still invokes `export-book-images-to-drive` once at `remaining === 0`. With progressive uploads working, almost every row already has `drive_file_id` and is skipped (existing `if (img.drive_file_id) continue` already handles this). Anything that progressive upload missed (subfolder wasn't ready, retries exhausted) gets one more chance here.

### 5. No DB schema changes

`book_images` already has `drive_file_id`, `drive_file_url`, `error`. We keep using `error` for the last upload failure message; we don't add a separate upload-retry-count column for v1.

## Files touched

- `supabase/functions/_shared/driveUpload.ts` — **new**, holds folder + upload + retry helpers.
- `supabase/functions/export-book-images-to-drive/index.ts` — refactored to use the shared helpers; behavior preserved.
- `supabase/functions/generate-book-images/index.ts` — resolve subfolder once; call `scheduleDriveUpload` after each successful `upsertImage` for portraits / pages / cover.

## Out of scope

- Realtime UI showing per-image Drive links as they appear (the data is there — `book_images.drive_file_url` — but no UI consumer for it yet).
- Tracking upload attempt counts or per-image upload latency in the DB.
- Changing how the manuscript Google Doc is exported (`export-book-to-drive` is untouched).