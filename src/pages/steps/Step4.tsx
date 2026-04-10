import { useEffect, useState, useRef } from "react";
import WizardShell from "@/components/WizardShell";
import { useWizard } from "@/contexts/WizardContext";

const CATEGORIES = [
  {
    label: "🐾 Animals & Nature",
    items: [
      { value: "dinosaurs", label: "🦕 Dinosaurs" },
      { value: "dogs", label: "🐶 Dogs" },
      { value: "cats", label: "🐱 Cats" },
      { value: "horses", label: "🐴 Horses" },
      { value: "ocean-mermaids", label: "🧜 Ocean & Mermaids" },
      { value: "farm-animals", label: "🐄 Farm Animals" },
      { value: "zoo-animals", label: "🦁 Zoo Animals" },
      { value: "bugs-butterflies", label: "🦋 Bugs & Butterflies" },
    ],
  },
  {
    label: "🚀 Adventure & Fantasy",
    items: [
      { value: "space-stars", label: "🌟 Space & Stars" },
      { value: "pirates", label: "🏴‍☠️ Pirates" },
      { value: "superheroes", label: "🦸 Superheroes" },
      { value: "princesses-castles", label: "👑 Princesses & Castles" },
      { value: "unicorns", label: "🦄 Unicorns" },
      { value: "dragons", label: "🐉 Dragons" },
      { value: "fairies-magic", label: "🧚 Fairies & Magic" },
      { value: "ninjas", label: "🥷 Ninjas" },
      { value: "treasure-hunting", label: "💎 Treasure Hunting" },
    ],
  },
  {
    label: "🚗 Vehicles & Things That Go",
    items: [
      { value: "trains", label: "🚂 Trains" },
      { value: "cars-trucks", label: "🚗 Cars & Trucks" },
      { value: "bikes-scooters", label: "🛴 Bikes & Scooters" },
    ],
  },
  {
    label: "⚽ Sports & Active Play",
    items: [
      { value: "soccer", label: "⚽ Soccer" },
      { value: "basketball", label: "🏀 Basketball" },
      { value: "baseball", label: "⚾ Baseball" },
      { value: "swimming", label: "🏊 Swimming" },
      { value: "gymnastics", label: "🤸 Gymnastics" },
      { value: "martial-arts", label: "🥋 Martial Arts" },
      { value: "dancing-ballet", label: "💃 Dancing/Ballet" },
    ],
  },
  {
    label: "🎨 Creative & Learning",
    items: [
      { value: "art-drawing", label: "🎨 Art & Drawing" },
      { value: "music", label: "🎵 Music" },
      { value: "reading-books", label: "📚 Reading & Books" },
      { value: "science-experiments", label: "🔬 Science & Experiments" },
      { value: "cooking-baking", label: "🧁 Cooking & Baking" },
      { value: "building-lego", label: "🧱 Building/LEGO" },
      { value: "robots-machines", label: "🤖 Robots & Machines" },
    ],
  },
  {
    label: "🌈 Vibes & Worlds",
    items: [
      { value: "camping-outdoors", label: "🏕️ Camping & Outdoors" },
      { value: "gardening-flowers", label: "🌸 Gardening & Flowers" },
      { value: "snow-winter", label: "❄️ Snow & Winter" },
      { value: "rainbows-colors", label: "🌈 Rainbows & Colors" },
    ],
  },
];

const COMBO_SENTENCES: Record<string, string> = {
  "dinosaurs+space-stars": "{name} zooms past the rings of Saturn on a dinosaur-back…",
  "pirates+dragons": "{name} sails the seven seas with a fire-breathing first mate…",
  "unicorns+fairies-magic": "{name} gallops through an enchanted forest of shimmering spells…",
  "superheroes+robots-machines": "{name} builds a mega-robot suit and saves the city before bedtime…",
  "dogs+camping-outdoors": "{name} and a loyal pup set up camp under a sky full of stars…",
  "cooking-baking+dragons": "{name} bakes a cake so good even a dragon wants the recipe…",
  "space-stars+robots-machines": "{name} pilots a robot spaceship to the edge of the galaxy…",
  "princesses-castles+horses": "{name} rides a royal horse through a kingdom of wildflowers…",
  "ocean-mermaids+treasure-hunting": "{name} dives deep to find a sunken chest of glowing pearls…",
  "ninjas+martial-arts": "{name} trains in a secret mountain dojo with the world's sneakiest sensei…",
};

function getPreviewSentence(name: string, interests: string[]): string | null {
  if (interests.length < 2) return null;
  // Try all pairs
  for (let i = 0; i < interests.length; i++) {
    for (let j = i + 1; j < interests.length; j++) {
      const key1 = `${interests[i]}+${interests[j]}`;
      const key2 = `${interests[j]}+${interests[i]}`;
      if (COMBO_SENTENCES[key1]) return COMBO_SENTENCES[key1].replace("{name}", name);
      if (COMBO_SENTENCES[key2]) return COMBO_SENTENCES[key2].replace("{name}", name);
    }
  }
  // Fallback
  const allItems = CATEGORIES.flatMap((c) => c.items);
  const labels = interests.map((v) => allItems.find((i) => i.value === v)?.label.replace(/^[^\s]+\s/, "") ?? v);
  return `${name} discovers a world of ${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}…`;
}

export default function Step4() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = (answers.childName as string) || "your child";
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
      // Deselect oldest with shake
      const oldest = interests[0];
      setShaking(oldest);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShaking(null), 400);
      setAnswer("interests", [...interests.slice(1), value]);
    }
  };

  const preview = getPreviewSentence(name, interests);

  return (
    <WizardShell>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>
            What's {name}'s world like?
          </h1>
          <p className="text-muted-foreground text-lg">
            Pick 2–3 things they're obsessed with. These flavor the whole story.
          </p>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.label} className="space-y-2">
              <h2 className="text-sm font-medium text-muted-foreground">{cat.label}</h2>
              <div className="flex flex-wrap gap-2">
                {cat.items.map((item) => {
                  const selected = interests.includes(item.value);
                  const isShaking = shaking === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => toggle(item.value)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                        selected
                          ? "text-white border-transparent"
                          : "border-transparent bg-white hover:shadow-md"
                      } ${isShaking ? "animate-shake" : ""}`}
                      style={
                        selected
                          ? { backgroundColor: "hsl(var(--wizard-primary))", color: "#fff" }
                          : { color: "hsl(var(--wizard-primary))" }
                      }
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {preview && (
          <p className="text-center text-muted-foreground text-sm italic animate-fade-in">
            {preview}
          </p>
        )}
      </div>
    </WizardShell>
  );
}
