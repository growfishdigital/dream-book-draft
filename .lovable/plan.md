

## Step 1: "Who's this for?"

### What we're building
A fully interactive first step with name input, age range pills, gender pills, occasion chips, and dynamic heading that updates with the child's name.

### Implementation

**File: `src/pages/steps/Step1.tsx`** — Complete rewrite with:

1. **Dynamic heading** — Shows "Let's start with the star of the story." initially, fades to "Let's make a book for [Name]." once name is entered (CSS transition on opacity/transform)

2. **Name input** — Large centered text input, stores as `childName` in WizardContext

3. **Age range pills** — Horizontal row of pill buttons, each with main label and gray sublabel:
   - 0–2 / Board book, 3–5 / Picture book, 6–8 / Early reader, 9–12 / Chapter book
   - Selected state: green border + light green bg, unselected: white with shadow

4. **Gender pills** — Same style: Girl, Boy, Non-binary, Surprise me

5. **Occasion chips** — 3-column grid of emoji+label chips, single select, optional. "Other" reveals a text input below.

6. **Validation** — `setCanContinue(true)` when name + age + gender all filled, false otherwise (via useEffect)

**File: `src/contexts/WizardContext.tsx`** — No changes needed; already supports arbitrary key/value answers.

**Styling approach**: Reusable pill/chip components inline in Step1 using Tailwind classes matching the design language (rounded-2xl, green border on select, soft shadow, warm bg).

**Animation**: The heading swap uses a CSS transition — opacity fades out, text changes, fades back in. Implemented with a simple state toggle + `transition-opacity duration-300`.

### Files changed
- `src/pages/steps/Step1.tsx` — full rewrite

