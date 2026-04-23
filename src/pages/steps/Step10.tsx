import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useWizard } from "@/contexts/WizardContext";
import ProgressBar from "@/components/ProgressBar";

const STAGES = [
  { emoji: "✍️", text: "Crafting {name}'s story..." },
  { emoji: "🎨", text: "Illustrating the pages..." },
  { emoji: "🌟", text: "Adding the magic touches..." },
  { emoji: "📖", text: "Putting it all together..." },
  { emoji: "💌", text: "Almost ready..." },
];

const TOTAL_DURATION = 8000;
const STAGE_INTERVAL = 1600;

export default function Step9() {
  const { answers } = useWizard();
  const navigate = useNavigate();
  const name = answers.childName || "your child";
  const [stageIndex, setStageIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [barStarted, setBarStarted] = useState(false);
  const intervRef = useRef<ReturnType<typeof setInterval>>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // kick off progress bar on next frame
    requestAnimationFrame(() => setBarStarted(true));

    intervRef.current = setInterval(() => {
      setStageIndex((i) => (i < STAGES.length - 1 ? i + 1 : i));
    }, STAGE_INTERVAL);

    timeoutRef.current = setTimeout(() => {
      setDone(true);
      if (intervRef.current) clearInterval(intervRef.current);
    }, TOTAL_DURATION);

    return () => {
      if (intervRef.current) clearInterval(intervRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const stage = STAGES[stageIndex];

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[100dvh] px-4 relative"
      style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
    >
      <button
        onClick={() => navigate("/step/9")}
        className="absolute top-4 left-4 p-2 rounded-xl transition-colors hover:bg-black/5 z-10"
        aria-label="Go back"
      >
        <ChevronLeft className="w-5 h-5" style={{ color: "hsl(var(--wizard-primary))" }} />
      </button>
      <button className="absolute top-4 right-4 text-sm font-medium px-3 py-1.5 rounded-xl transition-colors hover:bg-black/5 z-10" style={{ color: "hsl(var(--wizard-primary))" }}>
        Save &amp; exit
      </button>
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
        {/* Sparkles */}
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

        <svg viewBox="0 0 160 200" className="w-full h-full" style={{ filter: "drop-shadow(0 8px 24px hsl(var(--wizard-primary) / 0.18))" }}>
          {/* Back cover */}
          <rect x="30" y="10" width="100" height="180" rx="4" fill="hsl(var(--wizard-primary) / 0.15)" stroke="hsl(var(--wizard-primary) / 0.3)" strokeWidth="1.5" />

          {/* Pages */}
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
                animation: done ? "none" : `page-flutter ${1.8 + i * 0.3}s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}

          {/* Front cover */}
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

          {/* Spine */}
          <rect x="28" y="10" width="6" height="180" rx="2" fill="hsl(var(--wizard-primary) / 0.8)" />

          {/* Title lines on cover */}
          <rect x="50" y="60" width="60" height="6" rx="3" fill="hsl(var(--wizard-primary-foreground, 0 0% 100%) / 0.6)" style={{ transformOrigin: "left center", animation: done ? "none" : "book-open 3s ease-in-out infinite alternate" }} />
          <rect x="55" y="74" width="40" height="4" rx="2" fill="hsl(var(--wizard-primary-foreground, 0 0% 100%) / 0.35)" style={{ transformOrigin: "left center", animation: done ? "none" : "book-open 3s ease-in-out infinite alternate" }} />
        </svg>

        {/* Checkmark overlay */}
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

      {/* Stage message */}
      <div className="h-10 flex items-center justify-center mb-4 overflow-hidden">
        <p
          key={stageIndex}
          className="text-lg font-medium text-center"
          style={{
            color: "hsl(var(--wizard-primary))",
            animation: "btn-fade 0.4s ease-out",
          }}
        >
          {stage.emoji} {stage.text.replace("{name}", name)}
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs h-1.5 rounded-full overflow-hidden mb-6" style={{ backgroundColor: "hsl(var(--wizard-primary) / 0.12)" }}>
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: "hsl(var(--wizard-primary))",
            width: done ? "100%" : barStarted ? "100%" : "0%",
            transition: done ? "none" : `width ${TOTAL_DURATION}ms linear`,
          }}
        />
      </div>

      {/* Static copy */}
      <p className="text-sm italic text-center mb-8" style={{ color: "hsl(var(--wizard-primary) / 0.45)" }}>
        Every word, every illustration — made just for {name}.
      </p>

      {/* CTA button */}
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
    </div>
  );
}
