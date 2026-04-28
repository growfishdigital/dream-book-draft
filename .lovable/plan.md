## Add Real AI Story Concepts Step

Insert a new step between Step 9 (Cover Designer) and Step 10 (Generating animation) that shows **3 AI-generated story concepts**, each with a real cover image and short summary, based on everything the user has entered so far. The user picks one, and the wizard remembers the choice.

This is the first place real AI runs in the prototype — so we also need to enable backend infrastructure to host the API calls safely.

### What the new step looks like

- Title: "Pick {name}'s story" / subtitle: "Three concepts, made just for them."
- Three side-by-side (stacked on mobile) concept cards, each with:
  - A real generated cover image (Gemini 3 Pro Image, ~2:3 aspect)
  - A generated working title
  - A 2–3 sentence story summary (GPT-5-mini)
  - A "Choose this one" button
- A "Regenerate options" link below the cards (limited to a couple of retries to keep cost sane)
- Loading state: shimmer skeleton cards with a friendly status line ("Sketching three little adventures…")
- Error state: clear retry button if generation fails or rate-limits

Picking a concept stores `selectedConcept` in WizardContext (title, summary, coverImage base64/url) and advances to the existing Step 10 generating animation, which will then carry that concept forward into the Step 11 preview.

### Inputs sent to the AI

From WizardContext we'll assemble a single "brief" object:
- Child: name, age band, gender
- Story: genre, mood, lessons, interests
- Characters: protagonist details from Step 5/6 (hair, skin, clothing, accessories, vibe), supporting cast
- Style: illustration style from Step 7
- Cover: chosen layout + working title from Step 9
- Photo(s): protagonist photo(s) uploaded in Step 5, as base64 — passed to Gemini for likeness reference

### Pipeline (high level)

1. New edge function `generate-concepts` receives the brief.
2. It calls **GPT-5-mini** via the Lovable AI Gateway with a structured-output (tool-call) schema to return exactly 3 concepts: `[{ title, summary, coverPrompt }]`. The `coverPrompt` is a model-written illustration brief that describes the scene, mood, palette, and references the protagonist.
3. For each concept, it calls **Gemini 3 Pro Image** (`google/gemini-3-pro-image-preview`) using the protagonist photo as input image plus the `coverPrompt` and Step 5 character details, in the chosen illustration style — producing a base64 cover image.
4. Returns `{ concepts: [{ title, summary, coverImage }] }` to the client.

The 3 image generations run in parallel inside the edge function to keep latency reasonable. Loading UI on the client streams in cards as they resolve (function returns once all are done; we can stream later if needed).

### Pipeline rules

The user mentioned wanting to discuss pipeline rules. The plan ships with a sensible default we can iterate on:
- Text model: `openai/gpt-5-mini`, structured output via tool calling (no free-form JSON parsing).
- Image model: `google/gemini-3-pro-image-preview`, with the protagonist photo passed as an image input to anchor likeness; Step 5 fields appended to the prompt as constraints.
- One text call + three image calls per "Generate" action.
- "Regenerate" capped at 2 extra attempts per session to limit spend.
- Errors: 429 → "We're a bit busy, try again in a moment"; 402 → "Out of AI credits — see Settings → Workspace → Usage".
- All prompts and the schema live on the edge function, not the client.

After this step ships, we can refine the prompts, add streaming, or split text/image into separate calls if you want partial results sooner.

### Routing changes

Current order is fixed at 11 steps. We'll insert the new step at position 10 and shift the existing Generating + Preview to 11 + 12. Concretely:

```text
/step/9   Cover Designer        (unchanged)
/step/10  Story Concepts        (NEW — generate + pick)
/step/11  Generating animation  (was /step/10)
/step/12  Preview / Buy         (was /step/11)
```

`TOTAL_STEPS` in `WizardShell.tsx` and `WizardHeader.tsx` becomes 12, and `App.tsx` routes are updated. The Step 11 preview is updated to display the chosen concept's cover + summary instead of the wireframe placeholder.

### Backend setup required

The project currently has no backend (pure prototype, only `LOVABLE_API_KEY` is present). To call AI safely without leaking the key in the browser, this step needs:
- **Lovable Cloud enabled** — gives us Supabase Edge Functions to host `generate-concepts`.
- The edge function calls the Lovable AI Gateway server-side using `LOVABLE_API_KEY`.
- The frontend calls the edge function via `supabase.functions.invoke("generate-concepts", { body: brief })`.

This is the first deviation from the "no backend" core memory rule, so the memory will be updated to reflect that AI generation runs through an edge function while the rest of the wizard stays client-only.

### Files touched

- `src/App.tsx` — add `/step/10` for new step, shift others.
- `src/components/WizardShell.tsx`, `src/components/WizardHeader.tsx` — `TOTAL_STEPS = 12`.
- `src/pages/steps/Step9b.tsx` (new) — Story Concepts page (cards, loading, error, regenerate, pick).
- `src/pages/steps/Step11.tsx` — pull cover + summary from `answers.selectedConcept` instead of placeholder.
- `src/lib/buildBrief.ts` (new) — pure function turning WizardContext answers into the brief payload.
- `supabase/functions/generate-concepts/index.ts` (new) — orchestrates GPT-5-mini + Gemini 3 Pro Image, returns `{ concepts }`.
- `mem://project/wizard-steps` and `mem://index.md` Core — updated to reflect new step + edge function exception.

### Open questions before I build

1. **Summary length** — you skipped that question. Default I'll use: **2–3 sentence blurb** per concept (matches the card layout). Say the word if you'd rather have a longer paragraph.
2. **Pipeline rules** — you mentioned wanting to discuss these. Happy to ship the defaults above and iterate, or pause after the routing/UI is wired and let you write the exact prompts before we go live.

Approve and I'll implement; or reply with the summary length + any pipeline rule overrides first.