// generate-book-images
//
// Orchestrator that runs the post-purchase image pipeline for a single book:
//   1. Portrait phase — ensure 1–3 canonical character portraits exist
//      (front / side / action), with portrait 1 acting as the anchor
//      reference for portraits 2–3.
//   2. Page phase — sequentially generate every page illustration, using
//      the portraits as anchor references on top of the per-page
//      image_prompt already baked into generated_books.parsed.pages[].
//   3. Drive phase — hand off to export-book-images-to-drive to upload
//      every image into the same Drive folder as the manuscript, in a
//      book_images_<bookId>/ subfolder.
//
// Input: { book_id: string }
// Sequential by design (page images need consistent character likeness).
// Long-running: 30 pages × ~6s ≈ ~3min. If we hit the edge function
// timeout in production we'll shard into per-page invocations.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  CHARACTER_PORTRAIT_PROMPT_TEMPLATE,
  getArtStylePrompt,
  MODELS,
  type PortraitPose,
} from "../_shared/prompts.ts";
import {
  ensureBookImagesSubfolder,
  uploadByKindSlot,
} from "../_shared/driveUpload.ts";

// Fire-and-forget Drive upload for a single (kind, slot). Safe to call
// without awaiting — surface failures only via console + the row's error
// column; the final cleanup pass will re-attempt anything that slipped.
function scheduleDriveUpload(
  supabase: any,
  bookId: string,
  kind: string,
  slot: number,
  parentId: string | null,
): void {
  if (!parentId) return;
  const p = uploadByKindSlot(supabase, bookId, kind, slot, parentId)
    .catch((e) => console.error(`scheduleDriveUpload ${kind}/${slot} threw:`, e));
  // Keep the upload alive past the HTTP response when the runtime supports it.
  const ert = (globalThis as any).EdgeRuntime;
  if (ert && typeof ert.waitUntil === "function") {
    try { ert.waitUntil(p); } catch (_) { /* ignore */ }
  }
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

// ---- AI gateway --------------------------------------------------------

async function callImageModel(
  apiKey: string,
  userContent: any[],
): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODELS.cover,
      messages: [{ role: "user", content: userContent }],
      modalities: ["image", "text"],
    }),
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`AI gateway ${resp.status}: ${t.slice(0, 300)}`);
  }
  const data = await resp.json();
  const url: string | undefined =
    data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) {
    throw new Error("Model did not return an image.");
  }
  return url;
}

function buildProtoDesc(brief: any): string {
  const proto = brief.protagonist || {};
  const app = proto.appearance || {};
  return [
    proto.age && `age: ${proto.age}`,
    proto.gender && `gender: ${proto.gender}`,
    app.hairColor && `hair color: ${app.hairColor}`,
    app.hairStyle && `hair style: ${app.hairStyle}`,
    app.skinTone && `skin tone: ${app.skinTone}`,
    app.glasses && `wears glasses`,
    app.features && `other: ${app.features}`,
    proto.special && `signature detail: ${proto.special}`,
  ].filter(Boolean).join(", ");
}

// ---- DB helpers --------------------------------------------------------

async function setPipeline(
  supabase: any,
  bookId: string,
  status: string,
  progress: Record<string, unknown>,
): Promise<void> {
  await supabase
    .from("generated_books")
    .update({ pipeline_status: status, pipeline_progress: progress })
    .eq("id", bookId);
}

async function upsertImage(
  supabase: any,
  row: {
    book_id: string;
    kind: "portrait" | "page" | "cover";
    slot: number;
    prompt?: string;
    image_data_url?: string;
    status: "pending" | "ok" | "failed";
    error?: string;
    generated_ms?: number;
  },
): Promise<void> {
  await supabase.from("book_images").upsert(row, {
    onConflict: "book_id,kind,slot",
  });
}

// ---- Pipeline phases ---------------------------------------------------

interface PortraitsResult {
  anchor: string;          // portrait 1 data URL
  references: string[];    // [p1, p2?, p3?] for downstream page generation
}

async function ensurePortraits(
  supabase: any,
  bookId: string,
  brief: any,
  seedPortrait: string | null,
  apiKey: string,
  subfolderId: string | null,
): Promise<PortraitsResult> {
  const proto = brief.protagonist || {};
  const photos: string[] = Array.isArray(proto.photos)
    ? proto.photos.filter(
        (p: unknown) => typeof p === "string" && (p as string).startsWith("data:"),
      )
    : [];

  // Reuse anything we already have from a previous run.
  const { data: existing } = await supabase
    .from("book_images")
    .select("slot,image_data_url,status")
    .eq("book_id", bookId)
    .eq("kind", "portrait");

  const slotData = new Map<number, string>();
  for (const r of existing || []) {
    if (r.status === "ok" && r.image_data_url) slotData.set(r.slot, r.image_data_url);
  }

  const styleHint = getArtStylePrompt(brief.artStyle);
  const childName = brief.child?.name || "the child";
  const protoDesc = buildProtoDesc(brief);
  const interests: string[] = Array.isArray(brief.story?.interests)
    ? brief.story.interests
    : [];
  const interestPhrase = interests.slice(0, 2).join(" and ") || undefined;

  const totalSlots = Math.max(1, Math.min(3, photos.length || 1));
  await setPipeline(supabase, bookId, "portraits", {
    stage: "portraits",
    current: slotData.size,
    total: totalSlots,
    message: "Creating character portraits…",
  });

  // ---- Portrait 1 (anchor) -------------------------------------------
  let anchor = slotData.get(1) || seedPortrait || null;
  if (!anchor) {
    const promptText = CHARACTER_PORTRAIT_PROMPT_TEMPLATE({
      childName, protoDesc, styleHint,
      heroPhotoCount: photos.length, pose: "front",
    });
    const userContent: any[] = [{ type: "text", text: promptText }];
    for (const url of photos) {
      userContent.push({ type: "image_url", image_url: { url } });
    }
    const started = Date.now();
    try {
      anchor = await callImageModel(apiKey, userContent);
      await upsertImage(supabase, {
        book_id: bookId, kind: "portrait", slot: 1,
        prompt: promptText, image_data_url: anchor,
        status: "ok", generated_ms: Date.now() - started,
      });
      scheduleDriveUpload(supabase, bookId, "portrait", 1, subfolderId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await upsertImage(supabase, {
        book_id: bookId, kind: "portrait", slot: 1,
        prompt: promptText, status: "failed", error: msg,
      });
      throw new Error(`Portrait 1 failed: ${msg}`);
    }
  } else if (!slotData.has(1)) {
    // Seeded from the wizard's existing characterPortrait — persist it.
    await upsertImage(supabase, {
      book_id: bookId, kind: "portrait", slot: 1,
      prompt: "(seeded from Step 6 background portrait)",
      image_data_url: anchor, status: "ok",
    });
    scheduleDriveUpload(supabase, bookId, "portrait", 1, subfolderId);
  }

  await setPipeline(supabase, bookId, "portraits", {
    stage: "portraits", current: 1, total: totalSlots,
    message: "Sketching alternate poses…",
  });

  // ---- Portraits 2 & 3 (alt poses) -----------------------------------
  const references: string[] = [anchor!];
  const altPoses: { slot: number; pose: PortraitPose; photoIdx: number }[] = [
    { slot: 2, pose: "side",   photoIdx: 1 },
    { slot: 3, pose: "action", photoIdx: 2 },
  ];
  for (const { slot, pose, photoIdx } of altPoses) {
    if (photos.length <= photoIdx) break;
    if (slotData.has(slot)) {
      references.push(slotData.get(slot)!);
      continue;
    }
    const photo = photos[photoIdx];
    const promptText = CHARACTER_PORTRAIT_PROMPT_TEMPLATE({
      childName, protoDesc, styleHint,
      heroPhotoCount: 1, pose,
      interestPhrase, hasAnchorPortrait: true,
    });
    const userContent: any[] = [
      { type: "text", text: promptText },
      { type: "image_url", image_url: { url: anchor } },
      { type: "image_url", image_url: { url: photo } },
    ];
    const started = Date.now();
    try {
      const url = await callImageModel(apiKey, userContent);
      await upsertImage(supabase, {
        book_id: bookId, kind: "portrait", slot,
        prompt: promptText, image_data_url: url,
        status: "ok", generated_ms: Date.now() - started,
      });
      references.push(url);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Portrait ${slot} failed:`, msg);
      await upsertImage(supabase, {
        book_id: bookId, kind: "portrait", slot,
        prompt: promptText, status: "failed", error: msg,
      });
      // Non-fatal — page generation will fall back to fewer references.
    }
    await setPipeline(supabase, bookId, "portraits", {
      stage: "portraits", current: slot, total: totalSlots,
      message: "Sketching alternate poses…",
    });
  }

  return { anchor: anchor!, references };
}

const MAX_RUN_MS = 50_000;
const MAX_CONSECUTIVE_PAGE_FAILURES = 3;

interface GeneratePagesResult {
  remaining: number;
  fatal?: string;
}

async function generatePages(
  supabase: any,
  bookId: string,
  parsed: any,
  references: string[],
  apiKey: string,
  deadline: number,
): Promise<GeneratePagesResult> {
  const pages = Array.isArray(parsed?.pages) ? parsed.pages : [];
  const targets = pages.filter((p: any) => p.image_prompt);
  const total = targets.length;

  // Reuse any previously-succeeded pages.
  const { data: existing } = await supabase
    .from("book_images")
    .select("slot,status")
    .eq("book_id", bookId)
    .eq("kind", "page");
  const done = new Set<number>(
    (existing || []).filter((r: any) => r.status === "ok").map((r: any) => r.slot),
  );

  await setPipeline(supabase, bookId, "pages", {
    stage: "pages", current: done.size, total,
    message: `Painting page ${done.size + 1} of ${total}…`,
  });

  const anchorPreamble =
    references.length > 1
      ? `Use Image #1 as the canonical character appearance reference (face, hair, body, outfit). Images #2${references.length > 2 ? "–#" + references.length : ""} are alternate poses of the SAME character — use them only to inform pose variety and body proportions.`
      : `Use Image #1 as the canonical character appearance reference (face, hair, body, outfit).`;

  let completed = done.size;
  let consecutiveFailures = 0;
  let lastError: string | undefined;

  for (const page of targets) {
    if (done.has(page.page_number)) continue;
    if (Date.now() > deadline) {
      // Out of time budget; let the chained invocation pick up the rest.
      break;
    }
    const promptText = `${anchorPreamble}\n\n${page.image_prompt}`;
    const userContent: any[] = [{ type: "text", text: promptText }];
    for (const url of references) {
      userContent.push({ type: "image_url", image_url: { url } });
    }
    const started = Date.now();
    try {
      const url = await callImageModel(apiKey, userContent);
      await upsertImage(supabase, {
        book_id: bookId, kind: "page", slot: page.page_number,
        prompt: promptText, image_data_url: url,
        status: "ok", generated_ms: Date.now() - started,
      });
      consecutiveFailures = 0;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Page ${page.page_number} failed:`, msg);
      lastError = msg;
      consecutiveFailures += 1;
      await upsertImage(supabase, {
        book_id: bookId, kind: "page", slot: page.page_number,
        prompt: promptText, status: "failed", error: msg,
      });
      if (consecutiveFailures >= MAX_CONSECUTIVE_PAGE_FAILURES) {
        return { remaining: -1, fatal: `Page generation aborted after ${consecutiveFailures} consecutive failures. Last error: ${msg}` };
      }
    }
    completed += 1;
    await setPipeline(supabase, bookId, "pages", {
      stage: "pages", current: completed, total,
      message: `Painting page ${Math.min(completed + 1, total)} of ${total}…`,
    });
  }

  // Recompute remaining from DB to be authoritative.
  const { data: after } = await supabase
    .from("book_images")
    .select("slot,status")
    .eq("book_id", bookId)
    .eq("kind", "page");
  const okSlots = new Set<number>(
    (after || []).filter((r: any) => r.status === "ok").map((r: any) => r.slot),
  );
  const remaining = targets.filter((p: any) => !okSlots.has(p.page_number)).length;
  return { remaining, fatal: undefined };
}


// ---- Handler -----------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let bookId: string | null = null;
  let supabase: any = null;
  try {
    const apiKey = getEnv("LOVABLE_API_KEY");
    const body = await req.json();
    bookId = body.book_id || body.bookId;
    const seedPortrait: string | null = body.seed_portrait_data_url || null;
    if (!bookId) throw new Error("Missing book_id");

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseSrv =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_ANON_KEY");
    supabase = createClient(supabaseUrl, supabaseSrv);

    const { data: row, error } = await supabase
      .from("generated_books")
      .select("id,brief,parsed")
      .eq("id", bookId)
      .maybeSingle();
    if (error) throw new Error(`DB read failed: ${error.message}`);
    if (!row) throw new Error(`Book ${bookId} not found`);
    if (!row.parsed) throw new Error("Book has no parsed payload yet.");

    const startedAt = Date.now();
    const deadline = startedAt + MAX_RUN_MS;

    // 1. Portraits
    const { references } = await ensurePortraits(
      supabase, bookId, row.brief || {}, seedPortrait, apiKey,
    );

    // 2. Pages (time-budgeted slice)
    const { remaining, fatal } = await generatePages(
      supabase, bookId, row.parsed, references, apiKey, deadline,
    );

    if (fatal) {
      await supabase
        .from("generated_books")
        .update({ pipeline_status: "failed", pipeline_error: fatal.slice(0, 1000) })
        .eq("id", bookId);
      return new Response(
        JSON.stringify({ ok: false, error: fatal }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (remaining > 0) {
      // More pages to do — hand off to a fresh invocation.
      try {
        void supabase.functions.invoke("generate-book-images", {
          body: { book_id: bookId },
        });
      } catch (e) {
        console.error("Self-chain invoke threw:", e);
      }
      return new Response(
        JSON.stringify({ ok: true, book_id: bookId, continued: true, remaining }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Drive export (best-effort) — only when all pages are done.
    let exportResult: any = null;
    try {
      const { data, error: invErr } = await supabase.functions.invoke(
        "export-book-images-to-drive",
        { body: { book_id: bookId } },
      );
      if (invErr) console.error("Drive image export invoke error:", invErr);
      exportResult = data ?? null;
    } catch (e) {
      console.error("Drive image export threw:", e);
    }

    await setPipeline(supabase, bookId, "done", {
      stage: "done", current: 1, total: 1, message: "All done!",
    });

    return new Response(
      JSON.stringify({ ok: true, book_id: bookId, done: true, drive_export: exportResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("generate-book-images error:", msg);
    if (bookId && supabase) {
      try {
        await supabase
          .from("generated_books")
          .update({
            pipeline_status: "failed",
            pipeline_error: msg.slice(0, 1000),
          })
          .eq("id", bookId);
      } catch (_) { /* ignore */ }
    }
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
