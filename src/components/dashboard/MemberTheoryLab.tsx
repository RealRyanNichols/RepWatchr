"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

type TheoryStatus = "Needs source" | "Testing" | "Record-backed" | "Ready to share";
type TheoryConfidence = "Lead" | "Medium" | "Strong";

type MemberTheory = {
  id: string;
  title: string;
  target: string;
  summary: string;
  sourceLinks: string;
  nextCheck: string;
  status: TheoryStatus;
  confidence: TheoryConfidence;
  updatedAt: string;
};

type TheoryRow = {
  id: string;
  title: string;
  target: string;
  summary: string;
  source_links: string[] | null;
  next_check: string | null;
  status: TheoryStatus;
  confidence: TheoryConfidence;
  updated_at: string;
};

const STORAGE_KEY = "repwatchr.member.theoryLab.v1";

const defaultTheories: MemberTheory[] = [
  {
    id: "theory-school-board-finance",
    title: "Campaign money may explain the board vote split",
    target: "Longview ISD / school-board finance",
    summary:
      "Compare public campaign finance filings against agenda votes before treating the pattern as anything stronger than a lead.",
    sourceLinks: "/funding\n/school-boards",
    nextCheck: "Pull filing dates, donor names, agenda item, motion language, and meeting minutes from public sources.",
    status: "Testing",
    confidence: "Lead",
    updatedAt: "Seeded",
  },
  {
    id: "theory-roster-gap",
    title: "Roster gaps may hide outdated trustee information",
    target: "Harrison County school boards",
    summary:
      "Several district pages need term dates, seat labels, and official source URLs checked before profile completion claims are made.",
    sourceLinks: "/school-boards\n/buildout",
    nextCheck: "Cross-check district board pages, election packets, board minutes, and official photos.",
    status: "Needs source",
    confidence: "Medium",
    updatedAt: "Seeded",
  },
];

function readLocalTheories() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MemberTheory[]) : defaultTheories;
  } catch {
    return defaultTheories;
  }
}

function toSourceArray(sourceLinks: string) {
  return sourceLinks
    .split(/\n|,/)
    .map((link) => link.trim())
    .filter(Boolean);
}

function rowToTheory(row: TheoryRow): MemberTheory {
  return {
    id: row.id,
    title: row.title,
    target: row.target,
    summary: row.summary,
    sourceLinks: (row.source_links ?? []).join("\n"),
    nextCheck: row.next_check ?? "",
    status: row.status,
    confidence: row.confidence,
    updatedAt: new Date(row.updated_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  };
}

function statusClass(status: TheoryStatus) {
  if (status === "Ready to share") return "bg-emerald-100 text-emerald-800";
  if (status === "Record-backed") return "bg-blue-100 text-blue-800";
  if (status === "Testing") return "bg-amber-100 text-amber-900";
  return "bg-slate-100 text-slate-700";
}

function confidenceClass(confidence: TheoryConfidence) {
  if (confidence === "Strong") return "bg-red-100 text-red-800";
  if (confidence === "Medium") return "bg-blue-100 text-blue-800";
  return "bg-slate-100 text-slate-700";
}

function theoryBrief(theory: MemberTheory) {
  const links = toSourceArray(theory.sourceLinks);
  return [
    "RepWatchr research theory",
    `Target: ${theory.target}`,
    `Theory: ${theory.title}`,
    `Summary: ${theory.summary}`,
    `Status: ${theory.status}`,
    `Confidence: ${theory.confidence}`,
    `Source links: ${links.length ? links.join(", ") : "None attached yet"}`,
    `Next check: ${theory.nextCheck}`,
    "Label: theory, not a finding. Verify with public records before publishing.",
  ].join("\n");
}

export default function MemberTheoryLab() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [theories, setTheories] = useState<MemberTheory[]>(defaultTheories);
  const [backendStatus, setBackendStatus] = useState("Loading member backend");
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadTheories() {
      if (!user) {
        if (mounted) {
          setTheories(readLocalTheories());
          setBackendStatus("Local workspace until login");
        }
        return;
      }

      const { data, error } = await supabase
        .from("member_research_theories")
        .select("id, title, target, summary, source_links, next_check, status, confidence, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (!mounted) return;

      if (error) {
        setTheories(readLocalTheories());
        setBackendStatus("Local fallback until theory tables are installed");
        return;
      }

      const rows = (data ?? []) as TheoryRow[];
      setTheories(rows.length ? rows.map(rowToTheory) : defaultTheories);
      setBackendStatus("Synced to member_research_theories");
    }

    loadTheories();

    return () => {
      mounted = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (backendStatus.startsWith("Local")) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(theories));
    }
  }, [backendStatus, theories]);

  const metrics = useMemo(
    () => ({
      total: theories.length,
      shareReady: theories.filter((theory) => theory.status === "Ready to share").length,
      recordBacked: theories.filter((theory) => theory.status === "Record-backed").length,
      sourceLinks: theories.reduce((sum, theory) => sum + toSourceArray(theory.sourceLinks).length, 0),
    }),
    [theories]
  );

  async function addTheory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const target = String(formData.get("target") ?? "").trim();
    const summary = String(formData.get("summary") ?? "").trim();
    const sourceLinks = String(formData.get("sourceLinks") ?? "").trim();
    const nextCheck = String(formData.get("nextCheck") ?? "").trim();
    const confidence = String(formData.get("confidence") ?? "Lead") as TheoryConfidence;

    if (!title || !target || !summary || !nextCheck) return;

    const draft: MemberTheory = {
      id: `theory-${Date.now()}`,
      title,
      target,
      summary,
      sourceLinks,
      nextCheck,
      status: sourceLinks ? "Testing" : "Needs source",
      confidence,
      updatedAt: "Just now",
    };

    if (user) {
      const { data, error } = await supabase
        .from("member_research_theories")
        .insert({
          user_id: user.id,
          title,
          target,
          summary,
          source_links: toSourceArray(sourceLinks),
          next_check: nextCheck,
          status: draft.status,
          confidence,
        })
        .select("id, title, target, summary, source_links, next_check, status, confidence, updated_at")
        .single();

      if (!error && data) {
        setTheories((current) => [rowToTheory(data as TheoryRow), ...current]);
        setBackendStatus("Synced to member_research_theories");
        event.currentTarget.reset();
        return;
      }

      setBackendStatus("Local fallback until theory tables are installed");
    }

    setTheories((current) => [draft, ...current]);
    event.currentTarget.reset();
  }

  async function updateStatus(theory: MemberTheory, status: TheoryStatus) {
    setTheories((current) =>
      current.map((item) => (item.id === theory.id ? { ...item, status, updatedAt: "Just now" } : item))
    );

    if (user && !theory.id.startsWith("theory-") && !theory.id.startsWith("theory-school") && !theory.id.startsWith("theory-roster")) {
      await supabase
        .from("member_research_theories")
        .update({ status })
        .eq("id", theory.id)
        .eq("user_id", user.id);
    }
  }

  async function shareTheory(theory: MemberTheory) {
    const text = theoryBrief(theory);
    try {
      if (navigator.share) {
        await navigator.share({ title: theory.title, text });
        return;
      }
      await navigator.clipboard.writeText(text);
    } catch {
      await navigator.clipboard.writeText(text);
    }
    setCopiedId(theory.id);
    window.setTimeout(() => setCopiedId(""), 1800);
  }

  return (
    <section className="mt-8 overflow-hidden rounded-3xl border border-slate-300 bg-slate-950 text-white shadow-xl">
      <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_33%,#ffffff_33%,#ffffff_66%,#1d4ed8_66%,#1d4ed8_100%)]" />
      <div className="p-5 sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-300">Theory Lab</p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
              Cross-reference people, records, theories, and what still has to be proved.
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
              This is the member backend office for political accountability work: follow targets, attach public source links,
              test theories, and copy a share-safe brief that clearly labels what is proven and what still needs records.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
            <div className="flex items-center gap-2 text-sm font-black text-blue-100">
              <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] uppercase tracking-wide">DB</span>
              {backendStatus}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Metric label="Theories" value={metrics.total} />
              <Metric label="Sources" value={metrics.sourceLinks} />
              <Metric label="Record-backed" value={metrics.recordBacked} />
              <Metric label="Share-ready" value={metrics.shareReady} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={addTheory} className="rounded-2xl border border-white/10 bg-white p-5 text-slate-950 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-red-700">New cross-check</p>
                <h3 className="mt-1 text-2xl font-black">Build a theory file</h3>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-black text-blue-800">LINK</span>
            </div>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Theory
                <input name="title" required placeholder="What pattern are you testing?" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Target
                <input name="target" required placeholder="Official, school board, race, county, issue..." className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Public source links
                <textarea name="sourceLinks" rows={3} placeholder="One source URL or internal path per line" className="resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-700">
                What the theory says
                <textarea name="summary" rows={4} required placeholder="Keep it factual. Say what is known, what is alleged, and what is only a theory." className="resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Next record to check
                <textarea name="nextCheck" rows={3} required placeholder="The next public record, filing, vote, meeting, or source needed." className="resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold" />
              </label>
              <label className="grid gap-1 text-sm font-black text-slate-700">
                Confidence
                <select name="confidence" defaultValue="Lead" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-black">
                  <option>Lead</option>
                  <option>Medium</option>
                  <option>Strong</option>
                </select>
              </label>
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700">
                <span aria-hidden="true">+</span>
                Add theory
              </button>
            </div>
          </form>

          <div className="grid content-start gap-3">
            {theories.map((theory) => (
              <article key={theory.id} className="rounded-2xl border border-white/10 bg-white p-5 text-slate-950 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${statusClass(theory.status)}`}>
                        {theory.status}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${confidenceClass(theory.confidence)}`}>
                        {theory.confidence}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                        {theory.updatedAt}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-black text-slate-950">{theory.title}</h3>
                    <p className="mt-1 text-sm font-black text-blue-800">{theory.target}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => shareTheory(theory)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-blue-800 hover:bg-blue-100"
                  >
                    <span aria-hidden="true">SH</span>
                    {copiedId === theory.id ? "Copied" : "Share brief"}
                  </button>
                </div>
                <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{theory.summary}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-red-700">
                      <span aria-hidden="true">SRC</span>
                      Source links
                    </p>
                    <div className="mt-2 grid gap-1 text-xs font-bold text-slate-600">
                      {toSourceArray(theory.sourceLinks).length ? (
                        toSourceArray(theory.sourceLinks).map((link) => <span key={link}>{link}</span>)
                      ) : (
                        <span>No public source attached yet.</span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-red-700">
                      <span aria-hidden="true">NEXT</span>
                      Next check
                    </p>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-600">{theory.nextCheck}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["Needs source", "Testing", "Record-backed", "Ready to share"] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStatus(theory, status)}
                      className={`rounded-lg px-3 py-2 text-xs font-black ${
                        theory.status === status ? "bg-blue-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
      <p className="text-2xl font-black text-white">{value.toLocaleString()}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-slate-300">{label}</p>
    </div>
  );
}
