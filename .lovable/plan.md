## Convert Step 4b to 3 pill-style interest slots

### Data model
- Replace `answers.interestsFreeform` (string) with `answers.interestsList: { word: string; emoji?: string }[]` (max 3).

### `src/pages/steps/Step4b.tsx` rewrite

**Layout (top to bottom):**
1. Headline "What does {name} love?" stays. Subhead changes to *"Add up to 3 things they're into."*
2. **Filled pills row** (`flex flex-wrap gap-2`):
   - Each entry renders as a **pill** matching the suggestion-chip style: `rounded-full`, `px-5 py-2.5`, `text-base font-medium`, bg `hsl(var(--wizard-primary) / 0.10)`, text `hsl(var(--wizard-primary))`.
   - Inline content: `[emoji?] [auto-sizing editable input] [✕]`.
   - Editable input is borderless, transparent bg, auto-sized via `size={Math.max(value.length, placeholder.length)}` so the pill hugs the text.
   - ✕ uses `lucide-react` `X` icon, primary color at lower opacity, hover → full opacity. Removes that entry.
   - Empty entry stays until ✕ pressed; placeholder reads "type here".
3. **"+ Add interest" dashed pill** in the same row, after filled pills:
   - `rounded-full border-2 border-dashed`, `px-5 py-2.5`, primary-tinted text, `+` icon left.
   - Appends `{ word: "" }` and autofocuses the new input.
   - Hidden when `list.length === 3`.
4. **Copyright disclaimer** (unchanged).
5. **Suggestion chips section**:
   - Visible only when `list.length < 3`.
   - Tapping a chip fills the next empty-slot's `word`+`emoji`, or appends a new entry (capped at 3).
   - Chips already in the list (case-insensitive on `word`) are filtered out.
   - Existing `buildPool(age, gender)` logic stays.
6. **At-cap state** (`list.length === 3`): chip section + add button hidden. Show muted helper line: *"That's plenty — 3 is the sweet spot ✨"*.
7. "Why we ask" footer line stays.

**Helpers:**
- `addEntry(word, emoji?)` — fills first empty slot or appends; dedupes case-insensitively; respects cap.
- `updateEntry(idx, word)` — sets `list[idx].word`; clears emoji if word changes from the original suggestion text.
- `removeEntry(idx)` — splices.
- Drop `parseEntered`, `appendInterest`. Drop `Textarea` import. Add `Input` not needed (raw `<input>` for auto-size). Add `X`, `Plus` from `lucide-react`.

**Misc:** `setCanContinue(true)` on mount stays. No validation.

### No other files change
Routing, progress bar, Step 4 (`interests` array) all untouched.

### Out of scope
Recap card surfacing of `interestsList`; add/remove animations.