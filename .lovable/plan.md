

## Step 2: "What kind of story?"

### What we're building
An interactive genre and mood selection screen with a 2-column card grid for genres and horizontal pill selector for mood/tone.

### Implementation

**New file: `src/pages/steps/Step2.tsx`**

- Dynamic heading using `answers.childName` from WizardContext: "What kind of story does [Name] need right now?"
- Subheading: "Pick the vibe — this shapes the whole adventure."
- **Genre cards** — 2-column grid (`grid grid-cols-2 gap-3`), each card with emoji, bold label, one-line description. 10 genres:
  - 🗺️ Adventure, 🐉 Fantasy, 🚀 Sci-Fi / Space, 🔍 Mystery, 🏡 Everyday Life, 🌙 Bedtime, ⚽ Sports, 👑 Fairy Tale, 🐾 Animals / Nature, 🦸 Superhero
  - Selected state: green border + light green bg (same pill style as Step 1)
  - Stores `genre` in WizardContext
- **Mood pills** — horizontal wrap of pills below genre grid: Funny, Heartwarming, Calm, Whimsical, Brave, Mysterious
  - Same pill styling as Step 1's age/gender pills
  - Stores `mood` in WizardContext
- **Validation** — `setCanContinue(genre && mood)` via useEffect

**Updated file: `src/App.tsx`** — Add route for `/step/2` pointing to `Step2`

### Files changed
- `src/pages/steps/Step2.tsx` — new
- `src/App.tsx` — add Step2 import and route

