// Frontend art-style catalogue used by the Step 6 picker (labels, emojis,
// preview thumbnails).
//
// IMPORTANT: the `prompt` strings below are duplicated in
// `supabase/functions/_shared/prompts.ts` (ART_STYLE_PROMPTS), which is the
// canonical place for ALL backend prompt copy. The duplication exists only
// so the frontend can show preview text without importing from the edge
// function. When you change a `prompt` here, also change it in
// `supabase/functions/_shared/prompts.ts` AND regenerate the matching
// preview in `public/art-styles/{value}.jpg` so the picker reflects what
// the cover model will actually paint.
//
// Legacy slug aliases (kept so in-flight wizard state / old defaults still
// resolve to a valid current style):
//   watercolor      -> cozy-gouache
//   cozy-sketch     -> geometric-pop
//   bold-bright     -> papercraft-collage
//   dreamy-pastel   -> hand-drawn-charm
//   storybook-soft  -> cozy-gouache

export interface ArtStyle {
  value: string;
  label: string;
  emoji: string;
  desc: string;
  /** Style fragment fed verbatim to the image model. */
  prompt: string;
  /** Path under /public for the example thumbnail. */
  preview: string;
}

export const ART_STYLE_ALIASES: Record<string, string> = {
  watercolor: "cozy-gouache",
  "cozy-sketch": "geometric-pop",
  "bold-bright": "papercraft-collage",
  "dreamy-pastel": "hand-drawn-charm",
  "storybook-soft": "cozy-gouache",
};

export const ART_STYLES: ArtStyle[] = [
  {
    value: "cozy-gouache",
    label: "Cozy Gouache",
    emoji: "🎨",
    desc: "Traditional watercolor and gouache with nostalgic charm",
    prompt:
      "painterly children's book illustration in traditional gouache and watercolor on warm cream cold-pressed paper with visible paper grain and soft pigment bleeds; loose visible gouache and watercolor brush strokes throughout — dappled leaf dabs, painterly washes with soft expressive edges, hand-painted texture clearly visible in backgrounds, clothing, and foliage (not flat, not digitally smooth); warm gently saturated storybook palette of soft reds, mustard yellows, bright leaf greens, sky blues, terracotta, and warm browns anchored by a warm cream/butter ground — colorful and inviting, NOT sepia, NOT washed out, NOT desaturated, but also no neon or over-saturation; minimal soft brown linework only where needed for character features and a few key edges, most forms defined by painted shape and color rather than outline, no bold black ink outlines and no heavy sepia overlay; characters have rounded approachable contours with tiny widely-spaced black dot eyes, a subtle curved mouth, and a clear symmetrical round soft rosy cheek patch on each side; timeless vintage rustic clothing (simple dresses, striped sweaters, overalls, small caps); nostalgic, gentle, whimsical mood",
    preview: "/art-styles/cozy-gouache.jpg",
  },
  {
    value: "geometric-pop",
    label: "Geometric Pop",
    emoji: "🔷",
    desc: "Nostalgic flat vector with digital grain and cozy palette",
    prompt:
      "2D digital children's book illustration in geometric textured pop style, flat gouache washes combined with crisp vector art, strictly lineless with no visible outlines, forms defined entirely by clean geometric edges and graphic silhouettes, warm vibrant retro-pop palette balancing high-saturation colors with grounded muted earthy greens and warm mustards, subtle stippled shading, light digital noise and paper grain overlay over flat color blocks, no smooth complex gradients; characters have simplified geometric proportions with slightly larger heads and stylized solid block hair, highly minimalist faces with large simple dark eyes with minimal highlights, distinct rosy stippled cheeks, and soft curved mouths; cheerful cozy wholesome energetic mood; no 3D, no CGI, no photorealism, no black outlines, no line art, no cel shading, no messy brushstrokes, no anime, no complex gradients, no muddy colors",
    preview: "/art-styles/geometric-pop.jpg",
  },
  {
    value: "papercraft-collage",
    label: "Papercraft Collage",
    emoji: "📜",
    desc: "Tactile, hand-crafted paper",
    prompt:
      "authentic hand-crafted cut and torn paper collage children's book illustration, overlapping flat construction paper shapes with absolutely no ink outlines, forms defined entirely by raw fibrous torn and snipped paper edges, warm muted earth tones and soft pastels, pronounced paper grain and visible fibers, subtle natural drop shadows creating shallow tactile layered depth, highly cozy wholesome nostalgic mood; characters have simple round faces, minimalist dotted eyes, rosy circular cheeks, simple curved line smiles, hair constructed from overlapping textured paper shapes; no 3D render, no photorealism, no digital shading, no glossy finish, no neon colors, no visible ink outlines, no sharp vector graphics",
    preview: "/art-styles/papercraft-collage.jpg",
  },
  {
    value: "hand-drawn-charm",
    label: "Hand-Drawn Charm",
    emoji: "✏️",
    desc: "Sketchy dry media with warm paper texture",
    prompt:
      "traditional dry-media children's book illustration using colored pencils, wax crayons, and soft pastels, visible slightly imperfect sketchy graphite or colored pencil outlines that read as clearly hand-drawn, warm cheerful yet gently muted color palette, pronounced rough paper grain with highly visible organic pencil shading and grainy pastel strokes, cozy whimsical innocent nostalgic mood; characters have soft rounded proportions, large dot eyes with subtle highlights, simple curved smiles, distinct round rosy blush patches on the cheeks, and fluffy hair rendered with distinct overlapping pencil strokes; no 3D render, no photorealism, no sharp vector graphics, no digital airbrushing, no heavy ink outlines, no flat colors, no glossy finish",
    preview: "/art-styles/hand-drawn-charm.jpg",
  },
];

/** Resolve a (possibly legacy) slug to a current ART_STYLES value. */
export function resolveArtStyleValue(value: string | undefined): string {
  if (!value) return ART_STYLES[0].value;
  const aliased = ART_STYLE_ALIASES[value] ?? value;
  return ART_STYLES.find((s) => s.value === aliased)?.value ?? ART_STYLES[0].value;
}

export function getArtStylePrompt(value: string | undefined): string {
  const resolved = resolveArtStyleValue(value);
  return (
    ART_STYLES.find((s) => s.value === resolved)?.prompt ?? ART_STYLES[0].prompt
  );
}
