# Step-Aware Progress Encouragement

## What you'll see
The dot/segment progress bar in the wizard header already exists and already says "Your book is taking shape ✨" under the dots. This change makes that **caption rotate** through warm, kid-focused encouragement that matches the user's current step — so it feels like the app is cheering them on as they go.

The dots themselves keep their current behavior (filled = completed, click to jump back, tooltip shows step name).

## Per-step messages
Each step gets its own short caption (≤ ~40 chars, child-focused warmth, light emoji):

| Step | Screen | Caption |
|------|--------|---------|
| 1 | Who's it for? | Your book is taking shape ✨ |
| 2 | Story Type | Lovely start — let's pick the vibe 🌱 |
| 3 | Life Lessons | Beautiful choice — what should they learn? 💛 |
| 4 | Interests | You're sparking ideas already ✨ |
| 5 | Personality | Bringing their personality to life 🌟 |
| 6 | Art Style | Painting the perfect look 🎨 |
| 7 | Characters | Filling the world with friends 🧸 |
| 8 | Story Summary | Your story is almost written 📖 |
| 9 | Generating | Stitching every page together ✨ |
| 10 | Preview & Buy | Tada! Meet your storybook 🎉 |

(Easy to tweak later — they live in one map.)

## Files to change
- **`src/components/ProgressBar.tsx`** — add a `PROGRESS_MESSAGES` map keyed by step, render the matching message instead of the hardcoded one. Use `key={message}` + a CSS opacity transition so the swap is a soft fade rather than a jarring snap.
- Same file: fix the existing `STEP_LABELS` tooltip map, which is stale (still lists "Cover Design" at 8 and goes up to 11). Update to the current 10-step flow so tooltips match what users actually see.

## Out of scope
- No layout/visual changes to the dots themselves — just the caption text.
- No changes to step routing or `WizardContext`.
- No new dependencies.
