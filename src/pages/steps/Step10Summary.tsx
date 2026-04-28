import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useWizard } from "@/contexts/WizardContext";
import WizardHeader from "@/components/WizardHeader";
import { buildBrief } from "@/lib/buildBrief";
import { summaryMessages, useRotatingMessage } from "@/lib/loadingMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function Step10Summary() {
  const { answers, setAnswer } = useWizard();
  const navigate = useNavigate();
  const name = (answers.childName || "your little one").trim();

  const [title, setTitle] = useState<string>(answers.selectedConcept?.title || "");
  const [summary, setSummary] = useState<string>(answers.selectedConcept?.summary || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previousSummaryRef = useRef<string>("");
  const loadingMsg = useRotatingMessage(summaryMessages(name), 2000);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const brief = buildBrief(answers);
      const { data, error: fnError } = await supabase.functions.invoke(
        "generate-summary",
        {
          body: {
            brief,
            previousSummary: previousSummaryRef.current || undefined,
          },
        },
      );
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      const newTitle = String(data?.title || "").trim();
      const newSummary = String(data?.summary || "").trim();
      if (!newSummary) throw new Error("Empty summary returned.");
      setTitle(newTitle);
      setSummary(newSummary);
      previousSummaryRef.current = newSummary;
    } catch (e: any) {
      const msg = e?.message || "Something went wrong.";
      setError(msg);
      toast({ title: "Couldn't craft the story", description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on first arrival if nothing yet
  useEffect(() => {
    if (!summary && !loading) {
      fetchSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = () => {
    if (!summary.trim()) return;
    setAnswer("selectedConcept", {
      title: title.trim() || `${name}'s Adventure`,
      summary: summary.trim(),
    });
    navigate("/step/11");
  };

  const wordCount = (s: string) =>
    s.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div
      className="flex flex-col min-h-[100dvh]"
      style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
    >
      <WizardHeader currentStep={10} />

      <main className="flex-1 px-4 pt-8 pb-32">
        <div className="mx-auto w-full max-w-[640px]">
          <h1 className="font-heading font-bold text-center mb-1 text-4xl md:text-3xl text-[#2b4e18]">
            Here's {name}'s story
          </h1>
          <p
            className="text-sm text-center mb-6"
            style={{ color: "hsl(var(--wizard-primary) / 0.65)" }}
          >
            Read it and refresh until it feels right.
          </p>

          {/* Summary card */}
          <div
            className="rounded-2xl border bg-white p-6 shadow-sm"
            style={{ borderColor: "hsl(var(--wizard-primary) / 0.18)" }}
          >
            {loading && !summary ? (
              <div className="space-y-3">
                <div className="h-6 w-2/3 mx-auto rounded animate-pulse bg-black/5" />
                <div className="h-3 w-full rounded animate-pulse bg-black/5" />
                <div className="h-3 w-full rounded animate-pulse bg-black/5" />
                <div className="h-3 w-5/6 rounded animate-pulse bg-black/5" />
                <div className="h-3 w-full rounded animate-pulse bg-black/5" />
                <div className="h-3 w-4/5 rounded animate-pulse bg-black/5" />
                <p
                  className="text-center text-sm italic pt-3"
                  style={{ color: "hsl(var(--wizard-primary) / 0.6)" }}
                >
                  {loadingMsg}
                </p>
              </div>
            ) : (
              <div className="relative">
                {loading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
                    <p
                      className="text-sm italic"
                      style={{ color: "hsl(var(--wizard-primary) / 0.7)" }}
                    >
                      {loadingMsg}
                    </p>
                  </div>
                )}
                <h2 className="font-heading text-2xl font-bold text-center text-[#2b4e18] mb-3">
                  {title || `${name}'s Adventure`}
                </h2>
                <p className="text-base font-serif leading-relaxed whitespace-pre-wrap text-[#2b4e18]/90">
                  {summary}
                </p>
                <p className="text-xs text-[#2b4e18]/45 text-right mt-3">
                  {wordCount(summary)} words
                </p>
              </div>
            )}

            {error && !loading && (
              <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
            )}
          </div>

          {/* Small Refresh button */}
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={fetchSummary}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-black/15 text-[#2b4e18] bg-white disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Crafting…" : summary ? "Refresh" : "Try again"}
            </button>
          </div>

          <p
            className="text-center text-xs italic mt-6"
            style={{ color: "hsl(var(--wizard-primary) / 0.5)" }}
          >
            Refresh as many times as you like. Once it's just right, approve
            and we'll bring the cover to life.
          </p>
        </div>
      </main>

      {/* Sticky bottom CTA */}
      <div
        className="sticky bottom-0 z-30 px-4 py-4 flex justify-center items-center gap-3 border-t border-black/10"
        style={{ backgroundColor: "hsl(var(--wizard-bg) / 0.9)" }}
      >
        <button
          type="button"
          onClick={() => navigate("/step/9")}
          className="py-4 px-8 rounded-full text-base font-semibold border-2"
          style={{
            borderColor: "hsl(var(--wizard-primary))",
            color: "hsl(var(--wizard-primary))",
            backgroundColor: "transparent",
          }}
        >
          Back
        </button>
        <button
          type="button"
          onClick={approve}
          disabled={!summary || loading}
          className="flex-1 sm:flex-none sm:min-w-[320px] py-4 rounded-full text-base font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "hsl(var(--wizard-primary))",
            color: "#fff",
          }}
        >
          Approve & illustrate →
        </button>
      </div>
    </div>
  );
}
