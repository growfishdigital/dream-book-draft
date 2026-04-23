import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TOTAL_STEPS = 11;

const STEP_LABELS: Record<number, string> = {
  1: "Who's it for?",
  2: "Story Type",
  3: "Life Lessons",
  4: "Art Style",
  5: "Interests",
  6: "Secret Ingredient",
  7: "Characters",
  8: "Dedication & Language",
  9: "Cover Design",
  10: "Generating…",
  11: "Preview & Buy",
};

export default function ProgressBar({ currentStep }: { currentStep: number }) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center gap-1.5">
      <TooltipProvider delayDuration={0}>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const stepNum = i + 1;
            const isClickable = stepNum < currentStep;
            return (
              <Tooltip key={i}>
              <TooltipTrigger asChild>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/step/${stepNum}`)}
                    className="h-2 rounded-full transition-all duration-300 cursor-pointer hover:scale-y-150"
                    style={{
                      width: 24,
                      backgroundColor: i < currentStep ? "hsl(var(--wizard-primary))" : "hsl(var(--wizard-primary) / 0.15)",
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Step {stepNum}: {STEP_LABELS[stepNum]}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      <span className="text-xs text-muted-foreground font-medium tracking-wide">
        Your book is taking shape ✨
      </span>
    </div>
  );
}
