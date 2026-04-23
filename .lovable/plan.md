

## Add user-decision summary to checkout page preview

Add a "Your story details" recap card below the plot summary on Step 11 (`src/pages/steps/Step11.tsx`), so parents can verify their choices before checkout.

### What gets displayed

The recap pulls from `useWizard().answers` and shows six rows:

1. **Age range** — from `answers.ageRange` (e.g. "3–5")
2. **Story type** — `answers.genre` + `answers.mood` (e.g. "Adventure · Funny")
3. **Life lesson** — from `answers.lesson` (e.g. "Courage")
4. **Interests** — list from `answers.interests[]` plus optional `answers.customInterest`, rendered as small emoji chips
5. **Favorite thing** — from `answers.specialThing.category` + key detail (e.g. "Stuffed Animal — Flopsy the Bear"); hidden if user skipped
6. **Characters** — `answers.protagonist.name` (starred) plus each `answers.supportingCharacters[].name` with their relationship (e.g. "Mia ★ · Mom (Sarah) · Friend (Leo)")

### Layout

A new card placed directly below the existing "The Story" plot-summary card in the left preview column, using the same rounded-2xl + tinted-background styling so it feels like part of the preview block.

```text
┌─ Preview column ────────────────┐
│  [Cover]   [First page]         │
│                                 │
│  ┌─ The Story ──────────────┐   │
│  │ plot summary paragraph   │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌─ Your story details ─────┐   │  ← NEW
│  │ Age range   3–5          │   │
│  │ Story type  Adventure ·  │   │
│  │             Funny        │   │
│  │ Life lesson Courage      │   │
│  │ Interests   🦕 🐶 🚀     │   │
│  │ Favorite    🧸 Flopsy    │   │
│  │ Characters  Mia ★, Mom…  │   │
│  └──────────────────────────┘   │
└─────────────────────────────────┘
```

Each row uses a two-column layout: a small uppercase muted label on the left and the formatted value on the right. Empty/skipped fields are simply omitted (no "—" placeholders).

### Technical details

- **Single file edited:** `src/pages/steps/Step11.tsx`.
- Add small label-lookup maps inside Step11 (mirroring the labels defined in Step1/Step2/Step3/Step4/Step5) so values like `"3-5"` render as `"3–5"`, `"adventure"` as `"Adventure"`, etc. These are local constants — no shared module needed for this prototype.
- Add a `SummaryRow` helper component inside the file for the label/value rows.
- Interests render as inline emoji+label chips (reusing the same `findItem`-style lookup from Step 4, inlined as a small map keyed by interest value).
- Characters: protagonist gets a ⭐ suffix; supporting characters show `Name (Relationship)`, falling back to `Relationship` only if name is empty/surprise.
- No changes to `WizardContext`, routing, or any other files.

