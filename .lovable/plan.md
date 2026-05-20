# Fix: Drive uploads failing — folder name mismatch

## Root cause

`export-book-to-drive` searches the connected Drive for a top-level folder named **`ThistleBooks`** (no space). Your actual Drive root folder is **`Thistle Books`** (with a space). Every export call fails with:

> Couldn't find a top-level 'ThistleBooks' folder in the connected Drive.

Because the manuscript export never succeeds, `generated_books.drive_folder_id` stays `NULL`. Every `generate-book-images` upload then bails with "Book has no Drive folder yet" — so portraits, cover, page 1, and the Doc never reach Drive even though they generate correctly in the DB.

## Change

Update the hardcoded root folder name in two edge functions to match the real Drive folder:

- `supabase/functions/export-book-to-drive/index.ts` — replace the `findFolder("ThistleBooks", "root")` lookup (and the error message that mentions it) with `"Thistle Books"`.
- Audit `supabase/functions/export-book-images-to-drive/index.ts` and `supabase/functions/_shared/driveUpload.ts` for any other `ThistleBooks` literal and update to `"Thistle Books"`. (The shared helper resolves via `drive_folder_id` so likely no change needed, but verify.)

No schema changes, no client changes, no other behavior changes.

## Verify after deploy

1. Re-run the current book generation (or trigger a fresh one with `?dev=1`).
2. Check `export-book-to-drive` logs — expect a success line, no "Couldn't find" error.
3. Check `generated_books` row — `drive_folder_id` and `drive_doc_url` populated.
4. Check `generate-book-images` logs — uploads should succeed; no more "Book has no Drive folder yet".
5. Refresh the `Thistle Books / Unprocessed Books` folder in Drive — expect the dated subfolder containing the manuscript Doc plus `book_images_<id>/` with portrait, cover, and page PNGs as they finish.
