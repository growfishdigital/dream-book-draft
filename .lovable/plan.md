## Story Summary First, Images Later (with encouraging loading states)

Two-phase flow: lock in the summary text before any images are generated. All loading states use warm, encouraging copy.

### New flow

```text
/step/9   Cover Designer        (unchanged)
/step/10  Story Summary         (NEW — single summary, refresh + pen-edit, approve to advance)
/step/11  Generating animation  (was /step/10 — now also runs cover image generation)
/step/12  Preview / Buy         (was /step/11 — shows approved summary + generated cover)
```

### Step 10: Story Summary (text-only)

A single summary card. No images. No concept variants.

- **Header**: "Here's {name}'s story" / "Read it, refresh it, or tweak it before we draw the pictures."
- **Summary card**:
  - Working title (editable inline)
  - ~200-word summary paragraph (target 180–220 words)
  - **Refresh** button (circular arrow icon) — unlimited regenerations
  - **Edit** button (pen icon) — toggles the summary into a `<textarea>` with Save / Cancel and a live word count
- **Loading state** (while GPT-5-mini runs): shimmer over the summary block + rotating encouraging line, e.g.:
  - "Crafting {name}'s adventure…"
  - "Bringing their dreams to life…"
  - "Whispering the first words of the story…"
- **Error state**: inline retry; 429 → "We're a bit busy, try again in a moment"; 402 → "Out of AI credits — see Settings → Workspace → Usage"
- **Primary CTA**: "Approve & illustrate →" — saves `{ title, summary }` to `WizardContext.selectedConcept` and advances to Step 11

### Step 11: Generating animation (now does real work)

Existing 8-second animation stays as the visual base, but kicks off the real cover generation:
- Calls **Gemini 3 Pro Image** with the uploaded photo + Step 5 character details + chosen illustration style + approved summary as scene context
- Stores the result in `WizardContext.selectedConcept.coverImage`
- Animation loops the existing book/sparkles until the image is back, then reveals the "Your book is ready" CTA (graceful fallback if image errors — show CTA anyway)
- Rotating encouragement underneath the animation, e.g.:
  - "Sketching the cover…"
  - "Painting {name} into the scene…"
  - "Adding a little extra magic…"

### Step 12: Preview

Renders `selectedConcept.title`, `selectedConcept.summary`, and `selectedConcept.coverImage` in the existing carousel — replacing the wireframe placeholder.

### Encouraging loading copy — project-wide rule

New convention: **every loading state in the app uses warm, child-focused, encouraging copy**, not generic "Loading…". Tone matches the brand voice (gentle, magical, parent-to-child).

I'll add a tiny helper `src/lib/loadingMessages.ts` exporting themed message arrays (e.g. `summaryMessages`, `coverMessages`, `genericMessages`) plus a `useRotatingMessage(messages, intervalMs)` hook that cycles them every ~2s. Existing loading spots will be retrofitted to use it as we touch them.

This rule will be saved to memory so it applies to every future loading state.

### Backend: two edge functions

Splitting text and image keeps the summary loop fast and cheap.

1. **`generate-summary`** — GPT-5-mini, structured tool-call output `{ title (≤60 chars), summary (~200 words) }`. Accepts the brief + optional `previousSummary` so refreshes feel different.
2. **`generate-cover`** — Gemini 3 Pro Image, single image, base64. Triggered only from Step 11 after approval.

Prompts live server-side. Both surface 429 / 402 cleanly.

### Files touched

- `src/App.tsx`, `src/components/WizardShell.tsx`, `src/components/WizardHeader.tsx` — `TOTAL_STEPS = 12`, insert new step, shift routes
- `src/pages/steps/Step10Summary.tsx` (new) — summary card, refresh, pen-edit toggle, encouraging shimmer, approve CTA
- `src/pages/steps/Step11.tsx` (existing animation, was Step10.tsx) — kicks off `generate-cover` on mount, gates CTA on completion, encouraging copy rotates
- `src/pages/steps/Step12.tsx` (was Step11.tsx) — render approved summary + generated cover
- `src/lib/buildBrief.ts` (new) — assemble brief payload from WizardContext
- `src/lib/loadingMessages.ts` (new) — themed encouragement arrays + `useRotatingMessage` hook
- `src/contexts/WizardContext.tsx` — add `selectedConcept: { title, summary, coverImage? }`
- `supabase/functions/generate-summary/index.ts` (new)
- `supabase/functions/generate-cover/index.ts` (new)
- Enable Lovable Cloud (required for edge functions + `LOVABLE_API_KEY`)
- Update `mem://index.md` Core with the encouraging-loading rule, and `mem://project/wizard-steps` with the new Step 10 + edge-function exception

Approve and I'll build it.
