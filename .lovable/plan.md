

## Plan: Combine Preview + Checkout into One Page

Merge Step 11 (preview carousel) and Step 12 (plan picker / checkout) into a single side-by-side page. Reduce the wizard from 12 steps to 11 total.

### Layout

Single page at `/step/11` with two columns on desktop, stacked on mobile:

```text
┌──────────────────────────────────────────────────┐
│  Header: progress bar + "100% complete ✓"        │
│  Heading: "[Name]'s book is ready ✨"            │
│  Subtitle: "Preview the book and choose how      │
│             you'd like it delivered."            │
├──────────────────────┬───────────────────────────┤
│                      │                           │
│   PREVIEW CAROUSEL   │   PLAN PICKER + CHECKOUT  │
│   (from old Step11)  │   (from old Step12)       │
│                      │                           │
│   - 5-page carousel  │   - Digital card          │
│   - Cover, story x2, │   - Hardcover card        │
│     dedication,      │   - Trust signals         │
│     locked page      │   - Email input           │
│                      │   - Place Order button    │
│                      │                           │
└──────────────────────┴───────────────────────────┘
```

- Desktop (≥768px): two columns, `grid-cols-2`, gap-8, max-width ~1100px centered
- Mobile (<768px): stacked, preview on top, checkout below
- Order success state remains the same (full-screen confirmation with 🎉)

### Files Changed

1. **`src/pages/steps/Step11.tsx`** — Full rewrite. Combines the carousel rendering (CoverPage, StoryPage1, StoryPage2, DedicationPage, LockedPage helpers) with the plan selection cards, email input, place-order button, and order success state. Back button goes to `/step/10`. Remove the standalone "Get [Name]'s book" CTA and "Make changes" link — checkout lives directly on the page.

2. **`src/pages/steps/Step12.tsx`** — Delete (or repurpose to redirect to `/step/11`). Simplest: replace contents with a `<Navigate to="/step/11" replace />`.

3. **`src/App.tsx`** — Remove the `Step12` import and the `/step/12` route (or keep redirect route). Simpler: drop the route entirely.

4. **`src/components/WizardShell.tsx`** — Change `TOTAL_STEPS = 12` to `TOTAL_STEPS = 11`.

5. **`src/components/ProgressBar.tsx`** — If it has its own `TOTAL_STEPS` constant or step titles array, update from 12 → 11 and remove the Step 12 entry from the titles map (Step 11 title becomes "Preview & Buy" or similar).

6. **`src/pages/steps/Step10.tsx`** — Update the "100% complete" / final progress copy if it references step 12; navigation forward from Step 10's generation animation goes to `/step/11` (already does).

### Behavior Notes

- Preview carousel keeps all 5 pages including the locked teaser page — the lock now sits next to the actual checkout, reinforcing the unlock CTA.
- Plan selection (Digital $9.99 / Hardcover $44.99) defaults to Hardcover with the "Most popular" badge, identical to current Step 12.
- "Place Order" button still requires a valid email and shows the same success screen on click.
- Wizard progress bar shows 11 segments, all filled at this final step.

