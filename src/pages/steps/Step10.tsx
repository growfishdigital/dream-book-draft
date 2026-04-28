import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWizard } from "@/contexts/WizardContext";
import WizardHeader from "@/components/WizardHeader";
import { buildBrief } from "@/lib/buildBrief";
import { coverMessages, useRotatingMessage } from "@/lib/loadingMessages";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const MIN_DURATION = 6000; // soft floor so animation doesn't feel cut short

export default function Step11Generating() {
  const { answers, setAnswer } = useWizard();
  const navigate = useNavigate();
  const name = (answers.childName || "your little one").trim();

  const [done, setDone] = useState(false);
  const [coverDone, setCoverDone] = useState(false);
  const [errored, setErrored] = useState<string | null>(null);
  const startedAt = useRef<number>(Date.now());
  const fired = useRef(false);

  const title = (answers.selectedConcept?.title || "").trim();

  const message = useRotatingMessage(coverMessages(name), 2200);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    startedAt.current = Date.now();

    (async () => {
      const concept = answers.selectedConcept || {};
      try {
        const brief = buildBrief(answers);
        const { data, error: fnError } = await supabase.functions.invoke(
          "generate-cover",
          {
            body: {
              brief,
              title: concept.title || "",
              summary: concept.summary || "",
            },
          },
        );
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);
        const imageDataUrl = data?.imageDataUrl as string | undefined;

        if (imageDataUrl) {
          setAnswer("selectedConcept", {
            ...concept,
            coverImage: imageDataUrl,
          });
        }
      } catch (e: any) {
        const msg = e?.message || "Cover generation failed.";
        setErrored(msg);
        toast({ title: "Cover hit a snag", description: msg });
      } finally {
        setCoverDone(true);
        const elapsed = Date.now() - startedAt.current;
        const wait = Math.max(0, MIN_DURATION - elapsed);
        setTimeout(() => setDone(true), wait);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="flex flex-col min-h-[100dvh]"
      style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
    >
      <WizardHeader currentStep={10} />

      <div className="flex-1 flex flex-col items-center justify-center px-4 relative">
        <style>{`
          @keyframes book-open {
            0% { transform: rotateY(0deg); }
            100% { transform: rotateY(-35deg); }
          }
          @keyframes page-flutter {
            0%, 100% { transform: rotateY(0deg); }
            50% { transform: rotateY(-8deg); }
          }
          @keyframes float-sparkle {
            0% { opacity: 0; transform: translateY(0) scale(0); }
            20% { opacity: 1; transform: translateY(-10px) scale(1); }
            100% { opacity: 0; transform: translateY(-60px) scale(0.5); }
          }
          @keyframes check-pop {
            0% { opacity: 0; transform: scale(0.5); }
            60% { opacity: 1; transform: scale(1.15); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes btn-fade {
            0% { opacity: 0; transform: translateY(12px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .sparkle {
            position: absolute;
            border-radius: 50%;
            background: hsl(var(--wizard-primary));
            animation: float-sparkle 2.4s ease-out infinite;
          }
        `}</style>

        {/* Book animation */}
        <div className="relative w-40 h-48 mb-8" style={{ perspective: "600px" }}>
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="sparkle"
              style={{
                width: 4 + (i % 3) * 2,
                height: 4 + (i % 3) * 2,
                left: `${15 + i * 12}%`,
                bottom: `${20 + (i % 4) * 15}%`,
                animationDelay: `${i * 0.35}s`,
                opacity: done ? 0 : undefined,
              }}
            />
          ))}

          <svg
            viewBox="0 0 160 200"
            className="w-full h-full"
            style={{ filter: "drop-shadow(0 8px 24px hsl(var(--wizard-primary) / 0.18))" }}
          >
            <rect x="30" y="10" width="100" height="180" rx="4" fill="hsl(var(--wizard-primary) / 0.15)" stroke="hsl(var(--wizard-primary) / 0.3)" strokeWidth="1.5" />
            {[0, 1, 2].map((i) => (
              <rect
                key={i}
                x={34 + i * 2}
                y={14 + i}
                width="92"
                height="172"
                rx="2"
                fill="#fff"
                stroke="hsl(var(--wizard-primary) / 0.1)"
                strokeWidth="0.5"
                style={{
                  transformOrigin: "left center",
                  animation: done
                    ? "none"
                    : `page-flutter ${1.8 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
            <rect
              x="30"
              y="10"
              width="100"
              height="180"
              rx="4"
              fill="hsl(var(--wizard-primary))"
              style={{
                transformOrigin: "left center",
                animation: done ? "none" : "book-open 3s ease-in-out infinite alternate",
              }}
            />
            <rect x="28" y="10" width="6" height="180" rx="2" fill="hsl(var(--wizard-primary) / 0.8)" />
            <rect x="50" y="60" width="60" height="6" rx="3" fill="hsl(var(--wizard-primary-foreground, 0 0% 100%) / 0.6)" style={{ transformOrigin: "left center", animation: done ? "none" : "book-open 3s ease-in-out infinite alternate" }} />
            <rect x="55" y="74" width="40" height="4" rx="2" fill="hsl(var(--wizard-primary-foreground, 0 0% 100%) / 0.35)" style={{ transformOrigin: "left center", animation: done ? "none" : "book-open 3s ease-in-out infinite alternate" }} />
          </svg>

          {done && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ animation: "check-pop 0.5s ease-out forwards" }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "hsl(var(--wizard-primary))" }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <div className="h-10 flex items-center justify-center mb-4 overflow-hidden">
          <p
            key={message}
            className="text-lg font-medium text-center"
            style={{
              color: "hsl(var(--wizard-primary))",
              animation: "btn-fade 0.4s ease-out",
            }}
          >
            ✨ {done ? "Your book is ready!" : message}
          </p>
        </div>

        <p className="text-sm italic text-center mb-8" style={{ color: "hsl(var(--wizard-primary) / 0.5)" }}>
          Every word, every illustration — made just for {name}.
        </p>

        {done && (
          <button
            onClick={() => navigate("/step/11")}
            className="px-8 py-4 rounded-full text-base font-semibold"
            style={{
              backgroundColor: "hsl(var(--wizard-primary))",
              color: "#fff",
              animation: "btn-fade 0.6s ease-out",
            }}
          >
            ✨ Your book is ready — take a look
          </button>
        )}

        {errored && done && (
          <p className="text-xs text-center mt-4 max-w-xs text-[#2b4e18]/60">
            We had trouble drawing the cover, but your story is safe. You can
            continue and we'll try again later.
          </p>
        )}
      </div>
    </div>
  );
}
