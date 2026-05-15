import { useEffect, useState } from "react";

// Use the same Supabase project the rest of the app talks to.
const SUPABASE_URL = "https://rxokrzsbfnttgchketde.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4b2tyenNiZm50dGdjaGtldGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjY3MDEsImV4cCI6MjA4ODgwMjcwMX0.EGgeE47oDvVv1-OxH2P7a9kG5R5_SdTGSTIVWruDNes";

const FN_BASE = `${SUPABASE_URL}/functions/v1`;
const SS_EMAIL = "sl_admin_email";
const SS_PASS = "sl_admin_pass";

const BRANDS = [
  { id: "school", label: "School" },
  { id: "teacher", label: "Teacher" },
  { id: "parent", label: "Parent" },
  { id: "brand", label: "Brand" },
];

const MAX_FILE_MB = 50;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

const FONT = "'Pretendard Variable','Pretendard',sans-serif";

// ── auth helpers ────────────────────────────────────────────────────────────
function getCreds() {
  return {
    email: sessionStorage.getItem(SS_EMAIL) || "",
    password: sessionStorage.getItem(SS_PASS) || "",
  };
}
function setCreds(email, password) {
  sessionStorage.setItem(SS_EMAIL, email);
  sessionStorage.setItem(SS_PASS, password);
}
function clearCreds() {
  sessionStorage.removeItem(SS_EMAIL);
  sessionStorage.removeItem(SS_PASS);
}
function adminHeaders() {
  const { email, password } = getCreds();
  return {
    apikey: SUPABASE_ANON,
    Authorization: `Bearer ${SUPABASE_ANON}`,
    "x-admin-email": email,
    "x-admin-password": password,
  };
}

// ── network ────────────────────────────────────────────────────────────────
async function verifyLogin(password) {
  const res = await fetch(`${FN_BASE}/admin-verify`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON,
      Authorization: `Bearer ${SUPABASE_ANON}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error || `login failed (${res.status})`);
  }
  // returns { ok: true, email }
  return res.json();
}

async function listDocuments() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/documents?select=*&order=updated_at.desc`,
    {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
    },
  );
  if (!res.ok) throw new Error(`list failed (${res.status})`);
  return res.json();
}

async function uploadDocument(fields) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) continue;
    fd.append(k, v);
  }
  const res = await fetch(`${FN_BASE}/admin-upload`, {
    method: "POST",
    headers: adminHeaders(), // do NOT set content-type — browser sets multipart boundary
    body: fd,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `upload failed (${res.status})`);
  return j;
}

async function updateDocument(fields) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v === null || v === undefined) continue;
    fd.append(k, v);
  }
  const res = await fetch(`${FN_BASE}/admin-update`, {
    method: "POST",
    headers: adminHeaders(),
    body: fd,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `update failed (${res.status})`);
  return j;
}

async function deleteDocument(id) {
  const res = await fetch(`${FN_BASE}/admin-delete`, {
    method: "POST",
    headers: { ...adminHeaders(), "content-type": "application/json" },
    body: JSON.stringify({ id }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `delete failed (${res.status})`);
  return j;
}

// ── shared styles ───────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 14px",
  border: "1.5px solid #e8e8e4",
  borderRadius: 8,
  fontFamily: FONT,
  fontSize: 14,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontFamily: FONT,
  fontSize: 12,
  fontWeight: 600,
  color: "#555",
  marginBottom: 6,
  letterSpacing: "0.02em",
};

function primaryBtn(disabled = false) {
  return {
    background: disabled ? "#9DD9C9" : "#0FB896",
    color: "#fff",
    border: "none",
    borderRadius: 100,
    padding: "10px 22px",
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "background 0.2s",
  };
}

function ghostBtn() {
  return {
    background: "#fff",
    color: "#1a1a1a",
    border: "1.5px solid #e8e8e4",
    borderRadius: 100,
    padding: "9px 18px",
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "border-color 0.2s",
  };
}

// ── Login screen ───────────────────────────────────────────────────────────
function LoginScreen({ onLoggedIn }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { email } = await verifyLogin(password);
      // store the email returned by the backend — subsequent admin-*
      // calls still send x-admin-email + x-admin-password headers
      setCreds(email, password);
      onLoggedIn();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 20px",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          background: "#fff",
          border: "1.5px solid #e8e8e4",
          borderRadius: 16,
          padding: "36px 32px",
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
        }}
      >
        <h1
          style={{
            fontFamily: "'SUIT Variable','SUIT',sans-serif",
            fontSize: 24,
            fontWeight: 900,
            color: "#0E2A22",
            margin: "0 0 8px",
          }}
        >
          Admin Login
        </h1>
        <p
          style={{
            fontFamily: FONT,
            fontSize: 13,
            color: "#888",
            margin: "0 0 24px",
          }}
        >
          Authorized administrators only.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Password</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            style={inputStyle}
          />
        </div>

        {err && (
          <div
            style={{
              background: "#FFF1F0",
              color: "#A8071A",
              borderRadius: 8,
              padding: "10px 12px",
              fontFamily: FONT,
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {err}
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          style={{ ...primaryBtn(busy), width: "100%" }}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </section>
  );
}

// ── Document form (used for both Create and Edit) ───────────────────────────
function DocumentForm({ initial, onCancel, onSaved }) {
  const isEdit = !!initial?.id;
  const [brand, setBrand] = useState(initial?.brand || "school");
  const [type, setType] = useState(initial?.type || "");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!isEdit && !file) {
      setErr("File is required for a new document.");
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setErr(`File exceeds the ${MAX_FILE_MB} MB limit (got ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    if (thumbnail && thumbnail.size > MAX_FILE_BYTES) {
      setErr(`Thumbnail exceeds the ${MAX_FILE_MB} MB limit.`);
      return;
    }
    setBusy(true);
    try {
      const fields = { brand, type, name, description };
      if (file) fields.file = file;
      if (thumbnail) fields.thumbnail = thumbnail;
      if (isEdit) {
        fields.id = initial.id;
        await updateDocument(fields);
      } else {
        await uploadDocument(fields);
      }
      onSaved();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{
        background: "#fff",
        border: "1.5px solid #e8e8e4",
        borderRadius: 16,
        padding: 28,
        marginBottom: 24,
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <h2
          style={{
            fontFamily: "'SUIT Variable','SUIT',sans-serif",
            fontSize: 18,
            fontWeight: 800,
            color: "#0E2A22",
            margin: 0,
          }}
        >
          {isEdit ? "Edit document" : "Upload new document"}
        </h2>
        <button type="button" onClick={onCancel} style={ghostBtn()}>
          Cancel
        </button>
      </div>
      <p
        style={{
          fontFamily: FONT,
          fontSize: 12,
          color: "#888",
          margin: "0 0 20px",
        }}
      >
        Maximum file size: {MAX_FILE_MB} MB (applies to both file and thumbnail).
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 14,
        }}
      >
        <div>
          <label style={labelStyle}>Brand</label>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            style={inputStyle}
          >
            {BRANDS.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Type (e.g. Guide, Template)</label>
          <input
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Title</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: FONT }}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
          <label style={labelStyle}>
            File {isEdit && <span style={{ color: "#aaa" }}>(replace, optional)</span>}
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ ...inputStyle, padding: 8 }}
          />
          {isEdit && initial?.file_url && (
            <a
              href={initial.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 12,
                color: "#0FB896",
                wordBreak: "break-all",
              }}
            >
              current ↗
            </a>
          )}
        </div>
        <div>
          <label style={labelStyle}>
            Thumbnail{" "}
            <span style={{ color: "#aaa" }}>(image, optional)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
            style={{ ...inputStyle, padding: 8 }}
          />
          {isEdit && initial?.thumbnail_url && (
            <a
              href={initial.thumbnail_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                marginTop: 6,
                fontSize: 12,
                color: "#0FB896",
                wordBreak: "break-all",
              }}
            >
              current ↗
            </a>
          )}
        </div>
      </div>

      {err && (
        <div
          style={{
            background: "#FFF1F0",
            color: "#A8071A",
            borderRadius: 8,
            padding: "10px 12px",
            fontFamily: FONT,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {err}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button type="submit" disabled={busy} style={primaryBtn(busy)}>
          {busy ? "Saving…" : isEdit ? "Save changes" : "Upload"}
        </button>
      </div>
    </form>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ onLogout }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // doc row, or "new"
  const [filter, setFilter] = useState("all");
  const [err, setErr] = useState("");

  const refresh = async () => {
    setLoading(true);
    setErr("");
    try {
      setDocs(await listDocuments());
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered =
    filter === "all" ? docs : docs.filter((d) => d.brand === filter);

  const onDelete = async (doc) => {
    if (!confirm(`Delete "${doc.name}"?\nThis removes the file from storage too.`))
      return;
    try {
      await deleteDocument(doc.id);
      refresh();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <section
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "32px clamp(20px,4vw,48px)",
        minHeight: "70vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'SUIT Variable','SUIT',sans-serif",
              fontSize: 28,
              fontWeight: 900,
              color: "#0E2A22",
              margin: 0,
            }}
          >
            Admin Dashboard
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setEditing("new")}
            style={primaryBtn(false)}
          >
            + Upload
          </button>
          <button onClick={onLogout} style={ghostBtn()}>
            Sign out
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        {[{ id: "all", label: "All" }, ...BRANDS].map((b) => (
          <button
            key={b.id}
            onClick={() => setFilter(b.id)}
            style={{
              background: filter === b.id ? "#0E2A22" : "#fff",
              color: filter === b.id ? "#EEF8F3" : "#555",
              border: "1.5px solid",
              borderColor: filter === b.id ? "#0E2A22" : "#e8e8e4",
              borderRadius: 100,
              padding: "6px 14px",
              fontFamily: FONT,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.18s",
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      {editing === "new" && (
        <DocumentForm
          initial={null}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}
      {editing && editing !== "new" && (
        <DocumentForm
          initial={editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
          }}
        />
      )}

      {err && (
        <div
          style={{
            background: "#FFF1F0",
            color: "#A8071A",
            borderRadius: 8,
            padding: "10px 12px",
            fontFamily: FONT,
            fontSize: 13,
            marginBottom: 16,
          }}
        >
          {err}
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#0FB896",
            fontFamily: FONT,
          }}
        >
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            color: "#999",
            fontFamily: FONT,
            background: "#fff",
            border: "1.5px dashed #e8e8e4",
            borderRadius: 16,
          }}
        >
          No documents yet.
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            border: "1.5px solid #e8e8e4",
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {filtered.map((d, i) => (
            <div
              key={d.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 18px",
                borderTop: i === 0 ? "none" : "1px solid #f0f0ec",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  background: "#F4F8F6",
                  flexShrink: 0,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {d.thumbnail_url ? (
                  <img
                    src={d.thumbnail_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 11, color: "#aaa" }}>—</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#1a1a1a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.name}
                </div>
                <div
                  style={{
                    fontFamily: FONT,
                    fontSize: 12,
                    color: "#888",
                    marginTop: 2,
                  }}
                >
                  {d.brand} · {d.type}
                  {d.updated_at && " · " + d.updated_at.slice(0, 10)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={() => setEditing(d)} style={ghostBtn()}>
                  Edit
                </button>
                <button
                  onClick={() => onDelete(d)}
                  style={{
                    ...ghostBtn(),
                    color: "#A8071A",
                    borderColor: "#F5C2C0",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Public component ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const [authed, setAuthed] = useState(!!getCreds().email && !!getCreds().password);

  const logout = () => {
    clearCreds();
    setAuthed(false);
  };

  return authed ? (
    <Dashboard onLogout={logout} />
  ) : (
    <LoginScreen onLoggedIn={() => setAuthed(true)} />
  );
}
