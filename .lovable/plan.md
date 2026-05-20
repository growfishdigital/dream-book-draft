
# Post-purchase story + image generation pipeline

## Goal

After the user "purchases" on Step 11, run the full backend pipeline end-to-end:
1. Generate the full book text (already exists via `generate-book`).
2. Generate 1–3 character portraits (front / 3/4 side / action), anchored to the existing portrait from Step 6.
3. Sequentially generate every page illustration, anchored to those portraits + per-page scene/layout prompts.
4. Upload all images to the same Google Drive folder as the manuscript, in a `book_images_<bookId>/` subfolder, named `page-01.png`, `page-02.png`, etc.

Canonical bookID = `generated_books.id` (existing uuid). All new rows reference it.

## What changes for the user

- **Step 11**: replace the "Place order" button with a tiny buyer form (name + email), then a "Pay" button. On click, we kick off the pipeline and show a "Crafting your book…" screen with a real progress indicator (story → portraits → page 1/30 → page 2/30…). When done, show the existing success state. No real Stripe yet.

## Data model

New table `book_images` (one row per image asset for a book):

```text
id              uuid pk
book_id         uuid not null  -- FK generated_books.id (logical, no hard FK)
kind            text not null  -- 'portrait' | 'page' | 'cover'
slot            int  not null  -- portrait: 1..3 ; page: page_number ; cover: 0
prompt          text
image_data_url  text           -- base64 (kept short-term until Drive upload)
drive_file_id   text
drive_file_url  text
status          text not null default 'pending'  -- pending|ok|failed
error           text
generated_ms    int
created_at      timestamptz default now()
unique (book_id, kind, slot)
```

New columns on `generated_books`:
- `buyer_name text`
- `buyer_email text`
- `pipeline_status text default 'idle'`  -- idle|story|portraits|pages|done|failed
- `pipeline_progress jsonb`               -- `{ stage, current, total, message }`
- `pipeline_error text`

RLS: same permissive "anyone can read/insert/update" pattern as `generated_books` (no auth in the prototype).

## Edge functions

### `generate-book` (modify)
- Accept `buyer_name` and `buyer_email` in the request; stamp them onto the row + brief so the Drive folder name (already keyed off `brief.buyer_name`) picks them up.
- Set `pipeline_status = 'story'` at start, `'portraits'` on success. Return `{ id, ... }` as today.

### `generate-character-portrait` (modify)
- Accept `pose: 'front' | 'side' | 'action'` and `photoDataUrl` (the specific source photo to base this portrait on).
- Accept optional `anchorPortraitDataUrl` — when present (portraits 2 & 3), feed it FIRST as the canonical likeness reference, then the alt photo as the source-of-pose reference.
- Update `CHARACTER_PORTRAIT_PROMPT_TEMPLATE` in `_shared/prompts.ts` to take a `pose` arg:
  - front: full-body, facing camera, neutral cream background.
  - side: 3/4 turn, same outfit, same background.
  - action: mid-motion expressive pose appropriate to one of the child's interests, same outfit.
- Still returns `{ imageDataUrl }`. No DB write — the orchestrator persists it into `book_images`.

### `generate-book-images` (NEW)
- Input: `{ book_id }`.
- Loads the `generated_books` row (must have `parsed.pages` and `parsed.cover.image_prompt`).
- Updates `pipeline_status = 'portraits'` and `pipeline_progress = { stage:'portraits', current:0, total: N }`.
- **Portrait phase**:
  - Reads `brief.protagonist.photos[]` (already saved). N = `min(photos.length, 3)`.
  - Portrait 1 = the existing portrait from Step 6 (passed in via `answers.characterPortrait.dataUrl` and saved to the row before invoking; falls back to a fresh `front` portrait if absent).
  - Portrait 2 (if photo 2 exists) = pose `side`, anchored on portrait 1.
  - Portrait 3 (if photo 3 exists) = pose `action`, anchored on portrait 1.
  - Each result inserted into `book_images (kind='portrait', slot=1..3)`.
- **Page phase**:
  - Sets `pipeline_status='pages'`.
  - For each page where `image_prompt` is not null (skips the title page), sequentially calls the Lovable AI gateway with `MODELS.cover` and:
    - text = `image_prompt` (already baked in `generate-book`, includes art style + canonical appearance + scene + layout).
    - images = `[portrait1, portrait2?, portrait3?]` as anchor references, prepending a short "Use Image #1 as the canonical character appearance reference; Images #2–#3 are alternate poses of the same character" preamble.
  - On each success, upsert `book_images (kind='page', slot=page_number)` and bump `pipeline_progress`.
  - Failures are recorded on the row but do not stop the loop.
- **Drive phase**:
  - After all pages, invoke `export-book-images-to-drive` (below) and `pipeline_status='done'`.
- Errors set `pipeline_status='failed'` and `pipeline_error`.
- `verify_jwt = false` in `supabase/config.toml`.

### `export-book-images-to-drive` (NEW)
- Input: `{ book_id }`.
- Reads `generated_books.drive_folder_id` (already populated by `export-book-to-drive`). If missing, waits/falls back to invoking the doc exporter first to ensure the folder exists.
- Creates subfolder `book_images_<book_id>` inside that folder (idempotent — find-or-create, same helper as the existing exporter).
- For each `book_images` row with `image_data_url` and no `drive_file_id`:
  - Decodes the base64.
  - Uploads via multipart `POST https://connector-gateway.lovable.dev/google_drive/upload/drive/v3/files?uploadType=multipart` with the proper name:
    - portraits: `portrait-1.png`, `portrait-2.png`, `portrait-3.png`
    - pages: `page-01.png`, `page-02.png`, … (zero-padded so they sort)
    - cover: `cover.png`
  - Stamps `drive_file_id` + `drive_file_url`, clears `image_data_url` to keep the row light.
- Best-effort, same error semantics as the manuscript exporter.

## Frontend changes

### `src/pages/steps/Step11.tsx`
- Add buyer form above the plan selector: `name` (required), `email` (required, basic regex). Errors inline.
- Replace `setOrderPlaced(true)` button handler with `startPipeline()`:
  1. Save buyer to `WizardContext`.
  2. Build the full brief (`buildBrief`) **with** `buyer_name` + `buyer_email`.
  3. Invoke `generate-book` and capture `id`.
  4. Persist the existing portrait (`answers.characterPortrait.dataUrl`) into `book_images` (slot 1) so the backend has it.
  5. Invoke `generate-book-images` with `{ book_id }`.
  6. Poll `generated_books.pipeline_progress` every ~3s until `pipeline_status` is `done` or `failed`.
- New `PipelineProgress` component renders progress copy from `pipeline_progress` using the warm `loadingMessages` voice ("Sketching {name}…", "Painting page 7 of 30…").
- Final state = existing `orderPlaced` screen, with a "View your book" link (later wired to Drive doc URL once available).

### `src/lib/buildBrief.ts`
- Add `buyer_name` / `buyer_email` passthrough.

### `src/lib/loadingMessages.ts`
- Add `pipelineMessages(stage, current, total, name)`.

## Technical notes

- The Lovable AI image gateway accepts multiple `image_url` parts; we already do this in `generate-cover`. Same call shape works for page images.
- `book_images.image_data_url` is intentionally a transient column — kept only between `generate-book-images` and the Drive export, then nulled. Keeps the row small.
- Generation runs sequentially in one invocation of `generate-book-images`. Edge function timeout is the constraint; 30 page images × ~6s ≈ 3 minutes — within Supabase Edge Function limits (150s soft / 400s hard). If we hit the cap during testing we can shard later; flagged in code comment.
- No payment integration is added. The "Pay" button is a simulated purchase event. Real Stripe wiring is a follow-up that just needs to trigger the same `startPipeline()` from a webhook.
- The Drive doc already includes the per-page image prompts, so QA can verify each generated image against its prompt in one place.

## Out of scope
- Real payment provider (`payments--enable_*`).
- User accounts / auth.
- Sending the final book to the buyer's email.
- Retrying failed page images automatically.
