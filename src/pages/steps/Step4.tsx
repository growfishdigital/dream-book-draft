import { useEffect, useMemo, useState, useRef } from "react";
import WizardShell from "@/components/WizardShell";
import { Input } from "@/components/ui/input";
import { useWizard } from "@/contexts/WizardContext";
import { Check, X } from "lucide-react";

type AgeRange = "0-2" | "3-5" | "6-8" | "9-12";
const ALL_AGES: AgeRange[] = ["0-2", "3-5", "6-8", "9-12"];

interface InterestItem {
  value: string;
  label: string;
  emoji: string;
  ages: AgeRange[];
}

interface Category {
  label: string;
  items: InterestItem[];
}

const CATEGORIES: Category[] = [
  {
    label: "🐾 Animals & Nature",
    items: [
      { value: "dinosaurs", label: "Dinosaurs", emoji: "🦕", ages: ["3-5", "6-8", "9-12"] },
      { value: "dogs", label: "Dogs", emoji: "🐶", ages: ALL_AGES },
      { value: "cats", label: "Cats", emoji: "🐱", ages: ALL_AGES },
      { value: "horses", label: "Horses", emoji: "🐴", ages: ["3-5", "6-8", "9-12"] },
      { value: "farm-animals", label: "Farm Animals", emoji: "🐄", ages: ["0-2", "3-5", "6-8"] },
      { value: "bugs-butterflies", label: "Bugs & Butterflies", emoji: "🦋", ages: ["0-2", "3-5", "6-8"] },
    ],
  },
  {
    label: "🚀 Adventure & Fantasy",
    items: [
      { value: "pirates", label: "Pirates", emoji: "🏴‍☠️", ages: ["3-5", "6-8", "9-12"] },
      { value: "superheroes", label: "Superheroes", emoji: "🦸", ages: ["3-5", "6-8", "9-12"] },
      { value: "princesses-castles", label: "Princesses & Castles", emoji: "👑", ages: ["3-5", "6-8"] },
      { value: "unicorns", label: "Unicorns", emoji: "🦄", ages: ["3-5", "6-8"] },
      { value: "dragons", label: "Dragons", emoji: "🐉", ages: ["3-5", "6-8", "9-12"] },
      { value: "mermaids-magic", label: "Mermaids & Magic", emoji: "🧜", ages: ["3-5", "6-8"] },
    ],
  },
  {
    label: "🚗 Vehicles & Things That Go",
    items: [
      { value: "trains", label: "Trains", emoji: "🚂", ages: ["0-2", "3-5", "6-8"] },
      { value: "cars-trucks", label: "Cars & Trucks", emoji: "🚗", ages: ["0-2", "3-5", "6-8"] },
      { value: "bikes-scooters", label: "Bikes & Scooters", emoji: "🛴", ages: ["3-5", "6-8", "9-12"] },
      { value: "planes", label: "Planes", emoji: "✈️", ages: ["0-2", "3-5", "6-8", "9-12"] },
      { value: "boats-ships", label: "Boats & Ships", emoji: "⛵", ages: ["0-2", "3-5", "6-8", "9-12"] },
      { value: "construction-trucks", label: "Construction Trucks", emoji: "🚜", ages: ["0-2", "3-5", "6-8"] },
    ],
  },
  {
    label: "⚽ Sports & Active Play",
    items: [
      { value: "soccer", label: "Soccer", emoji: "⚽", ages: ["3-5", "6-8", "9-12"] },
      { value: "basketball", label: "Basketball", emoji: "🏀", ages: ["3-5", "6-8", "9-12"] },
      { value: "baseball", label: "Baseball", emoji: "⚾", ages: ["3-5", "6-8", "9-12"] },
      { value: "swimming", label: "Swimming", emoji: "🏊", ages: ["3-5", "6-8", "9-12"] },
      { value: "gymnastics", label: "Gymnastics", emoji: "🤸", ages: ["3-5", "6-8", "9-12"] },
      { value: "dancing-ballet", label: "Dancing/Ballet", emoji: "💃", ages: ALL_AGES },
    ],
  },
  {
    label: "🎨 Creative & Learning",
    items: [
      { value: "art-drawing", label: "Art & Drawing", emoji: "🎨", ages: ["3-5", "6-8", "9-12"] },
      { value: "music", label: "Music", emoji: "🎵", ages: ALL_AGES },
      { value: "reading-books", label: "Reading & Books", emoji: "📚", ages: ["3-5", "6-8", "9-12"] },
      { value: "cooking-baking", label: "Cooking & Baking", emoji: "🧁", ages: ["3-5", "6-8", "9-12"] },
      { value: "building-lego", label: "Building/LEGO", emoji: "🧱", ages: ["3-5", "6-8", "9-12"] },
      { value: "science-experiments", label: "Science & Experiments", emoji: "🔬", ages: ["6-8", "9-12"] },
    ],
  },
  {
    label: "🌈 Worlds & Wonders",
    items: [
      { value: "camping-outdoors", label: "Camping & Outdoors", emoji: "🏕️", ages: ["3-5", "6-8", "9-12"] },
      { value: "gardening-flowers", label: "Gardening & Flowers", emoji: "🌸", ages: ["0-2", "3-5", "6-8"] },
      { value: "snow-winter", label: "Snow & Winter", emoji: "❄️", ages: ALL_AGES },
      { value: "rainbows-colors", label: "Rainbows & Colors", emoji: "🌈", ages: ["0-2", "3-5"] },
      { value: "space-stars", label: "Space & Stars", emoji: "🌟", ages: ["3-5", "6-8", "9-12"] },
      { value: "robots-machines", label: "Robots & Machines", emoji: "🤖", ages: ["6-8", "9-12"] },
    ],
  },
];

const POPULAR_BY_AGE: Record<AgeRange, string[]> = {
  "0-2": ["farm-animals", "dogs", "cats", "bugs-butterflies", "rainbows-colors", "music"],
  "3-5": ["dinosaurs", "unicorns", "princesses-castles", "dogs", "space-stars", "cars-trucks"],
  "6-8": ["superheroes", "dragons", "space-stars", "soccer", "art-drawing", "science-experiments"],
  "9-12": ["building-lego", "cooking-baking", "science-experiments", "robots-machines", "reading-books", "art-drawing"],
};

const AGE_LABEL: Record<AgeRange, string> = {
  "0-2": "0–2",
  "3-5": "3–5",
  "6-8": "6–8",
  "9-12": "9–12",
};

const COMBO_SENTENCES: Record<string, string> = {
  "dinosaurs+space-stars": "{name} zooms past the rings of Saturn on a dinosaur-back…",
  "pirates+dragons": "{name} sails the seven seas with a fire-breathing first mate…",
  "unicorns+mermaids-magic": "{name} gallops through an enchanted forest of shimmering spells…",
  "superheroes+robots-machines": "{name} builds a mega-robot suit and saves the city before bedtime…",
  "dogs+camping-outdoors": "{name} and a loyal pup set up camp under a sky full of stars…",
  "cooking-baking+dragons": "{name} bakes a cake so good even a dragon wants the recipe…",
  "space-stars+robots-machines": "{name} pilots a robot spaceship to the edge of the galaxy…",
  "princesses-castles+horses": "{name} rides a royal horse through a kingdom of wildflowers…",
  "mermaids-magic+pirates": "{name} dives deep to find a sunken chest of glowing pearls…",
};

const ALL_ITEMS: InterestItem[] = CATEGORIES.flatMap((c) => c.items);

function findItem(value: string): InterestItem | undefined {
  return ALL_ITEMS.find((i) => i.value === value);
}

function getPreviewSentence(name: string, interests: string[]): string | null {
  if (interests.length < 2) return null;
  for (let i = 0; i < interests.length; i++) {
    for (let j = i + 1; j < interests.length; j++) {
      const key1 = `${interests[i]}+${interests[j]}`;
      const key2 = `${interests[j]}+${interests[i]}`;
      if (COMBO_SENTENCES[key1]) return COMBO_SENTENCES[key1].replace("{name}", name);
      if (COMBO_SENTENCES[key2]) return COMBO_SENTENCES[key2].replace("{name}", name);
    }
  }
  const labels = interests.map((v) => findItem(v)?.label ?? v);
  return `${name} discovers a world of ${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}…`;
}

interface InterestTileProps {
  item: InterestItem;
  selected: boolean;
  shaking: boolean;
  onClick: () => void;
}

function InterestTile({ item, selected, shaking, onClick }: InterestTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative h-24 w-full rounded-xl border-2 shadow-sm transition-all flex flex-col items-center justify-center gap-1 px-2 py-2 ${
        selected
          ? "bg-[hsl(var(--wizard-primary)/0.08)]"
          : "bg-white border-transparent hover:shadow-md hover:-translate-y-0.5"
      } ${shaking ? "animate-shake" : ""}`}
      style={selected ? { borderColor: "hsl(var(--wizard-primary))" } : undefined}
    >
      {selected && (
        <span
          className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "hsl(var(--wizard-primary))" }}
        >
          <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
        </span>
      )}
      <span className="text-2xl leading-none">{item.emoji}</span>
      <span
        className="text-xs sm:text-sm font-medium text-center leading-tight"
        style={{ color: "hsl(var(--wizard-primary))" }}
      >
        {item.label}
      </span>
    </button>
  );
}

export default function Step4() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = (answers.childName as string) || "your little one";
  const ageRange = (answers.ageRange as AgeRange | undefined) || undefined;
  const interests = (answers.interests as string[]) || [];
  const [shaking, setShaking] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setCanContinue(interests.length >= 2);
  }, [interests, setCanContinue]);

  const toggle = (value: string) => {
    if (interests.includes(value)) {
      setAnswer("interests", interests.filter((v) => v !== value));
    } else if (interests.length < 3) {
      setAnswer("interests", [...interests, value]);
    } else {
      const oldest = interests[0];
      setShaking(oldest);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShaking(null), 400);
      setAnswer("interests", [...interests.slice(1), value]);
    }
  };

  const remove = (value: string) => {
    setAnswer("interests", interests.filter((v) => v !== value));
  };

  // Age-filtered visible categories
  const visibleCategories = useMemo(() => {
    if (!ageRange) return CATEGORIES;
    return CATEGORIES
      .map((cat) => ({
        ...cat,
        items: cat.items.filter((i) => i.ages.includes(ageRange)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [ageRange]);

  const popularItems = useMemo(() => {
    if (!ageRange) return [];
    return POPULAR_BY_AGE[ageRange]
      .map((v) => findItem(v))
      .filter((x): x is InterestItem => Boolean(x));
  }, [ageRange]);

  const preview = getPreviewSentence(name, interests);
  const count = interests.length;
  const isFull = count === 3;

  return (
    <WizardShell>
      <div className="space-y-8 pb-32">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>
            What is {name} interested in?
          </h1>
          <p className="text-muted-foreground text-lg">
            Pick up to 3 — we'll weave these into the world of the story to make it feel like theirs.
          </p>
        </div>

        {/* Popular picks */}
        {ageRange && popularItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-medium text-muted-foreground text-base">
              ⭐ Popular picks for ages {AGE_LABEL[ageRange]}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {popularItems.map((item) => (
                <InterestTile
                  key={`pop-${item.value}`}
                  item={item}
                  selected={interests.includes(item.value)}
                  shaking={shaking === item.value}
                  onClick={() => toggle(item.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="space-y-6">
          {visibleCategories.map((cat) => (
            <div key={cat.label} className="space-y-3">
              <h2 className="font-medium text-muted-foreground text-base">{cat.label}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {cat.items.map((item) => (
                  <InterestTile
                    key={item.value}
                    item={item}
                    selected={interests.includes(item.value)}
                    shaking={shaking === item.value}
                    onClick={() => toggle(item.value)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Write-in interest */}
        <div className="space-y-2">
          <h2 className="font-medium text-muted-foreground text-base">✍️ Or write your own</h2>
          <Input
            placeholder='e.g. "volcanoes" or "making friendship bracelets"'
            value={(answers.customInterest as string) || ""}
            onChange={(e) => setAnswer("customInterest", e.target.value)}
            className="bg-white"
          />
          <p className="text-xs text-muted-foreground">
            ⚠️ Please don't reference copyrighted material (movies, TV shows, singers, brands, etc.) — we can't include them in your book.
          </p>
        </div>
      </div>

      {/* Persistent selection bar — sits above WizardShell footer (~88px) */}
      <div className="fixed left-0 right-0 bottom-[96px] z-20 px-4 pointer-events-none">
        <div className="max-w-[700px] mx-auto pointer-events-auto">
          <div
            className={`rounded-2xl border shadow-lg backdrop-blur-sm px-4 py-3 transition-colors ${
              isFull ? "bg-[hsl(var(--wizard-primary)/0.08)]" : "bg-white/95"
            }`}
            style={{ borderColor: isFull ? "hsl(var(--wizard-primary))" : "hsl(var(--border))" }}
          >
            {count === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                Pick 2–3 interests to bring the story to life
              </p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="text-sm font-semibold whitespace-nowrap"
                    style={{ color: "hsl(var(--wizard-primary))" }}
                  >
                    {isFull ? "Perfect — you're all set ✨" : `${count} of 3 selected`}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((v) => {
                      const item = findItem(v);
                      if (!item) return null;
                      return (
                        <span
                          key={v}
                          className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: "hsl(var(--wizard-primary))" }}
                        >
                          <span>{item.emoji}</span>
                          <span>{item.label}</span>
                          <button
                            type="button"
                            onClick={() => remove(v)}
                            className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/20"
                            aria-label={`Remove ${item.label}`}
                          >
                            <X className="w-3 h-3" strokeWidth={3} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
                {preview && (
                  <p className="text-xs italic text-muted-foreground">{preview}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
