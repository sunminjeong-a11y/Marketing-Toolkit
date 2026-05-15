// Shared CORS + auth helpers for the admin-* Edge Functions.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-email, x-admin-password",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

export function handleOptions(): Response {
  return new Response("ok", { headers: corsHeaders });
}

// Verifies (email, password) against admin_emails via verify_admin_password RPC.
// Reads credentials from x-admin-email / x-admin-password headers — these are
// sent by AdminPanel.jsx on every privileged call (sessionStorage-backed).
export async function requireAdmin(
  req: Request,
  supabaseUrl: string,
  serviceKey: string,
): Promise<{ ok: true; email: string } | { ok: false; response: Response }> {
  const email = req.headers.get("x-admin-email") ?? "";
  const password = req.headers.get("x-admin-password") ?? "";

  if (!email || !password) {
    return {
      ok: false,
      response: jsonResponse({ error: "missing admin credentials" }, 401),
    };
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

  if (!res.ok) {
    return {
      ok: false,
      response: jsonResponse({ error: "verify failed" }, 500),
    };
  }

  const valid = await res.json();
  if (valid !== true) {
    return {
      ok: false,
      response: jsonResponse({ error: "invalid credentials" }, 401),
    };
  }

  return { ok: true, email };
}

export function env() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in function env");
  }
  return { supabaseUrl, serviceKey };
}
