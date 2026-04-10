import { useEffect, useState, useCallback } from "react";
import WizardShell from "@/components/WizardShell";
import { useWizard } from "@/contexts/WizardContext";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Camera, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

const RELATIONSHIPS = ["Parent", "Grandparent", "Sibling", "Best friend", "Teacher", "Pet", "Other"] as const;
const GENDERS = ["Girl", "Boy", "Non-binary"] as const;

interface Character {
  id: string;
  name: string;
  relationship: string;
  gender: string;
  age: string;
  notable: string;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function emptyCharacter(): Character {
  return { id: makeId(), name: "", relationship: "", gender: "", age: "", notable: "" };
}

function PillSelector({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(selected ? "" : opt)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
              selected
                ? "border-transparent shadow-sm"
                : "border-border bg-background text-muted-foreground hover:border-primary/40"
            }`}
            style={
              selected
                ? {
                    backgroundColor: "hsl(var(--wizard-primary))",
                    color: "#fff",
                  }
                : undefined
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function CharacterCard({
  character,
  onChange,
  onRemove,
  defaultExpanded,
  childName,
  isHero,
}: {
  character: Character;
  onChange: (c: Character) => void;
  onRemove?: () => void;
  defaultExpanded: boolean;
  childName: string;
  isHero?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const update = (patch: Partial<Character>) => onChange({ ...character, ...patch });

  const displayName = character.name || "New character";
  const displayRelationship = character.relationship || "";

  return (
    <div
      className="rounded-2xl border overflow-hidden transition-shadow"
      style={{
        borderColor: isHero ? "hsl(var(--wizard-primary) / 0.3)" : undefined,
        backgroundColor: isHero && !expanded ? "hsl(var(--wizard-primary) / 0.06)" : undefined,
        boxShadow: expanded ? "0 4px 24px 0 hsl(var(--wizard-primary) / 0.08)" : undefined,
      }}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        {isHero && <span className="text-xl">👑</span>}
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-sm truncate block" style={{ color: "hsl(var(--wizard-primary))" }}>
            {displayName}
          </span>
          {displayRelationship && (
            <span className="text-xs text-muted-foreground">{displayRelationship}</span>
          )}
        </div>
        {!isHero && onRemove && <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
          aria-label="Remove character"
        >
          <Trash2 className="w-4 h-4" />
        </button>}
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded fields */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted-foreground">Name</label>
            <Input
              className="rounded-xl"
              placeholder="e.g. Grandma Rose"
              value={character.name}
              onChange={(e) => update({ name: e.target.value })}
            />
          </div>

          {/* Relationship */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted-foreground">
              Relationship to {childName}
            </label>
            <PillSelector
              options={RELATIONSHIPS}
              value={character.relationship}
              onChange={(v) => update({ relationship: v })}
            />
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted-foreground">Gender</label>
            <PillSelector
              options={GENDERS}
              value={character.gender}
              onChange={(v) => update({ gender: v })}
            />
          </div>

          {/* Age */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted-foreground">Age (optional)</label>
            <Input
              className="rounded-xl w-24"
              placeholder="e.g. 35"
              value={character.age}
              onChange={(e) => update({ age: e.target.value })}
            />
          </div>

          {/* Notable */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted-foreground">
              Something notable about them (optional)
            </label>
            <Textarea
              className="rounded-xl resize-none"
              placeholder="e.g. always wears a red hat, loves to tell jokes"
              maxLength={100}
              rows={2}
              value={character.notable}
              onChange={(e) => update({ notable: e.target.value })}
            />
            <p className="text-xs text-muted-foreground text-right">{character.notable.length}/100</p>
          </div>

          {/* Photo placeholder */}
          <button
            type="button"
            onClick={() => toast("Coming soon!", { description: "Photo upload will be available in a future update." })}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary/40 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Upload a photo
          </button>
        </div>
      )}
    </div>
  );
}

export default function Step6() {
  const { answers, setAnswer, setCanContinue } = useWizard();
  const name = (answers.childName as string) || "your child";

  const characters: Character[] = (answers.characters as Character[]) || [];

  const setCharacters = useCallback(
    (chars: Character[]) => setAnswer("characters", chars),
    [setAnswer],
  );

  useEffect(() => {
    setCanContinue(true);
  }, [setCanContinue]);

  const addCharacter = () => {
    if (characters.length >= 4) return;
    setCharacters([...characters, emptyCharacter()]);
  };

  const updateCharacter = (id: string, updated: Character) => {
    setCharacters(characters.map((c) => (c.id === id ? updated : c)));
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter((c) => c.id !== id));
  };

  return (
    <WizardShell>
      <div className="space-y-6">
        {/* Heading */}
        <div className="text-center space-y-2">
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold"
            style={{ color: "hsl(var(--wizard-primary))" }}
          >
            Who's in {name}'s story?
          </h1>
          <p className="text-muted-foreground text-lg">
            {name} is always the hero. Who else should join the adventure?
          </p>
        </div>

        {/* Hero card */}
        <div
          className="rounded-2xl border-2 px-4 py-3 flex items-center gap-3"
          style={{ borderColor: "hsl(var(--wizard-primary) / 0.3)", backgroundColor: "hsl(var(--wizard-primary) / 0.06)" }}
        >
          <span className="text-xl">👑</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm block" style={{ color: "hsl(var(--wizard-primary))" }}>
              {name}
            </span>
            <span className="text-xs text-muted-foreground">Hero</span>
          </div>
        </div>

        {/* Additional characters */}
        <div className="space-y-3">
          {characters.map((char, i) => (
            <CharacterCard
              key={char.id}
              character={char}
              onChange={(c) => updateCharacter(char.id, c)}
              onRemove={() => removeCharacter(char.id)}
              defaultExpanded={true}
              childName={name}
            />
          ))}
        </div>

        {/* Add button */}
        {characters.length < 4 && (
          <button
            type="button"
            onClick={addCharacter}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add a character
          </button>
        )}
      </div>
    </WizardShell>
  );
}
