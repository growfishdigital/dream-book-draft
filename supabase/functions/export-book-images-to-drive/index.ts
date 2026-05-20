// export-book-images-to-drive
//
// Uploads every generated image for a book into Google Drive:
//   <book's existing drive folder>/book_images_<bookId>/
//     portrait-1.png, portrait-2.png, portrait-3.png
//     page-01.png, page-02.png, …
//     cover.png (if present)
//
// Reads `generated_books.drive_folder_id` (created by export-book-to-drive).
// If the manuscript folder doesn't exist yet, invokes export-book-to-drive
// first to create it.
//
// Best-effort, idempotent: rows already stamped with `drive_file_id` are
// skipped. On success, `image_data_url` is cleared to keep the row small.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GD = "https://connector-gateway.lovable.dev/google_drive/drive/v3";
const GD_UPLOAD =
  "https://connector-gateway.lovable.dev/google_drive/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";

function getEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

function escQ(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function gfetch(url: string, init: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getEnv("LOVABLE_API_KEY")}`,
    "X-Connection-Api-Key": getEnv("GOOGLE_DRIVE_API_KEY"),
    ...(init.headers as Record<string, string> | undefined),
  };
  const resp = await fetch(url, { ...init, headers });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`${init.method || "GET"} ${url} → ${resp.status}: ${text.slice(0, 400)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function findFolder(
  name: string,
  parentId: string,
): Promise<string | null> {
  const q =
    `mimeType='${FOLDER_MIME}' and name='${escQ(name)}' ` +
    `and '${parentId}' in parents and trashed=false`;
  const url = `${GD}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=10&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const r = await gfetch(url, { headers: { "Content-Type": "application/json" } });
  return r.files?.[0]?.id ?? null;
}

async function ensureSubfolder(
  name: string,
  parentId: string,
): Promise<{ id: string; webViewLink: string }> {
  const existing = await findFolder(name, parentId);
  if (existing) {
    const meta = await gfetch(
      `${GD}/files/${existing}?fields=id,webViewLink&supportsAllDrives=true`,
      { headers: { "Content-Type": "application/json" } },
    );
    return { id: meta.id, webViewLink: meta.webViewLink };
  }
  return await gfetch(`${GD}/files?fields=id,webViewLink&supportsAllDrives=true`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: FOLDER_MIME, parents: [parentId] }),
  });
}

function dataUrlToBytes(dataUrl: string): { bytes: Uint8Array; mime: string } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) throw new Error("Not a base64 data URL");
  const mime = m[1];
  const b64 = m[2];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, mime };
}

async function uploadImage(
  name: string,
  parentId: string,
  dataUrl: string,
): Promise<{ id: string; webViewLink: string }> {
  const { bytes, mime } = dataUrlToBytes(dataUrl);
  const boundary = "thistle-" + crypto.randomUUID();
  const metadata = JSON.stringify({ name, parents: [parentId], mimeType: mime });

  const enc = new TextEncoder();
  const head = enc.encode(
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    metadata + `\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mime}\r\n\r\n`,
  );
  const tail = enc.encode(`\r\n--${boundary}--\r\n`);

  const body = new Uint8Array(head.length + bytes.length + tail.length);
  body.set(head, 0);
  body.set(bytes, head.length);
  body.set(tail, head.length + bytes.length);

  const resp = await fetch(
    `${GD_UPLOAD}/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getEnv("LOVABLE_API_KEY")}`,
        "X-Connection-Api-Key": getEnv("GOOGLE_DRIVE_API_KEY"),
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  );
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Upload ${name} → ${resp.status}: ${text.slice(0, 400)}`);
  }
  return JSON.parse(text);
}

function fileNameFor(kind: string, slot: number): string {
  if (kind === "portrait") return `portrait-${slot}.png`;
  if (kind === "cover") return `cover.png`;
  return `page-${String(slot).padStart(2, "0")}.png`;
}

async function exportImages(bookId: string, supabase: any) {
  // 1. Resolve the manuscript folder. If missing, fire the manuscript
  // exporter first so the folder tree exists.
  let { data: row, error } = await supabase
    .from("generated_books")
    .select("id,drive_folder_id")
    .eq("id", bookId)
    .maybeSingle();
  if (error) throw new Error(`DB read failed: ${error.message}`);
  if (!row) throw new Error(`Book ${bookId} not found`);

  if (!row.drive_folder_id) {
    try {
      await supabase.functions.invoke("export-book-to-drive", {
        body: { book_id: bookId },
      });
    } catch (e) {
      console.error("Manuscript export pre-step failed:", e);
    }
    const reread = await supabase
      .from("generated_books")
      .select("drive_folder_id")
      .eq("id", bookId)
      .maybeSingle();
    row = reread.data || row;
  }
  if (!row?.drive_folder_id) {
    throw new Error("Book has no Drive folder yet; manuscript export must run first.");
  }

  // 2. Subfolder
  const subfolder = await ensureSubfolder(`book_images_${bookId}`, row.drive_folder_id);

  // 3. Upload every pending image
  const { data: images, error: imgErr } = await supabase
    .from("book_images")
    .select("*")
    .eq("book_id", bookId)
    .eq("status", "ok")
    .order("kind", { ascending: true })
    .order("slot", { ascending: true });
  if (imgErr) throw new Error(`book_images read failed: ${imgErr.message}`);

  const uploaded: any[] = [];
  for (const img of images || []) {
    if (img.drive_file_id) continue;
    if (!img.image_data_url) continue;
    const name = fileNameFor(img.kind, img.slot);
    try {
      const file = await uploadImage(name, subfolder.id, img.image_data_url);
      await supabase
        .from("book_images")
        .update({
          drive_file_id: file.id,
          drive_file_url: file.webViewLink,
          image_data_url: null, // keep the row light
        })
        .eq("id", img.id);
      uploaded.push({ name, file_id: file.id });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Upload failed for ${name}:`, msg);
      await supabase
        .from("book_images")
        .update({ error: msg.slice(0, 500) })
        .eq("id", img.id);
    }
  }

  return {
    folder_id: subfolder.id,
    folder_url: subfolder.webViewLink,
    uploaded_count: uploaded.length,
    uploaded,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let bookId: string | null = null;
  try {
    const body = await req.json();
    bookId = body.book_id || body.bookId;
    if (!bookId) throw new Error("Missing book_id");

    const supabaseUrl = getEnv("SUPABASE_URL");
    const supabaseSrv =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || getEnv("SUPABASE_ANON_KEY");
    const supabase = createClient(supabaseUrl, supabaseSrv);

    const result = await exportImages(bookId, supabase);
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("export-book-images-to-drive error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
