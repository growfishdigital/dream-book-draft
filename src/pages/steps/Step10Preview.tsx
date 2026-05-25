import { useState } from "react";
import { pathForStep } from "@/lib/wizardSteps";
import { useNavigate } from "react-router-dom";
import { useWizard } from "@/contexts/WizardContext";

import { Check } from "lucide-react";
import WizardHeader from "@/components/WizardHeader";

type Plan = "digital" | "hardcover";

const DIGITAL_FEATURES = [
  "Full illustrated eBook (PDF)",
  "Delivered instantly by email",
  "Shareable gift link",
  "Print it yourself anytime",
];

const HARDCOVER_FEATURES = [
  "Everything in Digital",
  "Premium hardcover, printed & shipped",
  "Ships in 5–7 business days",
  "Free digital copy included",
];





export default function Step9Preview() {
  const { answers, setAnswer } = useWizard();
  const navigate = useNavigate();
  const name = answers.childName || "your little one";
  const concept = answers.selectedConcept || {};
  const title = concept.title || answers.bookTitle || `${name}'s Adventure`;
  const approvedSummary: string | undefined = concept.summary;
  const coverImage: string | undefined = concept.coverImage;
  const initialLayout = answers.coverLayout || "full-illustration";
  const [layout, setLayout] = useState<string>(initialLayout);
  const artHsl = "100 52% 20%";

  const [selected, setSelected] = useState<Plan>("hardcover");
  const [layoutConfirmed, setLayoutConfirmed] = useState(false);

  // Buyer form state
  const [buyerName, setBuyerName] = useState<string>(answers.buyer_name || "");
  const [buyerEmail, setBuyerEmail] = useState<string>(answers.buyer_email || "");
  const [buyerErrors, setBuyerErrors] = useState<{ name?: string; email?: string }>({});

  const canOrder = !!coverImage || layoutConfirmed;

  const price = selected === "digital" ? "$9.99" : "$44.99";
  const planLabel = selected === "digital" ? "Digital Book" : "Printed Hardcover + Digital";

  const handlePay = () => {
    const errs: { name?: string; email?: string } = {};
    if (!buyerName.trim()) errs.name = "Required";
    if (!/^\S+@\S+\.\S+$/.test(buyerEmail.trim())) errs.email = "Enter a valid email";
    setBuyerErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setAnswer("buyer_name", buyerName.trim());
    setAnswer("buyer_email", buyerEmail.trim());
    setAnswer("coverLayout", layout);
    setAnswer("selectedPlan", selected);

    navigate(pathForStep(10));
  };


  return (
    <div
      className="flex flex-col min-h-[100dvh]"
      style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
    >
      <WizardHeader currentStep={9} />

      <div className="flex flex-col items-center px-4 py-8">
      {/* Heading */}
      <h1 className="font-heading md:text-3xl font-semibold text-center mb-1 text-4xl text-[hsl(var(--wizard-primary))]">
        {name}'s book is ready. ✨
      </h1>
      <p className="text-sm text-center mb-8" style={{ color: "hsl(var(--wizard-primary) / 0.6)" }}>
        Preview the book and choose how you'd like it delivered.
      </p>

      {/* Single-column layout */}
      <div className="w-full max-w-[560px] flex flex-col gap-8 items-stretch">
        {/* Preview column */}
        <div className="flex flex-col items-center gap-5">
          {/* Cover + first page side-by-side */}
          <div className="w-full flex flex-row items-start justify-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                Cover
              </p>
              <div
                className="rounded-2xl overflow-hidden shadow-lg bg-white"
                style={{ aspectRatio: "2/3", width: 180 }}
              >
                <CoverPage layout={layout} title={title} name={name} artHsl={artHsl} coverImage={coverImage} />
              </div>
              {/* Cover variant selector */}
              {(() => {
                const variants: { value: string; label: string; Icon: typeof ImageIcon }[] = [
                  { value: "full-illustration", label: "Full illustration", Icon: ImageIcon },
                  { value: "bold-title", label: "Bold title split", Icon: Columns2 },
                ];
                return (
                  <div className="flex items-center gap-1.5 mt-1">
                    {variants.map(({ value, label, Icon }) => {
                      const active = layout === value;
                      return (
                        <Tooltip key={value}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setLayout(value)}
                              aria-label={label}
                              aria-pressed={active}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all"
                              style={
                                active
                                  ? {
                                      backgroundColor: "hsl(var(--wizard-primary))",
                                      borderColor: "hsl(var(--wizard-primary))",
                                      color: "#fff",
                                    }
                                  : {
                                      backgroundColor: "#fff",
                                      borderColor: "hsl(var(--wizard-primary) / 0.2)",
                                      color: "hsl(var(--wizard-primary) / 0.7)",
                                    }
                              }
                            >
                              <Icon className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            {label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                );
              })()}
              {!coverImage && (
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={layoutConfirmed}
                    onChange={(e) => setLayoutConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded accent-[hsl(var(--wizard-primary))]"
                  />
                  <span className="text-xs" style={{ color: "hsl(var(--wizard-primary) / 0.75)" }}>
                    Confirm this layout
                  </span>
                </label>
              )}
            </div>

          </div>
        </div>


        {/* Checkout column */}
        <div className="flex flex-col">
          <div className="flex flex-col gap-4 mb-6">
            {/* Digital */}
            <button
              type="button"
              onClick={() => setSelected("digital")}
              className="relative text-left rounded-2xl border-2 p-5 transition-all"
              style={{
                borderColor: selected === "digital" ? "hsl(var(--wizard-primary))" : "hsl(var(--border))",
                boxShadow: selected === "digital" ? "0 0 0 2px hsl(var(--wizard-primary) / 0.25)" : "none",
                backgroundColor: "hsl(var(--card))",
              }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <div>
                  <span className="font-semibold">Digital Book</span>
                  <span className="ml-2 text-xs text-muted-foreground">Instant delivery</span>
                </div>
                <span className="text-lg font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>$9.99</span>
              </div>
              <ul className="space-y-1.5">
                {DIGITAL_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--wizard-primary))" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </button>

            {/* Hardcover */}
            <button
              type="button"
              onClick={() => setSelected("hardcover")}
              className="relative text-left rounded-2xl border-2 p-5 transition-all"
              style={{
                borderColor: selected === "hardcover" ? "hsl(45 93% 58%)" : "hsl(45 93% 58% / 0.4)",
                boxShadow: selected === "hardcover" ? "0 0 0 2px hsl(45 93% 58% / 0.3)" : "none",
                backgroundColor: "hsl(var(--card))",
              }}
            >
              <span
                className="absolute -top-3 right-4 text-xs font-semibold px-3 py-1 rounded-full"
                style={{ backgroundColor: "hsl(45 93% 58%)", color: "hsl(45 93% 20%)" }}
              >
                ⭐ Most popular
              </span>

              <div className="flex items-baseline justify-between mb-3 mt-1">
                <div>
                  <span className="font-semibold">Printed Hardcover + Digital</span>
                </div>
                <span className="text-lg font-bold" style={{ color: "hsl(var(--wizard-primary))" }}>$44.99</span>
              </div>
              <ul className="space-y-1.5">
                {HARDCOVER_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 shrink-0" style={{ color: "hsl(var(--wizard-primary))" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground mb-6">
            <span>🔒 Secure checkout</span>
            <span>💳 All major cards accepted</span>
            <span>📦 Free shipping to the US</span>
          </div>

          {/* Buyer details + order */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-widest"
                     style={{ color: "hsl(var(--wizard-primary) / 0.7)" }}>
                Your name
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Sarah Johnson"
                className="w-full h-11 rounded-xl border px-3 text-sm bg-white"
                style={{ borderColor: buyerErrors.name ? "hsl(var(--destructive))" : "hsl(var(--wizard-primary) / 0.25)" }}
              />
              {buyerErrors.name && (
                <p className="text-xs text-destructive">{buyerErrors.name}</p>
              )}
              <label className="text-xs font-semibold uppercase tracking-widest mt-2"
                     style={{ color: "hsl(var(--wizard-primary) / 0.7)" }}>
                Email
              </label>
              <input
                type="email"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 rounded-xl border px-3 text-sm bg-white"
                style={{ borderColor: buyerErrors.email ? "hsl(var(--destructive))" : "hsl(var(--wizard-primary) / 0.25)" }}
              />
              {buyerErrors.email && (
                <p className="text-xs text-destructive">{buyerErrors.email}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                We'll use your name on the book's dedication and email you when it's ready.
              </p>
            </div>

            <button
              onClick={() => canOrder && handlePay()}
              disabled={!canOrder}
              className="w-full h-12 rounded-full text-base font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              style={{ backgroundColor: "#2B4E18", color: "#fff" }}
            >
              Pay {price} & start crafting
            </button>
            {!canOrder && (
              <p className="text-xs text-center" style={{ color: "hsl(var(--wizard-primary) / 0.6)" }}>
                Confirm your cover layout above to continue.
              </p>
            )}
            <div
              className="mt-2 rounded-2xl p-4 border flex gap-3 items-start"
              style={{
                backgroundColor: "#2B4E18" + "14",
                borderColor: "#2B4E18" + "33",
              }}
            >
              <span className="text-xl leading-none">✏️</span>
              <p className="text-sm leading-relaxed" style={{ color: "#2B4E18" }}>
                <span className="font-semibold">You'll get to review your book before it's actually sent to you.</span> After checkout, preview every page and request edits or revisions before it's finalized.
              </p>
            </div>
          </div>

          {/* Testimonial */}
          <figure
            className="mt-8 rounded-2xl p-5 border"
            style={{
              backgroundColor: `hsl(${artHsl} / 0.08)`,
              borderColor: `hsl(${artHsl} / 0.2)`,
            }}
          >
            <span
              className="block text-2xl leading-none mb-2 font-serif"
              style={{ color: `hsl(${artHsl})` }}
              aria-hidden="true"
            >
              “
            </span>
            <blockquote
              className="text-sm md:text-base font-serif italic leading-relaxed"
              style={{ color: "hsl(var(--wizard-primary) / 0.9)" }}
            >
              She opened the first page and whispered, "Grandma, it's me." I still can't stop thinking about that moment.
            </blockquote>
            <figcaption
              className="mt-3 text-xs font-medium"
              style={{ color: "hsl(var(--wizard-primary) / 0.65)" }}
            >
              — Carol, grandmother
            </figcaption>
          </figure>
        </div>
      </div>
      </div>
    </div>
  );
}
