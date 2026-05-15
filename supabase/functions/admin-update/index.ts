// POST /functions/v1/admin-update  (multipart/form-data)
//
// Fields: id (required), brand, name, type, description,
//         file (optional replacement), thumbnail (optional replacement)
// Headers: x-admin-email, x-admin-password

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

async function deleteObjects(
  supabaseUrl: string,
  serviceKey: string,
  paths: string[],
): Promise<void> {
  if (paths.length === 0) return;
  await fetch(`${supabaseUrl}/storage/v1/object/documents`, {
    method: "DELETE",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ prefixes: paths }),
  });
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

  const id = String(form.get("id") ?? "").trim();
  if (!id) return jsonResponse({ error: "id is required" }, 400);

  const curRes = await fetch(
    `${supabaseUrl}/rest/v1/documents?id=eq.${id}&select=*`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    },
  );
  if (!curRes.ok) return jsonResponse({ error: `fetch current failed: ${await curRes.text()}` }, 500);
  const cur = await curRes.json();
  if (!Array.isArray(cur) || cur.length === 0) return jsonResponse({ error: "document not found" }, 404);
  const current = cur[0];

  const brand = String(form.get("brand") ?? current.brand).trim();
  if (!["school", "teacher", "parent", "brand"].includes(brand)) {
    return jsonResponse({ error: "brand must be school/teacher/parent/brand" }, 400);
  }

  const patch: Record<string, unknown> = {
    brand,
    name: String(form.get("name") ?? current.name).trim(),
    type: String(form.get("type") ?? current.type).trim(),
    description: form.has("description")
      ? String(form.get("description") ?? "").trim() || null
      : current.description,
    updated_at: new Date().toISOString(),
  };

  const oldPathsToDelete: string[] = [];

  const file = form.get("file");
  if (file instanceof File && file.size > 0) {
    const stamp = Date.now();
    const newPath = `${brand}/${stamp}_${safeName(file.name)}`;
    const up = await uploadObject(supabaseUrl, serviceKey, newPath, file);
    if (!up.ok) return jsonResponse({ error: `upload failed: ${up.error}` }, 500);
    patch.file_url = publicUrl(supabaseUrl, newPath);
    patch.storage_path = newPath;
    if (current.storage_path && current.storage_path !== newPath) {
      oldPathsToDelete.push(current.storage_path);
    }
  }

  const thumbnail = form.get("thumbnail");
  if (thumbnail instanceof File && thumbnail.size > 0) {
    const stamp = Date.now();
    const newPath = `${brand}/thumb_${stamp}_${safeName(thumbnail.name)}`;
    const up = await uploadObject(supabaseUrl, serviceKey, newPath, thumbnail);
    if (!up.ok) return jsonResponse({ error: `thumb upload failed: ${up.error}` }, 500);
    patch.thumbnail_url = publicUrl(supabaseUrl, newPath);
    patch.thumbnail_storage_path = newPath;
    if (current.thumbnail_storage_path && current.thumbnail_storage_path !== newPath) {
      oldPathsToDelete.push(current.thumbnail_storage_path);
    }
  }

  const updateRes = await fetch(`${supabaseUrl}/rest/v1/documents?id=eq.${id}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(patch),
  });
  if (!updateRes.ok) return jsonResponse({ error: `update failed: ${await updateRes.text()}` }, 500);
  const [updated] = await updateRes.json();

  await deleteObjects(supabaseUrl, serviceKey, oldPathsToDelete);

  return jsonResponse({ ok: true, document: updated });
});
