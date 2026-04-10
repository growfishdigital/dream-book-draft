import { useEffect } from "react";
import WizardShell from "@/components/WizardShell";
import { useWizard } from "@/contexts/WizardContext";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const ART_STYLES = [
  { value: "watercolor", emoji: "🖼️", label: "Watercolor Storybook", desc: "Soft, painterly, classic", color: "hsl(200 60% 75%)" },
  { value: "cozy-sketch", emoji: "✏️", label: "Cozy Sketch", desc: "Charming hand-drawn linework", color: "hsl(35 50% 75%)" },
  { value: "bold-bright", emoji: "🌈", label: "Bold & Bright", desc: "Vivid colors, modern and punchy", color: "hsl(340 70% 65%)" },
  { value: "dreamy-pastel", emoji: "🌙", label: "Dreamy Pastel", desc: "Soft tones, gentle and ethereal", color: "hsl(270 50% 80%)" },
];

const BUYER_ROLES = [
  { value: "parent", emoji: "👨‍👩‍👧", label: "Parent" },
  { value: "grandparent", emoji: "👴", label: "Grandparent" },
  { value: "teacher", emoji: "🎓", label: "Teacher" },
  { value: "friend", emoji: "👫", label: "Friend" },
  { value: "other", emoji: "🎁", label: "Other" },
];

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "español", label: "Español" },
  { value: "français", label: "Français" },
  { value: "deutsch", label: "Deutsch" },
];

function getDefaultArtStyle(genre: string): string {
  if (["adventure", "superhero", "sports"].includes(genre)) return "bold-bright";
  if (["bedtime", "everyday"].includes(genre)) return "dreamy-pastel";
  if (["fantasy", "fairy-tale"].includes(genre)) return "watercolor";
  return "cozy-sketch";
}

function getDefaultDedication(name: string, role: string): string {
  switch (role) {
    case "parent": return `For ${name}, who makes every day an adventure. With all my love.`;
    case "grandparent": return `For ${name}, my greatest joy. From Grandma/Grandpa with love.`;
    case "teacher": return `For ${name} — keep being curious. —Your Teacher`;
    case "friend": return `For ${name}. This story is for you.`;
    default: return `For ${name}. This story is for you.`;
  }
}

export default function Step7() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = (answers.childName as string) || "your child";
  const artStyle = (answers.artStyle as string) || "";
  const buyerRole = (answers.buyerRole as string) || "parent";
  const dedication = (answers.dedication as string) ?? "";
  const language = (answers.language as string) || "english";

  useEffect(() => {
    setCanContinue(true);
    if (!answers.artStyle) setAnswer("artStyle", getDefaultArtStyle(answers.genre || ""));
    if (!answers.buyerRole) setAnswer("buyerRole", "parent");
    if (!answers.titlePageName) setAnswer("titlePageName", answers.childName || "");
    if (!answers.dedication) setAnswer("dedication", getDefaultDedication(name, "parent"));
    if (!answers.language) setAnswer("language", "english");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuyerChange = (role: string) => {
    setAnswer("buyerRole", role);
    // Update dedication if it matches any default template
    const currentDefault = getDefaultDedication(name, buyerRole);
    if (!dedication || dedication === currentDefault) {
      setAnswer("dedication", getDefaultDedication(name, role));
    }
  };

  const cardClass = (selected: boolean) =>
    `cursor-pointer rounded-2xl p-4 text-left transition-all border-2 shadow-sm ${
      selected
        ? "border-[hsl(var(--wizard-primary))] bg-[hsl(var(--wizard-primary)/0.08)]"
        : "border-transparent bg-white hover:shadow-md"
    }`;

  const pillClass = (selected: boolean, disabled = false) =>
    `rounded-2xl px-5 py-3 text-center transition-all border-2 shadow-sm ${
      disabled
        ? "border-transparent bg-muted opacity-50 cursor-not-allowed"
        : selected
          ? "border-[hsl(var(--wizard-primary))] bg-[hsl(var(--wizard-primary)/0.08)] cursor-pointer"
          : "border-transparent bg-white hover:shadow-md cursor-pointer"
    }`;

  return (
    <WizardShell>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>
            The finishing touches.
          </h1>
          <p className="text-muted-foreground text-lg">
            A few choices that make this feel unmistakably like {name}'s book.
          </p>
        </div>

        {/* 1. Art Style */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            Choose an illustration style
          </label>
          <div className="grid grid-cols-2 gap-3">
            {ART_STYLES.map((s) => (
              <button key={s.value} type="button" onClick={() => setAnswer("artStyle", s.value)} className={cardClass(artStyle === s.value)}>
                <div className="w-full h-16 rounded-lg mb-2 flex items-center justify-center text-2xl" style={{ backgroundColor: s.color }}>
                  {s.emoji}
                </div>
                <span className="block text-base font-semibold" style={{ color: "hsl(var(--wizard-primary))" }}>{s.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5">{s.desc}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center italic">
            We pre-selected the best style for your story — feel free to change it.
          </p>
        </div>

        <Separator />

        {/* 2. Buyer Role */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            Who are you in {name}'s life?
          </label>
          <div className="flex flex-wrap justify-center gap-3">
            {BUYER_ROLES.map((r) => (
              <button key={r.value} type="button" onClick={() => handleBuyerChange(r.value)} className={pillClass(buyerRole === r.value)}>
                <span className="block text-lg">{r.emoji}</span>
                <span className="block text-sm font-semibold" style={{ color: "hsl(var(--wizard-primary))" }}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        <Separator />

        {/* 4. Dedication */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            Dedication
          </label>
          <Textarea
            value={dedication}
            onChange={(e) => {
              if (e.target.value.length <= 200) setAnswer("dedication", e.target.value);
            }}
            maxLength={200}
            rows={3}
            className="rounded-xl resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{dedication.length}/200</p>
        </div>

        <Separator />

        {/* 5. Language */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            Book language
          </label>
          <div className="flex flex-wrap justify-center gap-3">
            {LANGUAGES.map((l) => (
              <button key={l.value} type="button" onClick={() => setAnswer("language", l.value)} className={pillClass(language === l.value)}>
                <span className="block text-sm font-semibold" style={{ color: "hsl(var(--wizard-primary))" }}>{l.label}</span>
              </button>
            ))}
            <div className={pillClass(false, true)}>
              <span className="block text-sm font-semibold text-muted-foreground">More coming soon</span>
            </div>
          </div>
        </div>
      </div>
    </WizardShell>
  );
}
