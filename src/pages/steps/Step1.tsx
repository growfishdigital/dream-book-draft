import { useEffect, useState } from "react";
import WizardShell from "@/components/WizardShell";
import { useWizard } from "@/contexts/WizardContext";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AGE_RANGES = [
  { value: "0-2", label: "0–2", sub: "Board book" },
  { value: "3-5", label: "3–5", sub: "Picture book" },
  { value: "6-8", label: "6–8", sub: "Early reader" },
  { value: "9-12", label: "9–12", sub: "Chapter book" },
];

const GENDERS = [
  { value: "girl", label: "Girl" },
  { value: "boy", label: "Boy" },
  { value: "non-binary", label: "Non-binary" },
  { value: "surprise", label: "Surprise me" },
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

export default function Step1() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = (answers.childName as string) || "";
  const age = (answers.ageRange as string) || "";
  const gender = (answers.gender as string) || "";
  const occasion = (answers.occasion as string) || "";
  const occasionOther = (answers.occasionOther as string) || "";
  const buyerRole = (answers.buyerRole as string) || "";
  const bookBelongsTo = answers.bookBelongsTo !== false;

  const [headingVisible, setHeadingVisible] = useState(true);
  const [headingText, setHeadingText] = useState("Let's start with the star of the story.");

  // Update heading when name changes
  useEffect(() => {
    const target = name.trim()
      ? `Let's make a book for ${name.trim()}.`
      : "Let's start with the star of the story.";

    if (target !== headingText) {
      setHeadingVisible(false);
      const t = setTimeout(() => {
        setHeadingText(target);
        setHeadingVisible(true);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [name]);

  // Validation
  useEffect(() => {
    if (!answers.buyerRole) setAnswer("buyerRole", "parent");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCanContinue(name.trim().length > 0 && age !== "" && gender !== "");
  }, [name, age, gender, setCanContinue]);

  const pillClass = (selected: boolean) =>
    `cursor-pointer rounded-2xl px-5 py-3 text-center transition-all border-2 shadow-sm ${
      selected
        ? "border-[hsl(var(--wizard-primary))] bg-[hsl(var(--wizard-primary)/0.08)]"
        : "border-transparent bg-white hover:shadow-md"
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
        {/* Heading */}
        <div className="text-center space-y-2">
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold transition-opacity duration-300"
            style={{
              color: "hsl(var(--wizard-primary))",
              opacity: headingVisible ? 1 : 0,
            }}
          >
            {headingText}
          </h1>
          <p className="text-muted-foreground text-lg">
            Tell us a little about the child this book is for.
          </p>
        </div>

        {/* Name input */}
        <div className="flex flex-col items-center gap-3">
          <label className="block text-sm font-medium text-muted-foreground">
            Their name
          </label>
          <Input
            value={name}
            onChange={(e) => setAnswer("childName", e.target.value)}
            placeholder="e.g. Emma, John, etc."
            className="text-center text-2xl font-medium h-14 max-w-[360px] rounded-2xl border-border bg-white shadow-sm focus-visible:ring-[hsl(var(--wizard-primary))]"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Checkbox
              checked={bookBelongsTo}
              onCheckedChange={(checked) => setAnswer("bookBelongsTo", !!checked)}
              className="border-[hsl(var(--wizard-primary))] data-[state=checked]:bg-[hsl(var(--wizard-primary))]"
            />
            <span className="text-sm text-muted-foreground">Add "This book belongs to" page</span>
          </label>
        </div>

        {/* Age range & Gender side by side */}
        <div className="grid grid-cols-2 gap-4 max-w-[420px] mx-auto">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">
              Age range
            </label>
            <Select value={age} onValueChange={(v) => setAnswer("ageRange", v)}>
              <SelectTrigger className="rounded-xl bg-white">
                <SelectValue placeholder="Select age" />
              </SelectTrigger>
              <SelectContent>
                {AGE_RANGES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label} — {a.sub}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-muted-foreground">
              Gender
            </label>
            <Select value={gender} onValueChange={(v) => setAnswer("gender", v)}>
              <SelectTrigger className="rounded-xl bg-white">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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

          {/* Other occasion input */}
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
      </div>
    </WizardShell>
  );
}
