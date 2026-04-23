## Reduce Interest Categories from 6 to 5 Tiles Each

Trim one tile from each of the 6 sections in `src/pages/steps/Step4.tsx` so every section displays exactly 5 options.

### Per-section changes

- Animals & Nature: remove Horses. Keep Dinosaurs, Dogs, Cats, Farm Animals, Bugs & Butterflies.
- Adventure & Fantasy: remove Princesses & Castles. Keep Pirates, Superheroes, Unicorns, Dragons, Mermaids & Magic.
- Vehicles & Things That Go: remove Boats & Ships. Keep Trains, Cars & Trucks, Bikes & Scooters, Planes, Construction Trucks.
- Sports & Active Play: remove Baseball. Keep Soccer, Basketball, Swimming, Gymnastics, Dancing/Ballet.
- Creative & Learning: remove Cooking & Baking. Keep Art & Drawing, Music, Reading & Books, Building/LEGO, Science & Experiments.
- Worlds & Wonders: remove Gardening & Flowers. Keep Camping & Outdoors, Snow & Winter, Rainbows & Colors, Space & Stars, Robots & Machines.

### Side effects

- POPULAR_BY_AGE: in 3-5 replace `princesses-castles` with `mermaids-magic`; in 9-12 replace `cooking-baking` with `camping-outdoors`.
- COMBO_SENTENCES: drop `cooking-baking+dragons` and `princesses-castles+horses`.
- Grid: change `md:grid-cols-6` to `md:grid-cols-5`.

### File touched

- `src/pages/steps/Step4.tsx` only.
