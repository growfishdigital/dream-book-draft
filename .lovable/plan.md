# Recover current job + correct folder name

## Folder name fix
- `supabase/functions/export-book-to-drive/index.ts`: change `"Thistle Books"` → `"ThistleBook"` in the `findFolder` call and the error message.
- Redeploy `export-book-to-drive`.

## Recover book `7a054950-7091-4f2a-b6ea-d6556bc96648`
1. Invoke `export-book-to-drive` with that `book_id` → creates dated subfolder under `ThistleBook/Unprocessed Books/` and the manuscript Google Doc; stamps `drive_folder_id` + `drive_doc_url` onto the row.
2. Invoke `export-book-images-to-drive` with the same `book_id` → uploads all 13 already-generated `book_images` rows (portraits + cover + pages) into `book_images_<id>/`.
3. Verify with `SELECT drive_folder_url, drive_doc_url FROM generated_books WHERE id = '7a054950…'` and a count of `book_images` where `drive_file_id IS NOT NULL`.

Pages 14–31 were never generated (the run failed at "Painting page 3" per your screenshot — the pipeline stopped because every image upload was erroring on the missing folder). They will NOT regenerate from this recovery; this only uploads what already exists. If you want the remaining pages, we'd need a separate "resume image pipeline" call — say the word and I'll add that next.

## Optional (not in this plan)
Older orphan row `c8b90584…` (34 images, `pipeline_status='failed'`) — leave alone unless you also want to recover it.
