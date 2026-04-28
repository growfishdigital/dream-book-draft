import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import WizardHeader from "./WizardHeader";
import { useWizard } from "@/contexts/WizardContext";
import type { ReactNode } from "react";

const TOTAL_STEPS = 11;

export default function WizardShell({ children, showSkip = false, maxWidth = 700 }: { children: ReactNode; showSkip?: boolean; maxWidth?: number }) {
  const { step } = useParams<{ step: string }>();
  const location = useLocation();
  const currentStep = Number(step ?? location.pathname.match(/^\/step\/(\d+)$/)?.[1]) || 1;
  const navigate = useNavigate();
  const { canContinue } = useWizard();

  const goBack = () => {
    if (currentStep > 1) navigate(`/step/${currentStep - 1}`);
  };

  const goNext = () => {
    if (currentStep < TOTAL_STEPS) navigate(`/step/${currentStep + 1}`);
  };

  return (
    <div className="flex flex-col min-h-[100dvh]" style={{ backgroundColor: "hsl(var(--wizard-bg))" }}>
      <WizardHeader currentStep={currentStep} />

      {/* Content */}
      <main className="flex-1 flex justify-center px-4 pt-12 pb-8">
        <div className="w-full" style={{ maxWidth: `${maxWidth}px` }}>{children}</div>
      </main>

      {/* Bottom bar */}
      <div className="sticky bottom-0 z-30 px-4 py-4 flex flex-col items-center gap-2 border-t border-black/10" style={{ backgroundColor: "hsl(var(--wizard-bg) / 0.9)" }}>
        <div className="flex justify-center items-center gap-3 w-full">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="py-4 px-8 rounded-full text-base font-semibold transition-all border-2"
              style={{
                borderColor: "hsl(var(--wizard-primary))",
                color: "hsl(var(--wizard-primary))",
                backgroundColor: "transparent",
              }}
            >
              Back
            </button>
          )}
          {showSkip && (
            <button
              type="button"
              onClick={goNext}
              className="py-4 px-6 rounded-full text-base font-semibold transition-all hover:bg-black/5"
              style={{ color: "hsl(var(--wizard-primary))" }}
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={() => { if (canContinue) goNext(); }}
            disabled={!canContinue}
            className="flex-1 sm:flex-none sm:min-w-[320px] py-4 rounded-full text-base font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "hsl(var(--wizard-primary))",
              color: "#fff",
            }}
          >
            Continue
          </button>
        </div>
        {/* Dev-only bypass: ignores validation, always advances */}
        <button
          type="button"
          onClick={goNext}
          title="Developer bypass — skips validation"
          className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full border border-dashed border-muted-foreground/40 text-muted-foreground/70 hover:text-muted-foreground hover:border-muted-foreground/70 transition-colors"
        >
          ⚙ dev: skip step
        </button>
      </div>
    </div>
  );
}
