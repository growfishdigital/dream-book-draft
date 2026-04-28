// Generate a single ~100-word kid-friendly story summary using GPT-5-mini.
// Returns { title, summary } via structured tool-call output.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Brief {
  child?: { name?: string; ageRange?: string; gender?: string };
  story?: {
    genre?: string;
    mood?: string;
    lesson?: string;
    interests?: string[];
    customInterest?: string;
  };
  protagonist?: Record<string, unknown>;
  supportingCharacters?: Array<{
    name?: string;
    relationship?: string;
    description?: string;
  }>;
  artStyle?: string;
  cover?: { workingTitle?: string };
  specialThing?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const brief: Brief = body.brief || {};
    const previousSummary: string | undefined = body.previousSummary;

    const childName = brief.child?.name || "the child";
    const ageBand = brief.child?.ageRange || "young";

    const supporting = (brief.supportingCharacters || [])
      .map((c) => {
        const rel = c.relationship?.trim();
        const nm = c.name?.trim();
        if (nm && rel) return `${nm} (${rel})`;
        return nm || rel;
      })
      .filter(Boolean)
      .join(", ");

    const interestsLine = [
      ...(brief.story?.interests || []),
      brief.story?.customInterest,
    ]
      .filter(Boolean)
      .join(", ");

    const userPrompt = [
      `Write a single, complete story summary for a personalized children's book.`,
      ``,
      `Hero: ${childName} (age band: ${ageBand})${
        brief.child?.gender ? `, gender: ${brief.child.gender}` : ""
      }`,
      brief.story?.genre ? `Genre: ${brief.story.genre}` : "",
      brief.story?.mood ? `Mood: ${brief.story.mood}` : "",
      brief.story?.lesson ? `Lesson / theme: ${brief.story.lesson}` : "",
      interestsLine ? `Interests woven in: ${interestsLine}` : "",
      supporting ? `Supporting characters: ${supporting}` : "",
      brief.specialThing ? `Special object/companion: ${brief.specialThing}` : "",
      ``,
      `Requirements:`,
      `- Title: short, warm, kid-appropriate (≤ 60 chars)`,
      `- Summary: ONE paragraph, target ~200 words (hard min 150, hard max 240).`,
      `- Use ${childName}'s name as the hero. Mention supporting characters by name where natural.`,
      `- Voice: warm, gentle, magical — like a parent reading aloud.`,
      `- Hint at the lesson; do NOT spoil the ending.`,
      `- No headings, no bullet lists, no quotation marks around the summary.`,
      previousSummary
        ? `\nThe previous attempt is below — write something distinctly DIFFERENT (different setting, twist, or framing). Do not repeat its opening line.\nPrevious:\n${previousSummary}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const aiResp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5-mini",
          messages: [
            {
              role: "system",
              content:
                "You write personalized children's book summaries. Always call the provided tool to return your output — never reply in plain text.",
            },
            { role: "user", content: userPrompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_story_summary",
                description: "Return a single working title and a ~200-word summary.",
                parameters: {
                  type: "object",
                  properties: {
                    title: {
                      type: "string",
                      description: "Short, kid-friendly working title (max 60 chars).",
                    },
                    summary: {
                      type: "string",
                      description:
                        "Single paragraph, ~200 words (150–240), narrative summary.",
                    },
                  },
                  required: ["title", "summary"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_story_summary" },
          },
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
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call in AI response", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "Model did not return a structured summary." }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const parsed = JSON.parse(argsStr);

    return new Response(
      JSON.stringify({
        title: String(parsed.title || "").slice(0, 80),
        summary: String(parsed.summary || ""),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("generate-summary error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
