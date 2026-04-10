import { useEffect, useRef } from "react";
import WizardShell from "@/components/WizardShell";
import { useWizard } from "@/contexts/WizardContext";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "dropdown";
  options?: string[];
  placeholder?: string;
}

interface CategoryDef {
  value: string;
  emoji: string;
  label: string;
  fields: FieldDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    value: "stuffed-animal", emoji: "🧸", label: "Stuffed Animal",
    fields: [
      { key: "name", label: "What's its name?", type: "text", placeholder: "e.g. Flopsy" },
      { key: "animalType", label: "What kind of animal?", type: "text", placeholder: "e.g. Bunny" },
      { key: "color", label: "Color", type: "text", placeholder: "e.g. Purple" },
    ],
  },
  {
    value: "pet", emoji: "🐕", label: "Pet",
    fields: [
      { key: "name", label: "Pet's name", type: "text", placeholder: "e.g. Max" },
      { key: "petType", label: "Type of pet", type: "dropdown", options: ["Dog", "Cat", "Fish", "Bird", "Hamster", "Rabbit", "Other"] },
      { key: "color", label: "Color / markings", type: "text", placeholder: "e.g. Golden with white paws" },
    ],
  },
  {
    value: "doll", emoji: "🧍", label: "Doll or Action Figure",
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "e.g. Captain Zoom" },
      { key: "description", label: "What does it look like?", type: "text", placeholder: "e.g. A space ranger with a silver helmet" },
    ],
  },
  {
    value: "toy-vehicle", emoji: "🚗", label: "Toy Vehicle",
    fields: [
      { key: "type", label: "Type of vehicle", type: "text", placeholder: "e.g. Fire truck" },
      { key: "color", label: "Color", type: "text", placeholder: "e.g. Red" },
    ],
  },
  {
    value: "ball-sports", emoji: "⚽", label: "Ball / Sports Item",
    fields: [
      { key: "type", label: "What sport / type?", type: "text", placeholder: "e.g. Soccer ball" },
    ],
  },
  {
    value: "blanket", emoji: "🛏️", label: "Blanket or Comfort Item",
    fields: [
      { key: "name", label: "Does it have a name?", type: "text", placeholder: "e.g. Blankie" },
      { key: "color", label: "Color / pattern", type: "text", placeholder: "e.g. Blue with stars" },
    ],
  },
  {
    value: "bike-scooter", emoji: "🛴", label: "Bike, Scooter, or Skateboard",
    fields: [
      { key: "type", label: "Which one?", type: "text", placeholder: "e.g. Pink scooter" },
      { key: "color", label: "Color", type: "text", placeholder: "e.g. Pink with streamers" },
    ],
  },
  {
    value: "instrument", emoji: "🎸", label: "Musical Instrument",
    fields: [
      { key: "type", label: "What instrument?", type: "text", placeholder: "e.g. Ukulele" },
    ],
  },
  {
    value: "book", emoji: "📖", label: "Book",
    fields: [
      { key: "title", label: "Title or topic", type: "text", placeholder: "e.g. A book about dinosaurs" },
    ],
  },
  {
    value: "cape-costume", emoji: "👑", label: "Superhero Cape or Costume",
    fields: [
      { key: "character", label: "What character / type?", type: "text", placeholder: "e.g. A dragon knight" },
      { key: "color", label: "Color", type: "text", placeholder: "e.g. Red and gold" },
    ],
  },
  {
    value: "backpack", emoji: "🎒", label: "Backpack or Bag",
    fields: [
      { key: "color", label: "Color / design", type: "text", placeholder: "e.g. Blue with rockets" },
    ],
  },
  {
    value: "hat-clothing", emoji: "🧢", label: "Hat or Clothing Item",
    fields: [
      { key: "type", label: "What is it?", type: "text", placeholder: "e.g. A rainbow tutu" },
      { key: "color", label: "Color", type: "text", placeholder: "e.g. Rainbow" },
    ],
  },
  {
    value: "building-toy", emoji: "🧩", label: "Building Toy / Playset",
    fields: [
      { key: "description", label: "What do they build?", type: "text", placeholder: "e.g. A castle made of blocks" },
    ],
  },
  {
    value: "art-supplies", emoji: "🎨", label: "Art Supplies",
    fields: [
      { key: "type", label: "What kind?", type: "text", placeholder: "e.g. Crayons and a sketchbook" },
    ],
  },
  {
    value: "food", emoji: "🍕", label: "Food",
    fields: [
      { key: "food", label: "What food?", type: "text", placeholder: "e.g. Pizza" },
    ],
  },
  {
    value: "plant", emoji: "🪴", label: "Plant or Flower",
    fields: [
      { key: "type", label: "What kind?", type: "text", placeholder: "e.g. Sunflower" },
    ],
  },
  {
    value: "jewelry", emoji: "💎", label: "Jewelry or Accessory",
    fields: [
      { key: "type", label: "What is it?", type: "text", placeholder: "e.g. A sparkly bracelet" },
      { key: "color", label: "Color", type: "text", placeholder: "e.g. Silver" },
    ],
  },
  {
    value: "night-light", emoji: "🌙", label: "Night Light or Lamp",
    fields: [
      { key: "description", label: "What does it look like?", type: "text", placeholder: "e.g. A glowing moon" },
    ],
  },
  {
    value: "toy-animal", emoji: "🦕", label: "Toy Animal / Figurine",
    fields: [
      { key: "name", label: "Does it have a name?", type: "text", placeholder: "e.g. Rex" },
      { key: "type", label: "What kind?", type: "text", placeholder: "e.g. T-Rex" },
      { key: "color", label: "Color", type: "text", placeholder: "e.g. Green" },
    ],
  },
  {
    value: "other-toy", emoji: "🎁", label: "Other Toy",
    fields: [
      { key: "description", label: "Describe it", type: "text", placeholder: "e.g. A kaleidoscope" },
    ],
  },
];

export default function Step5() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = (answers.childName as string) || "your child";
  const specialThing = (answers.specialThing as { category: string; details: Record<string, string> } | null) ?? null;
  const followUpRef = useRef<HTMLDivElement>(null);

  const selectedCategory = specialThing?.category ?? null;
  const details = specialThing?.details ?? {};

  useEffect(() => {
    setCanContinue(true);
  }, [setCanContinue]);

  const selectCategory = (value: string) => {
    if (selectedCategory === value) {
      setAnswer("specialThing", null);
    } else {
      setAnswer("specialThing", { category: value, details: {} });
      setTimeout(() => followUpRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    }
  };

  const setDetail = (key: string, value: string) => {
    setAnswer("specialThing", {
      category: selectedCategory!,
      details: { ...details, [key]: value },
    });
  };

  const activeCategoryDef = CATEGORIES.find((c) => c.value === selectedCategory);

  const cardClass = (selected: boolean) =>
    `cursor-pointer rounded-2xl p-4 text-left transition-all border-2 shadow-sm ${
      selected
        ? "border-[hsl(var(--wizard-primary))] bg-[hsl(var(--wizard-primary)/0.08)]"
        : "border-transparent bg-white hover:shadow-md"
    }`;

  return (
    <WizardShell>
      <div className="space-y-8">
        {/* Heading */}
        <div className="text-center space-y-2">
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold"
            style={{ color: "hsl(var(--wizard-primary))" }}
          >
            Got a secret ingredient?
          </h1>
          <p className="text-muted-foreground text-lg">
            Is there something specific — a toy, a pet, a person, a place — that we should weave into {name}'s story? This is optional, but it's where the real magic happens.
          </p>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => selectCategory(cat.value)}
              className={cardClass(selectedCategory === cat.value)}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span
                className="block text-base font-semibold mt-1"
                style={{ color: "hsl(var(--wizard-primary))" }}
              >
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Follow-up fields */}
        {activeCategoryDef && (
          <div ref={followUpRef} className="space-y-4 animate-fade-in">
            <h2
              className="text-lg font-semibold text-center"
              style={{ color: "hsl(var(--wizard-primary))" }}
            >
              Tell us about the {activeCategoryDef.label.toLowerCase()}
            </h2>
            {activeCategoryDef.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <label className="block text-sm font-medium text-muted-foreground">
                  {field.label}
                </label>
                {field.type === "dropdown" ? (
                  <Select
                    value={details[field.key] || ""}
                    onValueChange={(v) => setDetail(field.key, v)}
                  >
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Choose one…" />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options!.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="rounded-xl"
                    placeholder={field.placeholder}
                    value={details[field.key] || ""}
                    onChange={(e) => setDetail(field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Note */}
        <p className="text-center text-sm text-muted-foreground italic">
          This becomes a cameo in the story — a moment that only {name}'s book will have.
        </p>
      </div>
    </WizardShell>
  );
}
