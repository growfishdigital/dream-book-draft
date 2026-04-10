

## Step 4: "What is [name] into?"

### What we're building
An interests/hobbies selection screen with categorized chip selectors, a 2-3 pick limit with auto-deselect behavior, and a fun preview sentence.

### Implementation

**New file: `src/pages/steps/Step4.tsx`**

- Heading: "What's [name]'s world like?" (dynamic from `answers.childName`)
- Subheading: "Pick 2–3 things they're obsessed with. These flavor the whole story."
- Categorized chip grid with 6 sections, each with a category header (emoji + label):
  - 🐾 Animals & Nature (8 items), 🚀 Adventure & Fantasy (9), 🚗 Vehicles (3), ⚽ Sports (7), 🎨 Creative (7), 🌈 Vibes & Worlds (4)
- Each chip: pill-shaped button with emoji + label
- Selected state: `bg-[hsl(var(--wizard-primary))] text-white` (green bg, white text)
- Selection logic: stores `interests` as `string[]` in WizardContext. Min 2, max 3. Selecting a 4th auto-deselects the oldest (FIFO queue). Add a brief CSS shake animation on the deselected chip.
- After 2+ selected, fade in a fun preview line beneath the grid. Use a small map of hardcoded combo sentences keyed by interest values, with a fallback template like "[Name] discovers a world of [interest1] and [interest2]..."
- Validation: `setCanContinue(interests.length >= 2)`

**Updated file: `src/App.tsx`** — Add Step4 import and `/step/4` route

**Updated file: `tailwind.config.ts`** — Add `shake` keyframe animation for the auto-deselect effect (quick horizontal wiggle)

### Files changed
- `src/pages/steps/Step4.tsx` — new
- `src/App.tsx` — add route
- `tailwind.config.ts` — add shake animation keyframe

