"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AdminAuditRow } from "@/lib/admin-dashboard";
import type { AdminRaceDeskData, AdminRacePageRow } from "@/lib/race-hub-admin";

type RaceDeskPayload = {
  action: "race_edit";
  raceId: string;
  slug: string;
  title: string;
  office: string;
  jurisdiction: string;
  electionDate: string;
  summary: string;
  publicStatus: string;
  candidatesText: string;
  sourceLinksText: string;
  storyLinksText: string;
  fundingLinksText: string;
  redFlagsText: string;
  missingRecordsText: string;
  note: string;
};

const publicStatuses = ["staged", "needs_review", "published", "archived"];

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

async function postRaceAction(payload: RaceDeskPayload) {
  const response = await fetch("/api/admin/actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; audit?: AdminAuditRow } | null;
  if (!response.ok || !body?.ok) throw new Error(body?.error || "Race admin save failed.");
  return body;
}

function RaceRow({ row, onPick }: { row: AdminRacePageRow; onPick: (row: AdminRacePageRow) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(row)}
      className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md"
    >
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-900">
          {statusLabel(row.publicStatus)}
        </span>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-red-700">
          {row.missingCount} gaps
        </span>
      </div>
      <p className="mt-3 text-base font-black leading-tight text-blue-950">{row.title}</p>
      <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{row.office}</p>
      <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-500">
        {row.slug} / {row.candidateCount} candidates / {row.sourceCount} sources
      </p>
    </button>
  );
}

export default function AdminRaceDeskClient({
  adminEmail,
  initialData,
}: {
  adminEmail: string;
  initialData: AdminRaceDeskData;
}) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<RaceDeskPayload>({
    action: "race_edit",
    raceId: "",
    slug: "",
    title: "",
    office: "",
    jurisdiction: "",
    electionDate: "",
    summary: "",
    publicStatus: "staged",
    candidatesText: "",
    sourceLinksText: "",
    storyLinksText: "",
    fundingLinksText: "",
    redFlagsText: "",
    missingRecordsText: "",
    note: "",
  });

  const visibleRows = useMemo(() => {
    const haystack = query.trim().toLowerCase();
    const rows = [...data.stagedRows, ...data.staticRaces];
    if (!haystack) return rows.slice(0, 30);
    return rows
      .filter((row) => [row.title, row.slug, row.office, row.jurisdiction].join(" ").toLowerCase().includes(haystack))
      .slice(0, 30);
  }, [data.stagedRows, data.staticRaces, query]);

  function pickRace(row: AdminRacePageRow) {
    setForm((current) => ({
      ...current,
      raceId: row.id === row.slug ? "" : row.id,
      slug: row.slug,
      title: row.title,
      office: row.office,
      jurisdiction: row.jurisdiction,
      electionDate: row.electionDate === "Pending" ? "" : row.electionDate,
      publicStatus: row.publicStatus === "static" ? "staged" : row.publicStatus,
      summary: current.summary,
      note: `Staging update from ${row.publicStatus} race row.`,
    }));
  }

  function setField<K extends keyof RaceDeskPayload>(key: K, value: RaceDeskPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function saveRace() {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await postRaceAction(form);
      setNotice("Race page update saved and audit logged.");
      if (result.audit) {
        const nextRow: AdminRacePageRow = {
          id: result.audit.targetId,
          slug: form.slug,
          title: form.title,
          office: form.office,
          jurisdiction: form.jurisdiction,
          electionDate: form.electionDate || "Pending",
          publicStatus: form.publicStatus,
          candidateCount: form.candidatesText.split("\n").filter(Boolean).length,
          sourceCount: form.sourceLinksText.split("\n").filter(Boolean).length,
          missingCount: form.missingRecordsText.split("\n").filter(Boolean).length,
          updatedAt: "Just now",
        };
        setData((current) => ({
          ...current,
          stagedRows: [nextRow, ...current.stagedRows.filter((row) => row.slug !== form.slug)].slice(0, 40),
        }));
      }
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Race admin save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f9fc]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_34%,#d6b35a_34%,#d6b35a_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Secure admin</p>
            <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-black leading-tight sm:text-5xl">Race Desk</h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
                  {adminEmail} / race page edits are staged, source-backed, and audit logged.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin" className="secondary-button">Admin Home</Link>
                <Link href="/elections/texas" className="secondary-button">Public Texas Hub</Link>
              </div>
            </div>
          </div>
        </section>

        {notice ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-950">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-950">
            {error}
          </div>
        ) : null}
        {data.errors.length ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
            Missing race desk data: {data.errors.slice(0, 4).join(" / ")}
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Race inventory</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
              Pick a race to stage an edit.
            </h2>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search race, slug, office, jurisdiction"
              className="field mt-4"
            />
            <div className="mt-4 grid gap-3">
              {visibleRows.map((row) => (
                <RaceRow key={`${row.publicStatus}-${row.slug}-${row.id}`} row={row} onPick={pickRace} />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">Create / edit race page</p>
            <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">
              Attach candidates, sources, stories, funding, and red flags.
            </h2>
            <div className="mt-4 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={form.slug} onChange={(event) => setField("slug", event.target.value)} placeholder="race-page-slug" className="field" />
                <select value={form.publicStatus} onChange={(event) => setField("publicStatus", event.target.value)} className="field font-black">
                  {publicStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </div>
              <input value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="Race page title" className="field" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={form.office} onChange={(event) => setField("office", event.target.value)} placeholder="Office" className="field" />
                <input value={form.electionDate} onChange={(event) => setField("electionDate", event.target.value)} placeholder="Election date" className="field" />
              </div>
              <input value={form.jurisdiction} onChange={(event) => setField("jurisdiction", event.target.value)} placeholder="Jurisdiction" className="field" />
              <textarea value={form.summary} onChange={(event) => setField("summary", event.target.value)} rows={3} placeholder="Plain-English race summary. No unsupported claims." className="field resize-none" />
              <textarea value={form.candidatesText} onChange={(event) => setField("candidatesText", event.target.value)} rows={4} placeholder="Candidates, one per line: Name | party | incumbent? | campaign URL | filing/source URL" className="field resize-none" />
              <textarea value={form.sourceLinksText} onChange={(event) => setField("sourceLinksText", event.target.value)} rows={4} placeholder="Source links, one per line: Label | URL | source type" className="field resize-none" />
              <textarea value={form.storyLinksText} onChange={(event) => setField("storyLinksText", event.target.value)} rows={2} placeholder="Story/article IDs or URLs, one per line" className="field resize-none" />
              <textarea value={form.fundingLinksText} onChange={(event) => setField("fundingLinksText", event.target.value)} rows={2} placeholder="Funding links, one per line: Label | URL" className="field resize-none" />
              <textarea value={form.redFlagsText} onChange={(event) => setField("redFlagsText", event.target.value)} rows={3} placeholder="Red flags, one per line. Must include source URL or say needs review." className="field resize-none" />
              <textarea value={form.missingRecordsText} onChange={(event) => setField("missingRecordsText", event.target.value)} rows={3} placeholder="Missing records, one per line: label | priority | why" className="field resize-none" />
              <textarea value={form.note} onChange={(event) => setField("note", event.target.value)} rows={2} placeholder="Internal admin note" className="field resize-none" />
              <button
                type="button"
                disabled={busy || !form.slug.trim() || !form.title.trim()}
                onClick={saveRace}
                className="primary-button"
              >
                {busy ? "Saving..." : "Save Race Page Update"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
