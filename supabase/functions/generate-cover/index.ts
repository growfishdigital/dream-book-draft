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
    }: {
      brief?: any;
      title?: string;
      summary?: string;
    } = body;

    const childName = brief.child?.name || "the child";
    const proto = brief.protagonist || {};
    const photoDataUrl: string | undefined = proto.photoDataUrl;

    const styleHint =
      brief.artStyle === "watercolor"
        ? "soft watercolor children's book illustration, warm palette, gentle washes"
        : brief.artStyle === "cartoon"
          ? "modern cartoon children's book illustration, bold outlines, cheerful palette"
          : brief.artStyle === "pastel"
            ? "soft pastel children's book illustration, dreamy and gentle"
            : brief.artStyle === "realistic"
              ? "semi-realistic painterly children's book illustration"
              : "warm children's book illustration";

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
      `Title to display: "${title}".`,
      `Hero: ${childName}.${protoDesc ? ` Character details — ${protoDesc}.` : ""}`,
      photoDataUrl
        ? `Use the attached reference photo for the child's likeness (face shape, hair, skin tone). Keep it kind, warm, and age-appropriate.`
        : "",
      `Scene inspired by: ${summary.slice(0, 600)}`,
      `Composition: portrait orientation (2:3), the title clearly readable at the top or centered, no extra text, no watermarks.`,
      `Tone: magical, hopeful, suitable for young children.`,
    ]
      .filter(Boolean)
      .join(" ");

    const userContent: any[] = [{ type: "text", text: promptText }];
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
