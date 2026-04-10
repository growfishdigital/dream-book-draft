

## Plan: Rewrite Step 5 Categories

Replace the current 20 categories in `src/pages/steps/Step5.tsx` with the 10 new categories from the table. Each category gets updated follow-up fields with dropdowns where specified and a "Photo" upload field where indicated.

### New Categories & Fields

1. **Stuffed Animal 🧸** — Animal type (dropdown: Bear, Bunny, Dog, Cat, Elephant, Monkey, Dinosaur, Unicorn, Other) · Color(s) (text) · Name (text) · Photo
2. **Pet 🐕** — Animal type (dropdown: Dog, Cat, Fish, Bird, Hamster, Rabbit, Turtle, Horse, Other) · Breed/description (text) · Color (text) · Name (text) · Photo
3. **Doll or Action Figure 🧍** — Type (dropdown: Baby doll, Fashion doll, Action figure, Figurine, Toy animal, Other) · Hair/outfit description (text) · Name (text) · Photo
4. **Toy Vehicle 🚗** — Type (dropdown: Car, Truck, Train, Plane, Rocket, Boat, Bike, Scooter, Skateboard, Other) · Color (text) · Name (text) · Photo
5. **Blanket or Comfort Item 🛏️** — Color(s) (text) · Pattern (dropdown: Solid, Striped, Polka dot, Patchwork, Stars) · Name (text) · Photo
6. **Clothing or Accessory 👑** — Type (dropdown: Cape, Costume, Hat, Boots, Jewelry, Backpack, Tutu, Crown, Other) · Color (text) · Description (text) · Photo
7. **Sports or Outdoor Gear ⚽** — Sport/activity (dropdown: Soccer, Basketball, Baseball, Football, Tennis, Swimming, Gymnastics, Camping, Other) · Color if non-standard (text)
8. **Musical Instrument 🎸** — Type (dropdown: Guitar, Piano, Drums, Ukulele, Violin, Trumpet, Flute, Other) · Color if non-standard (text)
9. **Food 🍕** — What food (text, short)
10. **Something Else 🎁** — Description (text, 80 char max) · Photo (strongly encouraged)

### Technical Changes

**File: `src/pages/steps/Step5.tsx`**

- Replace the `CATEGORIES` array with the 10 new entries above
- Add `maxLength?: number` to the `FieldDef` interface
- Add `"photo"` to the `FieldDef.type` union
- For photo fields, render a file input (`<input type="file" accept="image/*">`) styled consistently
- Store photo as a base64 data URL in wizard answers via `FileReader`
- For "Something Else" description, set `maxLength: 80` on the input
- Show a small photo preview thumbnail when a photo is uploaded

### UI Notes
- Category grid stays as-is (2-column grid of cards with emoji + label)
- Follow-up fields appear below selected category with smooth scroll
- Photo fields show a simple styled file picker with preview
- Card shadows and styling remain consistent with other steps

