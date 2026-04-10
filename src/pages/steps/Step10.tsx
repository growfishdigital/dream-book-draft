import { useNavigate } from "react-router-dom";
import { useWizard } from "@/contexts/WizardContext";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { Lock } from "lucide-react";

const TOTAL_STEPS = 11;

const ART_COLORS: Record<string, string> = {
  watercolor: "210 60% 70%",
  cartoon: "45 90% 60%",
  pastel: "320 40% 75%",
  realistic: "160 30% 45%",
};

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

function StoryPage1({ artHsl }: { artHsl: string }) {
  return (
    <div className="flex flex-col h-full p-5 gap-3">
      <div className="h-2/5 rounded-lg flex items-center justify-center" style={{ backgroundColor: `hsl(${artHsl} / 0.15)` }}>
        <div className="w-16 h-12 rounded" style={{ backgroundColor: `hsl(${artHsl} / 0.35)` }} />
      </div>
      <div className="flex-1 flex flex-col gap-2 pt-2">
        <div className="h-2.5 rounded-full w-full" style={{ backgroundColor: `hsl(${artHsl} / 0.12)` }} />
        <div className="h-2.5 rounded-full w-11/12" style={{ backgroundColor: `hsl(${artHsl} / 0.12)` }} />
        <div className="h-2.5 rounded-full w-9/12" style={{ backgroundColor: `hsl(${artHsl} / 0.12)` }} />
      </div>
    </div>
  );
}

function StoryPage2({ artHsl }: { artHsl: string }) {
  return (
    <div className="flex h-full p-5 gap-3">
      <div className="w-2/5 rounded-lg flex items-center justify-center" style={{ backgroundColor: `hsl(${artHsl} / 0.15)` }}>
        <div className="w-10 h-14 rounded" style={{ backgroundColor: `hsl(${artHsl} / 0.35)` }} />
      </div>
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="h-2.5 rounded-full w-full" style={{ backgroundColor: `hsl(${artHsl} / 0.12)` }} />
        <div className="h-2.5 rounded-full w-10/12" style={{ backgroundColor: `hsl(${artHsl} / 0.12)` }} />
        <div className="h-2.5 rounded-full w-full" style={{ backgroundColor: `hsl(${artHsl} / 0.12)` }} />
        <div className="h-2.5 rounded-full w-8/12" style={{ backgroundColor: `hsl(${artHsl} / 0.12)` }} />
      </div>
    </div>
  );
}

function DedicationPage({ dedication, artHsl }: { dedication: string; artHsl: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 gap-4">
      <p className="text-xs uppercase tracking-widest" style={{ color: `hsl(${artHsl} / 0.4)` }}>Dedication</p>
      <p className="text-sm font-serif italic text-center leading-relaxed" style={{ color: `hsl(${artHsl} / 0.8)` }}>
        "{dedication}"
      </p>
    </div>
  );
}

function LockedPage({ name, artHsl }: { name: string; artHsl: string }) {
  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      {/* Blurred fake content */}
      <div className="flex-1 p-5 flex flex-col gap-2 blur-sm opacity-50">
        <div className="h-2/5 rounded-lg" style={{ backgroundColor: `hsl(${artHsl} / 0.15)` }} />
        <div className="h-2.5 rounded-full w-full" style={{ backgroundColor: `hsl(${artHsl} / 0.12)` }} />
        <div className="h-2.5 rounded-full w-10/12" style={{ backgroundColor: `hsl(${artHsl} / 0.12)` }} />
      </div>
      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-5 gap-3 bg-white/70 backdrop-blur-sm">
        <Lock className="w-8 h-8" style={{ color: `hsl(${artHsl} / 0.5)` }} />
        <p className="text-sm font-semibold text-center" style={{ color: `hsl(${artHsl})` }}>Unlock the full story</p>
        <p className="text-xs text-center leading-relaxed" style={{ color: `hsl(${artHsl} / 0.6)` }}>
          The rest of {name}'s story awaits. Get the full book to read every page together.
        </p>
      </div>
    </div>
  );
}

export default function Step10() {
  const { answers } = useWizard();
  const navigate = useNavigate();
  const name = answers.childName || "your child";
  const title = answers.bookTitle || `${name}'s Adventure`;
  const layout = answers.coverLayout || "full-illustration";
  const artStyle = answers.artStyle || "watercolor";
  const dedication = answers.dedication || `For ${name}, with all my love.`;
  const artHsl = ART_COLORS[artStyle] || ART_COLORS.watercolor;

  const pages = [
    <CoverPage key="cover" layout={layout} title={title} name={name} artHsl={artHsl} />,
    <StoryPage1 key="s1" artHsl={artHsl} />,
    <StoryPage2 key="s2" artHsl={artHsl} />,
    <DedicationPage key="ded" dedication={dedication} artHsl={artHsl} />,
    <LockedPage key="lock" name={name} artHsl={artHsl} />,
  ];

  return (
    <div
      className="flex flex-col items-center min-h-[100dvh] px-4 py-8"
      style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
    >
      {/* Progress */}
      <div className="flex flex-col items-center gap-1.5 mb-6">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className="h-2 w-6 rounded-full"
              style={{ backgroundColor: "hsl(var(--wizard-primary))" }}
            />
          ))}
        </div>
        <span className="text-xs font-medium tracking-wide" style={{ color: "hsl(var(--wizard-primary))" }}>
          100% complete ✓
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-1" style={{ color: "hsl(var(--wizard-primary))" }}>
        {name}'s book is ready. ✨
      </h1>
      <p className="text-sm text-center mb-6" style={{ color: "hsl(var(--wizard-primary) / 0.6)" }}>
        Here's a sneak peek before you make it official.
      </p>

      {/* Carousel */}
      <div className="w-full max-w-sm mb-8">
        <Carousel opts={{ align: "center", loop: false }} className="w-full">
          <CarouselContent>
            {pages.map((page, i) => (
              <CarouselItem key={i}>
                <div
                  className="rounded-2xl overflow-hidden shadow-lg bg-white mx-auto"
                  style={{ aspectRatio: "2/3", maxWidth: 260 }}
                >
                  {page}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-4" />
          <CarouselNext className="-right-4" />
        </Carousel>
      </div>

      {/* CTAs */}
      <button
        onClick={() => navigate("/step/11")}
        className="px-10 py-4 rounded-full text-base font-semibold mb-3"
        style={{ backgroundColor: "#22c55e", color: "#fff" }}
      >
        Get {name}'s book →
      </button>
      <button
        onClick={() => navigate("/step/1")}
        className="text-sm font-medium"
        style={{ color: "hsl(var(--wizard-primary) / 0.5)" }}
      >
        ← Make changes
      </button>
    </div>
  );
}
