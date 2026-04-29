## Goal

On Step 9 (the animated "generating" screen), the user must not be able to advance to Step 10 (Book Preview) until the real cover image has finished generating. The existing stage UI and animation stays exactly as-is.

## Current behavior (verified)

- `src/pages/steps/Step10.tsx` (the Step 9 route) calls `generate-cover` on mount, then sets `done = true` after both:
  1. The cover request resolves (success or error), and
  2. A 6s minimum animation floor has elapsed.
- The "✨ Your book is ready — take a look" CTA is already conditionally rendered only when `done` is true, so direct CTA bypass is not possible.

## What's missing / risk of bypass

1. **Progress-bar dot navigation** — the global `ProgressBar` lets users click any dot to jump steps. From Step 9 a user could click dot 10 and land on the Book Preview before the cover finishes.
2. **Browser back/forward + manual URL** — minor, but worth at least not actively re-enabling navigation from Step 9 itself.
3. **Error path** — currently if `generate-cover` fails, `done` still becomes true and the CTA appears with a soft apology. The user said "do not bypass until generation is complete," so on hard failure we should offer a Retry instead of silently moving on.

## Changes

### 1. `src/pages/steps/Step10.tsx`
- Track a `generating` flag (true until the cover request resolves, independent of the 6s floor).
- On error: do **not** auto-advance. Set `done = false`, show the existing apology copy plus a "Try again" button that re-runs the cover request. The animated book keeps playing.
- Pass a `lockNavigation` signal (via `WizardContext` — see step 3) so the progress bar disables dot clicks while generating.

### 2. `src/components/ProgressBar.tsx`
- Read the new `isGenerating` flag from `WizardContext`.
- When true: render the dots as visually unchanged but make them non-interactive (`pointer-events: none`, `aria-disabled`, no hover affordance, no click handler). Keep the encouraging caption.
- When false: existing click-to-jump behavior is unchanged.

### 3. `src/contexts/WizardContext.tsx`
- Add `isGenerating: boolean` and `setIsGenerating(v: boolean)` to the context.
- Step 9 sets it to `true` on mount and `false` once the cover request resolves successfully (and we're ready to advance).

### 4. No edge-function changes
The `generate-cover` function and prompts file are untouched.

## Out of scope

- No change to the Step 8 → Step 9 transition (Approve & illustrate still navigates normally).
- No change to the animation, checklist labels, copy, or 6s minimum floor.
- No change to story generation (still happens on Step 8).

## Files touched

- `src/pages/steps/Step10.tsx`
- `src/components/ProgressBar.tsx`
- `src/contexts/WizardContext.tsx`
