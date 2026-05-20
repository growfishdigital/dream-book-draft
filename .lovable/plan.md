## Fix Summary Generation Slowness

### Problem
`generate-summary` was switched to `openai/gpt-5` (a reasoning model), making the pre-purchase Step 8 call take 20–60s instead of ~3–6s. The full-book engine (`generate-book`) already runs async with `EdgeRuntime.waitUntil` + polling, so it correctly uses `openai/gpt-5`.

### Current State
`supabase/functions/_shared/prompts.ts` already has `MODELS.summary` reverted to `"openai/gpt-5-mini"`.

### Steps
1. Deploy the `generate-summary` edge function so the reverted model goes live.
2. Verify with a quick test invocation to confirm response time is back under ~10s.
3. Optionally trim the per-call prompt payload in `storyConceptPrompt.ts` (only inject the selected framework's examples/bad-phrases instead of all five) for an additional speed boost.

### Out of scope
- `generate-book` model stays `openai/gpt-5`
- Cover image model stays `google/gemini-3-pro-image-preview`
- No client-side queue/polling changes needed since the model itself is fast again.