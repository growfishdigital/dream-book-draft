// Generate a single book-cover illustration using Gemini 3 Pro Image.
// Uses the uploaded protagonist photo (if provided) for likeness reference.
// Returns { imageDataUrl } as a base64 data URL.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const {
      brief = {},
      title = "",
      summary = "",
      styleReferenceImage,
    }: {
      brief?: any;
      title?: string;
      summary?: string;
      styleReferenceImage?: string;
    } = body;

    const childName = brief.child?.name || "the child";
    const proto = brief.protagonist || {};
    const photoDataUrl: string | undefined = proto.photoDataUrl;

    // Keep this map in sync with src/lib/artStyles.ts — same prompt fragments
    // are used to generate the picker preview images on Step 6, so the cover
    // model receives the exact descriptor the user previewed.
    const ART_STYLE_PROMPTS: Record<string, string> = {
      "watercolor":
        "soft watercolor children's book illustration, hand-painted texture, gentle washes, warm muted palette, paper grain visible, classic storybook feel",
      "cozy-sketch":
        "charming hand-drawn children's book illustration, visible pencil and ink linework, light watercolor wash fill, warm earthy tones, sketchbook feel",
      "bold-bright":
        "modern vibrant children's book illustration, bold black outlines, flat saturated colors, playful punchy palette, contemporary cartoon style",
      "dreamy-pastel":
        "dreamy pastel children's book illustration, soft glowing light, gentle pinks lavenders and creams, ethereal and calm, bedtime story feel",
    };
    const styleHint =
      ART_STYLE_PROMPTS[brief.artStyle as string] ?? ART_STYLE_PROMPTS.watercolor;

    const protoDesc = [
      proto.hair && `hair: ${proto.hair}`,
      proto.skin && `skin tone: ${proto.skin}`,
      proto.eyes && `eyes: ${proto.eyes}`,
      proto.clothing && `clothing: ${proto.clothing}`,
      proto.accessories && `accessories: ${proto.accessories}`,
      proto.vibe && `vibe: ${proto.vibe}`,
    ]
      .filter(Boolean)
      .join(", ");

    const promptText = [
      `Children's book cover illustration in ${styleHint}.`,
      styleReferenceImage
        ? `The FIRST attached image is a STYLE REFERENCE — match its illustration technique, line quality, color palette, and overall finish exactly. Do NOT copy its subject, pose, or composition; only mimic its visual style.`
        : "",
      `Title to display on the cover: "${title}". Render this title text exactly as given — do NOT add the child's name or any first name to the title.`,
      `Hero (depicted in the art only, NOT named in any visible text): ${childName}.${protoDesc ? ` Character details — ${protoDesc}.` : ""}`,
      photoDataUrl
        ? `The ${styleReferenceImage ? "SECOND" : "attached"} image is a likeness reference for the child (face shape, hair, skin tone) — render the child in the chosen art style, not photo-realistically. Keep it kind, warm, and age-appropriate.`
        : "",
      `Scene inspired by: ${summary.slice(0, 600)}`,
      `Composition: portrait orientation (2:3), the title clearly readable at the top or centered, no extra text, no author byline, no watermarks. Do NOT include "${childName}" or any name as visible text on the cover.`,
      `Tone: magical, hopeful, suitable for young children.`,
    ]
      .filter(Boolean)
      .join(" ");

    const userContent: any[] = [{ type: "text", text: promptText }];
    // Order matters — references are introduced in the prompt as FIRST/SECOND.
    if (styleReferenceImage) {
      userContent.push({
        type: "image_url",
        image_url: { url: styleReferenceImage },
      });
    }
    if (photoDataUrl) {
      userContent.push({
        type: "image_url",
        image_url: { url: photoDataUrl },
      });
    }

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-pro-image-preview",
          messages: [{ role: "user", content: userContent }],
          modalities: ["image", "text"],
        }),
      },
    );

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(
          JSON.stringify({
            error: "We're a bit busy — please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "Out of AI credits. Please add credits in Settings → Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const t = await aiResp.text();
      console.error("AI gateway error (cover)", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const imageDataUrl: string | undefined =
      data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageDataUrl) {
      console.error("No image in AI response", JSON.stringify(data).slice(0, 800));
      return new Response(
        JSON.stringify({ error: "Model did not return an image." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ imageDataUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-cover error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
