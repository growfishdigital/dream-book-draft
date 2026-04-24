import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import ProgressBar from "./ProgressBar";
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
      {/* Top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 backdrop-blur-sm border-b border-black/10" style={{ backgroundColor: "hsl(var(--wizard-bg) / 0.9)" }}>
        <div className="w-[70px]" />

        <ProgressBar currentStep={currentStep} />

        <button className="text-sm font-medium px-3 py-1.5 rounded-xl transition-colors hover:bg-black/5" style={{ color: "hsl(var(--wizard-primary))" }}>
          Save &amp; exit
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex justify-center px-4 pt-12 pb-8">
        <div className="w-full max-w-[700px]">{children}</div>
      </main>

      {/* Bottom bar */}
      <div className="sticky bottom-0 z-30 px-4 py-4 flex justify-center gap-3" style={{ backgroundColor: "hsl(var(--wizard-bg) / 0.9)" }}>
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
          onClick={goNext}
          disabled={false}
          className="flex-1 sm:flex-none sm:min-w-[320px] py-4 rounded-full text-base font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            backgroundColor: "hsl(var(--wizard-primary))",
            color: "#fff",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
