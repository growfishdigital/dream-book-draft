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
      <div className="mx-auto w-48 sm:w-56 rounded-xl overflow-hidden shadow-lg border-2 border-muted" style={{ aspectRatio: "2/3" }}>
        <div className="h-full flex">
          <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: "hsl(var(--wizard-primary) / 0.15)" }}>
            <span className="text-3xl">🎨</span>
          </div>
          <div className="w-1/2 flex flex-col items-center justify-center p-3 bg-white">
            <p className="font-serif text-sm font-bold text-center leading-tight" style={{ color: "hsl(var(--wizard-primary))" }}>
              {title || "Your Title"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-2">by {name}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-48 sm:w-56 rounded-xl overflow-hidden shadow-lg border-2 border-muted" style={{ aspectRatio: "2/3" }}>
      <div className="h-full flex flex-col">
        <div className="flex-[2] flex items-center justify-center" style={{ backgroundColor: "hsl(var(--wizard-primary) / 0.15)" }}>
          <span className="text-4xl">🎨</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-3 bg-white">
          <p className="font-serif text-sm font-bold text-center leading-tight" style={{ color: "hsl(var(--wizard-primary))" }}>
            {title || "Your Title"}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">by {name}</p>
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
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>
            Design {name}'s cover.
          </h1>
          <p className="text-muted-foreground text-lg">
            The first thing they'll see — make it theirs.
          </p>
        </div>

        {/* Book title */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            What's {name}'s book called?
          </label>
          <Input
            value={bookTitle}
            onChange={(e) => {
              if (e.target.value.length <= 40) setAnswer("bookTitle", e.target.value);
            }}
            maxLength={40}
            className="text-center text-lg rounded-xl"
            placeholder={`${name} and the [something amazing]`}
          />
          <p className="text-xs text-muted-foreground text-right">{bookTitle.length}/40</p>
        </div>

        {/* Layout picker */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            Choose a cover layout
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Live preview */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            Cover preview
          </label>
          <CoverPreview layout={coverLayout || "full-illustration"} title={bookTitle} name={name} />
        </div>
      </div>
    </WizardShell>
  );
}
