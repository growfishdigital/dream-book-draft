import { useEffect, useState } from "react";

export const summaryMessages = (name: string) => [
  `Crafting ${name}'s adventure…`,
  `Bringing their dreams to life…`,
  `Whispering the first words of the story…`,
  `Weaving a little magic, just for ${name}…`,
  `Dreaming up something wonderful…`,
];

export const coverMessages = (name: string) => [
  `Sketching the cover…`,
  `Painting ${name} into the scene…`,
  `Mixing the perfect colors…`,
  `Adding a little extra magic…`,
  `Polishing every illustration…`,
];

export const portraitMessages = (name: string) => [
  `Sketching ${name}…`,
  `Choosing the perfect outfit for ${name}…`,
  `Bringing ${name} to life on the page…`,
  `Adding a little sparkle to ${name}…`,
];

export const genericMessages = [
  "Working a little magic…",
  "Just a moment…",
  "Almost there…",
];

/** Rotate through `messages` every `intervalMs`. */
export function useRotatingMessage(messages: string[], intervalMs = 2200): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setI((n) => (n + 1) % messages.length), intervalMs);
    return () => clearInterval(id);
  }, [messages, intervalMs]);
  return messages[i] ?? "";
}
