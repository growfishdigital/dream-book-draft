

## Step 10: "Preview" — Book Preview & CTA

### What we're building
A full-screen preview step (no WizardShell) showing a swipeable carousel of 5 simulated book pages, with personalized content from wizard answers, and two CTAs at the bottom. A custom progress indicator shows "100% complete".

### Implementation

**New file: `src/pages/steps/Step10.tsx`**

- Full-screen layout (like Step 9 — no WizardShell)
- Heading: "[Name]'s book is ready. ✨" / Subheading: "Here's a sneak peek before you make it official."

**Carousel (using Embla via existing `Carousel` components):**

5 book-shaped cards in a horizontal carousel with dots indicator:

1. **Cover page** — uses `answers.coverLayout` to render either full-illustration or bold-title layout with `answers.bookTitle`, child's name, and art style color
2. **Story page 1** — placeholder illustration block + 2-3 lines of whimsical lorem text, children's book style
3. **Story page 2** — different layout (illustration on side, text wrapping)
4. **Dedication page** — shows `answers.dedication` text centered in elegant serif
5. **Locked page** — blurred/obscured content with a lock icon overlay + "Unlock the full story" message

Each page is a styled card with book aspect ratio (~2:3), consistent rounded corners and shadow.

**Below carousel:**
- Primary CTA: "Get [name]'s book →" — large green pill button, navigates to `/step/11`
- Secondary: "← Make changes" text link, navigates to `/step/1`

**Top area:**
- Custom progress bar showing all dots filled + "100% complete ✓" text
- Back button to return to step 9

**Data used from WizardContext:**
- `childName`, `bookTitle`, `coverLayout`, `artStyle`, `dedication`

### Files changed
- `src/pages/steps/Step10.tsx` — new
- `src/App.tsx` — add Step10 import and `/step/10` route

