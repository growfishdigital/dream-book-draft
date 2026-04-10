

## Step 8: "The Cover" — Cover Designer

### What we're building
A cover design step with layout picker, title input with character count, and a live wireframe preview that updates in real-time.

### Implementation

**New file: `src/pages/steps/Step8.tsx`**

- Heading: "Design [name]'s cover." / Subheading: "The first thing they'll see — make it theirs."

1. **Cover layout picker** — two large cards side-by-side (`grid-cols-2`, stacked on mobile via `grid-cols-1 sm:grid-cols-2`):
   - "Full Illustration": colored rectangle top 2/3, text block bottom 1/3
   - "Bold Title": split left illustration / right large title text
   - Same `cardClass` pattern as other steps. Store as `answers.coverLayout`.

2. **Book title input** — text input, max 40 chars, live char counter (`{title.length}/40`).
   - Pre-fill with a generated suggestion based on `answers.genre` + `answers.childName` (e.g., fantasy → "[Name] and the Dragon's Secret", adventure → "[Name] and the Lost Treasure", etc.)
   - Store as `answers.bookTitle`.

3. **Live mini cover preview** — a styled div with book-cover aspect ratio (~2:3), centered below the input:
   - Renders differently based on selected layout:
     - Full Illustration: colored rectangle placeholder on top, title in serif font below
     - Bold Title: side-by-side split, illustration left, title right
   - Shows the typed title in real-time + child's name as author
   - Simple wireframe style: light background, placeholder blocks, `font-serif` for title

- `setCanContinue` enabled when both `coverLayout` and `bookTitle` (trimmed, non-empty) are set.

**Title suggestion helper** — a function mapping genre to a fun default title:
```
fantasy → "[Name] and the Dragon's Secret"
adventure → "[Name] and the Lost Treasure"  
sci-fi → "[Name] and the Star Beyond"
bedtime → "[Name]'s Dreamland Journey"
mystery → "[Name] and the Hidden Clue"
(etc., with a fallback)
```

**Updated file: `src/App.tsx`** — Add Step8 import and `/step/8` route.

### Files changed
- `src/pages/steps/Step8.tsx` — new
- `src/App.tsx` — add route

