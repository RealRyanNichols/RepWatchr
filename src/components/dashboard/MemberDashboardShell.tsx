"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { track } from "@vercel/analytics";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  defaultDigestPreferences,
  type DashboardDigestPreferences,
  type DashboardRecentChange,
  type DashboardSubmission,
  type DashboardWatchItem,
  type DashboardWatchlist,
  type MemberDashboardSnapshot,
} from "@/lib/member-dashboard";
import { trackVisitorIntelligenceEvent } from "@/lib/visitor-intelligence-client";

const emptySnapshot: MemberDashboardSnapshot = {
  ok: true,
  missingTables: [],
  watchlists: [],
  watchedItems: [],
  recentChanges: [],
  submissions: [],
  sourcePackets: [],
  recordsRequests: [],
  correctionRequests: [],
  savedSearches: [],
  contributorProfile: null,
  digestPreferences: defaultDigestPreferences,
};

const moduleNav = [
  ["summary", "Summary"],
  ["watchlists", "Watchlists"],
  ["changes", "Changes"],
  ["submissions", "Submissions"],
  ["packets", "Packets"],
  ["records", "Records"],
  ["reputation", "Reputation"],
  ["interests", "Interests"],
  ["digests", "Digests"],
  ["upgrades", "Packages"],
] as const;

const packages = [
  {
    name: "Quick Record Check",
    slug: "quick-record-check",
    detail: "Fast public-record scan around one official, agency, vote, claim, or source link.",
  },
  {
    name: "Official Record Brief",
    slug: "official-record-brief",
    detail: "Source trail, public questions, missing records, and a share-ready brief.",
  },
  {
    name: "Local Race Source Pack",
    slug: "local-race-source-pack",
    detail: "Candidate links, filing records, finance links, source gaps, and comparison notes.",
  },
  {
    name: "Election Watch Desk",
    slug: "election-watch-desk",
    detail: "Ongoing monitoring for races, filings, sources, stories, and changes.",
  },
  {
    name: "School Board Monitor",
    slug: "school-board-monitor",
    detail: "Future package interest for board agendas, minutes, votes, and source gaps.",
  },
  {
    name: "County Monitor",
    slug: "county-monitor",
    detail: "Future package interest for county officials, meetings, filings, and source trails.",
  },
  {
    name: "Journalist Desk",
    slug: "journalist-desk",
    detail: "Future workspace for public-record packets, safe summaries, and source review.",
  },
  {
    name: "Organization Dashboard",
    slug: "organization-dashboard",
    detail: "Future team dashboard for monitored officials, races, jurisdictions, and exports.",
  },
];

function event(eventType: Parameters<typeof trackVisitorIntelligenceEvent>[0]["eventType"], metadata?: Record<string, string | number | boolean | null>) {
  track(String(eventType), metadata ?? {});
  trackVisitorIntelligenceEvent({
    eventType,
    path: "/dashboard",
    metadata,
  });
}

function dateLabel(value: string | null) {
  if (!value) return "Not yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not yet";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(value: string) {
  return value.replace(/_/g, " ");
}

function scrollToModule(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function metricTone(index: number) {
  return [
    "from-blue-500/30 to-cyan-300/10 text-blue-100",
    "from-red-500/30 to-orange-300/10 text-red-100",
    "from-amber-400/30 to-yellow-200/10 text-amber-100",
    "from-emerald-400/30 to-teal-200/10 text-emerald-100",
  ][index % 4];
}

function Panel({
  id,
  eyebrow,
  title,
  children,
  action,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-28 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.065] shadow-[0_22px_80px_rgba(0,0,0,0.36)] backdrop-blur"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 bg-white/[0.035] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-200">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function EmptyState({
  title,
  body,
  href,
  label,
}: {
  title: string;
  body: string;
  href: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 bg-black/25 p-5">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{body}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-xl bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wide text-slate-950 transition hover:-translate-y-0.5 hover:bg-red-100"
        onClick={() => event("dashboard_next_action_clicked", { action: label })}
      >
        {label}
      </Link>
    </div>
  );
}

function DashboardMetricCard({ label, value, detail, index }: { label: string; value: string | number; detail: string; index: number }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${metricTone(index)} p-5`}>
      <div className="absolute right-3 top-3 h-16 w-16 rounded-full bg-white/10 blur-2xl" />
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-white/80">{label}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-200">{detail}</p>
    </div>
  );
}

function DashboardNextActionPanel({ hasWatchlists, hasSubmissions }: { hasWatchlists: boolean; hasSubmissions: boolean }) {
  const actions = [
    {
      label: hasWatchlists ? "Open a watched record" : "Watch your first record",
      href: hasWatchlists ? "#watchlists" : "/search",
      eventName: "watchlist_open" as const,
      detail: "Search, save, and return to the records that matter.",
    },
    {
      label: hasSubmissions ? "Check submission status" : "Submit one source",
      href: hasSubmissions ? "#submissions" : "/sources/submit",
      eventName: "dashboard_submission_opened" as const,
      detail: "A source queue is more valuable than loose screenshots.",
    },
    {
      label: "Build a packet",
      href: "/elections/texas/contribute",
      eventName: "dashboard_packet_started" as const,
      detail: "Turn one link and one question into copyable source context.",
    },
    {
      label: "Request a review",
      href: "/services/official-record-brief",
      eventName: "package_interest_clicked_from_dashboard" as const,
      detail: "Use this when the public record needs organized review.",
    },
  ];

  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          onClick={(click) => {
            if (action.href.startsWith("#")) {
              click.preventDefault();
              scrollToModule(action.href.slice(1));
            }
            event(action.eventName, { action: action.label });
            event("dashboard_next_action_clicked", { action: action.label });
          }}
          className="group rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:-translate-y-0.5 hover:border-red-300/60 hover:bg-white/10"
        >
          <span className="text-xs font-black uppercase tracking-[0.18em] text-red-200">Next move</span>
          <p className="mt-2 text-lg font-black leading-tight text-white">{action.label}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{action.detail}</p>
          <span className="mt-4 inline-flex text-xs font-black uppercase tracking-wide text-blue-200 group-hover:text-white">
            Open
          </span>
        </Link>
      ))}
    </div>
  );
}

function WatchlistPanel({ watchlists, watchedItems }: { watchlists: DashboardWatchlist[]; watchedItems: DashboardWatchItem[] }) {
  if (!watchlists.length) {
    return (
      <EmptyState
        title="No watchlists yet."
        body="Start by watching an official, agency, race, school board, issue, donor, PAC, court, or county record."
        href="/search"
        label="Search and watch"
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="grid gap-3">
        {watchlists.slice(0, 6).map((watchlist) => (
          <div key={watchlist.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-black text-white">{watchlist.name}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-300">
                  {watchlist.description || "Private member watchlist"}
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white">
                {watchlist.item_count}
              </span>
            </div>
            <p className="mt-3 text-[11px] font-black uppercase tracking-wide text-slate-400">
              Last alert: {dateLabel(watchlist.last_alert_at)} / digest: {dateLabel(watchlist.last_digest_at)}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">Watched records</p>
        <div className="mt-3 grid gap-3">
          {watchedItems.slice(0, 8).map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-white">{item.label}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                  {item.entity_type.replace(/_/g, " ")} {item.jurisdiction ? `/ ${item.jurisdiction}` : ""}
                </p>
              </div>
              {item.href ? (
                <Link
                  href={item.href}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-black text-slate-950 hover:bg-red-100"
                  onClick={() => event("watchlist_open", { item: item.label })}
                >
                  Open
                </Link>
              ) : null}
            </div>
          ))}
          {!watchedItems.length ? (
            <p className="rounded-xl border border-dashed border-white/20 bg-black/25 p-4 text-sm font-semibold text-slate-300">
              Your watchlists exist, but no watched records are attached yet.
            </p>
          ) : null}
        </div>
        <Link
          href="/dashboard/watchlists"
          className="mt-4 inline-flex rounded-xl border border-blue-300/50 bg-blue-500/15 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-blue-100 hover:bg-blue-500/25"
          onClick={() => event("watchlist_open", { action: "full_watch_office" })}
        >
          Manage watchlists
        </Link>
      </div>
    </div>
  );
}

function RecentChangesFeed({ changes }: { changes: DashboardRecentChange[] }) {
  if (!changes.length) {
    return (
      <EmptyState
        title="No watched changes yet."
        body="Your watchlist will show updates here once new public records are attached, corrected, reviewed, or promoted."
        href="/search"
        label="Find records to watch"
      />
    );
  }

  return (
    <div className="grid gap-3">
      {changes.slice(0, 8).map((change) => (
        <div key={change.id} className="rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-red-100">
                {change.label}
              </span>
              <p className="mt-3 text-base font-black text-white">{change.title}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">{change.summary}</p>
            </div>
            <span className="text-xs font-black uppercase tracking-wide text-slate-400">{dateLabel(change.created_at)}</span>
          </div>
          {change.href ? (
            <Link href={change.href} className="mt-3 inline-flex text-xs font-black uppercase tracking-wide text-blue-200 hover:text-white">
              Open related record
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function SubmissionList({ submissions, emptyCopy }: { submissions: DashboardSubmission[]; emptyCopy: string }) {
  if (!submissions.length) {
    return (
      <EmptyState
        title="Nothing here yet."
        body={emptyCopy}
        href="/sources/submit"
        label="Submit a source"
      />
    );
  }

  return (
    <div className="grid gap-3">
      {submissions.slice(0, 10).map((submission) => (
        <Link
          key={submission.id}
          href={`/intake/thank-you?submission=${encodeURIComponent(submission.id)}&form=${encodeURIComponent(submission.form_key)}`}
          onClick={() => event("dashboard_submission_opened", { form_key: submission.form_key, status: submission.status })}
          className="rounded-2xl border border-white/10 bg-black/25 p-4 transition hover:-translate-y-0.5 hover:border-blue-300/50 hover:bg-white/[0.08]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-base font-black text-white">{submission.title}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                {submission.form_key.replace(/_/g, " ")} {submission.jurisdiction ? `/ ${submission.jurisdiction}` : ""}
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
              {statusLabel(submission.status)}
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-400">Submitted {dateLabel(submission.created_at)}</p>
        </Link>
      ))}
    </div>
  );
}

function SourcePacketPanel({ packets }: { packets: DashboardSubmission[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <SubmissionList
        submissions={packets}
        emptyCopy="Build a packet from one public source URL, one claim or question, and the missing proof. Packet drafts can be copied and submitted for review."
      />
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm font-black text-white">Packet actions</p>
        <div className="mt-4 grid gap-3">
          <Link
            href="/elections/texas/contribute"
            onClick={() => event("dashboard_packet_started", { action: "texas_contribution_packet" })}
            className="rounded-xl bg-red-600 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-red-500"
          >
            Start packet
          </Link>
          <Link
            href="/sources/submit"
            onClick={() => event("source_submit_started", { source: "dashboard_packet_panel" })}
            className="rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm font-black uppercase tracking-wide text-white hover:bg-white/10"
          >
            Submit to review queue
          </Link>
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-black uppercase tracking-wide text-slate-400"
            disabled
          >
            Export drafts after packet storage is installed
          </button>
        </div>
      </div>
    </div>
  );
}

function RecordsRequestPanel({ requests }: { requests: DashboardSubmission[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <SubmissionList
        submissions={requests}
        emptyCopy="Public-record request drafts will appear here once saved through the intake workflow. Drafts stay private unless you submit them for RepWatchr review."
      />
      <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
        <p className="text-sm font-black text-white">Records draft statuses</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-black uppercase tracking-wide text-slate-300">
          {["draft", "sent", "response received", "partially fulfilled", "denied", "overdue", "closed"].map((status) => (
            <span key={status} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              {status}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-300">
          This is a public-records research tool, not legal advice. Uploaded responses should stay private until reviewed.
        </p>
      </div>
    </div>
  );
}

function ContributorPanel({ snapshot }: { snapshot: MemberDashboardSnapshot }) {
  const profile = snapshot.contributorProfile;
  if (!profile) {
    return (
      <EmptyState
        title="Contributor reputation is ready when you are."
        body="Create a contributor profile when you want reputation for useful source work. Public contributor pages are optional and never expose private email."
        href="/contributors"
        label="Open contributors"
      />
    );
  }

  const stats = [
    ["Score", profile.contribution_score],
    ["Accepted", profile.accepted_sources_count],
    ["Corrections", profile.correction_count],
    ["Packets", profile.packet_count],
    ["Watchlists", profile.watchlist_count],
    ["Rejected", profile.rejected_sources_count],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
        <p className="text-2xl font-black text-white">
          {profile.display_name || (profile.handle ? `@${profile.handle}` : "Private contributor")}
        </p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
          Public profile: {profile.public_profile_enabled ? "enabled" : "private"}. Reputation is based on useful source contribution and accuracy, not harassment.
        </p>
        {profile.handle ? (
          <Link href={`/contributors/${profile.handle}`} className="mt-4 inline-flex text-xs font-black uppercase tracking-wide text-blue-200 hover:text-white">
            Open public profile
          </Link>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-2xl font-black text-white">{Number(value).toLocaleString()}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterestProfileControls() {
  const [status, setStatus] = useState("");

  async function resetInterestProfile() {
    setStatus("Resetting interest profile");
    event("interest_profile_reset", { action: "reset_requested" });
    try {
      const response = await fetch("/api/member/interest-profile/reset", { method: "POST" });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      setStatus(response.ok && result?.ok ? "Interest profile reset" : result?.error ?? "Reset is not available yet");
    } catch {
      setStatus("Reset is not available yet");
    }
  }

  const interests = [
    "Texas",
    "School Boards",
    "Campaign Finance",
    "Transparency",
    "Open Records",
    "Courts",
    "Votes",
    "Public Questions",
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
      <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
        <p className="text-sm font-black text-white">Personalization boundary</p>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
          These interests help RepWatchr recommend public-record tools and profiles. RepWatchr does not sell personal political-interest profiles.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {interests.map((interest) => (
            <span key={interest} className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-200">
              {interest}
            </span>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
        <p className="text-sm font-black text-white">Controls</p>
        <button
          type="button"
          onClick={() => void resetInterestProfile()}
          className="mt-4 rounded-xl bg-white px-4 py-3 text-sm font-black uppercase tracking-wide text-slate-950 transition hover:bg-red-100"
        >
          Reset interest profile
        </button>
        <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">
          Hide-topic and manual-topic controls are planned after the interest graph has stable topic-level preferences.
        </p>
        {status ? <p className="mt-3 text-xs font-black uppercase tracking-wide text-blue-200">{status}</p> : null}
      </div>
    </div>
  );
}

function DigestSettingsPanel({
  initialPreferences,
}: {
  initialPreferences: DashboardDigestPreferences;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [status, setStatus] = useState("Preferences loaded");

  useEffect(() => {
    setPreferences(initialPreferences);
  }, [initialPreferences]);

  async function toggle(key: keyof DashboardDigestPreferences) {
    if (key === "email") return;
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setStatus("Saving preference");
    event("digest_settings_changed", { field: key, enabled: Boolean(next[key]) });

    try {
      const response = await fetch("/api/member/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; preferences?: DashboardDigestPreferences; error?: string } | null;
      if (response.ok && result?.ok && result.preferences) {
        setPreferences(result.preferences);
        setStatus("Preference saved");
      } else {
        setStatus(result?.error ?? "Preference saved locally until database is ready");
      }
    } catch {
      setStatus("Preference saved locally until API is reachable");
    }
  }

  const rows: Array<[keyof DashboardDigestPreferences, string]> = [
    ["weekly_digest", "Weekly digest"],
    ["daily_digest", "Daily digest"],
    ["breaking_alerts", "Breaking alerts"],
    ["watched_official_updates", "Watched official updates"],
    ["watched_race_updates", "Watched race updates"],
    ["source_review_updates", "Source review updates"],
    ["contribution_updates", "Contribution updates"],
    ["package_updates", "Package updates"],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {rows.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => void toggle(key)}
          className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${
            preferences[key]
              ? "border-blue-300/60 bg-blue-500/20 text-blue-50"
              : "border-white/10 bg-black/25 text-slate-300"
          }`}
        >
          <p className="text-sm font-black">{label}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide opacity-75">
            {preferences[key] ? "Enabled" : "Off"}
          </p>
        </button>
      ))}
      <p className="sm:col-span-2 lg:col-span-4 text-xs font-semibold leading-5 text-slate-400">
        {status}. No emails send unless email delivery is enabled, consent exists, and provider credentials are configured.
      </p>
    </div>
  );
}

function PackageInterestPanel({ userEmail }: { userEmail: string | undefined }) {
  const [status, setStatus] = useState("");

  async function requestPackage(packageName: string, serviceSlug: string) {
    event("package_interest_clicked_from_dashboard", { package: serviceSlug });
    if (!userEmail) {
      setStatus("Wait for your member email to load, then request beta access.");
      return;
    }
    setStatus(`Saving interest for ${packageName}`);
    try {
      const response = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formKey: "package_interest",
          payload: {
            name: "",
            email: userEmail,
            serviceSlug,
            serviceName: packageName,
            jurisdiction: "",
            target: "Member dashboard request",
            sourceUrl: "",
            deadline: "",
            summary: `Member dashboard package interest: ${packageName}`,
            consent: true,
          },
          context: { route: "/dashboard" },
        }),
      });
      const result = (await response.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      setStatus(response.ok && result?.ok ? "Package interest saved" : result?.message ?? "Package interest could not be saved yet");
    } catch {
      setStatus("Package interest could not be saved yet");
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {packages.map((item) => {
        const href = item.slug.includes("monitor") || item.slug.includes("journalist") || item.slug.includes("organization")
          ? "/services"
          : `/services/${item.slug}`;
        return (
          <div key={item.slug} className="rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-sm font-black text-white">{item.name}</p>
            <p className="mt-2 min-h-20 text-xs font-semibold leading-5 text-slate-300">{item.detail}</p>
            <div className="mt-4 grid gap-2">
              <Link
                href={href}
                className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-center text-xs font-black uppercase tracking-wide text-white hover:bg-white/10"
                onClick={() => event("package_interest_clicked_from_dashboard", { package: item.slug, action: "open_service" })}
              >
                Open
              </Link>
              <button
                type="button"
                onClick={() => void requestPackage(item.name, item.slug)}
                className="rounded-xl bg-red-600 px-3 py-2 text-xs font-black uppercase tracking-wide text-white hover:bg-red-500"
              >
                Request beta
              </button>
            </div>
          </div>
        );
      })}
      {status ? <p className="md:col-span-2 xl:col-span-4 text-xs font-black uppercase tracking-wide text-blue-200">{status}</p> : null}
    </div>
  );
}

export default function MemberDashboardShell() {
  const { user, profile } = useAuth();
  const [snapshot, setSnapshot] = useState<MemberDashboardSnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading member workspace");

  useEffect(() => {
    let mounted = true;
    event("dashboard_open", { surface: "member_dashboard" });

    async function loadDashboard() {
      try {
        const response = await fetch("/api/member/dashboard", { cache: "no-store" });
        const result = (await response.json()) as MemberDashboardSnapshot & { error?: string };
        if (!mounted) return;
        if (response.ok && result.ok) {
          setSnapshot(result);
          setStatus(result.missingTables.length ? "Some member tables are pending migration" : "Synced to RepWatchr member data");
        } else {
          setStatus(result.error ?? "Dashboard data is not available yet");
        }
      } catch {
        if (!mounted) return;
        setStatus("Dashboard API is not reachable yet");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(
    () => [
      {
        label: "Watched items",
        value: snapshot.watchedItems.length,
        detail: "Officials, races, boards, agencies, and records saved by this member.",
      },
      {
        label: "Submissions",
        value: snapshot.submissions.length,
        detail: "Source, correction, packet, package, and records-request intake rows.",
      },
      {
        label: "Accepted sources",
        value: snapshot.contributorProfile?.accepted_sources_count ?? 0,
        detail: "Accepted source contribution count from contributor reputation.",
      },
      {
        label: "Saved searches",
        value: snapshot.savedSearches.length,
        detail: "Searches saved for repeat monitoring and future alerts.",
      },
      {
        label: "Packets built",
        value: snapshot.sourcePackets.length + (snapshot.contributorProfile?.packet_count ?? 0),
        detail: "Packet rows and reputation packet count when available.",
      },
      {
        label: "Corrections",
        value: snapshot.correctionRequests.length + (snapshot.contributorProfile?.correction_count ?? 0),
        detail: "Correction requests and reputation correction count.",
      },
      {
        label: "Profile updates",
        value: snapshot.recentChanges.length,
        detail: "Recent watchlist alerts tied to watched records.",
      },
      {
        label: "Verification",
        value: profile?.verified ? "Verified" : "Pending",
        detail: "Verification controls whether civic scorecard votes can count.",
      },
    ],
    [profile?.verified, snapshot],
  );

  const sourceSubmissions = snapshot.submissions.filter((submission) =>
    ["submit_source", "source_submission", "data_source_suggestion", "missing_official", "missing_agency", "report_broken_link", "package_interest"].includes(submission.form_key),
  );

  return (
    <div className="min-h-screen bg-[#050817] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-80 w-80 rounded-full bg-blue-600/25 blur-3xl" />
        <div className="absolute right-[-8%] top-24 h-96 w-96 rounded-full bg-red-600/20 blur-3xl" />
        <div className="absolute bottom-[-16%] left-1/3 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.74)),radial-gradient(circle_at_top_right,rgba(59,130,246,0.38),transparent_32%)] shadow-[0_30px_110px_rgba(0,0,0,0.48)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.08fr_0.92fr] lg:p-8">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-red-200">
                Member command center
              </p>
              <h1 className="mt-4 text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
                Search. Watch. Source. Return.
              </h1>
              <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-slate-200 sm:text-base">
                This is the private RepWatchr workspace for watchlists, submissions, packets, records drafts, contributor reputation, digest controls, and package interest.
              </p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide">
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-white">{status}</span>
                <span className="rounded-full border border-blue-300/30 bg-blue-400/10 px-3 py-1.5 text-blue-100">
                  {user?.email ?? "Member session"}
                </span>
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">Suggested next action</p>
              <p className="mt-3 text-2xl font-black leading-tight text-white">
                {snapshot.watchedItems.length
                  ? "Open one watched record and check what changed."
                  : "Start by watching an official, submitting a source, or building a packet."}
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
                Every dashboard block should create another useful click. No dead ends, no fake urgency.
              </p>
            </div>
          </div>
        </section>

        <nav className="sticky top-3 z-20 mt-5 overflow-x-auto rounded-2xl border border-white/10 bg-[#070b1b]/90 p-2 shadow-2xl backdrop-blur">
          <div className="flex min-w-max gap-2">
            {moduleNav.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  scrollToModule(id);
                  event("dashboard_module_open", { module: id });
                }}
                className="rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-6 space-y-6">
          <Panel id="summary" eyebrow="Intelligence summary" title="Your civic operating screen">
            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {metrics.map((metric, index) => (
                    <DashboardMetricCard key={metric.label} {...metric} index={index} />
                  ))}
                </div>
                {snapshot.missingTables.length ? (
                  <p className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm font-semibold leading-6 text-amber-100">
                    Pending database install: {snapshot.missingTables.slice(0, 4).join("; ")}
                  </p>
                ) : null}
              </>
            )}
          </Panel>

          <DashboardNextActionPanel hasWatchlists={snapshot.watchedItems.length > 0} hasSubmissions={snapshot.submissions.length > 0} />

          <Panel id="watchlists" eyebrow="Watchlists" title="Private lists that create return reasons">
            <WatchlistPanel watchlists={snapshot.watchlists} watchedItems={snapshot.watchedItems} />
          </Panel>

          <Panel id="changes" eyebrow="Recent changes" title="What changed around watched records">
            <RecentChangesFeed changes={snapshot.recentChanges} />
          </Panel>

          <Panel id="submissions" eyebrow="My submissions" title="Source, correction, broken link, and package intake">
            <SubmissionList
              submissions={sourceSubmissions}
              emptyCopy="Your submitted sources, corrections, broken link reports, and package-interest forms will show here with review status."
            />
          </Panel>

          <Panel id="packets" eyebrow="Source packet builder" title="Build, copy, export, and submit source packets">
            <SourcePacketPanel packets={snapshot.sourcePackets} />
          </Panel>

          <Panel id="records" eyebrow="Public records drafts" title="Draft requests and track responses">
            <RecordsRequestPanel requests={snapshot.recordsRequests} />
          </Panel>

          <Panel id="reputation" eyebrow="Contributor reputation" title="Reputation for useful source work">
            <ContributorPanel snapshot={snapshot} />
          </Panel>

          <Panel id="interests" eyebrow="Interest profile controls" title="Personalization without selling political-interest profiles">
            <InterestProfileControls />
          </Panel>

          <Panel id="digests" eyebrow="Digest preferences" title="Return hooks with consent">
            <DigestSettingsPanel initialPreferences={snapshot.digestPreferences} />
          </Panel>

          <Panel id="upgrades" eyebrow="Future upgrades" title="Package interest without forcing checkout">
            <PackageInterestPanel userEmail={user?.email} />
          </Panel>
        </div>
      </div>
    </div>
  );
}
