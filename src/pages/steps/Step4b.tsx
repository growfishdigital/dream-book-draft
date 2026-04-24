import { useEffect, useMemo } from "react";
import WizardShell from "@/components/WizardShell";
import { Textarea } from "@/components/ui/textarea";
import { useWizard } from "@/contexts/WizardContext";

type AgeRange = "0-2" | "3-5" | "6-8" | "9-12";
type Gender = "girl" | "boy" | "non-binary" | "surprise";
type Suggestion = { emoji: string; word: string };

const s = (emoji: string, word: string): Suggestion => ({ emoji, word });

// Base pool per age bucket
const BASE_BY_AGE: Record<AgeRange, Suggestion[]> = {
  "0-2": [
    s("🐾", "animals"), s("🫧", "bubbles"), s("🎵", "music"), s("🦆", "ducks"),
    s("🙈", "peekaboo"), s("📚", "books"), s("🌈", "colors"), s("💃", "dancing"),
    s("💦", "splashing"), s("🧸", "soft toys"), s("🚚", "trucks"), s("🤗", "hugs"),
    s("🐶", "puppies"), s("🛁", "bath time"),
  ],
  "3-5": [
    s("🦕", "dinosaurs"), s("🐾", "animals"), s("🚚", "trucks"), s("🎨", "drawing"),
    s("🐛", "bugs"), s("🌊", "the ocean"), s("🚀", "space"), s("🧱", "building"),
    s("🫧", "bubbles"), s("🎵", "music"), s("🐶", "puppies"), s("🛝", "playgrounds"),
    s("🌈", "rainbows"), s("📖", "bedtime stories"),
  ],
  "6-8": [
    s("🎨", "drawing"), s("⚽", "soccer"), s("🏊", "swimming"), s("🧁", "baking"),
    s("🐾", "animals"), s("🚀", "space"), s("🔬", "science"), s("✨", "magic"),
    s("📚", "reading"), s("🧱", "lego"), s("🚲", "biking"), s("🏕️", "camping"),
    s("🧩", "puzzles"), s("🎵", "music"),
  ],
  "9-12": [
    s("🛹", "skateboarding"), s("🎮", "gaming"), s("🏀", "basketball"), s("⚽", "soccer"),
    s("🎨", "drawing"), s("📚", "reading"), s("🔬", "science"), s("🤖", "robots"),
    s("🔍", "mysteries"), s("🎵", "music"), s("💻", "coding"), s("🧁", "baking"),
    s("🚲", "biking"), s("📷", "photography"),
  ],
};

// Gender-flavored boost
const BOOST_BY_GENDER: Partial<Record<Gender, Partial<Record<AgeRange, Suggestion[]>>>> = {
  girl: {
    "0-2": [s("👑","princesses"), s("🪆","dolls"), s("🌸","flowers"), s("🐱","kittens"), s("🩰","ballet"), s("🍵","tea parties"), s("🦋","butterflies"), s("🧚","fairies")],
    "3-5": [s("👑","princesses"), s("🦄","unicorns"), s("🧜","mermaids"), s("🩰","ballet"), s("🧚","fairies"), s("🐴","horses"), s("🧁","baking"), s("🐱","kittens")],
    "6-8": [s("🐴","horses"), s("💃","dancing"), s("🤸","gymnastics"), s("👗","fashion"), s("💖","friendship"), s("✂️","crafts"), s("🧜","mermaids"), s("🎤","singing")],
    "9-12": [s("🏐","volleyball"), s("👗","fashion"), s("🐴","horses"), s("💖","friendship"), s("✍️","writing stories"), s("💃","dance"), s("🤸","gymnastics"), s("✂️","crafts")],
  },
  boy: {
    "0-2": [s("🚚","trucks"), s("🚂","trains"), s("⚾","balls"), s("🚗","cars"), s("🐶","puppies"), s("🦕","dinosaurs"), s("🔧","tools"), s("🧱","blocks")],
    "3-5": [s("🦸","superheroes"), s("🏴‍☠️","pirates"), s("🚒","fire trucks"), s("🛡️","knights"), s("👹","monsters"), s("🥷","ninjas"), s("🏎️","race cars"), s("🔧","tools")],
    "6-8": [s("🦸","superheroes"), s("🥷","ninjas"), s("🏴‍☠️","pirates"), s("🛹","skateboards"), s("⛏️","minecraft-style worlds"), s("⚽","soccer"), s("🛡️","knights"), s("🐉","dragons")],
    "9-12": [s("🛹","skateboarding"), s("🎮","video games"), s("🏀","basketball"), s("🏃","parkour"), s("🚗","cars"), s("🤖","robots"), s("🎸","guitar"), s("🎣","fishing")],
  },
};

function buildPool(age: AgeRange, gender: string): Suggestion[] {
  const base = BASE_BY_AGE[age] ?? BASE_BY_AGE["3-5"];
  const boost =
    gender && (gender === "girl" || gender === "boy")
      ? BOOST_BY_GENDER[gender as Gender]?.[age] ?? []
      : [];
  const seen = new Set<string>();
  return [...boost, ...base].filter((it) => {
    const k = it.word.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseEntered(text: string): Set<string> {
  return new Set(
    text.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
  );
}

function appendInterest(text: string, word: string): string {
  const trimmed = text.replace(/\s+$/, "");
  if (trimmed.length === 0) return `${word}, `;
  if (trimmed.endsWith(",")) return `${trimmed} ${word}, `;
  return `${trimmed}, ${word}, `;
}

export default function Step4b() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = ((answers.childName as string) || "").trim() || "your little one";
  const age = (answers.ageRange as AgeRange) || "3-5";
  const gender = (answers.gender as string) || "";
  const value = (answers.interestsFreeform as string) || "";

  useEffect(() => {
    setCanContinue(true);
  }, [setCanContinue]);

  const pool = useMemo(() => buildPool(age, gender), [age, gender]);

  const visibleChips = useMemo(() => {
    const entered = parseEntered(value);
    return pool.filter((it) => !entered.has(it.word.toLowerCase())).slice(0, 10);
  }, [pool, value]);

  const addChip = (word: string) => {
    setAnswer("interestsFreeform", appendInterest(value, word));
  };

  return (
    <WizardShell showSkip>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold"
            style={{ color: "hsl(var(--wizard-primary))" }}
          >
            What does {name} love?
          </h1>
          <p className="text-muted-foreground text-lg">
            Type their interests, separated by commas — or tap a suggestion below to add it.
          </p>
        </div>

        <Textarea
          value={value}
          onChange={(e) => setAnswer("interestsFreeform", e.target.value)}
          placeholder="Tell us what they're into…"
          className="min-h-[140px] rounded-2xl bg-white border-2 text-base px-4 py-3 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{ borderColor: "hsl(var(--wizard-primary) / 0.25)" }}
        />

        <p className="text-xs text-muted-foreground">
          ⚠️ Please don't reference copyrighted material (movies, TV shows, singers, brands, etc.) — we can't include them in your book.
        </p>

        {visibleChips.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-medium text-muted-foreground text-base">Tap for inspiration:</h2>
            <div className="flex flex-wrap gap-2">
              {visibleChips.map((it) => (
                <button
                  key={it.word}
                  type="button"
                  onClick={() => addChip(it.word)}
                  className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-base font-medium transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "hsl(var(--wizard-primary) / 0.10)",
                    color: "hsl(var(--wizard-primary))",
                  }}
                >
                  <span aria-hidden>{it.emoji}</span>
                  <span>{it.word}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          <span className="font-semibold">Why we ask:</span> {name}'s interests become woven into the story — making it uniquely theirs.
        </p>
      </div>
    </WizardShell>
  );
}
