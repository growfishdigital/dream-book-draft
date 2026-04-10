

## Step 3: "What should the story teach?"

### What we're building
A lesson/theme selection screen with a 2-column card grid and a dynamic preview line that appears after selection.

### Implementation

**New file: `src/pages/steps/Step3.tsx`**

- Heading: "Every great story has a heart."
- Subheading using `answers.childName`: "What do you want [name] to carry with them after the last page?"
- 2-column card grid with 10 lesson options (same card styling as Step 2 genre cards): emoji, bold label, gray description
- Stores `lesson` in WizardContext
- Validation: `setCanContinue(lesson !== "")`
- After selection, an animated line fades in below the grid: "[Name]'s story will be about [lesson label]." using `animate-fade-in`

**Updated file: `src/App.tsx`** — Add Step3 import and `/step/3` route

### Files changed
- `src/pages/steps/Step3.tsx` — new
- `src/App.tsx` — add route

