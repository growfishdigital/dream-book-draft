// Dev-only preview for the full-book engine output. Not linked from anywhere.
// No auth — closed prototype, no PII. See .lovable/plan.md §5.
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Spread {
  spread_number: number;
  beat_label: string;
  prose: string;
}
interface ParsedBook {
  cover_text?: string;
  outfit?: string;
  dedication_text?: string;
  repeating_phrase?: string;
  belongs_to_text?: string | null;
  spreads?: Spread[];
  generated_at?: string;
  prompt_version?: string;
}
interface BookRow {
  id: string;
  created_at: string;
  framework_id: string;
  brief: any;
  raw_output: string | null;
  parsed: ParsedBook | null;
  model: string;
  generation_ms: number | null;
  status: string;
}

export default function DevStoryPreview() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<BookRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase
        .from("generated_books")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) setError(error.message);
      else if (!data) setError("Book not found.");
      else setRow(data as BookRow);
    })();
  }, [id]);

  const regenerate = async () => {
    if (!row) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-book", {
        body: { brief: row.brief },
      });
      if (error) throw error;
      if (data?.id) window.location.assign(`/dev/story-preview/${data.id}`);
    } catch (e: any) {
      setError(e?.message ?? "Regeneration failed.");
    } finally {
      setRegenerating(false);
    }
  };

  if (error) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <p className="text-destructive">Error: {error}</p>
        <Link to="/" className="underline">← Home</Link>
      </div>
    );
  }
  if (!row) {
    return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  }

  const p = row.parsed || {};
  const child = row.brief?.child || {};

  return (
    <div className="min-h-[100dvh] bg-[hsl(var(--wizard-bg))] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Dev banner */}
        <div className="text-xs uppercase tracking-wider font-mono text-muted-foreground border border-dashed border-muted-foreground/40 rounded-full px-3 py-1 inline-block">
          ⚙ dev preview — full book engine
        </div>

        {/* Snapshot */}
        <header className="bg-white rounded-2xl p-6 shadow-sm space-y-2">
          <h1 className="font-heading text-2xl font-semibold text-[hsl(var(--wizard-primary))]">
            {p.cover_text || "Untitled"}
          </h1>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div><dt className="font-semibold">Child</dt><dd>{child.name} ({child.ageRange})</dd></div>
            <div><dt className="font-semibold">Framework</dt><dd>{row.framework_id}</dd></div>
            <div><dt className="font-semibold">Model</dt><dd className="truncate">{row.model}</dd></div>
            <div><dt className="font-semibold">Time</dt><dd>{row.generation_ms ? `${(row.generation_ms / 1000).toFixed(1)}s` : "—"}</dd></div>
          </dl>
          <p className="text-xs text-muted-foreground">Status: <span className="font-mono">{row.status}</span> · Created {new Date(row.created_at).toLocaleString()}</p>
        </header>

        {/* Outfit */}
        {p.outfit && (
          <section className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Locked outfit</h2>
            <p className="text-sm">{p.outfit}</p>
          </section>
        )}

        {/* Dedication */}
        {p.dedication_text && (
          <section className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Dedication</h2>
            <p className="font-heading italic text-lg leading-relaxed">{p.dedication_text}</p>
          </section>
        )}

        {/* Repeating phrase */}
        {p.repeating_phrase && (
          <section className="bg-[hsl(var(--wizard-primary)/0.08)] rounded-2xl p-5 border-2 border-[hsl(var(--wizard-primary)/0.2)]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--wizard-primary))] mb-1">Repeating phrase</h2>
            <p className="text-base font-medium text-[hsl(var(--wizard-primary))]">"{p.repeating_phrase}"</p>
          </section>
        )}

        {/* Belongs to */}
        {p.belongs_to_text && (
          <section className="bg-white rounded-2xl p-5 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Belongs-to page</h2>
            <p className="text-sm italic">{p.belongs_to_text}</p>
          </section>
        )}

        {/* Spreads */}
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold text-[hsl(var(--wizard-primary))]">
            Spreads ({p.spreads?.length ?? 0})
          </h2>
          {(p.spreads || []).map((s) => (
            <article key={s.spread_number} className="bg-white rounded-2xl p-6 shadow-sm">
              <header className="flex items-baseline justify-between mb-3 gap-3">
                <h3 className="font-heading font-semibold text-[hsl(var(--wizard-primary))]">
                  Spread {s.spread_number}
                </h3>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {s.beat_label}
                </span>
              </header>
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{s.prose}</p>
            </article>
          ))}
        </section>

        {/* Raw */}
        <section>
          <button
            type="button"
            onClick={() => setShowRaw((v) => !v)}
            className="text-xs font-mono uppercase tracking-wider text-muted-foreground underline"
          >
            {showRaw ? "Hide" : "View"} raw output
          </button>
          {showRaw && (
            <pre className="mt-3 bg-black/90 text-green-200 text-xs p-4 rounded-xl overflow-auto max-h-[60vh]">
              {row.raw_output ?? "(empty)"}
            </pre>
          )}
        </section>

        {/* Regenerate */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={regenerate}
            disabled={regenerating}
            className="px-6 py-3 rounded-full bg-[hsl(var(--wizard-primary))] text-white font-semibold disabled:opacity-50"
          >
            {regenerating ? "Regenerating…" : "Regenerate from same brief"}
          </button>
          <Link
            to="/"
            className="px-6 py-3 rounded-full border-2 border-[hsl(var(--wizard-primary))] text-[hsl(var(--wizard-primary))] font-semibold"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
