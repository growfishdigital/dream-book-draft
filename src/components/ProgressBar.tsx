import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const TOTAL_STEPS = 10;

// Short, accurate step names for tooltips. Matches the current 10-step flow
// (Cover Designer was removed).
const STEP_LABELS: Record<number, string> = {
  1: "Who's it for?",
  2: "Story Type",
  3: "Life Lessons",
  4: "Interests",
  5: "Personality",
  6: "Art Style",
  7: "Characters",
  8: "Story Summary",
  9: "Generating",
  10: "Preview & Buy",
};

// Warm, child-focused encouragement that swaps as the user advances.
// Keep these short — they sit in a tiny caption under the dots.
const PROGRESS_MESSAGES: Record<number, string> = {
  1: "Your book is taking shape ✨",
  2: "Lovely start — let's pick the vibe 🌱",
  3: "Beautiful choice — what should they learn? 💛",
  4: "You're sparking ideas already ✨",
  5: "Bringing their personality to life 🌟",
  6: "Painting the perfect look 🎨",
  7: "Filling the world with friends 🧸",
  8: "Your story is almost written 📖",
  9: "Stitching every page together ✨",
  10: "Tada! Meet your storybook 🎉",
};

export default function ProgressBar({ currentStep }: { currentStep: number }) {
  const navigate = useNavigate();

  const safeStep = Math.min(Math.max(currentStep, 1), TOTAL_STEPS);
  const message = PROGRESS_MESSAGES[safeStep] ?? PROGRESS_MESSAGES[1];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <TooltipProvider delayDuration={0}>
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => {
            const stepNum = i + 1;
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
                      backgroundColor:
                        i < currentStep
                          ? "hsl(var(--wizard-primary))"
                          : "hsl(var(--wizard-primary) / 0.15)",
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
      {/* `key` forces a remount on step change so the CSS animation replays as
          a soft fade-in instead of an abrupt text swap. */}
      <span
        key={safeStep}
        className="text-xs text-muted-foreground font-medium tracking-wide opacity-0 animate-[fadeIn_400ms_ease-out_forwards]"
      >
        {message}
      </span>
    </div>
  );
}
