## Smoke Test: gpt-5 text models

### Goal
Verify `generate-summary` (gpt-5-mini) and `generate-book` (gpt-5) both produce valid output end-to-end.

### Steps

1. **Deploy** `generate-summary` and `generate-book` to make sure both run the latest code.

2. **Test `generate-summary`** via `supabase--curl_edge_functions` with a realistic brief (child name, age band, genre, mood, lesson, interests, personality). Time the call. Pass criteria:
   - HTTP 200
   - `title` non-empty, doesn't contain child's first name
   - `summary` 50–110 words
   - Response time under ~10s
   - No quality warnings in edge logs

3. **Test `generate-book`** via `curl_edge_functions` with the same brief plus the approved concept from step 2. It returns `{ id, queued: true }` immediately (202); the real work runs in background via `EdgeRuntime.waitUntil`.

4. **Poll `generated_books`** via `supabase--read_query` every ~5s on `id`, watching `pipeline_status` advance `story → portraits`. Cap at ~3 minutes. Pass criteria:
   - `pipeline_status` reaches at least `portraits` (story done) without `failed`
   - `parsed` is non-null with 32 pages
   - `status` is `ok` (or `needs_review` with logged validation issues)
   - `generation_ms` recorded; surface it for visibility

5. **Skip image pipeline** for this smoke test — `generate-book-images` is triggered automatically but we only care about text-model output here. Note the final `pipeline_status` reached.

6. **Report** model used, latency for each, summary text, book title + first 2 page texts, and any validation warnings.

### Out of scope
- Image generation quality (cover/page images)
- Client-side wizard flow
- Drive export