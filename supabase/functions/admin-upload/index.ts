// POST /functions/v1/admin-upload  (multipart/form-data)
//
// Fields: file (required), thumbnail (optional), brand, name, type, description
// Headers: x-admin-email, x-admin-password (verified via verify_admin_password RPC)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-email, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

async function requireAdmin(
  req: Request,
  supabaseUrl: string,
  serviceKey: string,
): Promise<{ ok: true; email: string } | { ok: false; response: Response }> {
  const email = req.headers.get("x-admin-email") ?? "";
  const password = req.headers.get("x-admin-password") ?? "";
  if (!email || !password) {
    return { ok: false, response: jsonResponse({ error: "missing admin credentials" }, 401) };
  }
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/verify_admin_password`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ p_email: email, p_password: password }),
  });
  if (!res.ok) return { ok: false, response: jsonResponse({ error: "verify failed" }, 500) };
  const valid = await res.json();
  if (valid !== true) return { ok: false, response: jsonResponse({ error: "invalid credentials" }, 401) };
  return { ok: true, email };
}

function safeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
}

async function uploadObject(
  supabaseUrl: string,
  serviceKey: string,
  path: string,
  file: File,
): Promise<{ ok: boolean; error?: string }> {
  const buf = await file.arrayBuffer();
  const res = await fetch(
    `${supabaseUrl}/storage/v1/object/documents/${encodeURI(path)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "content-type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: buf,
    },
  );
  if (!res.ok) return { ok: false, error: await res.text() };
  return { ok: true };
}

function publicUrl(supabaseUrl: string, path: string): string {
  return `${supabaseUrl}/storage/v1/object/public/documents/${encodeURI(path)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return jsonResponse({ error: "function env not configured" }, 500);

  const auth = await requireAdmin(req, supabaseUrl, serviceKey);
  if (!auth.ok) return auth.response;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonResponse({ error: "expected multipart/form-data" }, 400);
  }

  const file = form.get("file");
  const thumbnail = form.get("thumbnail");
  const brand = String(form.get("brand") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const type = String(form.get("type") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();

  if (!(file instanceof File)) return jsonResponse({ error: "file is required" }, 400);
  if (!brand || !name || !type) return jsonResponse({ error: "brand, name, type are required" }, 400);
  if (!["school", "teacher", "parent", "brand"].includes(brand)) {
    return jsonResponse({ error: "brand must be school/teacher/parent/brand" }, 400);
  }

  const stamp = Date.now();
  const filePath = `${brand}/${stamp}_${safeName(file.name)}`;
  const up1 = await uploadObject(supabaseUrl, serviceKey, filePath, file);
  if (!up1.ok) return jsonResponse({ error: `upload failed: ${up1.error}` }, 500);

  let thumbPath: string | null = null;
  if (thumbnail instanceof File && thumbnail.size > 0) {
    thumbPath = `${brand}/thumb_${stamp}_${safeName(thumbnail.name)}`;
    const up2 = await uploadObject(supabaseUrl, serviceKey, thumbPath, thumbnail);
    if (!up2.ok) return jsonResponse({ error: `thumb upload failed: ${up2.error}` }, 500);
  }

  const row = {
    brand,
    name,
    type,
    description: description || null,
    file_url: publicUrl(supabaseUrl, filePath),
    storage_path: filePath,
    thumbnail_url: thumbPath ? publicUrl(supabaseUrl, thumbPath) : null,
    thumbnail_storage_path: thumbPath,
    updated_at: new Date().toISOString(),
  };

  const insertRes = await fetch(`${supabaseUrl}/rest/v1/documents`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  if (!insertRes.ok) {
    return jsonResponse({ error: `insert failed: ${await insertRes.text()}` }, 500);
  }

  const [inserted] = await insertRes.json();
  return jsonResponse({ ok: true, document: inserted });
});
