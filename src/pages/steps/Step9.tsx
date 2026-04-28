import { useEffect } from "react";
import WizardShell from "@/components/WizardShell";
import { useWizard } from "@/contexts/WizardContext";
import { Input } from "@/components/ui/input";

function getDefaultTitle(name: string, genre: string): string {
  switch (genre) {
    case "fantasy": return `${name} and the Dragon's Secret`;
    case "adventure": return `${name} and the Lost Treasure`;
    case "sci-fi": return `${name} and the Star Beyond`;
    case "bedtime": return `${name}'s Dreamland Journey`;
    case "mystery": return `${name} and the Hidden Clue`;
    case "everyday": return `${name}'s Best Day Ever`;
    case "sports": return `${name} and the Big Game`;
    case "fairy-tale": return `${name} and the Enchanted Crown`;
    case "animals": return `${name} and the Secret Forest`;
    case "superhero": return `${name} Saves the Day`;
    default: return `${name} and the Amazing Adventure`;
  }
}

const LAYOUTS = [
  {
    value: "full-illustration",
    label: "Full Illustration",
    desc: "Large illustration on top, title at bottom",
  },
  {
    value: "bold-title",
    label: "Bold Title",
    desc: "Split layout — illustration left, title right",
  },
];

function CoverPreview({ layout, title, name }: { layout: string; title: string; name: string }) {
  if (layout === "bold-title") {
    return (
      <div className="mx-auto w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border-2 border-muted" style={{ aspectRatio: "2/3" }}>
        <div className="h-full flex">
          <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: "hsl(var(--wizard-primary) / 0.15)" }}>
            <span className="text-7xl">🎨</span>
          </div>
          <div className="w-1/2 flex flex-col items-center justify-center p-6 bg-white">
            <p className="font-serif text-xl font-bold text-center leading-tight" style={{ color: "hsl(var(--wizard-primary))" }}>
              {title || "Your Title"}
            </p>
            <p className="text-sm text-muted-foreground mt-4">by {name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl border-2 border-muted" style={{ aspectRatio: "2/3" }}>
      <div className="h-full flex flex-col">
        <div className="flex-[2] flex items-center justify-center" style={{ backgroundColor: "hsl(var(--wizard-primary) / 0.15)" }}>
          <span className="text-8xl">🎨</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white">
          <p className="font-serif text-2xl font-bold text-center leading-tight" style={{ color: "hsl(var(--wizard-primary))" }}>
            {title || "Your Title"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">by {name}</p>
        </div>
      </div>
    </div>
  );
}

export default function Step8() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = (answers.childName as string) || "your little one";
  const coverLayout = (answers.coverLayout as string) || "";
  const bookTitle = (answers.bookTitle as string) ?? "";

  useEffect(() => {
    if (!answers.coverLayout) setAnswer("coverLayout", "full-illustration");
    if (answers.bookTitle === undefined) setAnswer("bookTitle", getDefaultTitle(name, answers.genre || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const layout = answers.coverLayout || coverLayout;
    const title = (answers.bookTitle ?? bookTitle).trim();
    setCanContinue(!!layout && title.length > 0);
  }, [answers.coverLayout, answers.bookTitle, coverLayout, bookTitle, setCanContinue]);

  const cardClass = (selected: boolean) =>
    `cursor-pointer rounded-2xl p-4 text-center transition-all border-2 shadow-sm ${
      selected
        ? "border-[hsl(var(--wizard-primary))] bg-[hsl(var(--wizard-primary)/0.08)]"
        : "border-transparent bg-white hover:shadow-md"
    }`;

  return (
    <WizardShell>
      {/* Widen beyond the shell's 700px cap for this step */}
      <div className="relative left-1/2 -translate-x-1/2 w-[min(1100px,calc(100vw-2rem))]">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <h1 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>
              Design {name}'s cover.
            </h1>
            <p className="text-muted-foreground text-lg">
              The first thing they'll see — make it theirs.
            </p>
          </div>

          {/* Two-column: controls on left, big preview on right */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-8 lg:gap-12 items-start">
            {/* LEFT: controls */}
            <div className="space-y-6">
              {/* Layout picker */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-muted-foreground">
                  Choose a cover layout
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {LAYOUTS.map((l) => (
                    <button key={l.value} type="button" onClick={() => setAnswer("coverLayout", l.value)} className={cardClass(coverLayout === l.value)}>
                      {/* Mini layout wireframe */}
                      <div className="mx-auto w-24 rounded-lg overflow-hidden border border-muted mb-3" style={{ aspectRatio: "2/3" }}>
                        {l.value === "full-illustration" ? (
                          <div className="h-full flex flex-col">
                            <div className="flex-[2]" style={{ backgroundColor: "hsl(var(--wizard-primary) / 0.2)" }} />
                            <div className="flex-1 bg-white flex items-center justify-center">
                              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex">
                            <div className="w-1/2" style={{ backgroundColor: "hsl(var(--wizard-primary) / 0.2)" }} />
                            <div className="w-1/2 bg-white flex items-center justify-center">
                              <div className="w-6 h-1.5 rounded-full bg-muted-foreground/30" />
                            </div>
                          </div>
                        )}
                      </div>
                      <span className="block text-base font-semibold" style={{ color: "hsl(var(--wizard-primary))" }}>{l.label}</span>
                      <span className="block text-xs text-muted-foreground mt-0.5">{l.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: large live preview */}
            <div className="space-y-3 lg:sticky lg:top-24">
              <label className="block text-sm font-medium text-muted-foreground text-center">
                Cover preview
              </label>
              <CoverPreview layout={coverLayout || "full-illustration"} title={bookTitle} name={name} />
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
