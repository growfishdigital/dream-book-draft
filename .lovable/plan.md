## Goal
On the Story Summary step (Step 10), remove the **Edit** button entirely. Keep **Refresh** as the only action, restyled as a small, compact button.

## Changes — `src/pages/steps/Step10Summary.tsx`

1. **Remove Edit affordance**
   - Delete the `Edit` button from the controls row.
   - Remove the inline edit mode entirely: `editing`, `draft`, `draftTitle` state, `startEdit` / `saveEdit` / `cancelEdit` handlers, the `editing` branch of the card render, and the `Pencil`/`Check`/`X` lucide imports.
   - Drop `editing` from the Approve button's `disabled` check and from the controls visibility check.
   - Title is no longer user-editable — it's whatever the AI returns (and is overwritten on each Refresh).

2. **Shrink the Refresh button**
   - Move it out of the centered row into a small button positioned subtly (top-right of the summary card, or just below it right-aligned).
   - Smaller footprint: `px-3 py-1.5 text-xs`, icon `w-3.5 h-3.5`, still pill-shaped with the same border treatment.
   - Spinner behavior on `RefreshCw` preserved while loading.
   - Label tightens: shows just the icon + "Refresh" (or "Try again" on error). While loading, icon spins and label becomes "Crafting…".

3. **Copy tweaks**
   - Update the subheader under the H1 from "Read it, refresh it, or tweak it before we draw the pictures." → "Read it and refresh until it feels right."
   - Update footer hint from "Refresh as many times as you like. Once it's just right, approve…" → keep similar but drop any edit-related wording.

## Out of scope
- No changes to the edge function, the brief, or any other step.
- Cover preview (Step 12) is unchanged.
