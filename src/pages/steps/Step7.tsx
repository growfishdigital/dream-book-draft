import { useEffect, useState } from "react";
import WizardShell from "@/components/WizardShell";
import { useWizard } from "@/contexts/WizardContext";
import { Input } from "@/components/ui/input";

const ART_STYLES = [
  { value: "watercolor", emoji: "🖼️", label: "Watercolor Storybook", desc: "Soft, painterly, classic", color: "hsl(200 60% 75%)" },
  { value: "cozy-sketch", emoji: "✏️", label: "Cozy Sketch", desc: "Charming hand-drawn linework", color: "hsl(35 50% 75%)" },
  { value: "bold-bright", emoji: "🌈", label: "Bold & Bright", desc: "Vivid colors, modern and punchy", color: "hsl(340 70% 65%)" },
  { value: "dreamy-pastel", emoji: "🌙", label: "Dreamy Pastel", desc: "Soft tones, gentle and ethereal", color: "hsl(270 50% 80%)" },
];

const CUSTOM_VALUE = "custom";

function getDefaultArtStyle(genre: string): string {
  if (["adventure", "superhero", "sports"].includes(genre)) return "bold-bright";
  if (["bedtime", "everyday"].includes(genre)) return "dreamy-pastel";
  if (["fantasy", "fairy-tale"].includes(genre)) return "watercolor";
  return "cozy-sketch";
}

export default function Step7() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = (answers.childName as string) || "your child";
  const artStyle = (answers.artStyle as string) || "";
  const customArtStyle = (answers.customArtStyle as string) || "";
  const isCustom = artStyle === CUSTOM_VALUE;

  useEffect(() => {
    setCanContinue(true);
    if (!answers.artStyle) setAnswer("artStyle", getDefaultArtStyle(answers.genre || ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectStyle = (value: string) => {
    setAnswer("artStyle", value);
    if (value !== CUSTOM_VALUE) setAnswer("customArtStyle", "");
  };

  const cardClass = (selected: boolean) =>
    `cursor-pointer rounded-2xl p-4 text-left transition-all border-2 shadow-sm ${
      selected
        ? "border-[hsl(var(--wizard-primary))] bg-[hsl(var(--wizard-primary)/0.08)]"
        : "border-transparent bg-white hover:shadow-md"
    }`;

  return (
    <WizardShell>
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>
            Pick an illustration style.
          </h1>
          <p className="text-muted-foreground text-lg">
            How should {name}'s story look?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {ART_STYLES.map((s) => (
            <button key={s.value} type="button" onClick={() => selectStyle(s.value)} className={cardClass(artStyle === s.value)}>
              <div className="w-full h-16 rounded-lg mb-2 flex items-center justify-center text-2xl" style={{ backgroundColor: s.color }}>
                {s.emoji}
              </div>
              <span className="block text-base font-semibold" style={{ color: "hsl(var(--wizard-primary))" }}>{s.label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{s.desc}</span>
            </button>
          ))}

          {/* Write-in option */}
          <button type="button" onClick={() => selectStyle(CUSTOM_VALUE)} className={`${cardClass(isCustom)} col-span-2`}>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "hsl(0 0% 88%)" }}>
                ✍️
              </div>
              <div className="flex-1 text-left">
                <span className="block text-base font-semibold" style={{ color: "hsl(var(--wizard-primary))" }}>Describe Your Own</span>
                <span className="block text-xs text-muted-foreground mt-0.5">Tell us the style you have in mind</span>
              </div>
            </div>
            {isCustom && (
              <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                <Input
                  autoFocus
                  placeholder='e.g. "retro pixel art" or "soft clay-mation look"'
                  value={customArtStyle}
                  onChange={(e) => setAnswer("customArtStyle", e.target.value)}
                  className="bg-white"
                />
              </div>
            )}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center italic">
          We pre-selected the best style for your story — feel free to change it.
        </p>
        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Please don't reference copyrighted material (movies, TV shows, singers, brands, etc.) — we can't include them in your book.
        </p>
      </div>
    </WizardShell>
  );
}
