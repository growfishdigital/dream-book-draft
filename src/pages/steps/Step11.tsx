import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWizard } from "@/contexts/WizardContext";


import { Check, ChevronLeft } from "lucide-react";
import ProgressBar from "@/components/ProgressBar";


const ART_COLORS: Record<string, string> = {
  watercolor: "210 60% 70%",
  cartoon: "45 90% 60%",
  pastel: "320 40% 75%",
  realistic: "160 30% 45%",
};

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

function CoverPage({ layout, title, name, artHsl }: { layout: string; title: string; name: string; artHsl: string }) {
  const bg = `hsl(${artHsl} / 0.2)`;
  const accent = `hsl(${artHsl})`;

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
  const title = answers.bookTitle || `${name}'s Adventure`;
  const layout = answers.coverLayout || "full-illustration";
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
      className="flex flex-col items-center min-h-[100dvh] px-4 py-8 relative"
      style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
    >
      <button
        onClick={() => navigate("/step/10")}
        className="absolute top-4 left-4 p-2 rounded-xl transition-colors hover:bg-black/5 z-10"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" style={{ color: "hsl(var(--wizard-primary))" }} />
      </button>
      <button className="absolute top-4 right-4 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors hover:bg-black/5 z-10" style={{ color: "hsl(var(--wizard-primary))" }}>
        Save &amp; exit
      </button>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar currentStep={11} />
      </div>

      {/* Heading */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-1" style={{ color: "hsl(var(--wizard-primary))" }}>
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
                <CoverPage layout={layout} title={title} name={name} artHsl={artHsl} />
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
              className="text-sm font-serif leading-relaxed"
              style={{ color: "hsl(var(--wizard-primary) / 0.85)" }}
            >
              When {name} discovers a mysterious glowing map hidden beneath the old oak tree, an unforgettable adventure begins. Together with new friends, {name} journeys through enchanted forests, solves clever riddles, and learns that the greatest magic of all is courage, kindness, and believing in yourself.
            </p>
          </div>
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
        </div>
      </div>
    </div>
  );
}
