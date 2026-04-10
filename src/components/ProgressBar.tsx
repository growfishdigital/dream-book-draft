const TOTAL_STEPS = 11;

export default function ProgressBar({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-1.5">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: 24,
              backgroundColor: i < currentStep ? "hsl(var(--wizard-primary))" : "hsl(var(--wizard-primary) / 0.15)",
            }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground font-medium tracking-wide">
        Your book is taking shape ✨
      </span>
    </div>
  );
}
