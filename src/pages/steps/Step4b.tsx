import { useEffect, useMemo } from "react";
import WizardShell from "@/components/WizardShell";
import { Textarea } from "@/components/ui/textarea";
import { useWizard } from "@/contexts/WizardContext";

type AgeRange = "0-2" | "3-5" | "6-8" | "9-12";
type Gender = "girl" | "boy" | "non-binary" | "surprise";

// Base pool per age bucket (~14 each)
const BASE_BY_AGE: Record<AgeRange, string[]> = {
  "0-2": [
    "animals", "bubbles", "music", "ducks", "peekaboo", "books", "colors",
    "dancing", "splashing", "soft toys", "trucks", "hugs", "puppies", "bath time",
  ],
  "3-5": [
    "dinosaurs", "animals", "trucks", "drawing", "bugs", "the ocean", "space",
    "building", "bubbles", "music", "puppies", "playgrounds", "rainbows", "bedtime stories",
  ],
  "6-8": [
    "drawing", "soccer", "swimming", "baking", "animals", "space", "science",
    "magic", "reading", "lego", "biking", "camping", "puzzles", "music",
  ],
  "9-12": [
    "skateboarding", "gaming", "basketball", "soccer", "drawing", "reading",
    "science", "robots", "mysteries", "music", "coding", "baking", "biking", "photography",
  ],
};

// Gender-flavored boost (~8 each)
const BOOST_BY_GENDER: Partial<Record<Gender, Partial<Record<AgeRange, string[]>>>> = {
  girl: {
    "0-2": ["princesses", "dolls", "flowers", "kittens", "ballet", "tea parties", "butterflies", "fairies"],
    "3-5": ["princesses", "unicorns", "mermaids", "ballet", "fairies", "horses", "baking", "kittens"],
    "6-8": ["horses", "dancing", "gymnastics", "fashion", "friendship", "crafts", "mermaids", "singing"],
    "9-12": ["volleyball", "fashion", "horses", "friendship", "writing stories", "dance", "gymnastics", "crafts"],
  },
  boy: {
    "0-2": ["trucks", "trains", "balls", "cars", "puppies", "dinosaurs", "tools", "blocks"],
    "3-5": ["superheroes", "pirates", "fire trucks", "knights", "monsters", "ninjas", "race cars", "tools"],
    "6-8": ["superheroes", "ninjas", "pirates", "skateboards", "minecraft-style worlds", "soccer", "knights", "dragons"],
    "9-12": ["skateboarding", "video games", "basketball", "parkour", "cars", "robots", "guitar", "fishing"],
  },
};

function buildPool(age: AgeRange, gender: string): string[] {
  const base = BASE_BY_AGE[age] ?? BASE_BY_AGE["3-5"];
  const boost =
    gender && (gender === "girl" || gender === "boy")
      ? BOOST_BY_GENDER[gender as Gender]?.[age] ?? []
      : [];
  // De-dupe while preserving order: boost first so flavor leads.
  const seen = new Set<string>();
  const ordered = [...boost, ...base].filter((w) => {
    const k = w.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return ordered;
}

function parseEntered(text: string): Set<string> {
  return new Set(
    text
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function appendInterest(text: string, word: string): string {
  const trimmed = text.replace(/\s+$/, "");
  if (trimmed.length === 0) return word;
  if (trimmed.endsWith(",")) return `${trimmed} ${word}`;
  return `${trimmed}, ${word}`;
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

  // Filter out anything already typed in (case-insensitive), then take the first 10.
  const visibleChips = useMemo(() => {
    const entered = parseEntered(value);
    return pool.filter((w) => !entered.has(w.toLowerCase())).slice(0, 10);
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
              {visibleChips.map((word) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => addChip(word)}
                  className="rounded-full px-5 py-2.5 text-base font-medium transition-all hover:shadow-md hover:-translate-y-0.5"
                  style={{
                    backgroundColor: "hsl(var(--wizard-primary) / 0.10)",
                    color: "hsl(var(--wizard-primary))",
                  }}
                >
                  {word}
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
