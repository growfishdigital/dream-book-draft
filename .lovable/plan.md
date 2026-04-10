

## Step 11: "Buy" — Product Selection & Checkout

### What we're building
A full-screen checkout step (no WizardShell) with two product option cards, trust signals, and a placeholder order form with a success state.

### Implementation

**New file: `src/pages/steps/Step11.tsx`**

Full-screen layout like Steps 9/10 — no WizardShell wrapper.

- Custom progress bar showing 100% + "Final step" label
- Heading: "Choose how you'd like [name]'s book." / Subheading: "Both options include the full story and all illustrations."

**Two product cards (stacked vertically):**

1. **Digital Book** — standard border card with price $9.99, bullet list (PDF, instant delivery, shareable link, print yourself), CTA button
2. **Printed Hardcover + Digital** — visually prominent: warm amber border (`border-amber-400`), "⭐ Most popular" badge positioned top-right, price $44.99, bullet list (everything in digital + hardcover + ships 5-7 days + free digital), CTA button. Default-selected via `useState`.

Selection state: clicking either card or its CTA selects that option (radio-style). Selected card gets a ring/highlight.

**Trust signals block** below cards:
- 🔒 Secure checkout
- 💳 All major cards accepted
- 📦 Free shipping on hardcovers over $35

**Placeholder order form** below trust signals:
- Email input field
- "Place Order" button
- On click: sets `orderPlaced` state to true, shows success view: "🎉 Your book is on its way!" with the selected plan details and a "← Back to start" link

**Data from WizardContext:** `childName` for personalization.

### Files changed
- `src/pages/steps/Step11.tsx` — new
- `src/App.tsx` — add Step11 import and `/step/11` route

