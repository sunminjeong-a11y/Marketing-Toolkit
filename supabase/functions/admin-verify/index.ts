// POST /functions/v1/admin-verify
// Body: { password }
// Returns: { ok: true, email } on valid login, { error } otherwise.
//
// Looks up an admin row by password alone (any matching admin_emails row wins).

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid JSON" }, 400);
  }

  const password = body?.password;
  if (!password) return jsonResponse({ error: "password required" }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "function env not configured" }, 500);
  }

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/verify_admin_password_only`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ p_password: password }),
  });

  if (!res.ok) return jsonResponse({ error: "verify failed" }, 500);

  const email = await res.json();
  if (!email) return jsonResponse({ error: "invalid password" }, 401);

  return jsonResponse({ ok: true, email });
});
