// POST /functions/v1/admin-delete
// Body: { id: <uuid> }
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return jsonResponse({ error: "function env not configured" }, 500);

  const auth = await requireAdmin(req, supabaseUrl, serviceKey);
  if (!auth.ok) return auth.response;

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid JSON" }, 400);
  }

  const id = (body.id ?? "").trim();
  if (!id) return jsonResponse({ error: "id is required" }, 400);

  const curRes = await fetch(
    `${supabaseUrl}/rest/v1/documents?id=eq.${id}&select=storage_path,thumbnail_storage_path`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  );
  if (!curRes.ok) return jsonResponse({ error: `fetch current failed: ${await curRes.text()}` }, 500);
  const cur = await curRes.json();
  if (!Array.isArray(cur) || cur.length === 0) return jsonResponse({ error: "document not found" }, 404);
  const { storage_path, thumbnail_storage_path } = cur[0];

  const delRes = await fetch(`${supabaseUrl}/rest/v1/documents?id=eq.${id}`, {
    method: "DELETE",
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!delRes.ok) return jsonResponse({ error: `delete failed: ${await delRes.text()}` }, 500);

  const paths: string[] = [];
  if (storage_path) paths.push(storage_path);
  if (thumbnail_storage_path) paths.push(thumbnail_storage_path);
  await deleteObjects(supabaseUrl, serviceKey, paths);

  return jsonResponse({ ok: true, id });
});
