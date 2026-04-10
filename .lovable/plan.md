

## Step 7: "Make it yours" — Customization

### What we're building
A multi-section customization step with art style picker, buyer relationship, title page name, dedication textarea, and language selector. All fields have smart defaults so Continue is enabled immediately.

### Implementation

**New file: `src/pages/steps/Step7.tsx`**

Five vertically stacked sections separated by `<Separator />`:

1. **Art style** — 2x2 card grid (same card style as Step 2). Each card: colored rectangle placeholder, title, description. Pre-select based on `answers.genre`:
   - adventure/superhero/sports → "bold-bright"
   - bedtime/everyday → "dreamy-pastel"
   - fantasy/fairy-tale → "watercolor"
   - default → "cozy-sketch"
   
   Store as `answers.artStyle`.

2. **Buyer relationship** — horizontal pill selector (same pill style as Step 2 mood pills). Options: Parent, Grandparent, Teacher, Friend, Other. Store as `answers.buyerRole`. Default: "parent".

3. **Title page name** — text input pre-filled with `answers.childName`. Store as `answers.titlePageName`.

4. **Dedication** — textarea, max 200 chars with character counter. Pre-fill dynamically based on `buyerRole`. Store as `answers.dedication`.

5. **Language** — pill selector: English, Español, Français, Deutsch, + a disabled "More coming soon" pill. Default: "english". Store as `answers.language`.

`setCanContinue(true)` on mount. All defaults set via `useEffect` on mount (only if not already set).

**Updated file: `src/App.tsx`** — Add Step7 import and `/step/7` route.

### Files changed
- `src/pages/steps/Step7.tsx` — new
- `src/App.tsx` — add route

