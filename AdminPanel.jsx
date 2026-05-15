// AdminPanel.jsx
// StoryLine Toolkit · Admin 패널 (단일 파일)
// App.jsx에서 import 해서 라우팅에 끼우기만 하면 됨.
//
//   import AdminPanel from "./AdminPanel";
//   ...
//   {page === "admin" && (
//     <AdminPanel SUPABASE_URL={SUPABASE_URL} SUPABASE_ANON={SUPABASE_ANON} onBack={() => setPage("home")} />
//   )}

import { useEffect, useMemo, useRef, useState } from "react";

const FF = "'Pretendard Variable','Pretendard',sans-serif";
const FF_DISPLAY = "'SUIT Variable','SUIT',sans-serif";

const BRANDS = [
  { id: "school", label: "School Kit", icon: "🎓" },
  { id: "teacher", label: "Teacher Kit", icon: "📖" },
  { id: "parent", label: "Parent Kit", icon: "👥" },
  { id: "brand", label: "Brand Kit", icon: "📡" },
];

const TYPE_PRESETS = [
  "Guide",
  "Template",
  "Resource",
  "Kit",
  "Guideline",
  "Video",
  "Asset",
];

const SESSION_KEY = "storyline_admin_session_v1";

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function saveSession(s) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ===================================================================
// Toast
// ===================================================================
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, toast.type === "error" ? 4500 : 2800);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  const bg = toast.type === "error" ? "#fef2f2" : "#ecfdf5";
  const border = toast.type === "error" ? "#fecaca" : "#a7f3d0";
  const color = toast.type === "error" ? "#991b1b" : "#065f46";
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        background: bg,
        border: `1.5px solid ${border}`,
        color,
        padding: "12px 20px",
        borderRadius: 12,
        fontFamily: FF,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        maxWidth: 360,
      }}
    >
      {toast.message}
    </div>
  );
}

// ===================================================================
// Login Form
// ===================================================================
function AdminLoginForm({ SUPABASE_URL, SUPABASE_ANON, onLoggedIn, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e?.preventDefault?.();
    setError("");
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Login failed.");
        setLoading(false);
        return;
      }
      saveSession({ email: data.email, password });
      onLoggedIn({ email: data.email, password });
    } catch (err) {
      setError("Network error: " + err.message);
      setLoading(false);
    }
  };

  const input = (focused) => ({
    width: "100%",
    padding: "13px 16px",
    borderRadius: 10,
    border: focused ? "1.5px solid #0FB896" : "1.5px solid #e5e7eb",
    fontFamily: FF,
    fontSize: 14,
    color: "#111827",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  });

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "#F8FAF9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "40px 36px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 4px 28px rgba(0,0,0,0.06)",
          border: "1px solid #eef0ee",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "#E8FDF6",
            border: "1.5px solid #C8F5E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            marginBottom: 20,
          }}
        >
          🔐
        </div>
        <h1
          style={{
            fontFamily: FF_DISPLAY,
            fontSize: 24,
            fontWeight: 900,
            color: "#111827",
            margin: 0,
            marginBottom: 6,
          }}
        >
          Admin Sign in
        </h1>
        <p
          style={{
            fontFamily: FF,
            fontSize: 14,
            color: "#6b7280",
            margin: 0,
            marginBottom: 28,
          }}
        >
          Whitelisted admins only. Contact your team for access.
        </p>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label
              style={{
                display: "block",
                fontFamily: FF,
                fontSize: 12,
                fontWeight: 700,
                color: "#374151",
                marginBottom: 6,
                letterSpacing: "0.02em",
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              placeholder="you@playtag.ai"
              style={input(false)}
              onFocus={(e) =>
                (e.target.style.borderColor = "#0FB896")
              }
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: "block",
                fontFamily: FF,
                fontSize: 12,
                fontWeight: 700,
                color: "#374151",
                marginBottom: 6,
                letterSpacing: "0.02em",
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={input(false)}
              onFocus={(e) =>
                (e.target.style.borderColor = "#0FB896")
              }
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>
          {error && (
            <div
              style={{
                fontFamily: FF,
                fontSize: 13,
                color: "#b91c1c",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                padding: "10px 14px",
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#9ca3af" : "#0E2A22",
              color: "#fff",
              border: "none",
              borderRadius: 100,
              padding: "13px 24px",
              fontFamily: FF,
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "default" : "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = "#0FB896";
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = "#0E2A22";
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "block",
            margin: "20px auto 0",
            background: "none",
            border: "none",
            color: "#6b7280",
            fontFamily: FF,
            fontSize: 13,
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          ← Back to site
        </button>
      </div>
    </div>
  );
}

// ===================================================================
// Upload / Edit form (shared)
// ===================================================================
function DocumentForm({
  mode, // 'create' | 'edit'
  initial,
  defaultBrand,
  onSubmit,
  onCancel,
  submitting,
}) {
  const [brand, setBrand] = useState(initial?.brand || defaultBrand || "school");
  const [type, setType] = useState(initial?.type || "Guide");
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [file, setFile] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1.5px solid #e5e7eb",
    fontFamily: FF,
    fontSize: 14,
    color: "#111827",
    outline: "none",
    background: "#fff",
    boxSizing: "border-box",
  };

  const submit = (e) => {
    e?.preventDefault?.();
    if (!name.trim()) {
      alert("Title is required.");
      return;
    }
    onSubmit({ brand, type, name: name.trim(), description, file, thumbnail });
  };

  const label = {
    display: "block",
    fontFamily: FF,
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    marginBottom: 6,
    letterSpacing: "0.02em",
  };

  const fileBox = (current) => ({
    border: "1.5px dashed #cbd5e1",
    borderRadius: 10,
    padding: "14px 16px",
    fontFamily: FF,
    fontSize: 13,
    color: "#475569",
    background: "#f8fafc",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 10,
  });

  return (
    <form onSubmit={submit}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <div>
          <label style={label}>Kit</label>
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
          <label style={label}>Type</label>
          <input
            list="type-presets"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={inputStyle}
            placeholder="Guide / Template / Resource …"
          />
          <datalist id="type-presets">
            {TYPE_PRESETS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={label}>Title *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={inputStyle}
          placeholder="StoryLine Overview for Schools"
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <label style={label}>Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
          placeholder="Short description shown on the card."
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={label}>
            File {mode === "edit" && <span style={{ color: "#9ca3af", fontWeight: 500 }}>(leave empty to keep)</span>}
          </label>
          <label style={fileBox(file)}>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <span style={{ fontSize: 16 }}>📎</span>
            <span style={{ flex: 1, color: file ? "#111827" : "#94a3b8" }}>
              {file ? file.name : "Choose file"}
            </span>
            {file && (
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {(file.size / 1024).toFixed(1)} KB
              </span>
            )}
          </label>
        </div>
        <div>
          <label style={label}>
            Thumbnail {mode === "edit" && <span style={{ color: "#9ca3af", fontWeight: 500 }}>(leave empty to keep)</span>}
          </label>
          <label style={fileBox(thumbnail)}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
            <span style={{ fontSize: 16 }}>🖼️</span>
            <span style={{ flex: 1, color: thumbnail ? "#111827" : "#94a3b8" }}>
              {thumbnail ? thumbnail.name : "Choose image"}
            </span>
            {thumbnail && (
              <span style={{ fontSize: 11, color: "#64748b" }}>
                {(thumbnail.size / 1024).toFixed(1)} KB
              </span>
            )}
          </label>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginTop: 22,
          justifyContent: "flex-end",
        }}
      >
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            style={{
              background: "#fff",
              color: "#374151",
              border: "1.5px solid #e5e7eb",
              borderRadius: 100,
              padding: "10px 22px",
              fontFamily: FF,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? "#9ca3af" : "#0E2A22",
            color: "#fff",
            border: "none",
            borderRadius: 100,
            padding: "10px 24px",
            fontFamily: FF,
            fontSize: 13,
            fontWeight: 700,
            cursor: submitting ? "default" : "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!submitting) e.currentTarget.style.background = "#0FB896";
          }}
          onMouseLeave={(e) => {
            if (!submitting) e.currentTarget.style.background = "#0E2A22";
          }}
        >
          {submitting
            ? mode === "create"
              ? "Uploading…"
              : "Saving…"
            : mode === "create"
              ? "Upload"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}

// ===================================================================
// Edit modal
// ===================================================================
function EditModal({ doc, onClose, onSubmit, submitting }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.42)",
          backdropFilter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 20,
          padding: "32px 32px 28px",
          width: "100%",
          maxWidth: 560,
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <button
          onClick={onClose}
          disabled={submitting}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 18,
            color: "#94a3b8",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
        <h2
          style={{
            fontFamily: FF_DISPLAY,
            fontSize: 20,
            fontWeight: 900,
            color: "#111827",
            margin: 0,
            marginBottom: 6,
          }}
        >
          Edit Document
        </h2>
        <p
          style={{
            fontFamily: FF,
            fontSize: 13,
            color: "#6b7280",
            margin: 0,
            marginBottom: 22,
          }}
        >
          Update metadata or replace the file/thumbnail.
        </p>
        <DocumentForm
          mode="edit"
          initial={doc}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitting={submitting}
        />
      </div>
    </div>
  );
}

// ===================================================================
// Document row
// ===================================================================
function DocRow({ doc, onEdit, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const dateStr = doc.updated_at ? doc.updated_at.slice(0, 10) : "";
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 16px",
        background: hovered ? "#fafafa" : "#fff",
        borderRadius: 12,
        border: "1px solid #eef0ee",
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          background: "#f1f5f4",
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {doc.thumbnail_url ? (
          <img
            src={doc.thumbnail_url}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          doc.type?.[0] || "·"
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontFamily: FF,
              fontSize: 10,
              fontWeight: 700,
              color: "#0FB896",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "#E8FDF6",
              padding: "2px 7px",
              borderRadius: 4,
            }}
          >
            {doc.type}
          </span>
          {dateStr && (
            <span
              style={{ fontFamily: FF, fontSize: 11, color: "#9ca3af" }}
            >
              {dateStr}
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: FF,
            fontSize: 14,
            fontWeight: 600,
            color: "#111827",
            marginBottom: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {doc.name}
        </div>
        <div
          style={{
            fontFamily: FF,
            fontSize: 12,
            color: "#9ca3af",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {doc.file_url ? (
            <a
              href={doc.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6b7280", textDecoration: "underline" }}
            >
              {doc.file_url.split("/").pop()}
            </a>
          ) : (
            <span style={{ color: "#cbd5e1" }}>No file (Coming soon)</span>
          )}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onEdit(doc)}
          style={{
            background: "#fff",
            border: "1.5px solid #e5e7eb",
            borderRadius: 8,
            padding: "7px 14px",
            fontFamily: FF,
            fontSize: 12,
            fontWeight: 600,
            color: "#374151",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#0FB896";
            e.currentTarget.style.color = "#0FB896";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.color = "#374151";
          }}
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(doc)}
          style={{
            background: "#fff",
            border: "1.5px solid #e5e7eb",
            borderRadius: 8,
            padding: "7px 14px",
            fontFamily: FF,
            fontSize: 12,
            fontWeight: 600,
            color: "#dc2626",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#dc2626";
            e.currentTarget.style.background = "#fef2f2";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.background = "#fff";
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ===================================================================
// Dashboard
// ===================================================================
function AdminDashboard({ SUPABASE_URL, SUPABASE_ANON, session, onLogout, onBack }) {
  const [activeBrand, setActiveBrand] = useState("school");
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editDoc, setEditDoc] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/documents?select=*&order=updated_at.desc`,
        {
          headers: {
            apikey: SUPABASE_ANON,
            Authorization: `Bearer ${SUPABASE_ANON}`,
          },
        },
      );
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setToast({ type: "error", message: "Failed to load documents." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const grouped = useMemo(() => {
    const g = { school: [], teacher: [], parent: [], brand: [] };
    for (const d of docs) {
      if (g[d.brand]) g[d.brand].push(d);
    }
    return g;
  }, [docs]);

  const currentDocs = grouped[activeBrand] || [];

  const handleUpload = async (values) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("email", session.email);
      fd.append("password", session.password);
      fd.append("brand", values.brand);
      fd.append("type", values.type);
      fd.append("name", values.name);
      if (values.description) fd.append("description", values.description);
      if (values.file) fd.append("file", values.file);
      if (values.thumbnail) fd.append("thumbnail", values.thumbnail);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-upload`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          clearSession();
          onLogout();
          return;
        }
        throw new Error(data.error || "Upload failed");
      }
      setShowUpload(false);
      setToast({ type: "success", message: "Document uploaded." });
      await fetchDocs();
      setActiveBrand(values.brand);
    } catch (e) {
      setToast({ type: "error", message: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (values) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("email", session.email);
      fd.append("password", session.password);
      fd.append("id", editDoc.id);
      fd.append("brand", values.brand);
      fd.append("type", values.type);
      fd.append("name", values.name);
      fd.append("description", values.description || "");
      if (values.file) fd.append("file", values.file);
      if (values.thumbnail) fd.append("thumbnail", values.thumbnail);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-update`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          clearSession();
          onLogout();
          return;
        }
        throw new Error(data.error || "Update failed");
      }
      setEditDoc(null);
      setToast({ type: "success", message: "Document updated." });
      await fetchDocs();
    } catch (e) {
      setToast({ type: "error", message: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (doc) => {
    const ok = window.confirm(`Delete "${doc.name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
        body: JSON.stringify({
          email: session.email,
          password: session.password,
          id: doc.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          clearSession();
          onLogout();
          return;
        }
        throw new Error(data.error || "Delete failed");
      }
      setToast({ type: "success", message: "Document deleted." });
      await fetchDocs();
    } catch (e) {
      setToast({ type: "error", message: e.message });
    }
  };

  return (
    <div style={{ background: "#F8FAF9", minHeight: "calc(100vh - 64px)" }}>
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "32px clamp(20px,4vw,40px) 80px",
        }}
      >
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: FF_DISPLAY,
                fontSize: 26,
                fontWeight: 900,
                color: "#111827",
                margin: 0,
                marginBottom: 4,
              }}
            >
              Toolkit Admin
            </h1>
            <p
              style={{
                fontFamily: FF,
                fontSize: 13,
                color: "#6b7280",
                margin: 0,
              }}
            >
              Signed in as {session.email}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onBack}
              style={{
                background: "#fff",
                border: "1.5px solid #e5e7eb",
                borderRadius: 100,
                padding: "9px 18px",
                fontFamily: FF,
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#0FB896")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
            >
              ← Back to site
            </button>
            <button
              onClick={() => {
                clearSession();
                onLogout();
              }}
              style={{
                background: "#fff",
                border: "1.5px solid #e5e7eb",
                borderRadius: 100,
                padding: "9px 18px",
                fontFamily: FF,
                fontSize: 13,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#dc2626";
                e.currentTarget.style.color = "#dc2626";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.color = "#374151";
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            background: "#fff",
            padding: 6,
            borderRadius: 14,
            border: "1px solid #eef0ee",
            marginBottom: 20,
            overflowX: "auto",
          }}
        >
          {BRANDS.map((b) => {
            const count = grouped[b.id]?.length || 0;
            const active = activeBrand === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setActiveBrand(b.id)}
                style={{
                  flex: "1 1 auto",
                  minWidth: 140,
                  background: active ? "#0E2A22" : "transparent",
                  color: active ? "#fff" : "#374151",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  fontFamily: FF,
                  fontSize: 13,
                  fontWeight: active ? 700 : 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 15 }}>{b.icon}</span>
                {b.label}
                <span
                  style={{
                    fontFamily: FF,
                    fontSize: 11,
                    fontWeight: 700,
                    background: active
                      ? "rgba(255,255,255,0.18)"
                      : "#f1f5f4",
                    color: active ? "#fff" : "#6b7280",
                    padding: "2px 8px",
                    borderRadius: 100,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Upload toggle / panel */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #eef0ee",
            borderRadius: 14,
            padding: showUpload ? 24 : "14px 20px",
            marginBottom: 20,
            transition: "padding 0.2s",
          }}
        >
          {!showUpload ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: FF,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  Add a new document
                </div>
                <div
                  style={{
                    fontFamily: FF,
                    fontSize: 12,
                    color: "#6b7280",
                    marginTop: 2,
                  }}
                >
                  Upload a file and thumbnail to{" "}
                  {BRANDS.find((b) => b.id === activeBrand)?.label}.
                </div>
              </div>
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  background: "#30E9BD",
                  color: "#0d0d0d",
                  border: "none",
                  borderRadius: 100,
                  padding: "10px 22px",
                  fontFamily: FF,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 12px rgba(48,233,189,0.25)",
                }}
              >
                + New document
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <h3
                  style={{
                    fontFamily: FF_DISPLAY,
                    fontSize: 17,
                    fontWeight: 800,
                    color: "#111827",
                    margin: 0,
                  }}
                >
                  New document
                </h3>
              </div>
              <DocumentForm
                mode="create"
                defaultBrand={activeBrand}
                onSubmit={handleUpload}
                onCancel={() => setShowUpload(false)}
                submitting={submitting}
              />
            </>
          )}
        </div>

        {/* Document list */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #eef0ee",
            borderRadius: 14,
            padding: 16,
          }}
        >
          {loading ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                fontFamily: FF,
                fontSize: 13,
                color: "#9ca3af",
              }}
            >
              Loading documents…
            </div>
          ) : currentDocs.length === 0 ? (
            <div
              style={{
                padding: 60,
                textAlign: "center",
                fontFamily: FF,
                fontSize: 14,
                color: "#9ca3af",
              }}
            >
              No documents in this kit yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {currentDocs.map((doc) => (
                <DocRow
                  key={doc.id}
                  doc={doc}
                  onEdit={(d) => setEditDoc(d)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {editDoc && (
        <EditModal
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSubmit={handleEdit}
          submitting={submitting}
        />
      )}
    </div>
  );
}

// ===================================================================
// AdminPanel (default export)
// ===================================================================
export default function AdminPanel({ SUPABASE_URL, SUPABASE_ANON, onBack }) {
  const [session, setSession] = useState(() => loadSession());

  if (!session) {
    return (
      <AdminLoginForm
        SUPABASE_URL={SUPABASE_URL}
        SUPABASE_ANON={SUPABASE_ANON}
        onLoggedIn={(s) => setSession(s)}
        onBack={onBack}
      />
    );
  }

  return (
    <AdminDashboard
      SUPABASE_URL={SUPABASE_URL}
      SUPABASE_ANON={SUPABASE_ANON}
      session={session}
      onLogout={() => setSession(null)}
      onBack={onBack}
    />
  );
}
