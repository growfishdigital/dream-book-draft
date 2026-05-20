
# Auto-export generated books to Google Drive

## Goal

When `generate-book` finishes and persists a `generated_books` row, automatically:

1. Ensure the folder `ThistleBooks / Unprocessed Books / [YYYY-MM-DD]_[Buyer]_[BookTitle]` exists in Drive.
2. Create a formatted Google Doc containing the full book text (one page per page, with image prompt + layout id as metadata) and place it inside that folder.
3. Persist the resulting Drive folder + doc IDs/URLs back on the `generated_books` row so we can re-find them and later drop images into the same folder.

Images are intentionally out of scope for this pass — but the folder is set up so we can add them next.

## Connectors required

- **Google Drive** (`google_drive`) — folder lookup, folder create, move file.
- **Google Docs** (`google_docs`) — create the doc + `batchUpdate` to insert formatted content.

Both go through the Lovable connector gateway under your developer Drive/Docs account, so no per-user OAuth needed. We'll trigger the `standard_connectors--connect` flow for each in the build phase.

## Naming + folder logic

- Folder name: `YYYY-MM-DD_{Buyer}_{BookTitle}` where:
  - `YYYY-MM-DD` from the generation timestamp (UTC).
  - `Buyer` from `brief.buyer_relationship` label (e.g. "Mom", "Grandma", "Friend"), sanitized.
  - `BookTitle` from `parsed.meta.title`, sanitized (strip `/`, `\`, control chars, trim, collapse whitespace, cap at ~80 chars).
- Parent resolution is cached in module scope per cold start:
  - Find `ThistleBooks` (root-level folder, `mimeType='application/vnd.google-apps.folder' and name='ThistleBooks' and 'root' in parents and trashed=false`). Fail loudly if missing — do not silently create it.
  - Find or create `Unprocessed Books` inside `ThistleBooks`.
  - Always create a fresh `[date]_[Buyer]_[BookTitle]` subfolder (don't reuse, even on duplicate titles — append `-2`, `-3` if a collision is detected on the same day).

## Doc structure

One Google Doc per book, page-broken so a human reader can scroll the manuscript.

```
{Book Title}                                ← Heading 1
By {child_name} • Generated YYYY-MM-DD       ← small italic line
Framework: {framework_id} • Age: {age_band} • Words: {word_count_total}

────────────────────────────────────────────
Page 1 — Title page                          ← Heading 2
Layout: title
Text: {page.text}
Image prompt: {page.image_prompt or "(uses cover art)"}
[page break]

Page 2 — Dedication                          ← Heading 2
Layout: dedication-spot
Text: {page.text}
Image prompt: {page.image_prompt}
[page break]

Page 3 — Story (beat: opening)               ← Heading 2
Layout: text-bottom-third
Text: {page.text}
Image prompt: {page.image_prompt}
Continuity: {page.continuity_notes}
[page break]
... (repeats through page 32)
```

Implemented via Google Docs `documents.batchUpdate` with `insertText` + `updateParagraphStyle` (Heading 1 / Heading 2) + `insertPageBreak` between pages. No HTML intermediate.

## Trigger + flow

In `supabase/functions/generate-book/index.ts`, immediately after the successful `generated_books` insert (and only when `status === 'ok'`), fire-and-await a new helper module that performs the export. If the export throws, log it and attach `drive_export_error` to the response but still return the book to the client — generation must never fail because Drive is flaky.

New edge function: **`export-book-to-drive`** (`verify_jwt = false`, added to `supabase/config.toml`).

- Input: `{ book_id }` (it re-reads `generated_books` server-side so callers don't need to ship the full payload).
- Steps: resolve parent folders → create dated subfolder → create Doc → batchUpdate Doc body → move Doc into the dated folder → write `drive_folder_id`, `drive_folder_url`, `drive_doc_id`, `drive_doc_url` back onto the row.
- Returns: `{ folder_url, doc_url }`.

`generate-book` calls it via `supabase.functions.invoke('export-book-to-drive', { body: { book_id } })` after insert. Keeping it as a separate function lets us also expose a "Re-export to Drive" button on `/dev/story-preview/:id` later with zero new wiring.

## DB changes

Migration on `public.generated_books` — add nullable columns:

- `drive_folder_id text`
- `drive_folder_url text`
- `drive_doc_id text`
- `drive_doc_url text`
- `drive_export_status text` — `pending` | `ok` | `failed`
- `drive_export_error text`

No RLS change needed (table is already permissive for the prototype).

## Dev preview tweaks (small)

`src/pages/DevStoryPreview.tsx`: if the loaded book has `drive_folder_url` / `drive_doc_url`, render two small link buttons ("Open Drive folder", "Open Google Doc") next to the existing Download buttons. If export failed, show the error inline so we can debug without leaving the preview.

## Technical notes for the implementer

- Gateway URLs:
  - Drive: `https://connector-gateway.lovable.dev/google_drive/drive/v3`
  - Docs:  `https://connector-gateway.lovable.dev/google_docs/v1`
  - Headers on every call: `Authorization: Bearer ${LOVABLE_API_KEY}`, `X-Connection-Api-Key: ${GOOGLE_DRIVE_API_KEY}` / `${GOOGLE_DOCS_API_KEY}`.
- Drive folder creation: `POST /files` with `{ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }`.
- Doc creation flow: `POST /documents { title }` → capture `documentId` → `POST /files/{documentId}?addParents={folderId}&removeParents=root&supportsAllDrives=true` to move it (Drive API), → `POST /documents/{documentId}:batchUpdate` for content. Order matters because batchUpdate appends from index 1.
- Track a running insertion index for `batchUpdate` requests; build the request list in one pass over `parsed.pages`. Apply `updateParagraphStyle` ranges right after each heading insert. Insert `\n` between blocks; insert a `pageBreak` after each page block.
- Sanitization helper: `s.replace(/[\\/:*?"<>|\u0000-\u001F]/g, '').replace(/\s+/g,' ').trim().slice(0,80)`.

## Build order

1. Migration: add Drive columns to `generated_books`.
2. `standard_connectors--connect` for `google_drive`, then `google_docs`.
3. New edge function `supabase/functions/export-book-to-drive/index.ts` with the helpers above (folder resolution, doc builder, batchUpdate). Add `[functions.export-book-to-drive] verify_jwt = false` to `supabase/config.toml`.
4. Wire `generate-book/index.ts` to invoke it after insert (best-effort, never blocks success response).
5. Add Drive links + error display to `DevStoryPreview.tsx`.
6. Test end-to-end with `?dev=1`, confirm folder + doc appear in `ThistleBooks/Unprocessed Books`.

## Open question

The folder name uses `buyer_relationship` (Mom / Grandma / Friend / …). If you'd rather use the **buyer's actual name** (e.g. their typed first name) we don't currently collect that anywhere in the wizard — let me know and I'll add a tiny field, otherwise I'll go with the relationship label.
