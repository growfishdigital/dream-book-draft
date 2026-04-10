import WizardShell from "@/components/WizardShell";

export default function Step1() {
  return (
    <WizardShell>
      <div className="text-center space-y-4">
        <h1 className="font-heading text-4xl font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>
          Who's this for?
        </h1>
        <p className="text-muted-foreground text-lg">
          Tell us about the child who'll star in this story.
        </p>
        <div className="mt-8 p-6 rounded-2xl border border-border bg-white/80 shadow-sm">
          <p className="text-muted-foreground italic">Step 1 content coming soon…</p>
        </div>
      </div>
    </WizardShell>
  );
}
