

## Plan: "The Spotlight" Character Creator — Step 6 Rewrite

Complete rewrite of `src/pages/steps/Step6.tsx` (~700 lines) to implement a mini-wizard-within-the-wizard with a horizontal pill bar and focused single-character editing.

### Data Model

New interfaces stored in wizard context under keys `protagonist`, `supportingCharacters`, `companion`:

```text
Protagonist: {
  photos: string[] (base64, max 3),
  name, age, gender, special (200 chars),
  appearance: { hairColor, hairStyle, skinTone, glasses: bool, features (100 chars) }
}

SupportingCharacter: {
  id, mode: "ai" | "real",
  // AI mode: name, surpriseName: bool, relationship, gender, ageRange
  // Real mode: above + photos (max 3), appearance (same as protagonist)
}

Companion: {
  id, name, type (Dog/Cat/Stuffed Animal/Imaginary Friend/Other + writeIn), description (100 chars)
}
```

### Component Breakdown (all in Step6.tsx)

1. **PillBar** — horizontal scrollable row of character pills
   - Protagonist pill: star icon + name from Step 1 (or "Main Character"), no X button
   - Supporting character pills: avatar placeholder (or photo thumbnail), name, X to remove
   - Companion pill: paw icon, name, X to remove
   - "+ Character" pill (hidden when 2 supporting exist, shows tooltip at limit)
   - "+ Companion" pill (hidden when 1 companion exists)
   - Active pill highlighted with wizard-primary color
   - Subtle slide-in animation on add

2. **ProtagonistForm** — always "real person" mode
   - Photo upload zone (drag-drop or click, up to 3, base64 via FileReader, thumbnails with X)
   - Name (pre-filled from `answers.childName`), Age (pre-filled from `answers.ageRange`), Gender (pre-filled)
   - "What makes [Name] special?" textarea (200 char limit + counter, optional)
   - "Refine appearance" collapsible accordion (expanded if no photos, collapsed if photos exist)
     - Hair color pills, hair style pills, skin tone color swatches (6-8 circles), glasses toggle, features text (100 chars)

3. **SupportingCharacterForm** — starts with path choice cards
   - Two large cards: "Let AI create" (sparkles icon) vs "Based on a real person" (camera icon)
   - After choosing, show appropriate form with "Switch to..." link at top
   - AI mode: name + "Surprise me" checkbox, relationship picker, gender picker, age range (auto-suggested from relationship)
   - Real mode: full form with photos, name, relationship, age range, gender, appearance accordion

4. **CompanionForm**
   - Name, type picker (with "Other" write-in), brief description (100 chars)

5. **Paid character upsell** — when user has 2 supporting characters and taps "+ Character", show a simulated $3 paywall dialog before adding the 3rd

### Validation & Navigation

- On "Continue" click: check protagonist has name + age + gender, each supporting char has name + relationship, each companion has name + type
- If invalid: add red dot badge to incomplete pill, switch to first incomplete character, highlight missing fields
- All data persists when switching pills (stored in wizard context)
- Remove character: confirmation toast/dialog, then remove and focus previous pill

### Files Changed

- **`src/pages/steps/Step6.tsx`** — full rewrite with all components above
- **`src/contexts/WizardContext.tsx`** — no changes needed (generic `answers` record handles new shape)

### Visual Notes

- Consistent with existing wizard styling (wizard-primary color, rounded-2xl cards, pill selectors)
- Skin tone picker: 8 colored circles (light to dark), no text labels
- Photo upload: dashed border zone with camera icon, prominent placement at top of form
- Path choice cards: equal visual weight, sparkles vs camera icons, subtle hover shadow

