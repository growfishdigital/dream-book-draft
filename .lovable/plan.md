

## Normalize Interest Categories to 6 Tiles Each

Rewrite the `CATEGORIES` constant in `src/pages/steps/Step4.tsx` so every section has exactly **6 options**. Adjust by adding, removing, or combining tiles while keeping the existing tone and emoji style.

### Current vs. Proposed

**🐾 Animals & Nature** (currently 8 → 6)
- Keep: Dinosaurs 🦕, Dogs 🐶, Cats 🐱, Horses 🐴, Farm Animals 🐄, Bugs & Butterflies 🦋
- Remove: Ocean & Mermaids (moves to Adventure & Fantasy as "Mermaids"), Zoo Animals (covered by Farm/Dogs/Cats)

**🚀 Adventure & Fantasy** (currently 9 → 6)
- Keep: Pirates 🏴‍☠️, Superheroes 🦸, Princesses & Castles 👑, Unicorns 🦄, Dragons 🐉, Mermaids & Magic 🧜
- Combine: "Fairies & Magic" merged into "Mermaids & Magic"; Space → moves to a new tech-leaning section
- Remove: Ninjas (overlaps Martial Arts), Treasure Hunting (niche), Space & Stars (moves)

**🚗 Vehicles & Things That Go** (currently 3 → 6)
- Keep: Trains 🚂, Cars & Trucks 🚗, Bikes & Scooters 🛴
- Add: Planes ✈️, Boats & Ships ⛵, Construction Trucks 🚜

**⚽ Sports & Active Play** (currently 7 → 6)
- Keep: Soccer ⚽, Basketball 🏀, Baseball ⚾, Swimming 🏊, Gymnastics 🤸, Dancing/Ballet 💃
- Remove: Martial Arts (move to Creative & Learning as a discipline-style activity, or drop — see below)

**🎨 Creative & Learning** (currently 7 → 6)
- Keep: Art & Drawing 🎨, Music 🎵, Reading & Books 📚, Cooking & Baking 🧁, Building/LEGO 🧱, Science & Experiments 🔬
- Remove: Robots & Machines (moves to a new section)

**🌈 Vibes & Worlds** (currently 4 → 6)
- Keep: Camping & Outdoors 🏕️, Gardening & Flowers 🌸, Snow & Winter ❄️, Rainbows & Colors 🌈
- Add: Space & Stars 🌟 (moved from Adventure), Robots & Machines 🤖 (moved from Creative)
- Rename section: **🌈 Worlds & Wonders** to better fit the new mix (space, robots, outdoors all feel like "worlds to explore")

### Side effects to handle

- **`POPULAR_BY_AGE`** references some removed values (`treasure-hunting`, `martial-arts`, `fairies-magic`). Update:
  - `0-2`: keep as-is (`farm-animals`, `dogs`, `cats`, `bugs-butterflies`, `rainbows-colors`, `music`)
  - `3-5`: keep as-is (`dinosaurs`, `unicorns`, `princesses-castles`, `dogs`, `space-stars`, `cars-trucks`)
  - `6-8`: keep as-is (`superheroes`, `dragons`, `space-stars`, `soccer`, `art-drawing`, `science-experiments`)
  - `9-12`: replace `martial-arts` → `robots-machines` already there; replace with `building-lego`, `cooking-baking`, `science-experiments`, `robots-machines`, `reading-books`, `art-drawing`
- **`COMBO_SENTENCES`** references removed values (`ninjas`, `martial-arts`, `treasure-hunting`, `fairies-magic`, `ocean-mermaids`). Either remap them to the new merged values (`mermaids-magic`) or drop those combo entries. Plan: drop combos that reference removed-only values; remap `ocean-mermaids+treasure-hunting` and `unicorns+fairies-magic` to use `mermaids-magic`.
- New values added (`planes`, `boats-ships`, `construction-trucks`) get appropriate `ages` arrays (mostly `0-2` / `3-5` / `6-8` for vehicles).

### Final shape

Each of the 6 sections renders exactly 6 tiles (before age filtering). With age filtering applied, sections may shrink — that's still fine since we already hide empty sections.

### File touched

- `src/pages/steps/Step4.tsx` (CATEGORIES, POPULAR_BY_AGE, COMBO_SENTENCES only — no logic or layout changes)

