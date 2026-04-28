import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWizard } from "@/contexts/WizardContext";


import { Check, LayoutGrid, Columns2, AlignVerticalJustifyCenter } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import WizardHeader from "@/components/WizardHeader";


const ART_COLORS: Record<string, string> = {
  watercolor: "100 52% 20%",
  cartoon: "100 52% 20%",
  pastel: "100 52% 20%",
  realistic: "100 52% 20%",
};

/* ── Label lookup maps for the recap card ─────────────────── */

const AGE_LABEL: Record<string, string> = {
  "0-2": "0–2",
  "3-5": "3–5",
  "6-8": "6–8",
  "9-12": "9–12",
};

const GENRE_LABEL: Record<string, string> = {
  adventure: "Adventure",
  fantasy: "Fantasy",
  "sci-fi": "Sci-Fi / Space",
  mystery: "Mystery",
  everyday: "Everyday Life",
  bedtime: "Bedtime",
  sports: "Sports",
  "fairy-tale": "Fairy Tale",
  animals: "Animals / Nature",
  superhero: "Superhero",
};

const MOOD_LABEL: Record<string, string> = {
  funny: "Funny",
  heartwarming: "Heartwarming",
  calm: "Calm",
  whimsical: "Whimsical",
  brave: "Brave",
  mysterious: "Mysterious",
};

const LESSON_LABEL: Record<string, string> = {
  courage: "Courage",
  kindness: "Kindness",
  resilience: "Resilience",
  friendship: "Friendship",
  curiosity: "Curiosity",
  "self-confidence": "Self-confidence",
  sharing: "Sharing & generosity",
  nature: "Caring for nature",
  empathy: "Empathy",
  "just-fun": "Just for fun",
};

const INTEREST_INFO: Record<string, { emoji: string; label: string }> = {
  dinosaurs: { emoji: "🦕", label: "Dinosaurs" },
  dogs: { emoji: "🐶", label: "Dogs" },
  cats: { emoji: "🐱", label: "Cats" },
  "farm-animals": { emoji: "🐄", label: "Farm Animals" },
  "bugs-butterflies": { emoji: "🦋", label: "Bugs & Butterflies" },
  pirates: { emoji: "🏴‍☠️", label: "Pirates" },
  superheroes: { emoji: "🦸", label: "Superheroes" },
  unicorns: { emoji: "🦄", label: "Unicorns" },
  dragons: { emoji: "🐉", label: "Dragons" },
  "mermaids-magic": { emoji: "🧜", label: "Mermaids & Magic" },
  trains: { emoji: "🚂", label: "Trains" },
  "cars-trucks": { emoji: "🚗", label: "Cars & Trucks" },
  "bikes-scooters": { emoji: "🛴", label: "Bikes & Scooters" },
  planes: { emoji: "✈️", label: "Planes" },
  "construction-trucks": { emoji: "🚜", label: "Construction Trucks" },
  soccer: { emoji: "⚽", label: "Soccer" },
  basketball: { emoji: "🏀", label: "Basketball" },
  swimming: { emoji: "🏊", label: "Swimming" },
  gymnastics: { emoji: "🤸", label: "Gymnastics" },
  "dancing-ballet": { emoji: "💃", label: "Dancing/Ballet" },
  "art-drawing": { emoji: "🎨", label: "Art & Drawing" },
  music: { emoji: "🎵", label: "Music" },
  "reading-books": { emoji: "📚", label: "Reading & Books" },
  "building-lego": { emoji: "🧱", label: "Building/LEGO" },
  "science-experiments": { emoji: "🔬", label: "Science & Experiments" },
  "camping-outdoors": { emoji: "🏕️", label: "Camping & Outdoors" },
  "snow-winter": { emoji: "❄️", label: "Snow & Winter" },
  "rainbows-colors": { emoji: "🌈", label: "Rainbows & Colors" },
  "space-stars": { emoji: "🌟", label: "Space & Stars" },
  "robots-machines": { emoji: "🤖", label: "Robots & Machines" },
};

const SPECIAL_THING_INFO: Record<string, { emoji: string; label: string }> = {
  "stuffed-animal": { emoji: "🧸", label: "Stuffed Animal" },
  pet: { emoji: "🐕", label: "Pet" },
  doll: { emoji: "🧍", label: "Doll or Action Figure" },
  "toy-vehicle": { emoji: "🚗", label: "Toy Vehicle" },
  blanket: { emoji: "🛏️", label: "Blanket or Comfort Item" },
  clothing: { emoji: "👑", label: "Clothing or Accessory" },
  sports: { emoji: "⚽", label: "Sports or Outdoor Gear" },
  instrument: { emoji: "🎸", label: "Musical Instrument" },
  food: { emoji: "🍕", label: "Food" },
};

function formatSpecialThing(st: any): string | null {
  if (!st || !st.category) return null;
  const info = SPECIAL_THING_INFO[st.category];
  if (!info) return null;
  const d = st.details || {};
  // Pick the best descriptive detail: prefer name, then food, then any text field
  const detail =
    d.name ||
    d.food ||
    d.description ||
    d.breed ||
    d.color ||
    d.animalType ||
    d.dollType ||
    d.vehicleType ||
    d.clothingType ||
    d.instrumentType ||
    d.sport ||
    d.pattern ||
    "";
  return detail ? `${info.emoji} ${info.label} — ${detail}` : `${info.emoji} ${info.label}`;
}

function formatCharacters(answers: Record<string, any>): string | null {
  const parts: string[] = [];
  const proto = answers.protagonist;
  const protoName = (proto?.name || answers.childName || "").trim();
  if (protoName) parts.push(`${protoName} ★`);

  const supporting = (answers.supportingCharacters as any[]) || [];
  for (const c of supporting) {
    const rel =
      c.relationship === "Other"
        ? (c.relationshipOther || "Other").trim()
        : (c.relationship || "").trim();
    const nm = c.surpriseName ? "" : (c.name || "").trim();
    if (nm && rel) parts.push(`${rel} (${nm})`);
    else if (nm) parts.push(nm);
    else if (rel) parts.push(rel);
  }
  return parts.length ? parts.join(" · ") : null;
}

/* ── Recap row helper ─────────────────────────────────────── */

function SummaryRow({
  label,
  children,
  artHsl,
}: {
  label: string;
  children: React.ReactNode;
  artHsl: string;
}) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3 items-baseline py-1.5">
      <span
        className="text-[10px] uppercase tracking-widest font-semibold"
        style={{ color: `hsl(${artHsl} / 0.7)` }}
      >
        {label}
      </span>
      <div
        className="text-sm leading-snug"
        style={{ color: "hsl(var(--wizard-primary) / 0.9)" }}
      >
        {children}
      </div>
    </div>
  );
}

type Plan = "digital" | "hardcover";

const DIGITAL_FEATURES = [
  "Full illustrated eBook (PDF)",
  "Delivered instantly by email",
  "Shareable gift link",
  "Print it yourself anytime",
];

const HARDCOVER_FEATURES = [
  "Everything in Digital",
  "Premium hardcover, printed & shipped",
  "Ships in 5–7 business days",
  "Free digital copy included",
];

function CoverPage({
  layout,
  title,
  name,
  artHsl,
  coverImage,
}: {
  layout: string;
  title: string;
  name: string;
  artHsl: string;
  coverImage?: string;
}) {
  const bg = `hsl(${artHsl} / 0.2)`;
  const accent = `hsl(${artHsl})`;

  // If we have an AI-generated cover, show it full-bleed.
  if (coverImage) {
    return (
      <div className="relative h-full w-full">
        <img
          src={coverImage}
          alt={`Cover of ${title}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  if (layout === "bold-title") {
    return (
      <div className="flex h-full">
        <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: bg }}>
          <div className="w-16 h-20 rounded-lg" style={{ backgroundColor: accent, opacity: 0.5 }} />
        </div>
        <div className="w-1/2 flex flex-col items-center justify-center p-4 gap-2">
          <p className="text-lg font-bold text-center font-serif leading-tight" style={{ color: accent }}>{title}</p>
          <p className="text-xs" style={{ color: `hsl(${artHsl} / 0.6)` }}>A story for {name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: bg }}>
        <div className="w-20 h-24 rounded-lg" style={{ backgroundColor: accent, opacity: 0.5 }} />
      </div>
      <div className="p-4 text-center">
        <p className="text-base font-bold font-serif" style={{ color: accent }}>{title}</p>
        <p className="text-xs mt-1" style={{ color: `hsl(${artHsl} / 0.6)` }}>A story for {name}</p>
      </div>
    </div>
  );
}

function StoryPage({ name, artHsl }: { name: string; artHsl: string }) {
  return (
    <div className="flex flex-col h-full p-5 gap-3">
      <div className="h-2/5 rounded-lg flex items-center justify-center" style={{ backgroundColor: `hsl(${artHsl} / 0.15)` }}>
        <div className="w-16 h-12 rounded" style={{ backgroundColor: `hsl(${artHsl} / 0.35)` }} />
      </div>
      <div className="flex-1 flex flex-col gap-2 pt-2">
        <p className="text-[11px] font-serif leading-relaxed" style={{ color: `hsl(${artHsl} / 0.85)` }}>
          {name} stepped softly into the clearing, eyes wide with wonder. The trees seemed to whisper a secret meant just for them — and somewhere deep in the woods, a tiny light began to glow…
        </p>
      </div>
    </div>
  );
}


export default function Step11() {
  const { answers } = useWizard();
  const navigate = useNavigate();
  const name = answers.childName || "your little one";
  const concept = answers.selectedConcept || {};
  const title = concept.title || answers.bookTitle || `${name}'s Adventure`;
  const approvedSummary: string | undefined = concept.summary;
  const coverImage: string | undefined = concept.coverImage;
  const initialLayout = answers.coverLayout || "full-illustration";
  const [layout, setLayout] = useState<string>(initialLayout);
  const artStyle = answers.artStyle || "watercolor";
  const artHsl = ART_COLORS[artStyle] || ART_COLORS.watercolor;

  const [selected, setSelected] = useState<Plan>("hardcover");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const price = selected === "digital" ? "$9.99" : "$44.99";
  const planLabel = selected === "digital" ? "Digital Book" : "Printed Hardcover + Digital";


  if (orderPlaced) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[100dvh] px-4 text-center"
        style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
      >
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "hsl(var(--wizard-primary))" }}>
          Your book is on its way!
        </h1>
        <p className="text-muted-foreground mb-1">
          {planLabel} — {price}
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          We'll send everything to your inbox shortly.
        </p>
        <button
          onClick={() => navigate("/step/1")}
          className="text-sm font-medium underline"
          style={{ color: "hsl(var(--wizard-primary))" }}
        >
          ← Back to start
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col min-h-[100dvh]"
      style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
    >
      <WizardHeader currentStep={10} />

      <div className="flex flex-col items-center px-4 py-8">
      {/* Heading */}
      <h1 className="font-heading md:text-3xl font-bold text-center mb-1 text-4xl text-[#2b4e18]">
        {name}'s book is ready. ✨
      </h1>
      <p className="text-sm text-center mb-8" style={{ color: "hsl(var(--wizard-primary) / 0.6)" }}>
        Preview the book and choose how you'd like it delivered.
      </p>

      {/* Two-column layout */}
      <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* Preview column */}
        <div className="flex flex-col items-center gap-5">
          {/* Cover + first page side-by-side */}
          <div className="w-full flex flex-row items-start justify-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                Cover
              </p>
              <div
                className="rounded-2xl overflow-hidden shadow-lg bg-white"
                style={{ aspectRatio: "2/3", width: 180 }}
              >
                <CoverPage layout={layout} title={title} name={name} artHsl={artHsl} coverImage={coverImage} />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                First page
              </p>
              <div
                className="rounded-2xl overflow-hidden shadow-lg bg-white"
                style={{ aspectRatio: "2/3", width: 180 }}
              >
                <StoryPage name={name} artHsl={artHsl} />
              </div>
            </div>
          </div>

          {/* Plot summary */}
          <div
            className="w-full max-w-sm rounded-2xl p-5 border"
            style={{
              backgroundColor: `hsl(${artHsl} / 0.08)`,
              borderColor: `hsl(${artHsl} / 0.2)`,
            }}
          >
            <p
              className="text-[10px] uppercase tracking-widest mb-2 font-semibold"
              style={{ color: `hsl(${artHsl})` }}
            >
              The Story
            </p>
            <p
              className="text-sm font-serif leading-relaxed whitespace-pre-wrap"
              style={{ color: "hsl(var(--wizard-primary) / 0.85)" }}
            >
              {approvedSummary ||
                `When ${name} discovers a mysterious glowing map hidden beneath the old oak tree, an unforgettable adventure begins. Together with new friends, ${name} journeys through enchanted forests, solves clever riddles, and learns that the greatest magic of all is courage, kindness, and believing in yourself.`}
            </p>
          </div>

          {/* Your story details recap */}
          {(() => {
            const ageLabel = AGE_LABEL[answers.ageRange as string];
            const genreLabel = GENRE_LABEL[answers.genre as string];
            const moodLabel = MOOD_LABEL[answers.mood as string];
            const lessonLabel = LESSON_LABEL[answers.lesson as string];
            const interests = (answers.interests as string[]) || [];
            const customInterest = (answers.customInterest as string)?.trim();
            const specialThing = formatSpecialThing(answers.specialThing);
            const charactersLine = formatCharacters(answers);

            const storyTypeBits = [genreLabel, moodLabel].filter(Boolean);
            const storyTypeLine = storyTypeBits.length ? storyTypeBits.join(" · ") : null;

            const placeholder = (
              <span className="italic opacity-50">Not chosen</span>
            );

            return (
              <div
                className="w-full max-w-sm rounded-2xl p-5 border"
                style={{
                  backgroundColor: `hsl(${artHsl} / 0.08)`,
                  borderColor: `hsl(${artHsl} / 0.2)`,
                }}
              >
                <p
                  className="text-[10px] uppercase tracking-widest mb-3 font-semibold"
                  style={{ color: `hsl(${artHsl})` }}
                >
                  Your story details
                </p>

                <div className="divide-y" style={{ borderColor: `hsl(${artHsl} / 0.15)` }}>
                  <SummaryRow label="Age range" artHsl={artHsl}>
                    {ageLabel || placeholder}
                  </SummaryRow>

                  <SummaryRow label="Story type" artHsl={artHsl}>
                    {storyTypeLine || placeholder}
                  </SummaryRow>

                  <SummaryRow label="Life lesson" artHsl={artHsl}>
                    {lessonLabel || placeholder}
                  </SummaryRow>

                  <SummaryRow label="Interests" artHsl={artHsl}>
                    {interests.length > 0 || customInterest ? (
                      <div className="flex flex-wrap gap-1.5">
                        {interests.map((v) => {
                          const info = INTEREST_INFO[v];
                          if (!info) return null;
                          return (
                            <span
                              key={v}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `hsl(${artHsl} / 0.18)`,
                                color: "hsl(var(--wizard-primary))",
                              }}
                            >
                              <span>{info.emoji}</span>
                              <span>{info.label}</span>
                            </span>
                          );
                        })}
                        {customInterest && (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `hsl(${artHsl} / 0.18)`,
                              color: "hsl(var(--wizard-primary))",
                            }}
                          >
                            <span>✍️</span>
                            <span>{customInterest}</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      placeholder
                    )}
                  </SummaryRow>

                  {/* Favorite thing row hidden — Secret Ingredient step disabled */}

                  <SummaryRow label="Characters" artHsl={artHsl}>
                    {charactersLine || placeholder}
                  </SummaryRow>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Checkout column */}
        <div className="flex flex-col">
          <div className="flex flex-col gap-4 mb-6">
            {/* Digital */}
            <button
              type="button"
              onClick={() => setSelected("digital")}
              className="relative text-left rounded-2xl border-2 p-5 transition-all"
              style={{
                borderColor: selected === "digital" ? "hsl(var(--wizard-primary))" : "hsl(var(--border))",
                boxShadow: selected === "digital" ? "0 0 0 2px hsl(var(--wizard-primary) / 0.25)" : "none",
                backgroundColor: "hsl(var(--card))",
              }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <span className="font-semibold">Digital Book</span>
                  <span className="ml-2 text-xs text-muted-foreground">Instant delivery</span>
                </div>
                <span className="text-lg font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>$9.99</span>
              </div>
              <ul className="space-y-1.5">
                {DIGITAL_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--wizard-primary))" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </button>

            {/* Hardcover */}
            <button
              type="button"
              onClick={() => setSelected("hardcover")}
              className="relative text-left rounded-2xl border-2 p-5 transition-all"
              style={{
                borderColor: selected === "hardcover" ? "hsl(45 93% 58%)" : "hsl(45 93% 58% / 0.4)",
                boxShadow: selected === "hardcover" ? "0 0 0 2px hsl(45 93% 58% / 0.3)" : "none",
                backgroundColor: "hsl(var(--card))",
              }}
            >
              <span
                className="absolute -top-3 right-4 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: "hsl(45 93% 58%)", color: "hsl(45 93% 20%)" }}
              >
                ⭐ Most popular
              </span>

              <div className="flex items-baseline justify-between mb-3 mt-1">
                <div>
                  <span className="font-semibold">Printed Hardcover + Digital</span>
                </div>
                <span className="text-lg font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>$44.99</span>
              </div>
              <ul className="space-y-1.5">
                {HARDCOVER_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--wizard-primary))" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground mb-6">
            <span>🔒 Secure checkout</span>
            <span>💳 All major cards accepted</span>
            <span>📦 Free shipping to the US</span>
          </div>

          {/* Order form */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setOrderPlaced(true)}
              className="w-full h-12 rounded-full text-base font-semibold transition-opacity"
              style={{ backgroundColor: "#2B4E18", color: "#fff" }}
            >
              Place Order
            </button>
            <div
              className="mt-2 rounded-2xl p-4 border flex gap-3 items-start"
              style={{
                backgroundColor: "#2B4E18" + "14",
                borderColor: "#2B4E18" + "33",
              }}
            >
              <span className="text-xl leading-none">✏️</span>
              <p className="text-sm leading-relaxed" style={{ color: "#2B4E18" }}>
                <span className="font-semibold">You'll get to review your book before it's actually sent to you.</span> After checkout, preview every page and request edits or revisions before it's finalized.
              </p>
            </div>
          </div>

          {/* Testimonial */}
          <figure
            className="mt-8 rounded-2xl p-5 border"
            style={{
              backgroundColor: `hsl(${artHsl} / 0.08)`,
              borderColor: `hsl(${artHsl} / 0.2)`,
            }}
          >
            <span
              className="block text-2xl leading-none mb-2 font-serif"
              style={{ color: `hsl(${artHsl})` }}
              aria-hidden="true"
            >
              “
            </span>
            <blockquote
              className="text-sm md:text-base font-serif italic leading-relaxed"
              style={{ color: "hsl(var(--wizard-primary) / 0.9)" }}
            >
              She opened the first page and whispered, "Grandma, it's me." I still can't stop thinking about that moment.
            </blockquote>
            <figcaption
              className="mt-3 text-xs font-medium"
              style={{ color: "hsl(var(--wizard-primary) / 0.65)" }}
            >
              — Carol, grandmother
            </figcaption>
          </figure>
        </div>
      </div>
      </div>
    </div>
  );
}
