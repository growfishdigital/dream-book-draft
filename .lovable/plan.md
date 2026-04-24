## Goal
Add a second interests page right after the existing one. It uses a single text field with comma-separated interests, plus suggestion chips below that auto-replace as you tap them. Suggestions are tailored to the child's age and gender from Step 1.

## New file: `src/pages/steps/Step4b.tsx`
- Headline: **"What does {childName} love?"** (falls back to "your little one")
- Subhead: short helper line — "Type anything, separated by commas — or tap a suggestion to add it."
- **Input**: full-width `Textarea` (rounded, wizard styling), bound to `answers.interestsFreeform` (string).
- **Suggestion chips**:
  - Render up to 10 chips at once.
  - Tapping a chip appends `", <chip>"` to the textarea (or just the word if the field is empty/ends with a comma) and immediately replaces that chip slot with the next unused suggestion from the pool.
  - When the pool runs out, the slot disappears (chips collapse).
  - Chips already present in the textarea (case-insensitive) are filtered out of the visible set on every render.
- **Suggestion source** — hardcoded inline lookup keyed by `answers.ageRange` and `answers.gender` from Step 1:
  - Build a base pool per age bucket (e.g. 0–2, 3–5, 6–8, 9–12) of ~14 generic items.
  - Layer a small gender-flavored boost list (~8 items) on top when gender is set; if gender is "any"/unset, just use the base pool.
  - Result: ~20–24 suggestion items per child, of which 10 show at a time.
- Sets `setCanContinue(true)` on mount (matches existing prototype behavior).
- Includes the standard copyright disclaimer line under the input (consistent with other custom-text steps per project memory).

## Routing — `src/App.tsx`
Bump the lineup so the new page sits at `/step/5`:
- `/step/1` → Step1 (Who's it for)
- `/step/2` → Step2 (Story Type)
- `/step/3` → Step3 (Life Lessons)
- `/step/4` → Step4 (Interests — original)
- `/step/5` → **Step4b (new)**
- `/step/6` → Step7 (Art Style) *(was /step/5)*
- `/step/7` → Step6 (Characters) *(was /step/6)*
- `/step/8` → Step9 (Dedication & Language) *(was /step/7)*
- `/step/9` → Step8 (Cover Design) *(was /step/8)*
- `/step/10` → Step10 (Generating) *(was /step/9)*
- `/step/11` → Step11 (Preview & Buy) *(was /step/10)*
- Keep the `/step/secret-ingredient` hidden route as-is.
- Update the legacy redirects (`/step/12` → `/step/11`) to point at the new final step.

## Progress bar — `src/components/ProgressBar.tsx`
- `TOTAL_STEPS = 11`.
- Update `STEP_LABELS`:
  1. Who's it for?
  2. Story Type
  3. Life Lessons
  4. Interests
  5. **More Interests**
  6. Art Style
  7. Characters
  8. Dedication & Language
  9. Cover Design
  10. Generating…
  11. Preview & Buy

## Wizard shell — `src/components/WizardShell.tsx`
- `TOTAL_STEPS = 11`.

## Back/forward link fixes
- `src/pages/steps/Step10.tsx` (Generating): any hardcoded back link should point to `/step/9` (new Cover Design slot).
- `src/pages/steps/Step11.tsx` (Checkout): any hardcoded back link should point to `/step/10` (new Generating slot).
- All other steps already use `WizardShell`'s relative `currentStep ± 1` navigation, so they need no edits.

## Data model
- Add a new key only: `answers.interestsFreeform: string`.
- Original Step 4 continues to write to `answers.interests` (array). The two are independent — no syncing, no overwrite.

## Out of scope
- No changes to recap card on Step 11 (we can wire `interestsFreeform` in later if you want it surfaced).
- No edits to the original Step 4.

Approve and I'll implement.