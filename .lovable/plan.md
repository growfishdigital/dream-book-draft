

## Rework Step 4 — Interests

Make the interests page calmer and more guided: a visual grid, age-aware filtering, popular picks at the top, and a persistent selection bar at the bottom.

### 1. Layout: visual grid (not pills)

Replace the wrapping pill list with a responsive tile grid inside each category:

- 2 cols on mobile, 3 on `sm`, 4 on `md+`
- Each tile: square-ish card (~`aspect-[4/3]`), white bg, rounded-2xl, soft shadow
- Big emoji centered (text-3xl), label below (text-xs/sm, medium weight)
- Selected state: primary-tinted bg + 2px primary border + small ✓ badge in top-right corner
- Hover: lift shadow
- Keep the existing FIFO replacement + shake animation on the displaced tile
- Keep section headers (`🐾 Animals & Nature`, etc.) above each grid

### 2. "Popular picks for age [X]" section at top

A new first section above the categories:

- Header: `⭐ Popular picks for ages {ageRange}` (pulled from `answers.ageRange` from Step 1)
- Same tile style as the rest of the grid
- Curated list of ~6 interests per age bracket:
  - **0–2**: farm-animals, dogs, cats, bugs-butterflies, rainbows-colors, music
  - **3–5**: dinosaurs, unicorns, princesses-castles, dogs, space-stars, cars-trucks
  - **6–8**: superheroes, dragons, space-stars, soccer, art-drawing, science-experiments
  - **9–12**: science-experiments, robots-machines, martial-arts, treasure-hunting, building-lego, cooking-baking
- If no age is set, hide this section entirely (no fallback noise)
- Selecting a tile here also reflects in its category section below (single source of truth)

### 3. Age-based filtering (hide some tiles for ages 5–8 and surrounding brackets)

Tag each interest with an age-suitability list, and filter the visible tiles based on `answers.ageRange`:

- **0–2**: only show very-young-friendly (animals, vehicles, music, rainbows, gardening, snow, dancing)
- **3–5**: hide overly-mature themes (martial-arts, ninjas, science-experiments, robots-machines)
- **6–8**: hide baby-leaning (farm-animals stays, but drop e.g. rainbows-colors as a primary)
- **9–12**: hide young-leaning (princesses-castles, unicorns, fairies-magic, rainbows-colors, bugs-butterflies)

Filtering is a soft hide — if a category ends up empty for the selected age, hide that whole category section too. If no age is selected, show everything.

### 4. Persistent bottom selection bar

A new sticky bar that sits **above** the existing WizardShell footer (Back / Continue):

- Position: `sticky bottom-[88px]` (clears the shell's footer), full-width, centered content
- Surface: white card with soft shadow, rounded-2xl, slight border
- Left: `2 of 3 selected` (live count)
- Right: chosen interests rendered as small removable pills (emoji + label + ✕)
- Empty state: subdued text `Pick 2–3 interests to bring the story to life`
- When count = 3: subtle success tint on the bar (primary-tinted bg) + label changes to `Perfect — you're all set ✨`

The combo "preview sentence" stays, but moves **inside** this bar (small italic line under the pills) so it feels like one cohesive status area instead of floating at page bottom.

### 5. Write-in interest

Stays as-is at the bottom of the scrollable content (under the grids), unchanged copy and disclaimer.

### Technical notes

- File: `src/pages/steps/Step4.tsx` only
- Add two constants:
  - `POPULAR_BY_AGE: Record<string, string[]>` keyed by `"0-2" | "3-5" | "6-8" | "9-12"`
  - Extend each item with an optional `ages: string[]` (which age ranges may see it); compute a `visibleCategories` derived list
- Keep existing `CATEGORIES`, `COMBO_SENTENCES`, `getPreviewSentence`, FIFO toggle logic, and `setCanContinue(interests.length >= 2)` behavior
- Read `answers.ageRange` for both popular section and filtering
- Tile component extracted locally (`InterestTile`) so the popular section and category sections share the same visual

### Visual sketch

```text
What is Emma interested in?
Pick up to 3 — we'll weave these into the world…

⭐ Popular picks for ages 3–5
[🦕 Dino] [🦄 Uni] [👑 Princess] [🐶 Dogs] [🌟 Space] [🚗 Cars]

🐾 Animals & Nature
[🦕] [🐶] [🐱] [🐴]
[🧜] [🐄] [🦁] [🦋]

🚀 Adventure & Fantasy
[🌟] [🏴‍☠️] [🦸] [👑]
…

✍️ Or write your own
[__________________________]

────── sticky bar ──────
2 of 3 selected     [🦕 Dinosaurs ✕] [🌟 Space ✕]
Emma zooms past the rings of Saturn…
─────────────────────────
[ Back ]        [ Continue ]
```

