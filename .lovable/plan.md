## Goal

Make Step 10 feel productive (not idle) by adding a live progress checklist alongside the existing book animation and rotating loading copy. No cover reveal on this screen — that stays a surprise on Step 11.

## What changes (Step 10 only)

### Layout

```text
 ┌───────────────────────────────────┐
 │   Making [Title]    (Playfair)    │  ← uses approved title from Step 9
 │   for [ChildName]                 │
 ├───────────────────────────────────┤
 │                                   │
 │       [ existing book SVG ]       │  ← unchanged animation
 │                                   │
 │     ✨ rotating warm message       │  ← unchanged copy
 │                                   │
 ├───────────────────────────────────┤
 │   ✓ Story written                 │
 │   ◐ Painting the cover…           │  ← live checklist
 │   ○ Binding the pages             │
 └───────────────────────────────────┘
        [ Continue → ] (after done)
```

### Behavior

- Pull the approved title from `answers.selectedConcept.title` for the new header line ("Making [Title] for [Name]"). Falls back to "Making your book" if missing.
- Checklist sits below the existing book + message block:
  - **Story written** — ticks immediately on mount (it was completed on Step 9).
  - **Painting the cover** — active/spinner state while `generate-cover` is in flight.
  - **Binding the pages** — ticks when the edge call resolves (success or error) and the `MIN_DURATION` floor has elapsed.
- Active row uses a small pulsing dot in forest green; completed rows use a check icon; pending rows use an outlined circle. All rounded corners, warm tone, matches existing visual language.
- Existing book animation, rotating `coverMessages`, 6s `MIN_DURATION`, error toast, and final CTA all stay exactly as-is.

## Files touched

- `src/pages/steps/Step10.tsx` — add the title header at top and the 3-row checklist below the existing message. No changes to the SVG, the edge-function call, the timing logic, or the navigate-to-Step-11 handoff.

## Out of scope

- No cover reveal on Step 10.
- No changes to Step 9, Step 11, edge functions, routing, or the progress bar.