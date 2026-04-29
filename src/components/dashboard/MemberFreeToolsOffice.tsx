"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/lib/supabase";

type PacketRow = {
  id: string;
  target: string;
  jurisdiction: string | null;
  issue: string;
  evidence_links: string[] | null;
  next_moves: string[] | null;
  records_request: string | null;
  timeline_starter: string | null;
  share_brief: string | null;
  created_at: string;
};

type MemberPacket = {
  id: string;
  target: string;
  jurisdiction: string;
  issue: string;
  evidenceLinks: string[];
  nextMoves: string[];
  recordsRequest: string;
  timelineStarter: string;
  shareBrief: string;
  createdAt: string;
};

type PacketDraft = Omit<MemberPacket, "id" | "createdAt">;

const STORAGE_KEY = "repwatchr.member.freeToolsOffice.v1";

const officeTools = [
  {
    label: "Follow anyone",
    detail: "Save officials, boards, counties, races, attorneys, media, and research targets.",
    href: "/dashboard",
  },
  {
    label: "Build a record packet",
    detail: "Turn a concern into source links, missing records, and a public-records request.",
    href: "/dashboard",
  },
  {
    label: "Share safely",
    detail: "Copy language that says what is known, what is alleged, and what still needs proof.",
    href: "/dashboard",
  },
  {
    label: "Cross-reference",
    detail: "Use votes, grades, funding, school boards, source gaps, comments, and theories together.",
    href: "/dashboard",
  },
];

const seedPackets: MemberPacket[] = [
  buildPacket({
    target: "Local school board vote",
    jurisdiction: "East Texas",
    issue: "Compare agenda language, meeting minutes, campaign finance, and public comments before posting a conclusion.",
    evidenceLinks: ["/school-boards", "/buildout", "/funding"],
  }, "seed-school-board", "Seeded"),
];

function splitLinks(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function dateLabel(value: string) {
  if (value === "Seeded" || value === "Just now") return value;
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildPacket(
  input: {
    target: string;
    jurisdiction: string;
    issue: string;
    evidenceLinks: string[];
  },
  id = `packet-${Date.now()}`,
  createdAt = "Just now",
): MemberPacket {
  const target = input.target.trim();
  const jurisdiction = input.jurisdiction.trim() || "Not set";
  const issue = input.issue.trim();
  const evidenceLinks = input.evidenceLinks;
  const sourceLine = evidenceLinks.length ? evidenceLinks.join(", ") : "No source links attached yet";
  const nextMoves = [
    "Find the official source page, agenda, minutes, video, filing, or vote record.",
    "Separate confirmed facts from claims, opinions, and missing records.",
    "Ask the target a direct written question before treating the issue as public-ready.",
  ];

  return {
    id,
    target,
    jurisdiction,
    issue,
    evidenceLinks,
    nextMoves,
    recordsRequest: [
      `Records request target: ${target}`,
      `Jurisdiction: ${jurisdiction}`,
      "",
      "Please provide public records sufficient to show:",
      "1. The agenda item, vote, policy, contract, filing, or decision connected to this issue.",
      "2. The date the matter was first noticed, discussed, voted on, approved, denied, or tabled.",
      "3. Any public attachments, exhibits, presentations, minutes, video links, correspondence, or responsive documents.",
      "",
      `Issue summary: ${issue}`,
      `Known source links: ${sourceLine}`,
      "",
      "If any portion is withheld, please cite the specific legal basis and release all non-exempt portions.",
    ].join("\n"),
    timelineStarter: [
      `Target: ${target}`,
      `Jurisdiction: ${jurisdiction}`,
      "",
      "Timeline starter:",
      "- Date unknown: Identify first public source, agenda, filing, or statement.",
      "- Date unknown: Identify vote, decision, contract, policy, or public meeting item.",
      "- Date unknown: Identify who was notified, who responded, and what record is still missing.",
      "",
      `Issue to test: ${issue}`,
      `Source links: ${sourceLine}`,
    ].join("\n"),
    shareBrief: [
      "RepWatchr accountability note",
      `Target: ${target}`,
      `Jurisdiction: ${jurisdiction}`,
      `Issue: ${issue}`,
      `Sources attached: ${sourceLine}`,
      "Status: This is a research packet, not a final finding. The next step is to verify the public records and ask a direct question before publishing a stronger claim.",
    ].join("\n"),
    createdAt,
  };
}

function rowToPacket(row: PacketRow): MemberPacket {
  return {
    id: row.id,
    target: row.target,
    jurisdiction: row.jurisdiction ?? "Not set",
    issue: row.issue,
    evidenceLinks: row.evidence_links ?? [],
    nextMoves: row.next_moves ?? [],
    recordsRequest: row.records_request ?? "",
    timelineStarter: row.timeline_starter ?? "",
    shareBrief: row.share_brief ?? "",
    createdAt: dateLabel(row.created_at),
  };
}

function readLocalPackets() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MemberPacket[]) : seedPackets;
  } catch {
    return seedPackets;
  }
}

async function copyText(text: string, label: string, setCopied: (value: string) => void) {
  await navigator.clipboard.writeText(text);
  setCopied(label);
  window.setTimeout(() => setCopied(""), 1600);
}

export default function MemberFreeToolsOffice() {
  const { user, roles } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [packets, setPackets] = useState<MemberPacket[]>(seedPackets);
  const [backendStatus, setBackendStatus] = useState("Loading member tools");
  const [copied, setCopied] = useState("");
  const isOperator = roles.some((role) => ["admin", "reviewer", "researcher"].includes(role));

  useEffect(() => {
    let mounted = true;

    async function loadPackets() {
      if (!user) {
        if (mounted) {
          setPackets(readLocalPackets());
          setBackendStatus("Local until login");
        }
        return;
      }

      const { data, error } = await supabase
        .from("member_action_packets")
        .select("id, target, jurisdiction, issue, evidence_links, next_moves, records_request, timeline_starter, share_brief, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12);

      if (!mounted) return;

      if (error) {
        setPackets(readLocalPackets());
        setBackendStatus("Local fallback until member_action_packets is installed");
        return;
      }

      const rows = (data ?? []) as PacketRow[];
      setPackets(rows.length ? rows.map(rowToPacket) : seedPackets);
      setBackendStatus("Synced to member_action_packets");
    }

    loadPackets();

    return () => {
      mounted = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (backendStatus.startsWith("Local")) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(packets));
    }
  }, [backendStatus, packets]);

  const metrics = useMemo(
    () => [
      { label: "Free tools", value: officeTools.length },
      { label: "Packets", value: packets.length },
      { label: "Sources", value: packets.reduce((sum, packet) => sum + packet.evidenceLinks.length, 0) },
      { label: "Next moves", value: packets.reduce((sum, packet) => sum + packet.nextMoves.length, 0) },
    ],
    [packets],
  );

  async function createPacket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const draft: PacketDraft = buildPacket({
      target: String(formData.get("target") ?? ""),
      jurisdiction: String(formData.get("jurisdiction") ?? ""),
      issue: String(formData.get("issue") ?? ""),
      evidenceLinks: splitLinks(String(formData.get("evidenceLinks") ?? "")),
    });

    if (!draft.target || !draft.issue) return;

    if (user) {
      const { data, error } = await supabase
        .from("member_action_packets")
        .insert({
          user_id: user.id,
          target: draft.target,
          jurisdiction: draft.jurisdiction,
          issue: draft.issue,
          evidence_links: draft.evidenceLinks,
          next_moves: draft.nextMoves,
          records_request: draft.recordsRequest,
          timeline_starter: draft.timelineStarter,
          share_brief: draft.shareBrief,
        })
        .select("id, target, jurisdiction, issue, evidence_links, next_moves, records_request, timeline_starter, share_brief, created_at")
        .single();

      if (!error && data) {
        setPackets((current) => [rowToPacket(data as PacketRow), ...current]);
        setBackendStatus("Synced to member_action_packets");
        form.reset();
        return;
      }

      setBackendStatus("Local fallback until member_action_packets is installed");
    }

    setPackets((current) => [buildPacket(draft), ...current]);
    form.reset();
  }

  const latest = packets[0];

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-slate-950 p-5 text-white sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-red-300">Free member backend</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">
                A political accountability office without charging people to start.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                Members can follow targets, build public-records requests, create timeline starters,
                prepare share-safe summaries, and keep their work organized before they ever pay for anything.
              </p>
            </div>
            {isOperator ? (
              <Link
                href="/admin/superadmin"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-black text-blue-950 hover:bg-blue-50"
              >
                SuperAdmin
              </Link>
            ) : null}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <div key={metric.label} className="rounded-xl border border-white/10 bg-white/10 p-4">
                <p className="text-3xl font-black">{metric.value.toLocaleString()}</p>
                <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-blue-100">{metric.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-white/10 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-blue-100">Backend status</p>
            <p className="mt-1 text-sm font-bold text-white">{backendStatus}</p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-xs font-black uppercase tracking-wide text-red-700">Tool suite</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {officeTools.map((tool) => (
              <Link key={tool.label} href={tool.href} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-300">
                <p className="text-sm font-black text-slate-950">{tool.label}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">{tool.detail}</p>
              </Link>
            ))}
          </div>

          <form onSubmit={createPacket} className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-sm font-black text-blue-950">Build a free accountability packet</p>
            <div className="mt-3 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="target" required placeholder="Target, official, board, race, agency" className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500" />
                <input name="jurisdiction" placeholder="County, state, district, city" className="rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500" />
              </div>
              <textarea name="issue" required rows={3} placeholder="What needs to be checked? Keep it factual." className="resize-none rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500" />
              <textarea name="evidenceLinks" rows={3} placeholder="Public source links or RepWatchr paths, one per line" className="resize-none rounded-xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500" />
              <button className="w-fit rounded-xl bg-blue-900 px-5 py-3 text-sm font-black text-white hover:bg-red-700">
                Build packet
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-red-700">Latest packet</p>
            <h3 className="mt-1 text-2xl font-black text-slate-950">{latest.target}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">{latest.jurisdiction} · {latest.createdAt}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copyText(latest.recordsRequest, "request", setCopied)} className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-900 hover:border-blue-500">
              {copied === "request" ? "Copied" : "Copy request"}
            </button>
            <button type="button" onClick={() => copyText(latest.timelineStarter, "timeline", setCopied)} className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-900 hover:border-blue-500">
              {copied === "timeline" ? "Copied" : "Copy timeline"}
            </button>
            <button type="button" onClick={() => copyText(latest.shareBrief, "share", setCopied)} className="rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-blue-900 hover:border-blue-500">
              {copied === "share" ? "Copied" : "Copy share brief"}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <PacketPanel title="Next 3 Moves" lines={latest.nextMoves} />
          <PacketPanel title="Records Request" text={latest.recordsRequest} />
          <PacketPanel title="Share-Safe Brief" text={latest.shareBrief} />
        </div>
      </div>
    </section>
  );
}

function PacketPanel({ title, lines, text }: { title: string; lines?: string[]; text?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-black text-slate-950">{title}</p>
      {lines ? (
        <ol className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700">
          {lines.map((line, index) => (
            <li key={line}>
              <span className="mr-2 font-black text-red-700">{index + 1}.</span>
              {line}
            </li>
          ))}
        </ol>
      ) : (
        <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap text-xs font-semibold leading-5 text-slate-700">{text}</pre>
      )}
    </div>
  );
}
