

## Make Hero Character Editable

### What we're building
Replace the static hero card (lines 248-260 in Step6.tsx) with a `CharacterCard` that uses the same expandable editor as other characters, but with a 👑 crown indicator, no delete button, and pre-filled name from `answers.childName`. The hero's data will be stored in `answers.heroCharacter`.

### Implementation

**File: `src/pages/steps/Step6.tsx`**

1. Add a `heroCharacter` state sourced from `answers.heroCharacter`, initialized with `{ id: "hero", name: name, relationship: "Hero", gender: answers.childGender || "", age: answers.childAge || "", notable: "" }`.

2. Replace the static hero card div (lines 248-260) with a `CharacterCard` component:
   - Pass `onRemove` as undefined/no-op — add an `isHero` prop to `CharacterCard` that hides the delete button and adds the 👑 badge + primary border styling.
   - `defaultExpanded={false}` since the hero info is pre-filled.
   - On change, call `setAnswer("heroCharacter", updatedChar)`.

3. Update `CharacterCard` to accept an optional `isHero?: boolean` prop:
   - When true: hide the trash icon, show 👑 emoji next to the name, use the primary border/background styling from the old hero card.
   - The relationship field can be hidden or locked to "Hero" for the hero card.

### Files changed
- `src/pages/steps/Step6.tsx` — modify `CharacterCard` and replace static hero card

