

## Step 6: "The Characters" — Character Builder

### What we're building
A character management step with a pre-filled hero card (the child from Step 1) and the ability to add up to 4 additional characters via expandable cards with structured fields.

### Implementation

**New file: `src/pages/steps/Step6.tsx`**

- Heading: "Who's in [name]'s story?" (from `answers.childName`)
- Subheading: "[Name] is always the hero. Who else should join the adventure?"
- **Hero card** (always visible, not removable, not editable):
  - Shows "👑 Hero" badge, child's name from Step 1, collapsed style
- **Additional character cards** (up to 4):
  - Each card is collapsible (using local state, not Radix — just a simple toggle)
  - Collapsed view: name + relationship pill, expand chevron, trash icon
  - Expanded view shows fields:
    - Name (text input, required)
    - Relationship (pill selector): Parent, Grandparent, Sibling, Best friend, Teacher, Pet, Other
    - Gender (pill selector): Girl, Boy, Non-binary
    - Age (optional short text input)
    - Something notable (optional textarea, max 100 chars, placeholder text)
    - Photo button: camera icon + "Coming soon" toast on click
    - Trash icon to remove
  - New cards start expanded
- "+ Add a character" button below cards, hidden when 4 additional characters exist
- `setCanContinue(true)` on mount — always enabled
- Stores `characters` array in WizardContext

**Updated file: `src/App.tsx`** — Add Step6 import and `/step/6` route

### Files changed
- `src/pages/steps/Step6.tsx` — new
- `src/App.tsx` — add route

