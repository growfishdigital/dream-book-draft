# Fix: "Edge Function returned a non-2xx status code" on Pay

## Root cause

The failing call is `generate-book` (first step of the post-purchase pipeline), not the image orchestrator. Edge logs show Lovable AI gateway returning **400** from the upstream provider (Google AI Studio / Gemini 2.5 Pro):

> "The specified schema produces a constraint that has too many states for serving. Typical causes are schemas with lots of text, long array length limits (especially when nested), or complex value matchers (integers/numbers with minimum/maximum, strings with date-time, etc)."

Our `buildBookJsonSchema()` in `supabase/functions/_shared/prompts.ts` hits all three of those triggers:

- `pages` array has `minItems: 32, maxItems: 32` with a nested object — Gemini multiplies the state space across every item.
- `page_number` is `integer` with `minimum: 1, maximum: 32` — another multiplier per item.
- `beat` is a nullable enum (`type: ["string","null"]` + `enum: [..., null]`) — Gemini's constrained decoder doesn't like the nullable‑enum combo.
- `role` and `layout_id` enums are fine on their own but compound the per‑item state space.

Net result: Gemini's serving-time constraint compiler refuses to compile the schema, so the function returns 500, which surfaces in Step 11 as "Edge Function returned a non-2xx status code".

## The fix (single file)

Edit `supabase/functions/_shared/prompts.ts` → `buildBookJsonSchema()`:

1. **Drop `minItems`/`maxItems` on `pages`.** Keep the 32‑page requirement in the prompt copy (`buildBookUserMessageV2` already specifies it). Validate length server‑side after parsing.
2. **Loosen `page_number`** to `{ type: "integer" }` — drop `minimum`/`maximum`. Already validated implicitly by the prompt.
3. **Simplify `beat`** to a plain optional enum: remove it from the per‑item `required` list (it already isn't required) and change the type to `{ type: "string", enum: ["opening","rising","turn","climax","resolution","closing"] }`. Model omits the field for the title/dedication pages instead of returning `null`.
4. **Make `image_scene`, `setting`, `mood`, `continuity_notes`** plain optional `{ type: "string" }` (drop the `["string","null"]` union). Same reasoning — Gemini's constrained mode hates nullable scalars; absence conveys the same thing.
5. **Keep** the `role` enum and `layout_id` enum — these are small and necessary.
6. Add a short server‑side guard after `JSON.parse` in `generate-book/index.ts` that:
   - Confirms `parsed.pages.length === 32`, otherwise returns a clear error.
   - Coerces missing optional fields to `null` so downstream code (`generate-book-images`, `export-book-to-drive`) keeps working unchanged.

No other functions need to change. `generate-book-images` already handles missing `image_prompt` and won't be reached until `generate-book` succeeds.

## Why this is safe

- The prompt (`buildBookUserMessageV2`) already enforces "exactly 32 pages, page_number 1–32, page 1 = title, page 2 = dedication, pages 3–32 = story, tag each story page's beat". Removing schema-level numeric constraints just stops Gemini's compiler from rejecting the schema; it doesn't change what the model is asked to produce.
- Downstream we already null‑coalesce these fields everywhere they're used; collapsing `["string","null"]` → optional `"string"` is a no-op for callers.

## Verification

1. Click "Pay" on Step 11 with a known-good wizard run.
2. Watch `supabase--edge_function_logs` for `generate-book` → expect 200 + a row in `generated_books` with `parsed.pages.length === 32`.
3. Pipeline should advance to `portraits` → `pages` → `done`; Step 11 polling shows the progress bar.

## Out of scope

- No changes to the image pipeline, Drive export, or Step 11 UI.
- No model swap. If Gemini still rejects after the simplification, the follow-up is to switch `MODELS.book` to `openai/gpt-5` (which uses OpenAI's structured outputs, a different constraint engine) — flagged but not done in this pass.
