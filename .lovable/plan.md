## What's going wrong

When you hit "purchase," `Step10Preview` calls the `generate-book` edge function with:

- `brief` — built by `buildBrief`, which currently includes raw uploaded reference photos as base64 `data:` URLs (`protagonist.photos`, `protagonist.photoDataUrl`, `supportingCharacters[].photos`, possibly `specialThing.details.photo`).
- `seed_portrait_data_url` — the generated hero portrait, also a base64 `data:` URL (~1–3 MB).

Edge logs confirm it: the request returns HTTP **546** ("WORKER_LIMIT — Memory limit exceeded") and the function dies before it can even insert the stub row. Recent successful rows had `brief` sizes of **7.6 MB** and **0.5 MB**; the new request is even bigger because we now also pass `seed_portrait_data_url` alongside. Edge runtime memory ceiling is ~150 MB, but JSON parsing + multiple in-memory copies (`brief`, `_engine_input`, stub insert payload, AI request body) multiply that several times over.

None of this base64 data is needed by `generate-book`. The text model never sees the photos, and the seed portrait is only forwarded to `generate-book-images` later.

## Fix — strip base64 at the edge of `generate-book`

Keep the change tightly scoped to `generate-book`; don't touch the client or `generate-book-images` behavior.

1. **Add a `stripDataUrls(value)` helper** in `generate-book/index.ts` that walks the brief and replaces any string starting with `data:` (or any field literally named `photo`, `photos`, `photoDataUrl`) with `null`. Recursive, runs over arrays + objects.
2. **Apply it before anything else:**
   - Run on `rawBrief` immediately after parsing the request body. Use the stripped version everywhere (mapping to `engineInput`, building the approved-concept instruction, inserting into `generated_books.brief`).
   - Drop `seed_portrait_data_url` from the stub insert payload entirely — it's only kept in the in-memory closure and passed to the `generate-book-images` invoke at the end.
3. **Guard the forwarded seed portrait too**: if `seed_portrait_data_url` is over, say, 4 MB, log a warning and pass it through anyway (generate-book-images already accepts large bodies fine in current logs — only generate-book is dying because it does additional heavy work). This is just a canary, not a hard cap.
4. **Don't store `_engine_input`** in the persisted `brief` jsonb — it duplicates the trimmed brief and balloons row size. It's only a debugging aid; if we want it, we can recompute. Remove the `_engine_input: engineInput` spread from the stub insert.

That's it. No schema migration, no storage bucket, no client changes.

## Technical details

Touched file: `supabase/functions/generate-book/index.ts`

```ts
function stripDataUrls<T>(value: T): T {
  if (value == null) return value;
  if (typeof value === "string") {
    return (value.startsWith("data:") ? null : value) as any;
  }
  if (Array.isArray(value)) {
    return value.map(stripDataUrls) as any;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === "photo" || k === "photos" || k === "photoDataUrl") {
        out[k] = null;
        continue;
      }
      out[k] = stripDataUrls(v);
    }
    return out as any;
  }
  return value;
}
```

In the handler:

```ts
const body = await req.json();
const rawBrief = stripDataUrls(body.brief || {});
// ...existing buyer_name/email merge...
const brief = { ...rawBrief, buyer_name, buyer_email };
```

And in the stub insert:

```ts
brief: { ...brief, approvedConcept },   // drop _engine_input
```

## Smoke test after the fix

1. Deploy `generate-book`.
2. From the wizard, trigger purchase. Expect the request to return 202 with `{ id, queued: true }` instead of 546.
3. Poll `generated_books` for that id: `pipeline_status` should advance `story → portraits → pages → done`.
4. Confirm `length(brief::text)` for the new row is small (< ~50 KB), proving stripping worked.

## Out of scope

- Cover vs portrait visual divergence — separate issue; the user noted outfit matches, which is the part this engine controls. We can revisit cover prompting after this fix lands.
- Moving portraits into a storage bucket — nice-to-have but not needed; stripping fixes the immediate crash.
