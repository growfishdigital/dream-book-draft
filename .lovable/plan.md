## Goal

Make Drive upload behavior debuggable by recording every upload attempt for every `book_images` row, including retries, HTTP status, timing, and final `drive_file_id`. Today the only signal is `book_images.error` (last error message, overwritten) plus edge function console logs that scroll out of view.

## Schema

New table `public.book_image_upload_attempts`:

| column | type | notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `book_image_id` | uuid | the `book_images.id` being uploaded; indexed |
| `book_id` | uuid | denormalized for fast filtering per book; indexed |
| `kind` | text | `portrait` / `page` / `cover` (denormalized) |
| `slot` | int | denormalized |
| `attempt` | int | 1-based attempt number within this upload sequence |
| `source` | text | `progressive` (from `generate-book-images`) or `cleanup` (from `export-book-images-to-drive`) |
| `outcome` | text | `ok` / `retry` / `failed` |
| `http_status` | int nullable | upstream status when applicable |
| `duration_ms` | int nullable | wall time of this single attempt |
| `error` | text nullable | truncated error message (≤500 chars) |
| `drive_file_id` | text nullable | populated on `ok` |
| `drive_file_url` | text nullable | populated on `ok` |
| `created_at` | timestamptz | `now()` |

Indexes: `(book_id, created_at desc)`, `(book_image_id, created_at desc)`.

RLS: enable + the same permissive "anyone can read/insert" policies the existing tables use (matches `book_images` — this is a public prototype with no auth). No update/delete policies needed; rows are append-only.

No changes to `book_images` itself — `drive_file_id`/`drive_file_url`/`error` stay as the "current state" summary; the new table is the full history.

## Edge function changes

### `_shared/driveUpload.ts`

`uploadImageWithRetry` currently swallows per-attempt detail. Refactor it (or add a sibling) so each attempt fires a callback with `{ attempt, outcome, http_status, duration_ms, error }`. `HttpError` already carries `status`.

`uploadAndStampImage` becomes the single place that records attempts:

- Accepts a `source: 'progressive' | 'cleanup'` argument.
- For each attempt the upload helper makes, insert one row into `book_image_upload_attempts` (`outcome: 'retry'` for retried failures, `outcome: 'failed'` for the terminal failure, `outcome: 'ok'` for success).
- Inserts are best-effort — wrapped in try/catch so a logging failure never breaks the upload.

### Call sites

- `generate-book-images` (`uploadByKindSlot` → `uploadAndStampImage`) passes `source: 'progressive'`.
- `export-book-images-to-drive` passes `source: 'cleanup'`.

No changes to the public contract of either function.

## Out of scope

- UI surface for the audit log. (Inspect via the database tools or a quick `select` for now.)
- Retention policy / pruning. Volume is tiny (≤ ~4 attempts × ~35 images per book).
- Backfilling history for books generated before this change.

## Files touched

- New migration: create `book_image_upload_attempts` + indexes + RLS.
- `supabase/functions/_shared/driveUpload.ts` — emit per-attempt callbacks, write rows in `uploadAndStampImage`, accept `source`.
- `supabase/functions/generate-book-images/index.ts` — pass `'progressive'` through `uploadByKindSlot`.
- `supabase/functions/export-book-images-to-drive/index.ts` — pass `'cleanup'`.