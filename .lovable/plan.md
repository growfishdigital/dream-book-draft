

## Step 9: "Generating" — Magical Loading Experience

### What we're building
A full-screen takeover generating screen with an animated book SVG, cycling status messages, a progress bar, and a reveal button after ~8 seconds. No WizardShell — this step owns the entire viewport.

### Implementation

**New file: `src/pages/steps/Step9.tsx`**

- **No WizardShell wrapper** — renders its own full-screen layout with `min-h-[100dvh]` and the wizard background color. No header, no back button, no continue button.

- **Animated book (CSS + SVG)**:
  - A book shape built from SVG: two "cover" rectangles that rotate open, with page shapes fanning out
  - CSS keyframe animations: book slowly opens over ~4s, pages gently flutter
  - Sparkle particles: 6-8 small dots/stars with randomized float-up animations using CSS (`@keyframes float-sparkle`)
  - After 8s, a checkmark fades in over the book

- **Progress stages** — cycle through 5 messages with crossfade transitions (opacity + translateY), each lasting ~1.6s:
  1. ✍️ "Crafting [name]'s story..."
  2. 🎨 "Illustrating the pages..."
  3. 🌟 "Adding the magic touches..."
  4. 📖 "Putting it all together..."
  5. 💌 "Almost ready..."

  Use `useState` + `useEffect` with `setInterval` to advance the stage index.

- **Progress bar** — thin bar beneath the messages, fills from 0% to 100% over 8 seconds using CSS `transition: width 8s linear`.

- **Completion (after ~8s)**:
  - Book animation settles, checkmark appears (fade-in)
  - Button fades in: "✨ Your book is ready — take a look"
  - Clicking navigates to `/step/10` via `useNavigate`

- **Static copy** (visible from start): "Every word, every illustration — made just for [name]." in small warm gray italic text below the animation.

- Child's name from `answers.childName` via `useWizard()`.

**Updated file: `src/App.tsx`** — Import Step9, add `/step/9` route.

### Technical details
- All animations are pure CSS keyframes defined in the component via inline `<style>` tag or Tailwind config additions
- No external animation libraries needed
- Timer-based state: `useEffect` manages stage cycling and the 8s completion trigger
- Cleanup: all intervals/timeouts cleared on unmount

### Files changed
- `src/pages/steps/Step9.tsx` — new
- `src/App.tsx` — add route

