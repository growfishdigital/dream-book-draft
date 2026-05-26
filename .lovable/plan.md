## Goal

Standardize the look, hover, and selected state of every selectable "box" in the wizard (excluding the Interests and Personality pickers, which keep their custom chip styling).

## What changes visually

All selectable tiles get:
- **Same shadow** — resting `shadow-sm`, hover `shadow-md` with a subtle `-translate-y-0.5` lift, selected `shadow-md` (no lift, no scale jump).
- **Same border treatment** — 2px transparent border at rest, `hsl(var(--wizard-primary))` border + `hsl(var(--wizard-primary)/0.08)` tint when selected.
- **Checkmark badge** when selected — a small filled green circle (`hsl(var(--wizard-primary))`) with a white check icon, absolutely positioned in the top-right corner of the tile (≈ `top-2 right-2`, ~20px circle, `lucide-react`'s `Check` at 12px stroke-2).

Pills (gender, hair color, hair style) keep their pill shape but get the same checkmark badge in the top-right corner and a unified hover (border tint + subtle shadow). Skin-tone swatches keep their circle shape but, when selected, show the same checkmark badge overlaid in the corner (in addition to the existing ring).

## Where it applies

| Step | Component(s) |
|------|--------------|
| Step 1 — Name | Language pills, Book type tiles |
| Step 2 — Buyer | "You are…" tiles, Occasion tiles |
| Step 3 — Genre | Genre tiles, Mood tiles |
| Step 4 — Lesson | Heart-of-story tiles |
| Step 6 — Art Style | Illustration style tiles |
| Step 7 — Character | Gender pills, Hair color pills, Hair style pills, Skin-tone swatches |

Explicitly **out of scope** (per your ask): Interests picker (Step 5) and Personality trait picker (Step 7 MiniPersonality + main personality step).

## Also recommended (flag for your decision)

- **Step 1 — "Gender" Select dropdown**: currently a native shadcn `<Select>`, not tiles. Consider converting to the same tile/pill row so it matches Step 7's gender selector and the rest of Step 1. Small UX win, removes the only dropdown in the early flow. *(Will only do this if you say yes.)*
- **Step 1 — "This book belongs to" checkbox**: stays as-is (it's a toggle, not a selection tile).
- **Supporting-character path choice in Step 7** ("Let AI create" / "Based on a real person"): two big tile buttons that today use a different border/hover style. Worth folding into the same standard since they are selectable boxes. *(Will include unless you say otherwise.)*
- **"Glasses" checkbox in Step 7**: leave alone (toggle, not a tile).

## Implementation approach (technical)

1. **New shared component** `src/components/SelectableTile.tsx`:
   - Props: `selected: boolean`, `onClick`, `as?: "tile" | "pill" | "swatch"`, `className?`, `children`, plus an optional `style` passthrough for the skin-tone swatch background.
   - Renders the button with the unified base classes and, when `selected`, renders a `<CheckBadge />` absolutely positioned top-right.
   - `CheckBadge` is a small internal component: filled circle in `--wizard-primary`, white `Check` icon, `w-5 h-5`, `shadow-sm`, `ring-2 ring-white` so it reads cleanly over any tile background or photo.

2. **Refactor each step** to replace the local `cardClass`/`pillClass`/`tileClass`/`PillSelector`/`SkinTonePicker` selected-state logic with `SelectableTile`. Tile contents (emoji, label, image, etc.) stay exactly as they are — only the wrapper changes.

3. **PillSelector** in `Step7Character.tsx` becomes a thin wrapper around `SelectableTile as="pill"` so hair color / hair style / gender all get the badge for free. `SkinTonePicker` likewise uses `as="swatch"`.

4. No changes to wizard state, validation, or any downstream logic. Pure presentation.

## Files touched

- `src/components/SelectableTile.tsx` (new)
- `src/pages/steps/Step1Name.tsx`
- `src/pages/steps/Step2Buyer.tsx`
- `src/pages/steps/Step3Genre.tsx`
- `src/pages/steps/Step4Lesson.tsx`
- `src/pages/steps/Step6ArtStyle.tsx`
- `src/pages/steps/Step7Character.tsx`

No prompt, edge-function, or schema changes.

## One question before I build

Should I also (a) convert the Step 1 "Gender" dropdown to tiles, and (b) standardize the Step 7 "AI vs real person" path-choice tiles? Both are small and consistent with the spirit of the request, but say the word and I'll skip either.