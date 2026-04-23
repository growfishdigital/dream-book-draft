import { useEffect } from "react";
import WizardShell from "@/components/WizardShell";
import { useWizard } from "@/contexts/WizardContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const LANGUAGES = [
  { value: "english", label: "English" },
  { value: "español", label: "Español" },
  { value: "français", label: "Français" },
  { value: "deutsch", label: "Deutsch" },
];

const BUYER_ROLES = [
  { value: "parent", emoji: "👨‍👩‍👧", label: "Parent" },
  { value: "grandparent", emoji: "👴", label: "Grandparent" },
  { value: "teacher", emoji: "🎓", label: "Teacher" },
  { value: "friend", emoji: "👫", label: "Friend" },
  { value: "other", emoji: "🎁", label: "Other" },
];

const OCCASIONS = [
  { value: "birthday", emoji: "🎂", label: "Birthday" },
  { value: "christmas", emoji: "🎄", label: "Christmas" },
  { value: "easter", emoji: "🐣", label: "Easter" },
  { value: "new-sibling", emoji: "👶", label: "New sibling" },
  { value: "first-day-school", emoji: "🏫", label: "First day of school" },
  { value: "graduation", emoji: "🎓", label: "Graduation" },
  { value: "baptism", emoji: "💧", label: "Baptism" },
  { value: "just-because", emoji: "❤️", label: "Just because" },
  { value: "other", emoji: "✏️", label: "Other" },
];

function getDefaultDedication(name: string, role: string): string {
  switch (role) {
    case "parent": return `For ${name}, who makes every day an adventure. With all my love.`;
    case "grandparent": return `For ${name}, my greatest joy. From Grandma/Grandpa with love.`;
    case "teacher": return `For ${name} — keep being curious. —Your Teacher`;
    case "friend": return `For ${name}. This story is for you.`;
    default: return `For ${name}. This story is for you.`;
  }
}

export default function Step8() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = (answers.childName as string) || "your little one";
  const buyerRole = (answers.buyerRole as string) || "parent";
  const occasion = (answers.occasion as string) || "";
  const occasionOther = (answers.occasionOther as string) || "";
  const dedication = (answers.dedication as string) ?? "";
  const language = (answers.language as string) || "english";
  const skipDedication = (answers.skipDedication as boolean) ?? false;

  useEffect(() => {
    setCanContinue(true);
    if (!answers.dedication) setAnswer("dedication", getDefaultDedication(name, buyerRole));
    if (!answers.language) setAnswer("language", "english");
    if (!answers.buyerRole) setAnswer("buyerRole", "parent");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pillClass = (selected: boolean, disabled = false) =>
    `rounded-2xl px-5 py-3 text-center transition-all border-2 shadow-sm ${
      disabled
        ? "border-transparent bg-muted opacity-50 cursor-not-allowed"
        : selected
          ? "border-[hsl(var(--wizard-primary))] bg-[hsl(var(--wizard-primary)/0.08)] cursor-pointer"
          : "border-transparent bg-white hover:shadow-md cursor-pointer"
    }`;

  const chipClass = (selected: boolean) =>
    `cursor-pointer rounded-2xl px-4 py-3 text-center transition-all border-2 shadow-sm ${
      selected
        ? "border-[hsl(var(--wizard-primary))] bg-[hsl(var(--wizard-primary)/0.08)]"
        : "border-transparent bg-white hover:shadow-md"
    }`;

  return (
    <WizardShell>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>
            Add a personal touch.
          </h1>
          <p className="text-muted-foreground text-lg">
            A dedication and language choice to make it truly {name}'s.
          </p>
        </div>

        {/* Dedication */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-muted-foreground">
              Dedication
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipDedication}
                onChange={(e) => setAnswer("skipDedication", e.target.checked)}
                className="h-4 w-4 rounded border-border accent-[hsl(var(--wizard-primary))] cursor-pointer"
              />
              No dedication
            </label>
          </div>
          <Textarea
            value={skipDedication ? "" : dedication}
            disabled={skipDedication}
            onChange={(e) => {
              if (e.target.value.length <= 200) setAnswer("dedication", e.target.value);
            }}
            maxLength={200}
            rows={3}
            className="rounded-xl resize-none disabled:opacity-50"
            placeholder={skipDedication ? "Your book will be printed without a dedication." : undefined}
          />
          {!skipDedication && (
            <p className="text-xs text-muted-foreground text-right">{dedication.length}/200</p>
          )}
        </div>

        <Separator />

        {/* Who are you? */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            Who are you in the child's life?
          </label>
          <div className="flex flex-wrap justify-center gap-3">
            {BUYER_ROLES.map((r) => (
              <button key={r.value} type="button" onClick={() => setAnswer("buyerRole", r.value)} className={pillClass(buyerRole === r.value)}>
                <span className="block text-lg">{r.emoji}</span>
                <span className="block text-sm font-semibold" style={{ color: "hsl(var(--wizard-primary))" }}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-muted-foreground text-center">
            What's the occasion? <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <div className="grid grid-cols-3 gap-3 max-w-[420px] mx-auto">
            {OCCASIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() =>
                  setAnswer("occasion", occasion === o.value ? "" : o.value)
                }
                className={chipClass(occasion === o.value)}
              >
                <span className="block text-xl">{o.emoji}</span>
                <span className="block text-sm mt-1">{o.label}</span>
              </button>
            ))}
          </div>

          {occasion === "other" && (
            <div className="flex justify-center mt-3">
              <Input
                value={occasionOther}
                onChange={(e) => setAnswer("occasionOther", e.target.value)}
                placeholder="Tell us the occasion..."
                className="max-w-[360px] rounded-2xl border-border bg-white shadow-sm"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Language */}
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
