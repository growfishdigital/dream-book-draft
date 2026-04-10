import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWizard } from "@/contexts/WizardContext";
import { Input } from "@/components/ui/input";
import { Check, ChevronLeft } from "lucide-react";

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

export default function Step11() {
  const { answers } = useWizard();
  const navigate = useNavigate();
  const name = answers.childName || "your child";

  const [selected, setSelected] = useState<Plan>("hardcover");
  const [email, setEmail] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const price = selected === "digital" ? "$9.99" : "$44.99";
  const planLabel = selected === "digital" ? "Digital Book" : "Printed Hardcover + Digital";

  if (orderPlaced) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[100dvh] px-4 text-center"
        style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
      >
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "hsl(var(--wizard-primary))" }}>
          Your book is on its way!
        </h1>
        <p className="text-muted-foreground mb-1">
          {planLabel} — {price}
        </p>
        <p className="text-sm text-muted-foreground mb-8">
          We'll send everything to <span className="font-medium">{email}</span>
        </p>
        <button
          onClick={() => navigate("/step/1")}
          className="text-sm font-medium underline"
          style={{ color: "hsl(var(--wizard-primary))" }}
        >
          ← Back to start
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center min-h-[100dvh] px-4 py-10 overflow-y-auto"
      style={{ backgroundColor: "hsl(var(--wizard-bg))" }}
    >
      {/* Progress */}
      <div className="flex flex-col items-center gap-1.5 mb-8">
        <div className="flex gap-1.5">
          {Array.from({ length: 11 }, (_, i) => (
            <div
              key={i}
              className="h-2 w-6 rounded-full"
              style={{ backgroundColor: "hsl(var(--wizard-primary))" }}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground font-medium">Final step ✓</span>
      </div>

      {/* Heading */}
      <h1 className="text-2xl md:text-3xl font-bold text-center mb-1" style={{ color: "hsl(var(--wizard-primary))" }}>
        Choose how you'd like {name}'s book.
      </h1>
      <p className="text-muted-foreground text-center mb-8 text-sm">
        Both options include the full story and all illustrations.
      </p>

      {/* Cards */}
      <div className="w-full max-w-md flex flex-col gap-4 mb-8">
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
          {/* Badge */}
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
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground mb-8">
        <span>🔒 Secure checkout</span>
        <span>💳 All major cards accepted</span>
        <span>📦 Free shipping on hardcovers over $35</span>
      </div>

      {/* Order form */}
      <div className="w-full max-w-md flex flex-col gap-3">
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl h-12"
        />
        <button
          disabled={!email.includes("@")}
          onClick={() => setOrderPlaced(true)}
          className="w-full h-12 rounded-full text-base font-semibold transition-opacity disabled:opacity-40"
          style={{ backgroundColor: "hsl(142 71% 45%)", color: "#fff" }}
        >
          Place Order — {price}
        </button>
      </div>
    </div>
  );
}
