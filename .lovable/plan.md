## Shorten story summary to ~100 words

Adjust Step 10's generated summary from ~200 words down to ~100 words.

### Changes

**`supabase/functions/generate-summary/index.ts`** — update prompt + tool description:
- "Summary: ONE paragraph, target ~100 words (hard min 80, hard max 130)."
- Update tool parameter description to match (~100 words, 80–130).

**`src/pages/steps/Step10Summary.tsx`** — update any UI copy that references the target length:
- Subheader / helper text mentioning "~200 words" → "~100 words"
- Word-count helper in the edit textarea: keep the live count, adjust the suggested range hint to 80–130 if shown.

**Redeploy `generate-summary`** so the new prompt takes effect.

No changes to Step 11, Step 12, or any other flow. No memory update needed (length isn't a saved rule).

Approve and I'll ship it.