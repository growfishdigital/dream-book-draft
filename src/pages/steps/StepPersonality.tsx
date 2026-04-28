import { useEffect, useMemo, useRef } from "react";
import { Plus, X } from "lucide-react";
import WizardShell from "@/components/WizardShell";
import { useWizard } from "@/contexts/WizardContext";

type Suggestion = { emoji: string; word: string };
type Entry = { word: string; emoji?: string };

const MAX_TRAITS = 3;

const TRAIT_POOL: Suggestion[] = [
  { emoji: "🤩", word: "outgoing" },
  { emoji: "🤫", word: "quiet" },
  { emoji: "😄", word: "joyful" },
  { emoji: "😊", word: "happy" },
  { emoji: "😢", word: "sensitive" },
  { emoji: "🔥", word: "fiery" },
  { emoji: "😠", word: "stubborn" },
  { emoji: "🦁", word: "brave" },
  { emoji: "🤓", word: "curious" },
  { emoji: "🎨", word: "creative" },
  { emoji: "🤗", word: "kind" },
  { emoji: "🤪", word: "silly" },
  { emoji: "🧘", word: "calm" },
  { emoji: "⚡", word: "energetic" },
  { emoji: "💭", word: "thoughtful" },
  { emoji: "🦋", word: "shy" },
  { emoji: "🎤", word: "confident" },
  { emoji: "🧩", word: "clever" },
];

const PLACEHOLDER = "type here";

export default function StepPersonality() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = ((answers.childName as string) || "").trim() || "your little one";
  const list: Entry[] = (answers.personalityList as Entry[]) || [];
  const focusIdxRef = useRef<number | null>(null);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const filled = list.filter((e) => e.word.trim().length > 0).length;
    setCanContinue(filled > 0);
  }, [list, setCanContinue]);

  useEffect(() => {
    if (focusIdxRef.current !== null) {
      const el = inputRefs.current[focusIdxRef.current];
      el?.focus();
      focusIdxRef.current = null;
    }
  });

  const enteredSet = useMemo(
    () => new Set(list.map((e) => e.word.trim().toLowerCase()).filter(Boolean)),
    [list],
  );

  const visibleChips = useMemo(
    () => TRAIT_POOL.filter((it) => !enteredSet.has(it.word.toLowerCase())).slice(0, 12),
    [enteredSet],
  );

  const setList = (next: Entry[]) => setAnswer("personalityList", next);

  const addEntry = (word: string, emoji?: string) => {
    if (list.length >= MAX_TRAITS) return;
    if (word && enteredSet.has(word.toLowerCase())) return;
    const emptyIdx = list.findIndex((e) => !e.word.trim());
    if (emptyIdx >= 0 && word) {
      const next = list.slice();
      next[emptyIdx] = { word, emoji };
      setList(next);
      return;
    }
    const next = [...list, { word, emoji }];
    setList(next);
    if (!word) focusIdxRef.current = next.length - 1;
  };

  const updateEntry = (idx: number, word: string) => {
    const next = list.slice();
    const prev = next[idx];
    const emoji = prev?.emoji && prev.word === word ? prev.emoji : undefined;
    next[idx] = { word, emoji };
    setList(next);
  };

  const removeEntry = (idx: number) => {
    setList(list.filter((_, i) => i !== idx));
  };

  const atCap = list.length >= MAX_TRAITS;

  const pillBase =
    "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-base font-medium transition-all";
  const pillFilledStyle = {
    backgroundColor: "hsl(var(--wizard-primary) / 0.10)",
    color: "hsl(var(--wizard-primary))",
  } as const;

  return (
    <WizardShell showSkip>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold"
            style={{ color: "hsl(var(--wizard-primary))" }}
          >
            Who is {name}?
          </h1>
          <p className="text-muted-foreground text-lg">
            Pick up to 3 traits that describe their personality.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 min-h-[44px]">
          {list.map((entry, idx) => {
            const size = Math.max((entry.word || "").length, PLACEHOLDER.length);
            return (
              <div key={idx} className={pillBase} style={pillFilledStyle}>
                {entry.emoji && <span aria-hidden>{entry.emoji}</span>}
                <input
                  ref={(el) => (inputRefs.current[idx] = el)}
                  value={entry.word}
                  onChange={(e) => updateEntry(idx, e.target.value)}
                  placeholder={PLACEHOLDER}
                  size={size}
                  className="bg-transparent border-0 outline-none p-0 text-base font-medium placeholder:text-[hsl(var(--wizard-primary)/0.5)]"
                  style={{ color: "hsl(var(--wizard-primary))" }}
                />
                <button
                  type="button"
                  onClick={() => removeEntry(idx)}
                  aria-label="Remove trait"
                  className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {!atCap && (
            <button
              type="button"
              onClick={() => addEntry("")}
              className="inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-base font-medium border-2 border-dashed transition-all hover:bg-[hsl(var(--wizard-primary)/0.05)]"
              style={{
                borderColor: "hsl(var(--wizard-primary) / 0.4)",
                color: "hsl(var(--wizard-primary))",
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add trait</span>
            </button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          ⚠️ Please don't reference copyrighted material (movies, TV shows, singers, brands, etc.) — we can't include them in your book.
        </p>

        {!atCap && visibleChips.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-medium text-muted-foreground text-base">Tap for inspiration:</h2>
            <div className="flex flex-wrap gap-2">
              {visibleChips.map((it) => (
                <button
                  key={it.word}
                  type="button"
                  onClick={() => addEntry(it.word, it.emoji)}
                  className={`${pillBase} hover:shadow-md hover:-translate-y-0.5`}
                  style={pillFilledStyle}
                >
                  <span aria-hidden>{it.emoji}</span>
                  <span>{it.word}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {atCap && (
          <p className="text-sm text-muted-foreground">
            That's plenty — 3 traits give us a great sense of {name} ✨
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          <span className="font-semibold">Why we ask:</span> {name}'s personality shapes how they show up in the story — their voice, choices, and reactions.
        </p>
      </div>
    </WizardShell>
  );
}
