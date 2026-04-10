
## Personalized Children's Book Wizard — Shell + Step 1 Placeholder

### What we're building
A full-page, 11-step wizard prototype for a personalized children's book app. This first implementation sets up the complete shell (layout, navigation, progress bar, context) and a placeholder for Step 1.

### Architecture
- **WizardContext** — single React context holding all wizard state (current step, answers dict) with read/write helpers
- **React Router** — routes at `/step/1` through `/step/11`, with `/` redirecting to `/step/1`
- **WizardShell** layout component wrapping every step

### Global Shell (every step)
- **Background**: warm off-white `#FDFAF5`
- **Sticky top bar**:
  - Left: back chevron (disabled on step 1)
  - Center: segmented dot/bar progress indicator (11 segments, fills as you go) with label "Your book is taking shape ✨"
  - Right: "Save & exit" text button (no-op)
- **Content area**: centered, max-w-600px, vertically centered, generous padding
- **Sticky bottom**: "Continue" button — full-width mobile, pill-shaped, deep green `#2D5016`, white text, disabled state support

### Styling
- Google Fonts: Playfair Display for headings, Inter/system sans for body
- Primary: `#2D5016` (deep forest green)
- Accent: `#F5A623` (warm amber)
- Rounded corners 16px+ on interactive elements
- Warm, clean, whimsical-but-not-childish aesthetic
- Chip/selector style: white card, green border when selected, soft shadow

### Step 1 — Placeholder
- Simple placeholder content ("Who's this for?") so the shell can be tested end-to-end
- Continue button enabled by default for now

### Files
- `src/contexts/WizardContext.tsx` — context + provider
- `src/components/WizardShell.tsx` — layout with top bar, progress, bottom button
- `src/components/ProgressBar.tsx` — visual dot/segment indicator
- `src/pages/steps/Step1.tsx` — placeholder
- Updated `src/App.tsx` — routes for all 11 steps
- Updated `index.html` — Google Fonts link
- Updated `src/index.css` — global styles for the wizard theme
