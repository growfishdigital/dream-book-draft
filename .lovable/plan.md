

## Step 5: "Something special" — Favorite Thing Picker

### What we're building
A two-part optional step: first pick a category from a visual grid of 20 item types (Stuffed Animal, Pet, etc.), then fill in 2-4 category-specific follow-up fields (name, color, details). Continue is always enabled since the field is optional.

### Implementation

**New file: `src/pages/steps/Step5.tsx`**

- Heading: "Got a secret ingredient?"
- Subheading with dynamic `[name]`: "Is there something specific — a toy, a pet, a person, a place — that we should weave into [name]'s story? This is optional, but it's where the real magic happens."
- **Phase 1 — Category picker**: 2-column card grid (same card style as Step 2) with 20 items, each showing emoji + label. Single-select. Clicking a selected card deselects it (making it truly optional).
- **Phase 2 — Follow-up fields** (appear below the grid when a category is selected, animated with `animate-fade-in`):
  - Category-specific fields defined in a config map. Examples:
    - Stuffed Animal: Name (text), What kind of animal? (text), Color (text)
    - Pet: Name (text), Type of pet (dropdown: Dog, Cat, Fish, Bird, Hamster, Rabbit, Other), Color/markings (text)
    - Food: What food? (text)
    - Most categories: 2-3 fields (name/label, color, brief description)
  - Fields use existing `Input` and `Select` components
- Beneath everything, italic gray note: "This becomes a cameo in the story — a moment that only [name]'s book will have."
- Stores in WizardContext as `specialThing: { category: string, details: Record<string, string> }` or `null`
- `setCanContinue(true)` always — runs on mount

**Updated file: `src/App.tsx`** — Add Step5 import and `/step/5` route

### Category follow-up field config (subset — all 20 defined similarly)

| Category | Fields |
|---|---|
| Stuffed Animal | Name, Animal type, Color |
| Pet | Name, Pet type (dropdown), Color/markings |
| Doll/Action Figure | Name, Description |
| Toy Vehicle | Type, Color |
| Ball/Sports Item | Sport/type |
| Blanket/Comfort Item | Name, Color/pattern |
| Musical Instrument | Instrument type |
| Book | Title or topic |
| Superhero Cape/Costume | What character/type, Color |
| Food | What food |
| Other Toy | Description |
| (remaining categories) | 1-3 fields each, similar pattern |

No category exceeds 4 fields. Most need only 2-3.

### Files changed
- `src/pages/steps/Step5.tsx` — new
- `src/App.tsx` — add route

