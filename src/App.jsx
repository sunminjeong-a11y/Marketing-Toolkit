import { useState, useEffect, useRef } from "react";

// ─── Supabase 설정 ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://rxokrzsbfnttgchketde.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4b2tyenNiZm50dGdjaGtldGRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMjY3MDEsImV4cCI6MjA4ODgwMjcwMX0.EGgeE47oDvVv1-OxH2P7a9kG5R5_SdTGSTIVWruDNes";

const KIT_META = {
  school: {
    id: "school",
    category: "communication",
    icon: "🎓",
    name: "School Kit",
    desc: "Communication materials for school leaders to support StoryLine adoption and onboarding.",
    subtitle: "Communication Materials for School Leaders",
  },
  teacher: {
    id: "teacher",
    category: "communication",
    icon: "📖",
    name: "Teacher Kit",
    desc: "Resources to help teachers understand and confidently use StoryLine in the classroom.",
    subtitle: "Communication Materials for Teachers",
  },
  parent: {
    id: "parent",
    category: "communication",
    icon: "👥",
    name: "Parent Kit",
    desc: "Materials to help parents understand StoryLine and feel confident about their child's participation.",
    subtitle: "Communication Materials for Parents",
  },
  brand: {
    id: "brand",
    category: "brand",
    icon: "📡",
    name: "Brand Kit",
    desc: "Brand assets and guidelines for sharing StoryLine content on digital platforms.",
    subtitle: "Communication Materials for Social Media",
  },
};

const FALLBACK_KITS = [
  {
    ...KIT_META.school,
    docs: 4,
    documents: [
      {
        type: "Guide",
        title: "StoryLine Overview For Schools",
        desc: "A one-page introduction covering features, benefits, and why StoryLine fits early-childhood programs.",
        date: "2026-03-20",
        file_url: null,
        thumbnail_url: null,
      },
      {
        type: "Guide",
        title: "StoryLine Onboarding Guideline",
        desc: "A step-by-step plan for rolling StoryLine out at your center.",
        date: "2026-03-15",
        file_url: null,
        thumbnail_url: null,
      },
      {
        type: "Template",
        title: "Sample Parent / Legal Guardian Consent Form (COPPA Compliance)",
        desc: "A COPPA-aligned consent form schools issue to obtain parental permission.",
        date: "2026-03-12",
        file_url: null,
        thumbnail_url: null,
      },
      {
        type: "Template",
        title: "Sample Parent Communication Email – StoryLine Pilot Program",
        desc: "A ready-to-send email template for announcing the StoryLine pilot program.",
        date: "2026-03-10",
        file_url: null,
        thumbnail_url: null,
      },
    ],
  },
  {
    ...KIT_META.teacher,
    docs: 3,
    documents: [
      {
        type: "Guide",
        title: "StoryLine Overview for Teachers",
        desc: "A one-pager on how StoryLine supports daily observation and lesson planning.",
        date: "2026-03-12",
        file_url: null,
        thumbnail_url: null,
      },
      {
        type: "Resource",
        title: "Teacher FAQs",
        desc: "Answers to the questions teachers ask most about StoryLine.",
        date: "2026-03-10",
        file_url: null,
        thumbnail_url: null,
      },
      {
        type: "Template",
        title: "Sample Teacher Consent Form",
        desc: "A consent form explaining teacher data collection and privacy compliance.",
        date: "2026-03-08",
        file_url: null,
        thumbnail_url: null,
      },
    ],
  },
  {
    ...KIT_META.parent,
    docs: 2,
    documents: [
      {
        type: "Guide",
        title: "StoryLine Overview for Parents",
        desc: "A one-page introduction explaining how StoryLine supports children's development.",
        date: "2026-03-12",
        file_url: null,
        thumbnail_url: null,
      },
      {
        type: "Resource",
        title: "Parent FAQs",
        desc: "Answers to common parent questions about data use and privacy safeguards.",
        date: "2026-03-10",
        file_url: null,
        thumbnail_url: null,
      },
    ],
  },
  {
    ...KIT_META.brand,
    docs: 3,
    documents: [
      {
        type: "Video",
        title: "StoryLine Introduction Video",
        desc: "Official StoryLine introduction video for social-media use.",
        date: "2026-03-16",
        file_url: null,
        thumbnail_url: null,
      },
      {
        type: "Logo",
        title: "StoryLine Logo",
        desc: "Official StoryLine logo assets — symbol, wordmark, signature.",
        date: "2026-03-16",
        file_url: null,
        thumbnail_url: null,
      },
      {
        type: "Logo",
        title: "Playtag Logo",
        desc: "Official Playtag logo assets for co-branding use.",
        date: "2026-03-16",
        file_url: null,
        thumbnail_url: null,
      },
    ],
  },
];

const SCHOOL_DOC_ORDER = [
  "StoryLine Overview For Schools",
  "StoryLine Onboarding Guideline",
  "Sample Parent Communication Email",
  "No cameras",
  "Existing cameras",
];

function sortSchoolDocs(docs) {
  return [...docs].sort((a, b) => {
    const rank = (title) => {
      const idx = SCHOOL_DOC_ORDER.findIndex((keyword) =>
        title.toLowerCase().includes(keyword.toLowerCase())
      );
      return idx === -1 ? 99 : idx;
    };
    return rank(a.title) - rank(b.title);
  });
}

async function fetchKits() {
  if (!SUPABASE_ANON || SUPABASE_ANON === "여기에_anon_key_붙여넣기")
    return FALLBACK_KITS;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/documents?select=*&order=updated_at.desc`,
      {
        headers: {
          apikey: SUPABASE_ANON,
          Authorization: `Bearer ${SUPABASE_ANON}`,
        },
      }
    );
    console.log("Supabase status:", res.status);
    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase error:", errText);
      return FALLBACK_KITS;
    }
    const rows = await res.json();
    console.log("rows fetched:", rows.length, JSON.stringify(rows.slice(0, 2)));
    const grouped = {};
    for (const row of rows) {
      const slug = row.brand;
      if (!slug || !KIT_META[slug]) {
        console.log("skipped brand:", slug);
        continue;
      }
      if (!grouped[slug]) grouped[slug] = [];
      grouped[slug].push({
        type: row.type,
        title: row.name,
        desc: "",
        date: row.updated_at ? row.updated_at.slice(0, 10) : "",
        file_url: row.file_url || null,
        thumbnail_url: row.thumbnail_url || null,
      });
    }
    console.log("grouped keys:", Object.keys(grouped));
    return ["school", "teacher", "parent", "brand"].map((slug) => {
      let docs =
        grouped[slug] ||
        FALLBACK_KITS.find((k) => k.id === slug)?.documents ||
        [];
      if (slug === "school") docs = sortSchoolDocs(docs);
      console.log(
        slug + " docs:",
        docs.length,
        docs.map((d) => d.title + " | " + d.file_url)
      );
      return { ...KIT_META[slug], docs: docs.length, documents: docs };
    });
  } catch (e) {
    console.error("fetchKits exception:", e);
    return FALLBACK_KITS;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedSection({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition:
          "opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1)",
      }}
    >
      {children}
    </div>
  );
}

const LOGO_SRC =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgxOSIgaGVpZ2h0PSI0MTciIHZpZXdCb3g9IjAgMCAxODE5IDQxNyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgY2xpcC1wYXRoPSJ1cmwoI3BhaW50MF9hbmd1bGFyXzY0M18yOTRfY2xpcF9wYXRoKSIgZGF0YS1maWdtYS1za2lwLXBhcnNlPSJ0cnVlIj48ZyB0cmFuc2Zvcm09Im1hdHJpeCgwIDAuMTQ1MDE1IDAuMTQ1MDE1IDAgMTQ1LjAxNCAxNjAuMDE1KSI+PGZvcmVpZ25PYmplY3QgeD0iLTEwMDYuOSIgeT0iLTEwMDYuOSIgd2lkdGg9IjIwMTMuNzkiIGhlaWdodD0iMjAxMy43OSI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImJhY2tncm91bmQ6Y29uaWMtZ3JhZGllbnQoZnJvbSA5MGRlZyxyZ2JhKDE3MiwgMjQ2LCAyMjksIDEpIDBkZWcscmdiYSg0OCwgMjMzLCAxODksIDEpIDI2MC42MjVkZWcscmdiYSg2NCwgMjAyLCAyNDUsIDEpIDM2MGRlZyk7aGVpZ2h0OjEwMCU7d2lkdGg6MTAwJTtvcGFjaXR5OjEiPjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjxwYXRoIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBkPSJNMTQ1LjAxNCAzMDUuMDNDNjQuOTI1IDMwNS4wMyAtMC4wMDAzOTM3IDI0MC4xMDQgLTAuMDAwMzkzNyAxNjAuMDE1Qy0wLjAwMDM5MzcgNzkuOTI1NCA2NC45MjUgMTUgMTQ1LjAxNCAxNUMyMjUuMTA0IDE1IDI5MC4wMjkgNzkuOTI1NCAyOTAuMDI5IDE2MC4wMTVDMjkwLjAyOSAyNDAuMTA0IDIyNS4xMDQgMzA1LjAzIDE0NS4wMTQgMzA1LjAzWk0xNDUuNTczIDI0Mi45OThDOTkuNDM0MiAyNDIuOTk4IDYyLjAzMTUgMjA1LjU5NSA2Mi4wMzE1IDE1OS40NTdDNjIuMDMxNSAxMTMuMzE4IDk5LjQzNDIgNzUuOTE1NCAxNDUuNTczIDc1LjkxNTRDMTkxLjcxMSA3NS45MTU0IDIyOS4xMTQgMTEzLjMxOCAyMjkuMTE0IDE1OS40NTdDMjI5LjExNCAyMDUuNTk1IDE5MS43MTEgMjQyLjk5OCAxNDUuNTczIDI0Mi45OThaIiBkYXRhLWZpZ21hLWdyYWRpZW50LWZpbGw9InsmIzM0O3R5cGUmIzM0OzomIzM0O0dSQURJRU5UX0FOR1VMQVImIzM0OywmIzM0O3N0b3BzJiMzNDs6W3smIzM0O2NvbG9yJiMzNDs6eyYjMzQ7ciYjMzQ7OjAuNjc0NTA5ODIzMzIyMjk2MTQsJiMzNDtnJiMzNDs6MC45NjQ3MDU4ODQ0NTY2MzQ1MiwmIzM0O2ImIzM0OzowLjg5ODAzOTIyMTc2MzYxMDg0LCYjMzQ7YSYjMzQ7OjEuMH0sJiMzNDtwb3NpdGlvbiYjMzQ7OjAuMH0seyYjMzQ7Y29sb3ImIzM0Ozp7JiMzNDtyJiMzNDs6MC4xODgyMzUyOTc3OTkxMTA0MSwmIzM0O2cmIzM0OzowLjkxMzcyNTQ5NTMzODQzOTk0LCYjMzQ7YiYjMzQ7OjAuNzQxMTc2NDg2MDE1MzE5ODIsJiMzNDthJiMzNDs6MS4wfSwmIzM0O3Bvc2l0aW9uJiMzNDs6MC43MjM5NTgzMTM0NjUxMTg0MX0seyYjMzQ7Y29sb3ImIzM0Ozp7JiMzNDtyJiMzNDs6MC4yNTA5ODA0MDY5OTk1ODgwMSwmIzM0O2cmIzM0OzowLjc5MjE1Njg3NTEzMzUxNDQwLCYjMzQ7YiYjMzQ7OjAuOTYwNzg0MzE2MDYyOTI3MjUsJiMzNDthJiMzNDs6MS4wfSwmIzM0O3Bvc2l0aW9uJiMzNDs6MS4wfV0sJiMzNDtzdG9wc1ZhciYjMzQ7OltdLCYjMzQ7dHJhbnNmb3JtJiMzNDs6eyYjMzQ7bTAwJiMzNDs6LTEuNzc1OTE5NzcwMzk5NDY3MmUtMTQsJiMzNDttMDEmIzM0OzoyOTAuMDI5NjkzNjAzNTE1NjIsJiMzNDttMDImIzM0OzotMC4wMDAzOTY3Mjg1MTU2MjUwLCYjMzQ7bTEwJiMzNDs6MjkwLjAyOTY5MzYwMzUxNTYyLCYjMzQ7bTExJiMzNDs6MS43NzU5MTk3NzAzOTk0NjcyZS0xNCwmIzM0O20xMiYjMzQ7OjE1LjB9LCYjMzQ7b3BhY2l0eSYjMzQ7OjEuMCwmIzM0O2JsZW5kTW9kZSYjMzQ7OiYjMzQ7Tk9STUFMJiMzNDssJiMzNDt2aXNpYmxlJiMzNDs6dHJ1ZX0iLz4KPGcgY2xpcC1wYXRoPSJ1cmwoI3BhaW50MV9hbmd1bGFyXzY0M18yOTRfY2xpcF9wYXRoKSIgZGF0YS1maWdtYS1za2lwLXBhcnNlPSJ0cnVlIj48ZyB0cmFuc2Zvcm09Im1hdHJpeCgyLjEwNDc5ZS0wOCAtMC4yNDA3NiAwLjI0MDc2MSAyLjEwNDhlLTA4IDE0NC44MjcgNDAyKSI+PGZvcmVpZ25PYmplY3QgeD0iLTEwMDMuNzUiIHk9Ii0xMDAzLjc1IiB3aWR0aD0iMjAwNy41IiBoZWlnaHQ9IjIwMDcuNSI+PGRpdiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94aHRtbCIgc3R5bGU9ImJhY2tncm91bmQ6Y29uaWMtZ3JhZGllbnQoZnJvbSA5MGRlZyxyZ2JhKDY0LCAyMDIsIDI0NSwgMC45MykgMGRlZyxyZ2JhKDQ4LCAyMzMsIDE4OSwgMSkgOTBkZWcscmdiYSg2NCwgMjAyLCAyNDUsIDAuOTMpIDM2MGRlZyk7aGVpZ2h0OjEwMCU7d2lkdGg6MTAwJTtvcGFjaXR5OjEiPjwvZGl2PjwvZm9yZWlnbk9iamVjdD48L2c+PC9nPjxwYXRoIGQ9Ik0xNDQuODI3IDE2OC4yMThDMTQ0LjgyNyAxNjQuMzY0IDE0Ny45NDEgMTYxLjIyOSAxNTEuNzggMTYxLjM0QzE4MS4wMjcgMTYyLjE4NSAyMDkuODk1IDE2OC4zNTUgMjM2Ljk2MyAxNzkuNTY2QzI2Ni4xNzMgMTkxLjY2NiAyOTIuNzE0IDIwOS40IDMxNS4wNzEgMjMxLjc1N0MzMzcuNDI4IDI1NC4xMTMgMzU1LjE2MiAyODAuNjU1IDM2Ny4yNjIgMzA5Ljg2NUMzNzguNDcgMzM2LjkyNSAzODQuNjQgMzY1Ljc4NCAzODUuNDg3IDM5NS4wMjJDMzg1LjU5OSAzOTguODc1IDM4Mi40NzUgNDAyIDM3OC42MzUgNDAyTDE1MS43ODEgNDAyQzE0Ny45NCA0MDIgMTQ0LjgyNyAzOTguODc2IDE0NC44MjcgMzk1LjAyMUwxNDQuODI3IDE2OC4yMThaIiBkYXRhLWZpZ21hLWdyYWRpZW50LWZpbGw9InsmIzM0O3R5cGUmIzM0OzomIzM0O0dSQURJRU5UX0FOR1VMQVImIzM0OywmIzM0O3N0b3BzJiMzNDs6W3smIzM0O2NvbG9yJiMzNDs6eyYjMzQ7ciYjMzQ7OjAuMjUwOTgwNDA2OTk5NTg4MDEsJiMzNDtnJiMzNDs6MC43OTIxNTY4NzUxMzM1MTQ0MCwmIzM0O2ImIzM0OzowLjk2MDc4NDMxNjA2MjkyNzI1LCYjMzQ7YSYjMzQ7OjAuOTMwMDAwMDA3MTUyNTU3Mzd9LCYjMzQ7cG9zaXRpb24mIzM0OzowLjB9LHsmIzM0O2NvbG9yJiMzNDs6eyYjMzQ7ciYjMzQ7OjAuMTg4MjM1Mjk3Nzk5MTEwNDEsJiMzNDtnJiMzNDs6MC45MTM3MjU0OTUzMzg0Mzk5NCwmIzM0O2ImIzM0OzowLjc0MTE3NjQ4NjAxNTMxOTgyLCYjMzQ7YSYjMzQ7OjEuMH0sJiMzNDtwb3NpdGlvbiYjMzQ7OjAuMjUwfV0sJiMzNDtzdG9wc1ZhciYjMzQ7OltdLCYjMzQ7dHJhbnNmb3JtJiMzNDs6eyYjMzQ7bTAwJiMzNDs6NC4yMDk1ODg1ODc0MDA1MDM1ZS0wNSwmIzM0O20wMSYjMzQ7OjQ4MS41MjIyNDczMTQ0NTMxMiwmIzM0O20wMiYjMzQ7Oi05NS45MzM4MDczNzMwNDY4NzUsJiMzNDttMTAmIzM0OzotNDgxLjUyMDc4MjQ3MDcwMzEyLCYjMzQ7bTExJiMzNDs6NC4yMDk2MDA5NTY1Mjg0NDc2ZS0wNSwmIzM0O20xMiYjMzQ7OjY0Mi43NjAzMTQ5NDE0MDYyNX0sJiMzNDtvcGFjaXR5JiMzNDs6MS4wLCYjMzQ7YmxlbmRNb2RlJiMzNDs6JiMzNDtOT1JNQUwmIzM0OywmIzM0O3Zpc2libGUmIzM0Ozp0cnVlfSIvPgo8cGF0aCBkPSJNNDg2LjkzNCAyNjIuNTMyQzUwMS4yOTYgMjkwLjU4OCA1MjEuNjcgMzA0LjYxNiA1NDMuMDQ2IDMwNC42MTZDNTc0Ljc3NiAzMDQuOTUgNTkyLjQ3OCAyODkuNTg2IDU5Mi40NzggMjY1Ljg3MkM1OTIuNDc4IDIwOS43NiA0NjguNTY0IDIzMy44MDggNDY4LjU2NCAxNDcuOTdDNDY4LjU2NCAxMDcuMjIyIDUwMS45NjQgODMuMTc0IDU0Ny43MjIgODMuNTA4QzU3OS40NTIgODMuODQyIDYwOS44NDYgMTAxLjU0NCA2MjMuNTQgMTM5Ljk1NEw1OTEuODEgMTUxLjMxQzU4My4xMjYgMTI1LjU5MiA1NjUuNzU4IDExNC41NyA1NDcuMzg4IDExNC4yMzZDNTIxLjAwMiAxMTQuMjM2IDUwMy45NjggMTI3LjI2MiA1MDMuOTY4IDE0Ny45N0M1MDMuOTY4IDIwMy40MTQgNjI3LjU0OCAxODIuMzcyIDYyNy41NDggMjY2LjIwNkM2MjcuNTQ4IDMwNy42MjIgNTk1LjE1IDMzNi4wMTIgNTQyLjcxMiAzMzUuMzQ0QzUwNi42NCAzMzUuMDEgNDc3LjkxNiAzMTQuMzAyIDQ1Ny41NDIgMjc4Ljg5OEw0ODYuOTM0IDI2Mi41MzJaTTY3Ny41MjMgMzMzLjAwNlYyMDQuMDgySDY0Ny40NjNWMTczLjM1NEg2NzcuNTIzVjExNy41NzZINzEyLjkyN1YxNzMuMzU0SDc1MC42NjlWMjA0LjA4Mkg3MTIuOTI3VjMzMy4wMDZINjc3LjUyM1pNODM5LjE5NSAzMDMuOTQ4Qzg2My45MTEgMzAzLjk0OCA4ODAuNjExIDI4NC4yNDIgODgwLjYxMSAyNTMuODQ4Qzg4MC42MTEgMjIzLjc4OCA4NjMuOTExIDIwMy43NDggODM5LjE5NSAyMDMuNzQ4QzgxNC40NzkgMjAzLjc0OCA3OTcuNzc5IDIyMy40NTQgNzk3Ljc3OSAyNTMuODQ4Qzc5Ny43NzkgMjg0LjI0MiA4MTQuMTQ1IDMwMy45NDggODM5LjE5NSAzMDMuOTQ4Wk04MzkuMTk1IDE3My4zNTRDODg0LjI4NSAxNzMuMzU0IDkxNi4wMTUgMjA2Ljc1NCA5MTYuMDE1IDI1My44NDhDOTE2LjAxNSAzMDAuNjA4IDg4NC4yODUgMzM0LjM0MiA4MzkuMTk1IDMzNC4zNDJDNzk0LjEwNSAzMzQuMzQyIDc2Mi4zNzUgMzAwLjYwOCA3NjIuMzc1IDI1My44NDhDNzYyLjM3NSAyMDYuNzU0IDc5NC4xMDUgMTczLjM1NCA4MzkuMTk1IDE3My4zNTRaTTkzNi45OTkgMzMzLjAwNlYxNzMuNjg4SDk3Mi40MDNWMTk3LjA2OEM5ODMuMDkxIDE4Mi4wMzggMTAwMi40NiAxNzIuMDE4IDEwMjEuMTcgMTczLjAyVjIwNS43NTJDOTkyLjc3NyAyMDQuNDE2IDk3Mi40MDMgMjI5LjQ2NiA5NzIuNDAzIDI1My44NDhWMzMzLjAwNkg5MzYuOTk5Wk0xMTA1LjQ1IDQwMi4xNDRIMTA2Ni43MUwxMTAxLjQ0IDMxOS42NDZMMTAzNy4zMiAxNzMuNjg4SDEwNzYuMzlMMTEyMC4xNSAyNzkuMjMyTDExNjIuMjMgMTczLjY4OEgxMjAwLjY0TDExNDEuMTkgMzE2Ljk3NEwxMTA1LjQ1IDQwMi4xNDRaTTEyNjQuNzcgODYuMThWMzAxLjYxSDEzNzYuMzJWMzMyLjY3MkgxMjI5LjM2Vjg2LjE4SDEyNjQuNzdaTTE0MTAuMDkgMTczLjM1NEgxNDQ1LjQ5VjMzMi42NzJIMTQxMC4wOVYxNzMuMzU0Wk0xNDI3Ljc5IDkzLjg2MkMxNDM5LjQ4IDkzLjg2MiAxNDQ3LjgzIDEwMi4yMTIgMTQ0Ny44MyAxMTMuOTAyQzE0NDcuODMgMTI1LjU5MiAxNDM5LjQ4IDEzMy45NDIgMTQyNy43OSAxMzMuOTQyQzE0MTYuMSAxMzMuOTQyIDE0MDcuNzUgMTI1LjU5MiAxNDA3Ljc1IDExMy45MDJDMTQwNy43NSAxMDIuMjEyIDE0MTYuMSA5My44NjIgMTQyNy43OSA5My44NjJaTTE1OTAuMDIgMjQ1LjE2NEMxNTkwLjAyIDIxOS43OCAxNTc3IDIwNC40MTYgMTU1NC45NSAyMDQuNDE2QzE1MzMuMjQgMjA0Ljc1IDE1MTYuNTQgMjIxLjc4NCAxNTE2Ljg4IDI0NS4xNjRWMzMzLjAwNkgxNDgxLjQ3VjE3My42ODhIMTUxNi44OFYxOTUuMzk4QzE1MjYuOSAxODMuMDQgMTU0My45MyAxNzQuMDIyIDE1NTkuMjkgMTc0LjAyMkMxNTg5LjM1IDE3NC4wMjIgMTYyNS40MyAxOTMuNzI4IDE2MjUuNDMgMjQzLjgyOFYzMzMuMDA2SDE1OTAuMDJWMjQ1LjE2NFpNMTcyNC44MyAzMzMuNjc0QzE2NzkuNzQgMzMzLjY3NCAxNjQ4LjAxIDMwMC42MDggMTY0OC4wMSAyNTMuODQ4QzE2NDguMDEgMjA2Ljc1NCAxNjc5Ljc0IDE3My42ODggMTcyNC44MyAxNzMuNjg4QzE3NzQuMjYgMTczLjY4OCAxNzg5Ljk2IDIxNC4xMDIgMTc5MC45NiAyMTYuNzc0QzE4MDAuNjUgMjM5LjQ4NiAxNzk3LjY0IDI2NC44NyAxNzk3LjY0IDI2Ny41NDJIMTY4Mi43NUMxNjg2Ljc1IDI4OC45MTggMTcwNC43OSAzMDMuNjE0IDE3MjQuODMgMzAzLjYxNEMxNzUxLjIyIDMwMy42MTQgMTc2MS45IDI4OC4yNSAxNzY0LjU4IDI4My41NzRMMTc5Mi45NyAyOTYuMjY2QzE3ODUuMjggMzE0LjMwMiAxNzYyLjkxIDMzMy42NzQgMTcyNC44MyAzMzMuNjc0Wk0xNzY0LjI0IDIzOS40ODZDMTc2MC45IDIxOS43OCAxNzQ5LjU1IDIwMy43NDggMTcyNC44MyAyMDMuNzQ4QzE3MDMuNDUgMjAzLjc0OCAxNjg2Ljc1IDIxOC43NzggMTY4Mi43NSAyMzkuNDg2SDE3NjQuMjRaIiBmaWxsPSJibGFjayIvPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJwYWludDBfYW5ndWxhcl82NDNfMjk0X2NsaXBfcGF0aCI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xNDUuMDE0IDMwNS4wM0M2NC45MjUgMzA1LjAzIC0wLjAwMDM5MzcgMjQwLjEwNCAtMC4wMDAzOTM3IDE2MC4wMTVDLTAuMDAwMzkzNyA3OS45MjU0IDY0LjkyNSAxNSAxNDUuMDE0IDE1QzIyNS4xMDQgMTUgMjkwLjAyOSA3OS45MjU0IDI5MC4wMjkgMTYwLjAxNUMyOTAuMDI5IDI0MC4xMDQgMjI1LjEwNCAzMDUuMDMgMTQ1LjAxNCAzMDUuMDNaTTE0NS41NzMgMjQyLjk5OEM5OS40MzQyIDI0Mi45OTggNjIuMDMxNSAyMDUuNTk1IDYyLjAzMTUgMTU5LjQ1N0M2Mi4wMzE1IDExMy4zMTggOTkuNDM0MiA3NS45MTU0IDE0NS41NzMgNzUuOTE1NEMxOTEuNzExIDc1LjkxNTQgMjI5LjExNCAxMTMuMzE4IDIyOS4xMTQgMTU5LjQ1N0MyMjkuMTE0IDIwNS41OTUgMTkxLjcxMSAyNDIuOTk4IDE0NS41NzMgMjQyLjk5OFoiLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0icGFpbnQxX2FuZ3VsYXJfNjQzXzI5NF9jbGlwX3BhdGgiPjxwYXRoIGQ9Ik0xNDQuODI3IDE2OC4yMThDMTQ0LjgyNyAxNjQuMzY0IDE0Ny45NDEgMTYxLjIyOSAxNTEuNzggMTYxLjM0QzE4MS4wMjcgMTYyLjE4NSAyMDkuODk1IDE2OC4zNTUgMjM2Ljk2MyAxNzkuNTY2QzI2Ni4xNzMgMTkxLjY2NiAyOTIuNzE0IDIwOS40IDMxNS4wNzEgMjMxLjc1N0MzMzcuNDI4IDI1NC4xMTMgMzU1LjE2MiAyODAuNjU1IDM2Ny4yNjIgMzA5Ljg2NUMzNzguNDcgMzM2LjkyNSAzODQuNjQgMzY1Ljc4NCAzODUuNDg3IDM5NS4wMjJDMzg1LjU5OSAzOTguODc1IDM4Mi40NzUgNDAyIDM3OC42MzUgNDAyTDE1MS43ODEgNDAyQzE0Ny45NCA0MDIgMTQ0LjgyNyAzOTguODc2IDE0NC44MjcgMzk1LjAyMUwxNDQuODI3IDE2OC4yMThaIi8+PC9jbGlwUGF0aD48L2RlZnM+Cjwvc3ZnPgo=";

function StoryLineLogo({ height = 32 }) {
  return (
    <img
      src={LOGO_SRC}
      alt="StoryLine"
      style={{ height, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el)
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.scrollY - 80,
      behavior: "smooth",
    });
}

function Navbar({ setPage, setSelectedKit, kits = [], page, selectedKit }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    {
      label: "School",
      activeKit: "school",
      action: () => {
        setPage("home");
        setSelectedKit(kits.find((k) => k.id === "school"));
      },
    },
    {
      label: "Teacher",
      activeKit: "teacher",
      action: () => {
        setPage("home");
        setSelectedKit(kits.find((k) => k.id === "teacher"));
      },
    },
    {
      label: "Parent",
      activeKit: "parent",
      action: () => {
        setPage("home");
        setSelectedKit(kits.find((k) => k.id === "parent"));
      },
    },
    {
      label: "Brand",
      activeKit: "brand",
      action: () => {
        setPage("home");
        setSelectedKit(kits.find((k) => k.id === "brand"));
      },
    },
    {
      label: "Privacy & Security",
      activePage: "privacy",
      action: () => setPage("privacy"),
    },
  ];
  const handleNav = (action) => {
    action();
    setMenuOpen(false);
  };

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(252,252,250,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #e8e8e4",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(20px,4vw,48px)",
          height: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            cursor: "pointer",
            position: "relative",
          }}
          onClick={() => {
            setPage("home");
            setSelectedKit(null);
            setMenuOpen(false);
          }}
        >
          <StoryLineLogo height={26} />
          <span
            style={{
              fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
              fontSize: 10,
              fontWeight: 600,
              color: "#1a1a1a",
              letterSpacing: "0.02em",
              lineHeight: 1,
              marginLeft: 2,
              marginTop: 1,
            }}
          >
            Toolkit
          </span>
        </div>

        {/* 데스크탑 메뉴 */}
        <div className="desktop-nav" style={{ display: "flex", gap: 28 }}>
          {navItems.map((item) => {
            const isActive =
              (item.activeKit && selectedKit?.id === item.activeKit) ||
              (item.activePage && page === item.activePage);
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.action)}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? "#1a1a1a" : "#666",
                  cursor: "pointer",
                  padding: "4px 0",
                  transition: "color 0.2s, font-weight 0.2s",
                  whiteSpace: "nowrap",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#1a1a1a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isActive ? "#1a1a1a" : "#666";
                }}
              >
                {item.label}
                <span
                  style={{
                    position: "absolute",
                    bottom: -4,
                    left: 0,
                    right: 0,
                    height: 2,
                    borderRadius: 2,
                    background: "#0FB896",
                    transform: isActive ? "scaleX(1)" : "scaleX(0)",
                    transition: "transform 0.25s cubic-bezier(.22,1,.36,1)",
                    transformOrigin: "left",
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* 햄버거 버튼 */}
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            flexDirection: "column",
            gap: 5,
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="메뉴"
        >
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: "#1a1a1a",
              borderRadius: 2,
              transition: "all 0.3s",
              transform: menuOpen
                ? "rotate(45deg) translate(5px, 5px)"
                : "none",
            }}
          />
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: "#1a1a1a",
              borderRadius: 2,
              transition: "all 0.3s",
              opacity: menuOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: "#1a1a1a",
              borderRadius: 2,
              transition: "all 0.3s",
              transform: menuOpen
                ? "rotate(-45deg) translate(5px, -5px)"
                : "none",
            }}
          />
        </button>
      </nav>

      {/* 모바일 드롭다운 */}
      <div
        className="mobile-menu"
        style={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          zIndex: 99,
          background: "rgba(252,252,250,0.98)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #e8e8e4",
          overflow: "hidden",
          maxHeight: menuOpen ? 400 : 0,
          transition: "max-height 0.35s cubic-bezier(.22,1,.36,1)",
          display: "none",
        }}
      >
        <div style={{ padding: "8px 24px 20px" }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNav(item.action)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                background: "none",
                border: "none",
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 16,
                fontWeight:
                  (item.activeKit && selectedKit?.id === item.activeKit) ||
                  (item.activePage && page === item.activePage)
                    ? 700
                    : 400,
                color:
                  (item.activeKit && selectedKit?.id === item.activeKit) ||
                  (item.activePage && page === item.activePage)
                    ? "#0FB896"
                    : "#333",
                cursor: "pointer",
                padding: "14px 0",
                textAlign: "left",
                borderBottom: "1px solid #f0f0ec",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#0FB896")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color =
                  (item.activeKit && selectedKit?.id === item.activeKit) ||
                  (item.activePage && page === item.activePage)
                    ? "#0FB896"
                    : "#333")
              }
            >
              {((item.activeKit && selectedKit?.id === item.activeKit) ||
                (item.activePage && page === item.activePage)) && (
                <span
                  style={{
                    width: 3,
                    height: 16,
                    borderRadius: 2,
                    background: "#0FB896",
                    flexShrink: 0,
                  }}
                />
              )}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .mobile-menu { display: block !important; }
        }
      `}</style>
    </>
  );
}

function HeroSection({ setSelectedKit, setPage }) {
  return (
    <section
      style={{
        background: "#EEF8F3",
        padding: "80px clamp(24px, 6vw, 80px) 96px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <AnimatedSection>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 36,
            }}
          >
            <div
              style={{
                width: 28,
                height: 1.5,
                background: "#0FB896",
                borderRadius: 2,
              }}
            />
            <span
              style={{
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#0FB896",
              }}
            >
              The StoryLine Partner Toolkit
            </span>
          </div>
        </AnimatedSection>
        <AnimatedSection delay={80}>
          <h1
            style={{
              fontFamily: "'SUIT Variable','SUIT',sans-serif",
              fontSize: "clamp(56px, 9vw, 108px)",
              fontWeight: 900,
              color: "#0E2A22",
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              margin: "0 0 40px",
            }}
          >
            Bring{" "}
            <span
              style={{
                background:
                  "linear-gradient(120deg, #0FB896, #2EE8B8, #0EA5D8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              StoryLine
            </span>
            <br />
            into the <br />
            <span
              style={{
                display: "inline",
                background:
                  "linear-gradient(180deg, transparent 62%, rgba(46,232,184,0.45) 62%, rgba(46,232,184,0.45) 96%, transparent 96%)",
                padding: "0 4px",
              }}
            >
              classroom.
            </span>
          </h1>
        </AnimatedSection>
        <AnimatedSection delay={180}>
          <p
            style={{
              fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
              fontSize: "clamp(16px,1.8vw,19px)",
              color: "#3A5048",
              lineHeight: 1.7,
              maxWidth: 620,
              margin: "0 0 48px",
            }}
          >
            A set of four plain-language kits — for school directors, classroom
            teachers, parents, and your marketing team — written to make rollout
            feel less like a launch and more like a{" "}
            <strong style={{ fontWeight: 700, color: "#0E2A22" }}>
              good conversation at pickup.
            </strong>
          </p>
        </AnimatedSection>
        <AnimatedSection delay={280}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button
              onClick={() => scrollToId("communication-kits")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "#0E2A22",
                color: "#EEF8F3",
                border: "none",
                borderRadius: 100,
                padding: "16px 32px",
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#0FB896";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#0E2A22";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Browse the toolkit <span style={{ fontSize: 18 }}>→</span>
            </button>
            <button
              onClick={() => {
                setPage("home");
                setTimeout(() => scrollToId("contact"), 50);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "transparent",
                color: "#0E2A22",
                border: "1.5px solid rgba(14,42,34,0.3)",
                borderRadius: 100,
                padding: "15px 32px",
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#0E2A22";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(14,42,34,0.3)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Talk to our partnerships team
            </button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}

function KitCard({ kit, index, onClick }) {
  const [hovered, setHovered] = useState(false);
  const iconMap = { school: "🎓", teacher: "📖", parent: "👥", brand: "📡" };
  return (
    <AnimatedSection delay={index * 100}>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: "#fff",
          borderRadius: 14,
          border: hovered ? "1.5px solid #30E9BD" : "1.5px solid #e8e8e4",
          padding: 28,
          cursor: "pointer",
          transition: "all 0.35s cubic-bezier(.22,1,.36,1)",
          transform: hovered ? "translateY(-6px)" : "translateY(0)",
          boxShadow: hovered
            ? "0 12px 32px rgba(48,233,189,0.12)"
            : "0 1px 3px rgba(0,0,0,0.04)",
          minHeight: 220,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: "#E8FDF6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            marginBottom: 20,
          }}
        >
          {iconMap[kit.id]}
        </div>
        <h3
          style={{
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 17,
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: 6,
          }}
        >
          {kit.name}
        </h3>
        <span
          style={{
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 12,
            fontWeight: 700,
            color: "#30E9BD",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          {kit.docs} Documents
        </span>
        <p
          style={{
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 14,
            color: "#888",
            lineHeight: 1.6,
            flex: 1,
          }}
        >
          {kit.desc}
        </p>
        <div
          style={{
            marginTop: 18,
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: "#30E9BD",
            display: "flex",
            alignItems: "center",
            gap: hovered ? 10 : 6,
            transition: "gap 0.3s",
          }}
        >
          Open Kit <span>→</span>
        </div>
      </div>
    </AnimatedSection>
  );
}

function KitCategorySection({
  id,
  badge,
  title,
  description,
  kits,
  setSelectedKit,
}) {
  return (
    <section
      id={id}
      style={{
        padding: "72px 24px",
        maxWidth: 1100,
        margin: "0 auto",
        scrollMarginTop: 80,
      }}
    >
      <AnimatedSection>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              display: "inline-block",
              fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
              fontSize: 12,
              fontWeight: 700,
              color: "#30E9BD",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              background: "#E0FBF4",
              padding: "6px 14px",
              borderRadius: 100,
              marginBottom: 16,
            }}
          >
            {badge}
          </div>
          <h2
            style={{
              fontFamily: "'SUIT Variable','SUIT',sans-serif",
              fontSize: "clamp(28px,4vw,40px)",
              fontWeight: 900,
              color: "#1a1a1a",
              marginBottom: 14,
            }}
          >
            {title}
          </h2>
          <p
            style={{
              fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
              fontSize: 16,
              color: "#888",
              lineHeight: 1.6,
              maxWidth: 480,
              margin: "0 auto",
            }}
          >
            {description}
          </p>
        </div>
      </AnimatedSection>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
        }}
      >
        {kits.map((kit, i) => (
          <KitCard
            key={kit.id}
            kit={kit}
            index={i}
            onClick={() => setSelectedKit(kit)}
          />
        ))}
      </div>
    </section>
  );
}

function ResourceKits({ setSelectedKit, kits = [] }) {
  return (
    <>
      <KitCategorySection
        id="communication-kits"
        badge="Communication Toolkit"
        title="Talk to Your Audience"
        description="Everything you need to communicate effectively with schools, teachers, and parents — pre-packaged and ready to share."
        kits={kits.filter((k) => k.category === "communication")}
        setSelectedKit={setSelectedKit}
      />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ borderTop: "1px solid #e8e8e4" }} />
      </div>
      <KitCategorySection
        id="brand-kits"
        badge="Brand Toolkit"
        title="Represent the Brand"
        description="Official brand assets, logos, and guidelines to keep every touchpoint consistent and on-brand."
        kits={kits.filter((k) => k.category === "brand")}
        setSelectedKit={setSelectedKit}
      />
    </>
  );
}

function WhySection() {
  const features = [
    {
      icon: "⬇️",
      title: "Instant Downloads",
      desc: "Access all your assets immediately. No waiting — start communicating today.",
    },
    {
      icon: "🛡️",
      title: "Consent & Compliance",
      desc: "Every template is built with legal safeguards and data privacy best practices.",
    },
    {
      icon: "⭐",
      title: "Professional Quality",
      desc: "Crafted by industry experts to ensure your message carries authority and clear intent.",
    },
  ];
  return (
    <section style={{ padding: "80px 24px", maxWidth: 900, margin: "0 auto" }}>
      <AnimatedSection>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <h2
            style={{
              fontFamily: "'SUIT Variable','SUIT',sans-serif",
              fontSize: "clamp(28px,4vw,40px)",
              fontWeight: 900,
              color: "#1a1a1a",
              marginBottom: 8,
            }}
          >
            Why StoryLine?
          </h2>
          <div
            style={{
              width: 40,
              height: 3,
              background: "#30E9BD",
              borderRadius: 2,
              margin: "0 auto",
            }}
          />
        </div>
      </AnimatedSection>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 40,
        }}
      >
        {features.map((f, i) => (
          <AnimatedSection key={i} delay={i * 120}>
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  border: "1.5px solid #e8e8e4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  margin: "0 auto 18px",
                  background: "#fff",
                }}
              >
                {f.icon}
              </div>
              <h3
                style={{
                  fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: 10,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                  fontSize: 14,
                  color: "#888",
                  lineHeight: 1.65,
                }}
              >
                {f.desc}
              </p>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}

function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "General",
    message: "",
  });
  const [focused, setFocused] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    try {
      await fetch(
        "https://rxokrzsbfnttgchketde.supabase.co/functions/v1/contact-notify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON}`,
          },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            topic: form.topic,
            message: form.message,
          }),
        }
      );
    } catch (e) {
      console.error("Contact submit error:", e);
    }
    setSubmitted(true);
  };
  const fs = (name) => ({
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border:
      focused === name
        ? "1.5px solid #30E9BD"
        : "1.5px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    padding: "14px 16px",
    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
    fontSize: 14,
    color: "#fff",
    outline: "none",
    transition: "all 0.2s",
    boxSizing: "border-box",
  });
  const ls = {
    display: "block",
    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
    fontSize: 13,
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 8,
    letterSpacing: "0.02em",
  };
  return (
    <section
      id="contact"
      style={{
        padding: "40px 24px 80px",
        maxWidth: 1100,
        margin: "0 auto",
        scrollMarginTop: 80,
      }}
    >
      <AnimatedSection>
        <div
          style={{
            background: "#1a2a22",
            borderRadius: 24,
            padding: "clamp(40px,5vw,64px) clamp(24px,4vw,56px)",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 48,
            alignItems: "start",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-block",
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#30E9BD",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 18,
              }}
            >
              Get in Touch
            </div>
            <h2
              style={{
                fontFamily: "'SUIT Variable','SUIT',sans-serif",
                fontSize: "clamp(28px,4vw,40px)",
                fontWeight: 900,
                color: "#fff",
                marginBottom: 20,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              Questions?
              <br />
              Talk to our team.
            </h2>
            <p
              style={{
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 15,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              Need help choosing the right kit or have a custom request? Leave
              us a message and our team will get back to you within 1–2 business
              days.
            </p>
          </div>
          <div>
            {submitted ? (
              <div
                style={{
                  background: "rgba(48,233,189,0.08)",
                  border: "1.5px solid rgba(48,233,189,0.3)",
                  borderRadius: 16,
                  padding: "40px 28px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "#30E9BD",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    fontSize: 26,
                  }}
                >
                  ✓
                </div>
                <h3
                  style={{
                    fontFamily: "'SUIT Variable','SUIT',sans-serif",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#fff",
                    marginBottom: 10,
                  }}
                >
                  Message sent!
                </h3>
                <p
                  style={{
                    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.65)",
                    lineHeight: 1.6,
                    marginBottom: 24,
                  }}
                >
                  Thanks, {form.name}. We'll be in touch at {form.email}{" "}
                  shortly.
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setForm({
                      name: "",
                      email: "",
                      topic: "General",
                      message: "",
                    });
                  }}
                  style={{
                    background: "transparent",
                    border: "1.5px solid rgba(255,255,255,0.3)",
                    color: "#fff",
                    borderRadius: 100,
                    padding: "10px 24px",
                    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => (e.target.style.borderColor = "#30E9BD")}
                  onMouseLeave={(e) =>
                    (e.target.style.borderColor = "rgba(255,255,255,0.3)")
                  }
                >
                  Send another message
                </button>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 18 }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div>
                    <label style={ls}>Name *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      onFocus={() => setFocused("name")}
                      onBlur={() => setFocused("")}
                      placeholder="Your name"
                      style={fs("name")}
                    />
                  </div>
                  <div>
                    <label style={ls}>Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      onFocus={() => setFocused("email")}
                      onBlur={() => setFocused("")}
                      placeholder="you@company.com"
                      style={fs("email")}
                    />
                  </div>
                </div>
                <div>
                  <label style={ls}>Topic</label>
                  <select
                    value={form.topic}
                    onChange={(e) =>
                      setForm({ ...form, topic: e.target.value })
                    }
                    onFocus={() => setFocused("topic")}
                    onBlur={() => setFocused("")}
                    style={{
                      ...fs("topic"),
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round'><path d='M6 9l6 6 6-6'/></svg>\")",
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                      paddingRight: 40,
                    }}
                  >
                    <option value="General" style={{ background: "#1a2a22" }}>
                      General inquiry
                    </option>
                    <option value="School" style={{ background: "#1a2a22" }}>
                      School partnership
                    </option>
                    <option value="Custom" style={{ background: "#1a2a22" }}>
                      Custom kit request
                    </option>
                    <option value="Support" style={{ background: "#1a2a22" }}>
                      Technical support
                    </option>
                  </select>
                </div>
                <div>
                  <label style={ls}>Message *</label>
                  <textarea
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    onFocus={() => setFocused("message")}
                    onBlur={() => setFocused("")}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    style={{
                      ...fs("message"),
                      resize: "vertical",
                      minHeight: 110,
                    }}
                  />
                </div>
                {error && (
                  <div
                    style={{
                      fontFamily:
                        "'Pretendard Variable','Pretendard',sans-serif",
                      fontSize: 13,
                      color: "#ff8e8e",
                      padding: "8px 14px",
                      background: "rgba(255,100,100,0.08)",
                      borderRadius: 8,
                      border: "1px solid rgba(255,100,100,0.2)",
                    }}
                  >
                    {error}
                  </div>
                )}
                <button
                  onClick={handleSubmit}
                  style={{
                    background: "#30E9BD",
                    color: "#0d0d0d",
                    border: "none",
                    borderRadius: 100,
                    padding: "14px 28px",
                    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.25s",
                    boxShadow: "0 4px 20px rgba(48,233,189,0.3)",
                    marginTop: 4,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 26px rgba(48,233,189,0.45)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow =
                      "0 4px 20px rgba(48,233,189,0.3)";
                  }}
                >
                  Send message →
                </button>
                <p
                  style={{
                    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  By submitting, you agree to our privacy policy.
                </p>
              </div>
            )}
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}

function Footer({ setPage, setSelectedKit, kits = [] }) {
  const col = {
    label: {
      fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "rgba(234,251,243,0.45)",
      marginBottom: 20,
    },
    link: {
      background: "none",
      border: "none",
      fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
      fontSize: 15,
      color: "rgba(234,251,243,0.75)",
      cursor: "pointer",
      padding: 0,
      display: "block",
      marginBottom: 12,
      textAlign: "left",
      transition: "color 0.2s",
    },
  };
  const kitLinks = kits.map((k) => ({
    label: k.name,
    action: () => {
      setPage("home");
      setSelectedKit(k);
    },
  }));
  const centerLinks = [
    { label: "Privacy & Security", action: () => setPage("privacy") },
    {
      label: "About Playtag ↗",
      action: () =>
        window.open(
          "https://playtag.ai/index.php",
          "_blank",
          "noopener,noreferrer"
        ),
    },
  ];
  return (
    <footer
      style={{
        background: "#0E2A22",
        color: "#EAFBF3",
        padding: "72px clamp(24px,5vw,64px) 0",
      }}
    >
      <style>{`
        .footer-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr 1fr 1.4fr;
          gap: 60px;
        }
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }
        @media (max-width: 768px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }
        @media (max-width: 480px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
            gap: 6px;
          }
        }
      `}</style>

      <div
        className="footer-grid"
        style={{
          maxWidth: 1240,
          margin: "0 auto",
          paddingBottom: 64,
          borderBottom: "1px solid rgba(234,251,243,0.1)",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginBottom: 24,
            }}
          >
            <img
              src={LOGO_SRC}
              alt="StoryLine"
              style={{
                height: 26,
                width: "auto",
                objectFit: "contain",
                display: "block",
                filter: "brightness(0) invert(1)",
              }}
            />
            <span
              style={{
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(234,251,243,0.75)",
                letterSpacing: "0.02em",
                lineHeight: 1,
                marginLeft: 2,
                marginTop: 1,
              }}
            >
              Toolkit
            </span>
          </div>
          <p
            style={{
              fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
              fontSize: 16,
              lineHeight: 1.65,
              color: "rgba(234,251,243,0.75)",
              maxWidth: 300,
              margin: 0,
            }}
          >
            A teacher-first toolkit for bringing{" "}
            <span
              style={{
                textDecoration: "underline",
                textDecorationColor: "#2EE8B8",
                textUnderlineOffset: 3,
                color: "rgba(234,251,243,0.9)",
              }}
            >
              better observation
            </span>{" "}
            into early-childhood classrooms.
          </p>
        </div>
        <div>
          <div style={col.label}>Toolkit</div>
          {kitLinks.map((l) => (
            <button
              key={l.label}
              onClick={l.action}
              style={col.link}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2EE8B8")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(234,251,243,0.75)")
              }
            >
              {l.label}
            </button>
          ))}
        </div>
        <div>
          <div style={col.label}>Center</div>
          {centerLinks.map((l) => (
            <button
              key={l.label}
              onClick={l.action}
              style={col.link}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#2EE8B8")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "rgba(234,251,243,0.75)")
              }
            >
              {l.label}
            </button>
          ))}
        </div>
        <div>
          <div style={col.label}>Get in Touch</div>
          <button
            onClick={() => {
              setPage("home");
              setSelectedKit(null);
              setTimeout(() => scrollToId("contact"), 50);
            }}
            style={col.link}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#2EE8B8")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(234,251,243,0.75)")
            }
          >
            Contact
          </button>
        </div>
      </div>

      <div
        className="footer-bottom"
        style={{ maxWidth: 1240, margin: "0 auto", padding: "24px 0 32px" }}
      >
        <span
          style={{
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 13,
            color: "rgba(234,251,243,0.4)",
          }}
        >
          © 2026 Playtag Inc. · StoryLine is a product of Playtag.
        </span>
        <span
          style={{
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 13,
            color: "rgba(234,251,243,0.4)",
          }}
        >
          COPPA · FERPA · State-privacy compliant
        </span>
      </div>
    </footer>
  );
}

function KitDetail({ kit, setSelectedKit, setPage }) {
  const [downloadingId, setDownloadingId] = useState(null);
  const [modalDoc, setModalDoc] = useState(null); // { idx, fileUrl }

  const handleDownload = (idx, fileUrl, title) => {
    if (!fileUrl) return;
    setModalDoc({ idx, fileUrl, title });
  };

  const handleModalConfirm = async ({ name, email, company }) => {
    try {
      const params = new URLSearchParams({
        name,
        email,
        company: company || "",
        file: modalDoc.title || modalDoc.fileUrl,
      });
      const img = new Image();
      img.src = `https://script.google.com/macros/s/AKfycbzvwFflzxuwGPJtd7GgrJR-Nsb1nMXfp8_JnTnFcgxerMCwuIjvFu8Ro90BECDEQugH9g/exec?${params.toString()}`;
    } catch (e) {
      console.error("sheets error:", e);
    }
    window.open(modalDoc.fileUrl, "_blank", "noopener,noreferrer");
    setDownloadingId(modalDoc.idx);
    setTimeout(() => setDownloadingId(null), 1500);
    setModalDoc(null);
  };
  const iconMap = { school: "🎓", teacher: "📖", parent: "👥", brand: "📡" };
  return (
    <section
      style={{
        padding: "32px clamp(20px,4vw,48px)",
        maxWidth: 1100,
        margin: "0 auto",
        minHeight: "70vh",
      }}
    >
      {modalDoc && (
        <DownloadModal
          onConfirm={handleModalConfirm}
          onClose={() => setModalDoc(null)}
        />
      )}
      <AnimatedSection>
        <button
          onClick={() => setSelectedKit(null)}
          style={{
            background: "#f5f5f3",
            border: "1.5px solid #e0e0da",
            borderRadius: 8,
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 14,
            color: "#444",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 32,
            padding: "8px 16px",
            fontWeight: 500,
            transition: "background 0.15s, border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ebebе8";
            e.currentTarget.style.borderColor = "#bbb";
            e.currentTarget.style.color = "#111";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f5f5f3";
            e.currentTarget.style.borderColor = "#e0e0da";
            e.currentTarget.style.color = "#444";
          }}
        >
          ← Back to Toolkit
        </button>
      </AnimatedSection>
      <AnimatedSection delay={100}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 40,
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "#E8FDF6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                border: "1.5px solid #C8F5E8",
              }}
            >
              {iconMap[kit.id]}
            </div>
            <div>
              <h1
                style={{
                  fontFamily: "'SUIT Variable','SUIT',sans-serif",
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                {kit.name}
              </h1>
              <p
                style={{
                  fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                  fontSize: 15,
                  color: "#000",
                }}
              >
                {kit.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedKit(null);
              setPage("home");
              setTimeout(() => scrollToId("contact"), 100);
            }}
            style={{
              background: "#fff",
              border: "1.5px solid #ddd",
              borderRadius: 100,
              padding: "10px 24px",
              fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#555",
            }}
            onMouseEnter={(e) => (e.target.style.borderColor = "#1a1a1a")}
            onMouseLeave={(e) => (e.target.style.borderColor = "#ddd")}
          >
            ✉️ Contact Us
          </button>
        </div>
      </AnimatedSection>
      <AnimatedSection delay={200}>
        <h3
          style={{
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: 24,
          }}
        >
          Available Documents ({kit.documents.length})
        </h3>
      </AnimatedSection>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 20,
        }}
      >
        {kit.documents.map((doc, i) => (
          <AnimatedSection key={i} delay={300 + i * 100}>
            <DocCard
              doc={doc}
              downloading={downloadingId === i}
              onDownload={() => handleDownload(i, doc.file_url, doc.title)}
            />
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}

function DocThumbnail({ type, title, thumbnailUrl }) {
  const isVideo =
    type === "Video" || (title && title.toLowerCase().includes("video"));
  if (thumbnailUrl)
    return (
      <img
        src={thumbnailUrl}
        alt={title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "top",
          display: "block",
        }}
        onError={(e) => {
          e.target.style.display = "none";
        }}
      />
    );
  if (isVideo)
    return (
      <svg
        viewBox="0 0 360 180"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <rect width="360" height="180" fill="#0E2A22" />
        {[40, 80, 120, 160].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="360"
            y2={y}
            stroke="rgba(46,232,184,0.08)"
            strokeWidth="1"
          />
        ))}
        {[72, 144, 216, 288].map((x) => (
          <line
            key={x}
            x1={x}
            y1="0"
            x2={x}
            y2="180"
            stroke="rgba(46,232,184,0.08)"
            strokeWidth="1"
          />
        ))}
        <circle
          cx="180"
          cy="90"
          r="36"
          fill="rgba(46,232,184,0.15)"
          stroke="#2EE8B8"
          strokeWidth="1.5"
        />
        <polygon points="170,74 200,90 170,106" fill="#2EE8B8" />
        <text
          x="40"
          y="162"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontSize="10"
          fill="#2EE8B8"
          fontWeight="700"
        >
          VIDEO
        </text>
      </svg>
    );
  if (type === "Template")
    return (
      <svg
        viewBox="0 0 360 180"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <rect width="360" height="180" fill="#F4FBF7" />
        <rect x="24" y="20" width="160" height="10" rx="3" fill="#C6FBEA" />
        <rect x="24" y="36" width="100" height="7" rx="2" fill="#DFF1E7" />
        {[60, 82, 104, 126].map((y, i) => (
          <g key={y}>
            <rect
              x="24"
              y={y}
              width={i % 2 === 0 ? 140 : 100}
              height="8"
              rx="2"
              fill="#E8F8F0"
            />
            <rect
              x="24"
              y={y + 10}
              width="300"
              height="1"
              rx="0.5"
              fill="#C8E6D8"
            />
          </g>
        ))}
        <rect
          x="24"
          y="152"
          width="120"
          height="1"
          fill="#0FB896"
          opacity="0.5"
        />
        <rect
          x="290"
          y="18"
          width="50"
          height="22"
          rx="4"
          fill="#ACF6E5"
          opacity="0.7"
        />
        <text
          x="315"
          y="33"
          textAnchor="middle"
          fontFamily="sans-serif"
          fontSize="9"
          fill="#0FB896"
          fontWeight="700"
        >
          FORM
        </text>
      </svg>
    );
  if (type === "Resource")
    return (
      <svg
        viewBox="0 0 360 180"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <rect width="360" height="180" fill="#F7FCF9" />
        <rect x="24" y="20" width="80" height="9" rx="3" fill="#ACF6E5" />
        {[
          { y: 46, qw: 180, aw: 240 },
          { y: 78, qw: 150, aw: 210 },
          { y: 110, qw: 200, aw: 160 },
          { y: 142, qw: 130, aw: 190 },
        ].map(({ y, qw, aw }, i) => (
          <g key={i}>
            <circle cx="30" cy={y + 4} r="5" fill="#2EE8B8" opacity="0.8" />
            <rect x="42" y={y} width={qw} height="8" rx="2" fill="#C8E6D8" />
            <rect
              x="42"
              y={y + 14}
              width={aw}
              height="6"
              rx="2"
              fill="#E8F8F0"
            />
          </g>
        ))}
      </svg>
    );
  return (
    <svg
      viewBox="0 0 360 180"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <rect width="360" height="180" fill="#EEF8F3" />
      <rect x="0" y="0" width="360" height="5" fill="#2EE8B8" />
      <circle cx="36" cy="28" r="12" fill="#ACF6E5" />
      <rect x="54" y="22" width="72" height="8" rx="3" fill="#C8E6D8" />
      <rect
        x="24"
        y="52"
        width="200"
        height="14"
        rx="3"
        fill="#0E2A22"
        opacity="0.75"
      />
      <rect
        x="24"
        y="72"
        width="150"
        height="10"
        rx="3"
        fill="#0E2A22"
        opacity="0.4"
      />
      {[96, 110, 124, 138].map((y, i) => (
        <rect
          key={y}
          x="24"
          y={y}
          width={i === 3 ? 180 : 300}
          height="7"
          rx="2"
          fill="#C8E6D8"
          opacity="0.8"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <rect
          key={i}
          x={280 + i * 22}
          y={140 - i * 18}
          width="16"
          height={20 + i * 18}
          rx="3"
          fill="#2EE8B8"
          opacity={0.4 + i * 0.2}
        />
      ))}
    </svg>
  );
}

function DownloadModal({ onConfirm, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", company: "" });
  const [error, setError] = useState("");
  const ff = "'Pretendard Variable','Pretendard',sans-serif";

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    onConfirm(form);
  };

  const inputStyle = (focused) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: "1.5px solid #e8e8e4",
    fontFamily: ff,
    fontSize: 14,
    color: "#1a1a1a",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  });

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
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: 20,
          padding: "36px 32px",
          width: "100%",
          maxWidth: 420,
          boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
        }}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 20,
            color: "#aaa",
            cursor: "pointer",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "#E8FDF6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              marginBottom: 16,
              border: "1.5px solid #C8F5E8",
            }}
          >
            ⬇️
          </div>
          <h2
            style={{
              fontFamily: "'SUIT Variable','SUIT',sans-serif",
              fontSize: 20,
              fontWeight: 900,
              color: "#1a1a1a",
              marginBottom: 6,
            }}
          >
            Download File
          </h2>
          <p
            style={{
              fontFamily: ff,
              fontSize: 13,
              color: "#999",
              lineHeight: 1.6,
            }}
          >
            Please enter your details to proceed with the download.
          </p>
        </div>

        {/* Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: ff,
                fontSize: 12,
                fontWeight: 600,
                color: "#555",
                marginBottom: 6,
              }}
            >
              Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Kim"
              style={inputStyle()}
              onFocus={(e) => (e.target.style.borderColor = "#30E9BD")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e4")}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: ff,
                fontSize: 12,
                fontWeight: 600,
                color: "#555",
                marginBottom: 6,
              }}
            >
              Email *
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              style={inputStyle()}
              onFocus={(e) => (e.target.style.borderColor = "#30E9BD")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e4")}
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                fontFamily: ff,
                fontSize: 12,
                fontWeight: 600,
                color: "#555",
                marginBottom: 6,
              }}
            >
              Organization (optional)
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="School or company name"
              style={inputStyle()}
              onFocus={(e) => (e.target.style.borderColor = "#30E9BD")}
              onBlur={(e) => (e.target.style.borderColor = "#e8e8e4")}
            />
          </div>
          {error && (
            <div
              style={{
                fontFamily: ff,
                fontSize: 12,
                color: "#e05c5c",
                padding: "8px 12px",
                background: "#fff5f5",
                borderRadius: 8,
                border: "1px solid #fcd5d5",
              }}
            >
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            style={{
              background: "#1a1a1a",
              color: "#fff",
              border: "none",
              borderRadius: 100,
              padding: "13px 24px",
              fontFamily: ff,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              marginTop: 4,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#30E9BD";
              e.target.style.color = "#0d0d0d";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#1a1a1a";
              e.target.style.color = "#fff";
            }}
          >
            Download Now
          </button>
          <p
            style={{
              fontFamily: ff,
              fontSize: 11,
              color: "#bbb",
              textAlign: "center",
              margin: 0,
            }}
          >
            Your information is used solely for resource access purposes.
          </p>
        </div>
      </div>
    </div>
  );
}

function DocCard({ doc, downloading, onDownload }) {
  const [hovered, setHovered] = useState(false);
  const hasFile = !!doc.file_url;
  const btnBase = {
    borderRadius: 100,
    padding: "8px 20px",
    fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
    fontSize: 13,
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    transition: "all 0.25s",
    cursor: hasFile ? "pointer" : "default",
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        borderRadius: 16,
        border: hovered ? "1.5px solid #30E9BD" : "1.5px solid #e8e8e4",
        overflow: "hidden",
        transition: "all 0.35s cubic-bezier(.22,1,.36,1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 8px 28px rgba(48,233,189,0.1)"
          : "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 160,
          overflow: "hidden",
          background: "#F4FBF7",
          position: "relative",
        }}
      >
        <DocThumbnail
          type={doc.type}
          title={doc.title}
          thumbnailUrl={doc.thumbnail_url}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 14,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid #C8E6D8",
            borderRadius: 6,
            padding: "3px 10px",
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 11,
            fontWeight: 700,
            color: "#0FB896",
            letterSpacing: "0.06em",
            backdropFilter: "blur(4px)",
          }}
        >
          {doc.type}
        </div>
      </div>
      <div style={{ padding: "18px 22px 22px" }}>
        <h4
          style={{
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: 8,
            lineHeight: 1.4,
          }}
        >
          {doc.title}
        </h4>
        <p
          style={{
            fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
            fontSize: 13,
            color: "#000",
            lineHeight: 1.55,
            marginBottom: 18,
          }}
        >
          {doc.desc}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
              fontSize: 12,
              color: "#bbb",
            }}
          >
            Updated {doc.date}
          </span>

          {/* ✅ 핵심 수정: file_url 없으면 Coming soon, 있으면 window.open으로 새 탭 */}
          {hasFile ? (
            <button
              onClick={onDownload}
              style={{
                ...btnBase,
                background: downloading ? "#E0FBF4" : "#fff",
                border: "1.5px solid #30E9BD",
                color: "#30E9BD",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#30E9BD";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = downloading
                  ? "#E0FBF4"
                  : "#fff";
                e.currentTarget.style.color = "#30E9BD";
              }}
            >
              {downloading ? (
                "✓ Done"
              ) : (
                <>
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 4v12M7 11l5 5 5-5M5 20h14" />
                  </svg>
                  Download
                </>
              )}
            </button>
          ) : (
            <span
              style={{
                ...btnBase,
                border: "1.5px solid #eee",
                color: "#ccc",
                cursor: "default",
              }}
            >
              Coming soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function PrivacyPage() {
  return (
    <div>
      <section
        style={{
          background: "#0d0d0d",
          padding: "clamp(60px,8vw,120px) clamp(24px,5vw,64px)",
          position: "relative",
          overflow: "hidden",
          minHeight: 480,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -40,
            right: "10%",
            width: 280,
            height: 200,
            borderRadius: 16,
            background:
              "linear-gradient(135deg,rgba(48,233,189,0.15),rgba(48,233,189,0.05))",
            transform: "rotate(6deg)",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 80,
            right: "25%",
            width: 220,
            height: 180,
            borderRadius: 16,
            background:
              "linear-gradient(135deg,rgba(48,233,189,0.1),rgba(48,233,189,0.03))",
            transform: "rotate(-3deg)",
            opacity: 0.5,
          }}
        />
        <div style={{ maxWidth: 600, position: "relative", zIndex: 1, margin: "0 auto", textAlign: "center" }}>
          <AnimatedSection>
            <div
              style={{
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 24,
                opacity: 0.7,
              }}
            >
              Data Privacy and Security
            </div>
          </AnimatedSection>
          <AnimatedSection delay={150}>
            <h1
              style={{
                fontFamily: "'SUIT Variable','SUIT',sans-serif",
                fontSize: "clamp(32px,5vw,52px)",
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1.15,
                marginBottom: 28,
                letterSpacing: "-0.02em",
              }}
            >
              The Most Secure Behavioral Analytics Platform
              <br />
              <span style={{ color: "#30E9BD" }}>
                for Early Childhood Education
              </span>
            </h1>
          </AnimatedSection>
          <AnimatedSection delay={300}>
            <p
              style={{
                fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
                fontSize: 17,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.7,
                maxWidth: 520,
                margin: "0 auto",
              }}
            >
              An end-to-end secure platform that protects your classroom data
              and video with enterprise-level security designed for early
              childhood centers.
            </p>
          </AnimatedSection>
        </div>
      </section>
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <AnimatedSection>
          <h2
            style={{
              fontFamily: "'SUIT Variable','SUIT',sans-serif",
              fontSize: "clamp(28px,4vw,44px)",
              fontWeight: 900,
              color: "#1a1a1a",
              marginBottom: 20,
              lineHeight: 1.15,
            }}
          >
            Built on Trust. Designed for Insight.
          </h2>
        </AnimatedSection>
        <AnimatedSection delay={150}>
          <p
            style={{
              fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
              fontSize: 16,
              color: "#888",
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto 40px",
            }}
          >
            StoryLine helps educators and families understand children's
            developmental progress through meaningful observational insights,
            grounded in U.S. child privacy laws.
          </p>
        </AnimatedSection>
      </section>
      <section
        style={{ padding: "40px 24px 80px", maxWidth: 1000, margin: "0 auto" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {[
            {
              icon: "🔒",
              title: "End-to-End Encryption",
              desc: "All data is encrypted in transit and at rest using AES-256 encryption standards.",
            },
            {
              icon: "📋",
              title: "COPPA & FERPA Compliant",
              desc: "Full compliance with children's privacy protection and educational records regulations.",
            },
            {
              icon: "🏛️",
              title: "SOC 2 Type II Certified",
              desc: "Independently audited security controls ensuring the highest standards of data protection.",
            },
            {
              icon: "👁️",
              title: "Transparent Data Practices",
              desc: "Clear policies on data collection, usage, retention, and deletion at every step.",
            },
            {
              icon: "🔑",
              title: "Role-Based Access Control",
              desc: "Granular permissions ensuring only authorized personnel can access sensitive data.",
            },
            {
              icon: "📊",
              title: "Audit Trail & Logging",
              desc: "Comprehensive activity logging for full accountability and compliance reporting.",
            },
          ].map((f, i) => (
            <AnimatedSection key={i} delay={i * 80}>
              <SecurityCard feature={f} />
            </AnimatedSection>
          ))}
        </div>
      </section>
    </div>
  );
}

function BrandKitPage({ kit, setSelectedKit, setPage }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [modalDoc, setModalDoc] = useState(null);

  const handleBrandDownload = (fileUrl, title) => {
    if (!fileUrl) return;
    setModalDoc({ fileUrl, title });
  };

  const handleModalConfirm = async ({ name, email, company }) => {
    try {
      const params = new URLSearchParams({
        name,
        email,
        company: company || "",
        file: modalDoc.title || modalDoc.fileUrl,
      });
      const img = new Image();
      img.src = `https://script.google.com/macros/s/AKfycbzvwFflzxuwGPJtd7GgrJR-Nsb1nMXfp8_JnTnFcgxerMCwuIjvFu8Ro90BECDEQugH9g/exec?${params.toString()}`;
    } catch (e) {
      console.error("sheets error:", e);
    }
    window.open(modalDoc.fileUrl, "_blank", "noopener,noreferrer");
    setModalDoc(null);
  };
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "logo", label: "Logo" },
    { id: "colors", label: "Colors" },
    { id: "typography", label: "Typography" },
    { id: "incorrect", label: "Incorrect Use" },
    { id: "partnership", label: "Partnership" },
    { id: "naming", label: "Naming" },
    { id: "contact", label: "Contact" },
  ];
  const ff = "'Pretendard Variable','Pretendard',sans-serif";
  const ffSuit = "'SUIT Variable','SUIT',sans-serif";
  const badge = (text, color = "#30E9BD") => (
    <span
      style={{
        display: "inline-block",
        fontFamily: ff,
        fontSize: 12,
        fontWeight: 700,
        color,
        background: color + "18",
        border: "1px solid " + color + "40",
        borderRadius: 100,
        padding: "4px 12px",
        marginBottom: 16,
      }}
    >
      {text}
    </span>
  );
  const card = (children, style) => (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1.5px solid #e8e8e4",
        padding: 32,
        ...style,
      }}
    >
      {children}
    </div>
  );

  const renderTab = () => {
    if (activeTab === "overview")
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {card(
            <>
              {badge("Brand Overview")}
              <h2
                style={{
                  fontFamily: ffSuit,
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 14,
                }}
              >
                StoryLine Brand Guidelines
              </h2>
              <p
                style={{
                  fontFamily: ff,
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                This guide defines the core visual identity of StoryLine — logo
                usage, wordmark rules, signature applications, color system,
                typography, co-branding expressions, and corporate naming
                conventions.
              </p>
              {[
                ["Logo System", "Symbol · Wordmark · Signature"],
                ["Color System", "Primary · Supporting · Mono"],
                ["Typography", "SUIT · Pretendard"],
                ["Co-branding", "Partner · Playtag"],
              ].map(([t, s]) => (
                <div
                  key={t}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: "#f7f7f5",
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: ff,
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#1a1a1a",
                    }}
                  >
                    {t}
                  </span>
                  <span style={{ fontFamily: ff, fontSize: 13, color: "#aaa" }}>
                    {s}
                  </span>
                </div>
              ))}
            </>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {card(
              <>
                {badge("Primary Typefaces")}
                <h3
                  style={{
                    fontFamily: ffSuit,
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#1a1a1a",
                    marginBottom: 10,
                  }}
                >
                  SUIT & Pretendard
                </h3>
                <p
                  style={{
                    fontFamily: ff,
                    fontSize: 14,
                    color: "#888",
                    lineHeight: 1.6,
                  }}
                >
                  SUIT for product interfaces. Pretendard for web, advertising,
                  and presentations.
                </p>
              </>
            )}
            {card(
              <>
                {badge("Core Colors")}
                <h3
                  style={{
                    fontFamily: ffSuit,
                    fontSize: 20,
                    fontWeight: 900,
                    color: "#1a1a1a",
                    marginBottom: 10,
                  }}
                >
                  #30E9BD · #FFFFFF · #40CAF5
                </h3>
                <p
                  style={{
                    fontFamily: ff,
                    fontSize: 14,
                    color: "#888",
                    lineHeight: 1.6,
                  }}
                >
                  Green, white, and blue anchor the StoryLine color system.
                </p>
              </>
            )}
          </div>
        </div>
      );
    if (activeTab === "logo")
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {card(
            <>
              {badge("Logo System")}
              <h2
                style={{
                  fontFamily: ffSuit,
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 12,
                }}
              >
                Logo, Wordmark & Signature
              </h2>
              <p
                style={{
                  fontFamily: ff,
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                The StoryLine logo system includes the symbol, wordmark, and
                official signature lockups. Always maintain clear space,
                preserve original proportions, and avoid distortion or
                recoloring.
              </p>
              <div
                style={{
                  background: "#f4f4f2",
                  borderRadius: 12,
                  padding: "28px 24px",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: "linear-gradient(135deg,#30E9BD,#40CAF5)",
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: ffSuit,
                      fontSize: 32,
                      fontWeight: 900,
                      color: "#1a1a1a",
                    }}
                  >
                    StoryLine
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: ff,
                    fontSize: 12,
                    color: "#999",
                    margin: 0,
                  }}
                >
                  Minimum size: 20px for mobile / 7mm for print
                </p>
              </div>
              {[
                "Use the wordmark in its original SUIT-typeface form — no redrawing.",
                "Maintain minimum clear space based on the x-height of lowercase “n”.",
                "Use vertical signature for service layouts; horizontal for web and presentations.",
                "Supporting symbol variants (reversed, grayscale) should only be used in limited contexts.",
              ].map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{ color: "#30E9BD", fontSize: 16, marginTop: 1 }}
                  >
                    ·
                  </span>
                  <span
                    style={{
                      fontFamily: ff,
                      fontSize: 14,
                      color: "#555",
                      lineHeight: 1.6,
                    }}
                  >
                    {t}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      );
    if (activeTab === "colors")
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {card(
            <>
              {badge("Color System")}
              <h2
                style={{
                  fontFamily: ffSuit,
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 12,
                }}
              >
                Primary & Supporting Colors
              </h2>
              <p
                style={{
                  fontFamily: ff,
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                StoryLine’s core palette is green, white, blue, and the official
                gradient. Supporting and monochrome tones extend the visual
                language across all environments.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                  gap: 16,
                }}
              >
                {[
                  {
                    name: "Gradient",
                    hex: "#30E9BD → #40CAF5",
                    bg: "linear-gradient(135deg,#30E9BD,#40CAF5)",
                  },
                  { name: "StoryLine Green", hex: "#30E9BD", bg: "#30E9BD" },
                  {
                    name: "StoryLine White",
                    hex: "#FFFFFF",
                    bg: "#FFFFFF",
                    border: true,
                  },
                  { name: "StoryLine Blue", hex: "#40CAF5", bg: "#40CAF5" },
                  {
                    name: "Supporting 01",
                    hex: "#F1FFFC",
                    bg: "#F1FFFC",
                    border: true,
                  },
                  { name: "Supporting 02", hex: "#D6FBF2", bg: "#D6FBF2" },
                  { name: "Highlight", hex: "#ACF6E5", bg: "#ACF6E5" },
                  { name: "Supporting 05", hex: "#59EDCA", bg: "#59EDCA" },
                ].map((c) => (
                  <div
                    key={c.name}
                    style={{
                      borderRadius: 12,
                      border: "1.5px solid #e8e8e4",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: 80,
                        background: c.bg,
                        border: c.border ? "1px solid #eee" : "none",
                      }}
                    />
                    <div style={{ padding: "12px 14px" }}>
                      <div
                        style={{
                          fontFamily: ff,
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#1a1a1a",
                          marginBottom: 3,
                        }}
                      >
                        {c.name}
                      </div>
                      <div
                        style={{ fontFamily: ff, fontSize: 12, color: "#aaa" }}
                      >
                        {c.hex}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      );
    if (activeTab === "typography")
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {card(
            <>
              {badge("Primary Typeface")}
              <h2
                style={{
                  fontFamily: ffSuit,
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 12,
                }}
              >
                SUIT Variable
              </h2>
              <p
                style={{
                  fontFamily: ff,
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}
              >
                Used for all product UI, headlines, and display text. Weight
                range: 100–900.
              </p>
              <div
                style={{ background: "#f7f7f5", borderRadius: 10, padding: 20 }}
              >
                <div
                  style={{
                    fontFamily: ffSuit,
                    fontSize: 36,
                    fontWeight: 900,
                    color: "#1a1a1a",
                    marginBottom: 4,
                  }}
                >
                  Aa
                </div>
                <div
                  style={{ fontFamily: ffSuit, fontSize: 14, color: "#888" }}
                >
                  SUIT Variable · 900 / 700 / 400
                </div>
              </div>
            </>
          )}
          {card(
            <>
              {badge("Supporting Typeface")}
              <h2
                style={{
                  fontFamily: ff,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: 12,
                }}
              >
                Pretendard Variable
              </h2>
              <p
                style={{
                  fontFamily: ff,
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}
              >
                Used for body copy, captions, and all web/presentation content.
                Weight range: 100–900.
              </p>
              <div
                style={{ background: "#f7f7f5", borderRadius: 10, padding: 20 }}
              >
                <div
                  style={{
                    fontFamily: ff,
                    fontSize: 36,
                    fontWeight: 700,
                    color: "#1a1a1a",
                    marginBottom: 4,
                  }}
                >
                  Aa
                </div>
                <div style={{ fontFamily: ff, fontSize: 14, color: "#888" }}>
                  Pretendard Variable · 700 / 500 / 400
                </div>
              </div>
            </>
          )}
        </div>
      );
    if (activeTab === "incorrect")
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {card(
            <>
              {badge("Incorrect Use", "#ff6b6b")}
              <h2
                style={{
                  fontFamily: ffSuit,
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 8,
                }}
              >
                What to Avoid
              </h2>
              <p
                style={{
                  fontFamily: ff,
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                Improper logo usage undermines brand consistency. When in doubt,
                contact{" "}
                <a href="mailto:pr@playtag.ai" style={{ color: "#30E9BD" }}>
                  pr@playtag.ai
                </a>{" "}
                before applying.
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    background: "#f0fdf8",
                    borderRadius: 12,
                    padding: 20,
                    border: "1px solid #c6f6e8",
                  }}
                >
                  <div
                    style={{
                      fontFamily: ff,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#30E9BD",
                      marginBottom: 12,
                    }}
                  >
                    Recommended
                  </div>
                  {[
                    "Use the official symbol, wordmark, and signature",
                    "Maintain clear space around the logo",
                    "Use approved colors and variants only",
                    "Scale proportionally per context",
                    "Preserve optical balance in lockups",
                  ].map((t, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 8, marginBottom: 8 }}
                    >
                      <span style={{ color: "#30E9BD" }}>✓</span>
                      <span
                        style={{ fontFamily: ff, fontSize: 13, color: "#444" }}
                      >
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    background: "#fff5f5",
                    borderRadius: 12,
                    padding: 20,
                    border: "1px solid #fcd5d5",
                  }}
                >
                  <div
                    style={{
                      fontFamily: ff,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#e05c5c",
                      marginBottom: 12,
                    }}
                  >
                    Do Not
                  </div>
                  {[
                    "Distort or stretch the logo",
                    "Use unapproved colors",
                    "Rotate the symbol",
                    "Crop the wordmark or symbol",
                    "Change letter case or spacing arbitrarily",
                    "Freely recombine logo elements",
                  ].map((t, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 8, marginBottom: 8 }}
                    >
                      <span style={{ color: "#e05c5c" }}>✗</span>
                      <span
                        style={{ fontFamily: ff, fontSize: 13, color: "#444" }}
                      >
                        {t}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      );
    if (activeTab === "partnership")
      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {card(
            <>
              {badge("Partnership")}
              <h2
                style={{
                  fontFamily: ffSuit,
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 12,
                }}
              >
                Co-branding Rules
              </h2>
              <p
                style={{
                  fontFamily: ff,
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}
              >
                When StoryLine appears alongside a partner brand, use the
                StoryLine wordmark as the visual anchor. Partner logos must be
                scaled so they do not overpower the StoryLine identity.
              </p>
              <div
                style={{
                  background: "#f7f7f5",
                  borderRadius: 12,
                  padding: "20px 24px",
                  textAlign: "center",
                }}
              >
                <span
                  style={{ fontFamily: ffSuit, fontSize: 24, fontWeight: 900 }}
                >
                  <span style={{ color: "#30E9BD" }}>StoryLine</span> @ Partner
                </span>
              </div>
            </>
          )}
          {card(
            <>
              {badge("Service & Playtag")}
              <h2
                style={{
                  fontFamily: ffSuit,
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 12,
                }}
              >
                Powered by PLAYTAG
              </h2>
              <p
                style={{
                  fontFamily: ff,
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.7,
                  marginBottom: 20,
                }}
              >
                StoryLine and Playtag may appear together in approved lockups.
                Use the English naming standard and always keep minimum clear
                space.
              </p>
              <div
                style={{
                  background: "#f7f7f5",
                  borderRadius: 12,
                  padding: "20px 24px",
                }}
              >
                <div
                  style={{
                    fontFamily: ff,
                    fontSize: 11,
                    color: "#aaa",
                    marginBottom: 6,
                  }}
                >
                  Powered by
                </div>
                <span
                  style={{ fontFamily: ffSuit, fontSize: 22, fontWeight: 900 }}
                >
                  <span style={{ color: "#30E9BD" }}>StoryLine</span> PLAYTAG
                </span>
              </div>
            </>
          )}
        </div>
      );
    if (activeTab === "naming")
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {card(
            <>
              {badge("Naming")}
              <h2
                style={{
                  fontFamily: ffSuit,
                  fontSize: 24,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 12,
                }}
              >
                Corporate Naming Conventions
              </h2>
              <p
                style={{
                  fontFamily: ff,
                  fontSize: 14,
                  color: "#666",
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                Consistent naming reinforces brand recognition. Always follow
                these conventions across all channels.
              </p>
              {[
                [
                  "Product name",
                  "StoryLine (capital S, capital L — never Storyline or STORYLINE)",
                ],
                ["Company name", "Playtag (not PLAYTAG in body text)"],
                [
                  "Combined reference",
                  "StoryLine by Playtag / Powered by Playtag",
                ],
                ["Domain", "storyline.playtag.ai"],
              ].map(([label, rule]) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    padding: "14px 0",
                    borderBottom: "1px solid #f0f0ec",
                  }}
                >
                  <span
                    style={{
                      fontFamily: ff,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      minWidth: 140,
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: ff,
                      fontSize: 13,
                      color: "#666",
                      lineHeight: 1.6,
                    }}
                  >
                    {rule}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      );
    if (activeTab === "contact")
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              background: "linear-gradient(135deg, #E8FDF6, #F0FBF8)",
              borderRadius: 16,
              border: "1.5px solid #C8F5E8",
              padding: 40,
            }}
          >
            <h2
              style={{
                fontFamily: ffSuit,
                fontSize: 28,
                fontWeight: 900,
                color: "#1a1a1a",
                marginBottom: 12,
              }}
            >
              Any Inquiries
            </h2>
            <p
              style={{
                fontFamily: ff,
                fontSize: 14,
                color: "#666",
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              For any questions related to the StoryLine brand guidelines,
              please contact us.
              <br />
              If you are unsure about a brand application, reach out before
              using.
            </p>
            <a
              href="mailto:pr@playtag.ai"
              style={{
                display: "block",
                fontFamily: ffSuit,
                fontSize: 28,
                fontWeight: 900,
                color: "#1a1a1a",
                textDecoration: "none",
                marginBottom: 24,
              }}
            >
              pr@playtag.ai
            </a>
            <p
              style={{ fontFamily: ff, fontSize: 13, color: "#aaa", margin: 0 }}
            >
              StoryLine, empowered by Playtag.
            </p>
          </div>
        </div>
      );
    return null;
  };

  return (
    <section
      style={{
        padding: "32px clamp(20px,4vw,48px)",
        maxWidth: 1100,
        margin: "0 auto",
        minHeight: "70vh",
      }}
    >
      {modalDoc && (
        <DownloadModal
          onConfirm={handleModalConfirm}
          onClose={() => setModalDoc(null)}
        />
      )}
      <AnimatedSection>
        <button
          onClick={() => setSelectedKit(null)}
          style={{
            background: "#f5f5f3",
            border: "1.5px solid #e0e0da",
            borderRadius: 8,
            fontFamily: ff,
            fontSize: 14,
            color: "#444",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 32,
            padding: "8px 16px",
            fontWeight: 500,
            transition: "background 0.15s, border-color 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#ebebе8";
            e.currentTarget.style.borderColor = "#bbb";
            e.currentTarget.style.color = "#111";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#f5f5f3";
            e.currentTarget.style.borderColor = "#e0e0da";
            e.currentTarget.style.color = "#444";
          }}
        >
          ← Back to Toolkit
        </button>
      </AnimatedSection>
      <AnimatedSection delay={100}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 36,
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: "#E8FDF6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                border: "1.5px solid #C8F5E8",
              }}
            >
              📡
            </div>
            <div>
              <h1
                style={{
                  fontFamily: ffSuit,
                  fontSize: 28,
                  fontWeight: 900,
                  color: "#1a1a1a",
                  marginBottom: 4,
                }}
              >
                Brand Kit
              </h1>
              <p style={{ fontFamily: ff, fontSize: 15, color: "#000" }}>
                Communication Materials for Social Media
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedKit(null);
              setPage("home");
              setTimeout(() => scrollToId("contact"), 100);
            }}
            style={{
              background: "#fff",
              border: "1.5px solid #ddd",
              borderRadius: 100,
              padding: "10px 24px",
              fontFamily: ff,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#555",
            }}
            onMouseEnter={(e) => (e.target.style.borderColor = "#1a1a1a")}
            onMouseLeave={(e) => (e.target.style.borderColor = "#ddd")}
          >
            ✉️ Contact Us
          </button>
        </div>
      </AnimatedSection>
      {kit.documents && kit.documents.length > 0 && (
        <AnimatedSection delay={150}>
          <div style={{ marginBottom: 40 }}>
            <h3
              style={{
                fontFamily: ff,
                fontSize: 15,
                fontWeight: 700,
                color: "#1a1a1a",
                marginBottom: 20,
              }}
            >
              Available Documents ({kit.documents.length})
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {kit.documents.map((doc, i) => {
                const hasFile = !!doc.file_url;
                return (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      borderRadius: 16,
                      border: "1.5px solid #e8e8e4",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: 160,
                        background: "#F4FBF7",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {doc.thumbnail_url ? (
                        <img
                          src={doc.thumbnail_url}
                          alt={doc.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            objectPosition: "top",
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 36,
                          }}
                        >
                          {doc.type === "Video"
                            ? "🎬"
                            : doc.type === "Logo" &&
                              doc.title.toLowerCase().includes("playtag")
                            ? "🅪"
                            : doc.type === "Logo"
                            ? "🏷️"
                            : doc.type === "Color"
                            ? "🎨"
                            : "📄"}
                        </div>
                      )}
                      <div
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 12,
                          background: "rgba(255,255,255,0.92)",
                          border: "1px solid #C8E6D8",
                          borderRadius: 6,
                          padding: "3px 10px",
                          fontFamily: ff,
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#0FB896",
                        }}
                      >
                        {doc.type}
                      </div>
                    </div>
                    <div style={{ padding: "18px 22px 22px" }}>
                      <h4
                        style={{
                          fontFamily: ff,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#1a1a1a",
                          marginBottom: 12,
                          lineHeight: 1.4,
                        }}
                      >
                        {doc.title}
                      </h4>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontFamily: ff,
                            fontSize: 11,
                            color: "#bbb",
                          }}
                        >
                          Updated {doc.date}
                        </span>
                        {hasFile ? (
                          <button
                            onClick={() =>
                              handleBrandDownload(doc.file_url, doc.title)
                            }
                            style={{
                              background: "#fff",
                              border: "1.5px solid #30E9BD",
                              borderRadius: 100,
                              padding: "6px 16px",
                              fontFamily: ff,
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#30E9BD",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#30E9BD";
                              e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#fff";
                              e.currentTarget.style.color = "#30E9BD";
                            }}
                          >
                            Download
                          </button>
                        ) : (
                          <span
                            style={{
                              fontFamily: ff,
                              fontSize: 12,
                              color: "#ccc",
                              padding: "6px 16px",
                              border: "1.5px solid #eee",
                              borderRadius: 100,
                            }}
                          >
                            Coming soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </AnimatedSection>
      )}
      <AnimatedSection delay={200}>
        <div
          style={{
            display: "flex",
            gap: 8,
            overflowX: "auto",
            paddingBottom: 4,
            marginBottom: 28,
            scrollbarWidth: "none",
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flexShrink: 0,
                background: activeTab === tab.id ? "#1a1a1a" : "#fff",
                border:
                  activeTab === tab.id
                    ? "1.5px solid #1a1a1a"
                    : "1.5px solid #e8e8e4",
                borderRadius: 100,
                padding: "8px 18px",
                fontFamily: ff,
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 400,
                color: activeTab === tab.id ? "#fff" : "#666",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = "#1a1a1a";
                  e.currentTarget.style.color = "#1a1a1a";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = "#e8e8e4";
                  e.currentTarget.style.color = "#666";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </AnimatedSection>
      <AnimatedSection delay={250}>{renderTab()}</AnimatedSection>
    </section>
  );
}

function SecurityCard({ feature }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#f7f7f5" : "#fff",
        borderRadius: 16,
        border: "1.5px solid #e8e8e4",
        padding: 28,
        transition: "all 0.3s",
        cursor: "default",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 16 }}>{feature.icon}</div>
      <h3
        style={{
          fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
          fontSize: 16,
          fontWeight: 700,
          color: "#1a1a1a",
          marginBottom: 10,
        }}
      >
        {feature.title}
      </h3>
      <p
        style={{
          fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
          fontSize: 14,
          color: "#888",
          lineHeight: 1.6,
        }}
      >
        {feature.desc}
      </p>
    </div>
  );
}

export default function StoryLineToolkit() {
  const [page, setPage] = useState("home");
  const [selectedKit, setSelectedKit] = useState(null);
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKits()
      .then((data) => {
        setKits(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedKit || page === "privacy")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page, selectedKit]);

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
          color: "#0FB896",
          fontSize: 15,
        }}
      >
        Loading toolkit…
      </div>
    );

  return (
    <div
      style={{
        fontFamily: "'Pretendard Variable','Pretendard',sans-serif",
        background: "#FCFCFA",
        minHeight: "100vh",
        color: "#1a1a1a",
      }}
    >
      <link
        href="https://cdn.jsdelivr.net/gh/sunn-us/SUIT/fonts/variable/woff2/SUIT-Variable.css"
        rel="stylesheet"
      />
      <link
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable.css"
        rel="stylesheet"
      />
      <Navbar
        setPage={setPage}
        setSelectedKit={setSelectedKit}
        kits={kits}
        page={page}
        selectedKit={selectedKit}
      />
      {page === "home" && !selectedKit && (
        <>
          <HeroSection setPage={setPage} setSelectedKit={setSelectedKit} />
          <ResourceKits setSelectedKit={setSelectedKit} kits={kits} />
          <WhySection />
          <ContactSection />
        </>
      )}
      {page === "home" && selectedKit && selectedKit.id !== "brand" && (
        <KitDetail
          kit={selectedKit}
          setSelectedKit={setSelectedKit}
          setPage={setPage}
        />
      )}
      {page === "home" && selectedKit && selectedKit.id === "brand" && (
        <BrandKitPage
          kit={selectedKit}
          setSelectedKit={setSelectedKit}
          setPage={setPage}
        />
      )}
      {page === "privacy" && <PrivacyPage />}
      <Footer setPage={setPage} setSelectedKit={setSelectedKit} kits={kits} />
    </div>
  );
}
