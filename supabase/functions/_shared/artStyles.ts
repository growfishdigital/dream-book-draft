// Shared art-style fragments for cover, book, and image prompts.
// Frontend style picker has matching labels; keep values in sync when changed.

export const ART_STYLE_PROMPTS: Record<string, string> = {
  watercolor:
    "soft watercolor children's book illustration, hand-painted texture, gentle washes, warm muted palette, paper grain visible, classic storybook feel",
  "cozy-sketch":
    "charming hand-drawn children's book illustration, visible pencil and ink linework, light watercolor wash fill, warm earthy tones, sketchbook feel",
  "bold-bright":
    "modern vibrant children's book illustration, bold black outlines, flat saturated colors, playful punchy palette, contemporary cartoon style",
  "dreamy-pastel":
    "dreamy pastel children's book illustration, soft glowing light, gentle pinks lavenders and creams, ethereal and calm, bedtime story feel",
  "storybook-soft":
    "warm contemporary children's book illustration, soft painterly texture, clean readable shapes, expressive characters, gentle storybook lighting",
};

export function getArtStylePrompt(value: string | undefined): string {
  return (value && ART_STYLE_PROMPTS[value]) || ART_STYLE_PROMPTS.watercolor;
}
