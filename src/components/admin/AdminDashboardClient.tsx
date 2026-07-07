"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type {
  AdminAuditRow,
  AdminBrokenLinkRow,
  AdminContentRow,
  AdminDailyWireRow,
  AdminDashboardData,
  AdminDataQualityIssueRow,
  AdminDuplicateCandidateRow,
  AdminImportErrorRow,
  AdminMetric,
  AdminPublicRecordRequestRow,
  AdminRevenueRow,
  AdminSourceSubmissionRow,
} from "@/lib/admin-dashboard";
import { trackRepWatchrEvent } from "@/lib/client-analytics";
import { PUBLIC_ROLE_REVIEW_LABELS } from "@/lib/public-role-safety";
import AdminRiskWarnings from "@/components/shared/AdminRiskWarnings";
import { scanPublicContentForWarnings } from "@/lib/trust-safety";

type AdminActionPayload =
  | {
      action: "source_review";
      submissionId: string;
      status: string;
      note: string;
      attachTargetType: string;
      attachTargetId: string;
      attachTargetUrl: string;
      publicFlag: boolean;
    }
  | {
      action: "profile_edit";
      profileType: string;
      profileId: string;
      profileName: string;
      publicFieldsText: string;
      sourceUrl: string;
      missingDataText: string;
      redFlagText: string;
      scoreStatus: string;
      publicRoleLabel: string;
    }
  | {
      action: "revenue_update";
      targetTable: AdminRevenueRow["type"];
      targetId: string;
      status: string;
      note: string;
    }
  | {
      action: "content_upsert";
      contentId?: string;
      contentType: "story_draft" | "daily_watch";
      title: string;
      summary: string;
      body: string;
      sourceUrl: string;
      officialIdsText: string;
      status: string;
      shareSnippet: string;
    }
  | {
      action: "broken_link_update";
      linkId: string;
      status: string;
      note: string;
    }
  | {
      action: "wire_moderation";
      wireId: string;
      status: string;
      note: string;
      attachTargetType: string;
      attachTargetId: string;
      promotedStoryId: string;
    }
  | {
      action: "data_health";
      healthAction: "rerun_import";
      importType: string;
      provider: string;
      note: string;
    }
  | {
      action: "data_health";
      healthAction: "update_status";
      targetTable: "data_quality_issue" | "duplicate_candidate" | "import_error" | "broken_link" | "import_run";
      targetId: string;
      status: string;
      note: string;
    }
  | {
      action: "data_health";
      healthAction: "quarantine_bad_item";
      entityType: string;
      entityId: string;
      title: string;
      sourceUrl: string;
      note: string;
    };
type SourceFormState = {
  status: string;
  note: string;
  attachTargetType: string;
  attachTargetId: string;
  attachTargetUrl: string;
  publicFlag: boolean;
};

const sourceStatuses = ["needs_review", "verified", "attached_to_profile", "needs_more_info", "rejected"];
const sourceTargetTypes = ["official", "school_board", "race", "article", "public_record"];
const revenueStatuses = ["requested", "in_review", "in_progress", "fulfilled", "canceled", "refunded", "active", "past_due"];
const contentStatuses = ["draft", "published", "unpublished", "archived"];
const brokenLinkStatuses = ["new", "confirmed", "fixed", "ignored"];
const importRunOptions = [
  { provider: "Federal Election Commission", importType: "fec_imports" },
  { provider: "Texas Ethics Commission", importType: "texas_ethics_imports" },
  { provider: "Open States", importType: "open_states_imports" },
  { provider: "House/Senate roll calls", importType: "house_senate_roll_calls" },
  { provider: "Daily Watch Wire", importType: "rss_news_wire" },
  { provider: "School board sources", importType: "school_board_imports" },
];

function statusLabel(value: string) {
  return value.replaceAll("_", " ");
}

function metricTone(status?: AdminMetric["status"]) {
  if (status === "good") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (status === "bad") return "border-red-200 bg-red-50 text-red-950";
  return "border-amber-200 bg-amber-50 text-amber-950";
}

async function postAdminAction(payload: AdminActionPayload) {
  const response = await fetch("/api/admin/actions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; audit?: AdminAuditRow } | null;
  if (!response.ok || !body?.ok) {
    throw new Error(body?.error || "Admin action failed.");
  }
  return body;
}

export default function AdminDashboardClient({
  adminEmail,
  initialData,
}: {
  adminEmail: string;
  initialData: AdminDashboardData;
}) {
  const [data, setData] = useState(initialData);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [sourceForms, setSourceForms] = useState<Record<string, SourceFormState>>({});
  const [profileSearch, setProfileSearch] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState(data.profileRows[0]?.id ?? "");
  const [profileForm, setProfileForm] = useState({
    publicFieldsText: "",
    sourceUrl: "",
    missingDataText: "",
    redFlagText: "",
    scoreStatus: "",
    publicRoleLabel: "under_review",
  });
  const [revenueForms, setRevenueForms] = useState<Record<string, { status: string; note: string }>>({});
  const [contentForm, setContentForm] = useState({
    contentType: "story_draft" as "story_draft" | "daily_watch",
    title: "",
    summary: "",
    body: "",
    sourceUrl: "",
    officialIdsText: "",
    status: "draft",
    shareSnippet: "",
  });
  const [wireForms, setWireForms] = useState<Record<string, { note: string; attachTargetType: string; attachTargetId: string; promotedStoryId: string }>>({});
  const [brokenLinkForms, setBrokenLinkForms] = useState<Record<string, { status: string; note: string }>>({});
  const [importQueueForm, setImportQueueForm] = useState({
    provider: importRunOptions[0].provider,
    importType: importRunOptions[0].importType,
    note: "",
  });
  const [quarantineForm, setQuarantineForm] = useState({
    entityType: "wire_item",
    entityId: "",
    title: "",
    sourceUrl: "",
    note: "",
  });
  const profileRiskWarnings = useMemo(
    () => scanPublicContentForWarnings(`${profileForm.publicFieldsText}\n${profileForm.redFlagText}\n${profileForm.missingDataText}`),
    [profileForm.missingDataText, profileForm.publicFieldsText, profileForm.redFlagText],
  );
  const contentRiskWarnings = useMemo(
    () => scanPublicContentForWarnings(`${contentForm.title}\n${contentForm.summary}\n${contentForm.body}\n${contentForm.shareSnippet}`),
    [contentForm.body, contentForm.shareSnippet, contentForm.summary, contentForm.title],
  );

  const selectedProfile = data.profileRows.find((profile) => profile.id === selectedProfileId) ?? data.profileRows[0];
  const filteredProfiles = useMemo(() => {
    const query = profileSearch.trim().toLowerCase();
    if (!query) return data.profileRows.slice(0, 18);
    return data.profileRows
      .filter((profile) =>
        [profile.name, profile.id, profile.position, profile.jurisdiction, profile.state]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 18);
  }, [data.profileRows, profileSearch]);

  async function runAction(key: string, payload: AdminActionPayload, onSuccess?: (audit?: AdminAuditRow) => void) {
    setBusyKey(key);
    setNotice("");
    setError("");
    try {
      const result = await postAdminAction(payload);
      if (result.audit) {
        setData((current) => ({
          ...current,
          auditLog: [result.audit!, ...current.auditLog].slice(0, 25),
        }));
      }
      onSuccess?.(result.audit);
      trackRepWatchrEvent("admin_review_completed", {
        action: payload.action,
      });
      setNotice("Admin action saved and audit logged.");
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Admin action failed.");
    } finally {
      setBusyKey("");
    }
  }

  function sourceFormFor(row: AdminSourceSubmissionRow) {
    return (
      sourceForms[row.id] ?? {
        status: row.status === "new" ? "needs_review" : row.status,
        note: "",
        attachTargetType: row.targetType || "official",
        attachTargetId: row.targetProfileId || "",
        attachTargetUrl: row.targetPageUrl || "",
        publicFlag: row.publicFlag,
      }
    );
  }

  function setSourceForm(id: string, patch: Partial<SourceFormState>) {
    const row = data.sourceQueue.find((item) => item.id === id);
    if (!row) return;
    setSourceForms((current) => ({ ...current, [id]: { ...sourceFormFor(row), ...current[id], ...patch } }));
  }

  function revenueFormFor(row: AdminRevenueRow) {
    return revenueForms[row.id] ?? { status: row.status, note: "" };
  }

  function brokenLinkFormFor(row: AdminBrokenLinkRow) {
    return brokenLinkForms[row.id] ?? { status: row.status, note: "" };
  }

  function wireFormFor(row: AdminDailyWireRow) {
    return wireForms[row.id] ?? { note: "", attachTargetType: "official", attachTargetId: "", promotedStoryId: "" };
  }

  function setWireForm(id: string, patch: Partial<ReturnType<typeof wireFormFor>>) {
    const row = data.dailyWireRows.find((item) => item.id === id);
    if (!row) return;
    setWireForms((current) => ({ ...current, [id]: { ...wireFormFor(row), ...current[id], ...patch } }));
  }

  function runWireModeration(row: AdminDailyWireRow, status: string) {
    const form = wireFormFor(row);
    runAction(
      `wire-${row.id}-${status}`,
      {
        action: "wire_moderation",
        wireId: row.id,
        status,
        ...form,
      },
      () => {
        setData((current) => ({
          ...current,
          dailyWireRows: current.dailyWireRows.map((item) => (item.id === row.id ? { ...item, status } : item)),
        }));
      },
    );
  }

  function queueImportRun() {
    runAction("data-health-rerun-import", {
      action: "data_health",
      healthAction: "rerun_import",
      ...importQueueForm,
    });
  }

  function updateDataHealthRow(
    key: string,
    targetTable: "data_quality_issue" | "duplicate_candidate" | "import_error" | "broken_link" | "import_run",
    targetId: string,
    status: string,
    note = "",
  ) {
    runAction(key, {
      action: "data_health",
      healthAction: "update_status",
      targetTable,
      targetId,
      status,
      note,
    });
  }

  function quarantineBadItem() {
    runAction("data-health-quarantine", {
      action: "data_health",
      healthAction: "quarantine_bad_item",
      ...quarantineForm,
    });
  }

  return (
    <main className="bg-[#f6f9fc]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-lg border border-slate-200 bg-slate-950 text-white shadow-sm">
          <div className="h-1.5 bg-[linear-gradient(90deg,#b42318_0%,#b42318_34%,#d6b35a_34%,#d6b35a_58%,#1d4ed8_58%,#1d4ed8_100%)]" />
          <div className="p-5 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-300">Secure admin</p>
            <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h1 className="text-3xl font-black leading-tight sm:text-5xl">RepWatchr admin dashboard</h1>
                <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
                  {adminEmail} / server-side admin role verified / generated {new Date(data.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/admin/races" className="secondary-button">Race Desk</Link>
                <Link href="/admin/money" className="secondary-button">Money Desk</Link>
                <Link href="/admin/records-responses" className="secondary-button">Response Desk</Link>
                <Link href="/admin/pricing" className="secondary-button">Pricing</Link>
                <Link href="/admin/api" className="secondary-button">API</Link>
                <Link href="/admin/quality" className="secondary-button">Quality</Link>
                <Link href="/admin/partners" className="secondary-button">Partners</Link>
                <Link href="/admin/share-campaigns" className="secondary-button">Share Campaigns</Link>
                <Link href="/admin/content-review" className="secondary-button">Old Review</Link>
                <Link href="/admin/control-center" className="secondary-button">Control Center</Link>
              </div>
            </div>
          </div>
        </section>

        {notice ? <Alert tone="good" text={notice} /> : null}
        {error ? <Alert tone="bad" text={error} /> : null}
        {data.errors.length ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-950">
            Missing or unavailable admin data: {data.errors.slice(0, 5).join(" / ")}
          </div>
        ) : null}

        <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-10">
          {[
            ["Overview", "#overview"],
            ["Analytics", "#analytics"],
            ["Sources", "#source-review"],
            ["Wire", "#wire-review"],
            ["Profiles", "#profile-manager"],
            ["Records", "#records-requests"],
            ["Revenue", "#revenue-desk"],
            ["Money", "/admin/money"],
            ["Responses", "/admin/records-responses"],
            ["Pricing", "/admin/pricing"],
            ["API", "/admin/api"],
            ["Quality", "/admin/quality"],
            ["Partners", "/admin/partners"],
            ["Share campaigns", "/admin/share-campaigns"],
            ["Content", "#content-desk"],
            ["Health", "#data-health"],
            ["Audit", "#audit-log"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-xs font-black uppercase tracking-wide text-blue-950 shadow-sm hover:border-red-300 hover:text-red-700">
              {label}
            </a>
          ))}
        </nav>

        <AdminSection id="overview" eyebrow="Overview" title="What needs attention first">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.overview.map((metric) => (
              <Metric key={metric.label} metric={metric} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <RankedList title="Most-viewed profiles" rows={data.mostViewedProfiles} empty="No page-view rows are available yet." />
            <RankedList title="Most-shared profiles" rows={data.mostSharedProfiles} empty="Share-event tracking is waiting on the admin dashboard migration." />
          </div>
        </AdminSection>

        <AdminSection id="analytics" eyebrow="Product Analytics" title="Usage, conversion, sharing, and broken funnel points">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Top pages">
              <RankedList title="Recent page views" rows={data.analytics.topPages} empty="No page-view rows are available yet." />
            </Panel>
            <Panel title="Top profiles">
              <RankedList title="Profile opens" rows={data.analytics.topProfiles} empty="No profile-open events are available yet." />
            </Panel>
            <Panel title="Conversion funnel">
              {data.analytics.conversionFunnel.map((metric) => <Metric key={metric.label} metric={metric} />)}
            </Panel>
            <Panel title="Broken funnel points">
              {data.analytics.brokenFunnelPoints.map((metric) => <Metric key={metric.label} metric={metric} />)}
            </Panel>
            <Panel title="Top searches">
              {data.analytics.topSearches.length ? data.analytics.topSearches.map((metric) => <Metric key={metric.label} metric={metric} />) : <EmptyState text="No official search events are available yet." />}
            </Panel>
            <Panel title="Revenue events">
              {data.analytics.revenueEvents.length ? data.analytics.revenueEvents.map((metric) => <Metric key={metric.label} metric={metric} />) : <EmptyState text="No payment events are available yet." />}
            </Panel>
            <Panel title="Most shared records">
              <RankedList title="Share actions" rows={data.analytics.mostSharedRecords} empty="No share records are available yet." />
            </Panel>
            <Panel title="Most watched records">
              <RankedList title="Watch actions" rows={data.analytics.mostWatchedRecords} empty="No watch events are available yet." />
            </Panel>
            <Panel title="Source submission volume">
              {data.analytics.sourceSubmissionVolume.map((metric) => <Metric key={metric.label} metric={metric} />)}
            </Panel>
          </div>
        </AdminSection>

        <AdminSection id="source-review" eyebrow="Source Review Queue" title="Review, attach, reject, or request more info">
          {data.sourceQueue.length === 0 ? (
            <EmptyState text="No source submissions are waiting for review." />
          ) : (
            <div className="grid gap-3">
              {data.sourceQueue.map((row) => {
                const form = sourceFormFor(row);
                const key = `source-${row.id}`;
                return (
                  <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-lg font-black text-blue-950">{row.targetName}</p>
                        <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
                          {statusLabel(row.status)} / {row.sourceType} / {row.createdAt}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{row.claimSummary}</p>
                        {row.checkRequest ? <p className="mt-1 text-sm font-bold leading-6 text-slate-600">Check: {row.checkRequest}</p> : null}
                        <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-black text-blue-700 hover:text-red-700">
                          Open source
                        </a>
                      </div>
                      <div className="grid min-w-0 gap-2 lg:w-[420px]">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <select value={form.status} onChange={(event) => setSourceForm(row.id, { status: event.target.value })} className="field font-black">
                            {sourceStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                          </select>
                          <select value={form.attachTargetType} onChange={(event) => setSourceForm(row.id, { attachTargetType: event.target.value })} className="field font-black">
                            {sourceTargetTypes.map((type) => <option key={type} value={type}>{statusLabel(type)}</option>)}
                          </select>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input value={form.attachTargetId} onChange={(event) => setSourceForm(row.id, { attachTargetId: event.target.value })} placeholder="profile/race/article id" className="field" />
                          <input value={form.attachTargetUrl} onChange={(event) => setSourceForm(row.id, { attachTargetUrl: event.target.value })} placeholder="/officials/..." className="field" />
                        </div>
                        <textarea value={form.note} onChange={(event) => setSourceForm(row.id, { note: event.target.value })} rows={3} placeholder="Internal note, rejection reason, or more-info request" className="field resize-none" />
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <input type="checkbox" checked={form.publicFlag} onChange={(event) => setSourceForm(row.id, { publicFlag: event.target.checked })} />
                          Public after review
                        </label>
                        <button
                          type="button"
                          disabled={busyKey === key}
                          onClick={() =>
                            runAction(
                              key,
                              {
                                action: "source_review",
                                submissionId: row.id,
                                ...form,
                              },
                              () => {
                                setData((current) => ({
                                  ...current,
                                  sourceQueue: current.sourceQueue.filter((item) => item.id !== row.id),
                                }));
                              },
                            )
                          }
                          className="primary-button"
                        >
                          {busyKey === key ? "Saving..." : "Save Review"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminSection>

        <AdminSection id="wire-review" eyebrow="Daily Watch Wire Quality" title="Approve, reject, attach, or promote wire items">
          {data.dailyWireRows.length === 0 ? (
            <EmptyState text="No Daily Wire rows are available. Run the wire cron after Supabase is configured." />
          ) : (
            <div className="grid gap-3">
              {data.dailyWireRows.map((row) => {
                const form = wireFormFor(row);
                return (
                  <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_440px]">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill value={row.status} />
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                            Quality {row.qualityScore}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                            Duplicate {row.duplicateScore}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-slate-600">
                            {statusLabel(row.jurisdictionMatch)} / {statusLabel(row.geographicRelevance)}
                          </span>
                        </div>
                        <p className="mt-3 text-lg font-black text-blue-950">{row.title}</p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{row.summary}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {row.publicLabels.map((label) => (
                            <span key={label} className="rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-blue-900">
                              {label}
                            </span>
                          ))}
                          {row.topicTags.slice(0, 6).map((tag) => (
                            <span key={tag} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-slate-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                        {row.reviewReasons.length ? (
                          <ul className="mt-3 space-y-1 text-sm font-semibold leading-5 text-red-800">
                            {row.reviewReasons.slice(0, 4).map((reason) => (
                              <li key={reason}>- {reason}</li>
                            ))}
                          </ul>
                        ) : null}
                        <p className="mt-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {row.sourceName} / {row.sourceDomain || "domain pending"} / {row.queryLane || "lane pending"} / {row.publishedAt}
                        </p>
                        <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-sm font-black text-blue-700 hover:text-red-700">
                          Open source
                        </a>
                      </div>
                      <div className="grid gap-2">
                        <textarea
                          value={form.note}
                          onChange={(event) => setWireForm(row.id, { note: event.target.value })}
                          rows={3}
                          placeholder="Moderation note, rejection reason, or attach context"
                          className="field resize-none"
                        />
                        <div className="grid gap-2 sm:grid-cols-2">
                          <select value={form.attachTargetType} onChange={(event) => setWireForm(row.id, { attachTargetType: event.target.value })} className="field font-black">
                            {sourceTargetTypes.map((type) => <option key={type} value={type}>{statusLabel(type)}</option>)}
                          </select>
                          <input value={form.attachTargetId} onChange={(event) => setWireForm(row.id, { attachTargetId: event.target.value })} placeholder="profile/race/article id" className="field" />
                        </div>
                        <input value={form.promotedStoryId} onChange={(event) => setWireForm(row.id, { promotedStoryId: event.target.value })} placeholder="story or draft id for promotion" className="field" />
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          <WireActionButton row={row} status="accepted" busyKey={busyKey} onClick={() => runWireModeration(row, "accepted")} />
                          <WireActionButton row={row} status="needs_review" busyKey={busyKey} onClick={() => runWireModeration(row, "needs_review")} />
                          <WireActionButton row={row} status="quarantined" busyKey={busyKey} onClick={() => runWireModeration(row, "quarantined")} />
                          <WireActionButton row={row} status="duplicate" busyKey={busyKey} onClick={() => runWireModeration(row, "duplicate")} />
                          <WireActionButton row={row} status="irrelevant" busyKey={busyKey} onClick={() => runWireModeration(row, "irrelevant")} />
                          <WireActionButton row={row} status="attached_to_profile" busyKey={busyKey} onClick={() => runWireModeration(row, "attached_to_profile")} />
                          <button type="button" disabled={busyKey === `wire-${row.id}-promoted_to_story`} onClick={() => runWireModeration(row, "promoted_to_story")} className="secondary-button sm:col-span-3">
                            Promote To Story
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </AdminSection>

        <AdminSection id="profile-manager" eyebrow="Official/Profile Manager" title="Search, mark gaps, and stage public profile edits">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <input value={profileSearch} onChange={(event) => setProfileSearch(event.target.value)} placeholder="Search name, id, office, jurisdiction, state" className="field" />
              <div className="mt-3 grid gap-2">
                {filteredProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => setSelectedProfileId(profile.id)}
                    className={`rounded-lg border p-3 text-left ${selectedProfile?.id === profile.id ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-slate-50"}`}
                  >
                    <p className="font-black text-blue-950">{profile.name}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">{profile.id} / {profile.reviewStatus}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{profile.missingData.length} gaps / {profile.scoreStatus}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              {selectedProfile ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xl font-black text-blue-950">{selectedProfile.name}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{selectedProfile.position} / {selectedProfile.jurisdiction}</p>
                    </div>
                    <Link href={selectedProfile.href} className="mini-button">Open</Link>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input value={profileForm.sourceUrl} onChange={(event) => setProfileForm((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="Source link to add" className="field" />
                    <select value={profileForm.scoreStatus} onChange={(event) => setProfileForm((current) => ({ ...current, scoreStatus: event.target.value }))} className="field font-black">
                      <option value="">Score status</option>
                      <option value="missing_scorecard">Missing scorecard</option>
                      <option value="needs_vote_review">Needs vote review</option>
                      <option value="reviewed">Reviewed</option>
                      <option value="public_ready">Public ready</option>
                    </select>
                    <select value={profileForm.publicRoleLabel} onChange={(event) => setProfileForm((current) => ({ ...current, publicRoleLabel: event.target.value }))} className="field font-black sm:col-span-2">
                      {PUBLIC_ROLE_REVIEW_LABELS.map((label) => (
                        <option key={label.value} value={label.value}>{label.label}</option>
                      ))}
                    </select>
                  </div>
                  <textarea value={profileForm.publicFieldsText} onChange={(event) => setProfileForm((current) => ({ ...current, publicFieldsText: event.target.value }))} rows={4} placeholder="Public field edits, one per line: field = value" className="field mt-2 resize-none" />
                  <textarea value={profileForm.missingDataText} onChange={(event) => setProfileForm((current) => ({ ...current, missingDataText: event.target.value }))} rows={3} placeholder={`Missing data already flagged: ${selectedProfile.missingData.join(", ")}`} className="field mt-2 resize-none" />
                  <textarea value={profileForm.redFlagText} onChange={(event) => setProfileForm((current) => ({ ...current, redFlagText: event.target.value }))} rows={3} placeholder="Red flag/source-backed note to stage for review" className="field mt-2 resize-none" />
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold leading-5 text-amber-950">
                    Badge, court, prosecutor, and public-safety edits must keep a public label. Do not imply criminal guilt, private targeting, or misconduct beyond the attached public source.
                  </p>
                  <div className="mt-2">
                    <AdminRiskWarnings warnings={profileRiskWarnings} />
                  </div>
                  <button
                    type="button"
                    disabled={busyKey === `profile-${selectedProfile.id}`}
                    onClick={() =>
                      runAction(`profile-${selectedProfile.id}`, {
                        action: "profile_edit",
                        profileType: "official",
                        profileId: selectedProfile.id,
                        profileName: selectedProfile.name,
                        ...profileForm,
                      })
                    }
                    className="primary-button mt-3"
                  >
                    {busyKey === `profile-${selectedProfile.id}` ? "Saving..." : "Stage Profile Update"}
                  </button>
                </>
              ) : (
                <EmptyState text="No profile selected." />
              )}
            </div>
          </div>
        </AdminSection>

        <AdminSection id="records-requests" eyebrow="Shared Public Records Requests" title="Member requests shared with RepWatchr">
          {data.publicRecordRequests.length === 0 ? (
            <EmptyState text="No member public-record requests have been shared with RepWatchr yet." />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.publicRecordRequests.map((row) => (
                <PublicRecordRequestRow key={row.id} row={row} />
              ))}
            </div>
          )}
        </AdminSection>

        <AdminSection id="revenue-desk" eyebrow="Revenue Desk" title="Orders, subscriptions, service requests, and fulfillment">
          {data.revenueRows.length === 0 ? (
            <EmptyState text="No revenue rows are available yet." />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {data.revenueRows.map((row) => {
                const form = revenueFormFor(row);
                return (
                  <div key={`${row.type}-${row.id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="font-black text-blue-950">{row.label}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{row.type} / {row.serviceName} / {row.amountLabel}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{row.customerEmail} / {row.createdAt}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-[180px_1fr]">
                      <select value={form.status} onChange={(event) => setRevenueForms((current) => ({ ...current, [row.id]: { ...form, status: event.target.value } }))} className="field font-black">
                        {revenueStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                      </select>
                      <input value={form.note} onChange={(event) => setRevenueForms((current) => ({ ...current, [row.id]: { ...form, note: event.target.value } }))} placeholder="Fulfillment note" className="field" />
                    </div>
                    <button
                      type="button"
                      disabled={busyKey === `revenue-${row.type}-${row.id}`}
                      onClick={() =>
                        runAction(
                          `revenue-${row.type}-${row.id}`,
                          { action: "revenue_update", targetTable: row.type, targetId: row.id, ...form },
                          () => {
                            setData((current) => ({
                              ...current,
                              revenueRows: current.revenueRows.map((item) => item.id === row.id && item.type === row.type ? { ...item, status: form.status } : item),
                            }));
                          },
                        )
                      }
                      className="secondary-button mt-3"
                    >
                      Update Fulfillment
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </AdminSection>

        <AdminSection id="content-desk" eyebrow="Content Desk" title="Drafts, Daily Watch, publishing, and share snippets">
          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={contentForm.contentType} onChange={(event) => setContentForm((current) => ({ ...current, contentType: event.target.value as "story_draft" | "daily_watch" }))} className="field font-black">
                  <option value="story_draft">Story draft</option>
                  <option value="daily_watch">Daily Watch item</option>
                </select>
                <select value={contentForm.status} onChange={(event) => setContentForm((current) => ({ ...current, status: event.target.value }))} className="field font-black">
                  {contentStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </div>
              <input value={contentForm.title} onChange={(event) => setContentForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" className="field" />
              <input value={contentForm.sourceUrl} onChange={(event) => setContentForm((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="Primary source URL" className="field" />
              <input value={contentForm.officialIdsText} onChange={(event) => setContentForm((current) => ({ ...current, officialIdsText: event.target.value }))} placeholder="Official/profile IDs, comma-separated" className="field" />
              <textarea value={contentForm.summary} onChange={(event) => setContentForm((current) => ({ ...current, summary: event.target.value }))} rows={3} placeholder="Summary" className="field resize-none" />
              <textarea value={contentForm.body} onChange={(event) => setContentForm((current) => ({ ...current, body: event.target.value }))} rows={4} placeholder="Draft body or Daily Watch note" className="field resize-none" />
              <textarea value={contentForm.shareSnippet} onChange={(event) => setContentForm((current) => ({ ...current, shareSnippet: event.target.value }))} rows={3} placeholder="Share snippet" className="field resize-none" />
              <AdminRiskWarnings warnings={contentRiskWarnings} />
              <button
                type="button"
                disabled={busyKey === "content"}
                onClick={() => runAction("content", { action: "content_upsert", ...contentForm })}
                className="primary-button"
              >
                {busyKey === "content" ? "Saving..." : "Save Content Item"}
              </button>
            </div>
            <div className="grid gap-3">
              {data.contentRows.map((row) => (
                <ContentRow key={`${row.type}-${row.id}`} row={row} />
              ))}
            </div>
          </div>
        </AdminSection>

        <AdminSection id="data-health" eyebrow="Data Health" title="Imports, cron, duplicates, links, canonical URLs, sitemap">
          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Imports">
              {data.dataHealth.imports.map((metric) => <Metric key={metric.label} metric={metric} />)}
            </Panel>
            <Panel title="Cron status">
              {data.dataHealth.cron.map((metric) => <Metric key={metric.label} metric={metric} />)}
            </Panel>
            <Panel title="Data checks">
              <Metric metric={data.dataHealth.duplicateProfiles} />
              <Metric metric={data.dataHealth.brokenLinks} />
              <Metric metric={data.dataHealth.missingCanonicalUrls} />
            </Panel>
            <Panel title="Sitemap counts">
              {data.dataHealth.sitemapCounts.map((metric) => <Metric key={metric.label} metric={metric} />)}
            </Panel>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Queue import check">
              <select
                value={`${importQueueForm.provider}|${importQueueForm.importType}`}
                onChange={(event) => {
                  const [provider, importType] = event.target.value.split("|");
                  setImportQueueForm((current) => ({ ...current, provider, importType }));
                }}
                className="field font-black"
              >
                {importRunOptions.map((option) => (
                  <option key={option.importType} value={`${option.provider}|${option.importType}`}>
                    {option.provider}
                  </option>
                ))}
              </select>
              <input
                value={importQueueForm.note}
                onChange={(event) => setImportQueueForm((current) => ({ ...current, note: event.target.value }))}
                placeholder="Why this import should run again"
                className="field"
              />
              <button type="button" disabled={busyKey === "data-health-rerun-import"} onClick={queueImportRun} className="secondary-button">
                Queue Import
              </button>
            </Panel>
            <Panel title="Quarantine bad item">
              <div className="grid gap-2 sm:grid-cols-2">
                <input value={quarantineForm.entityType} onChange={(event) => setQuarantineForm((current) => ({ ...current, entityType: event.target.value }))} placeholder="entity type" className="field" />
                <input value={quarantineForm.entityId} onChange={(event) => setQuarantineForm((current) => ({ ...current, entityId: event.target.value }))} placeholder="entity id" className="field" />
              </div>
              <input value={quarantineForm.title} onChange={(event) => setQuarantineForm((current) => ({ ...current, title: event.target.value }))} placeholder="Short issue title" className="field" />
              <input value={quarantineForm.sourceUrl} onChange={(event) => setQuarantineForm((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="Source URL if available" className="field" />
              <input value={quarantineForm.note} onChange={(event) => setQuarantineForm((current) => ({ ...current, note: event.target.value }))} placeholder="Reason for quarantine" className="field" />
              <button type="button" disabled={busyKey === "data-health-quarantine"} onClick={quarantineBadItem} className="secondary-button">
                Quarantine Item
              </button>
            </Panel>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel title="Import errors">
              {data.importErrors.length ? (
                data.importErrors.map((row) => (
                  <ImportErrorRow key={row.id} row={row} onUpdate={updateDataHealthRow} />
                ))
              ) : (
                <EmptyState text="No open import errors are stored." />
              )}
            </Panel>
            <Panel title="Data-quality issues">
              {data.dataQualityIssues.length ? (
                data.dataQualityIssues.map((row) => (
                  <DataQualityIssueRow key={row.id} row={row} onUpdate={updateDataHealthRow} />
                ))
              ) : (
                <EmptyState text="No open data-quality issues are stored." />
              )}
            </Panel>
            <Panel title="Duplicate candidates">
              {data.duplicateCandidates.length ? (
                data.duplicateCandidates.map((row) => (
                  <DuplicateCandidateRow key={row.id} row={row} onUpdate={updateDataHealthRow} />
                ))
              ) : (
                <EmptyState text="No duplicate candidates are stored." />
              )}
            </Panel>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-black text-blue-950">Broken source links</h3>
            {data.brokenSourceLinks.length === 0 ? (
              <EmptyState text="No live broken-link rows are stored yet." />
            ) : (
              <div className="mt-3 grid gap-3">
                {data.brokenSourceLinks.map((row) => {
                  const form = brokenLinkFormFor(row);
                  return (
                    <div key={row.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="font-black text-blue-950">{row.context}</p>
                      <p className="mt-1 break-all text-sm font-semibold text-slate-600">{row.url}</p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-[160px_1fr_auto]">
                        <select value={form.status} onChange={(event) => setBrokenLinkForms((current) => ({ ...current, [row.id]: { ...form, status: event.target.value } }))} className="field font-black">
                          {brokenLinkStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </select>
                        <input value={form.note} onChange={(event) => setBrokenLinkForms((current) => ({ ...current, [row.id]: { ...form, note: event.target.value } }))} placeholder="Fix note" className="field" />
                        <button type="button" onClick={() => runAction(`broken-${row.id}`, { action: "broken_link_update", linkId: row.id, ...form })} className="secondary-button">
                          Save
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </AdminSection>

        <AdminSection id="audit-log" eyebrow="Audit Log" title="Admin changes with before/after records">
          {data.auditLog.length === 0 ? (
            <EmptyState text="No admin audit rows are stored yet." />
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-100 text-xs font-black uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Admin</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Target</th>
                    <th className="p-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {data.auditLog.map((row) => (
                    <tr key={row.id}>
                      <td className="p-3 font-bold text-slate-600">{row.createdAt}</td>
                      <td className="p-3 font-bold text-slate-600">{row.adminEmail}</td>
                      <td className="p-3 font-black text-blue-950">{statusLabel(row.action)}</td>
                      <td className="p-3 font-mono text-xs text-slate-600">{row.targetType}:{row.targetId}</td>
                      <td className="p-3 font-semibold text-slate-700">{row.note || "No note"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminSection>
      </div>
    </main>
  );
}

function AdminSection({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black leading-tight text-blue-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-lg font-black text-blue-950">{title}</h3>
      {children}
    </div>
  );
}

function Metric({ metric }: { metric: AdminMetric }) {
  return (
    <div className={`rounded-lg border p-3 ${metricTone(metric.status)}`}>
      <p className="text-2xl font-black">{metric.value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide">{metric.label}</p>
      <p className="mt-2 text-sm font-semibold leading-5 opacity-80">{metric.detail}</p>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const tone =
    value === "accepted" || value === "attached_to_profile" || value === "promoted_to_story"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : value === "needs_review"
        ? "border-amber-200 bg-amber-50 text-amber-900"
        : "border-red-200 bg-red-50 text-red-900";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tone}`}>
      {statusLabel(value)}
    </span>
  );
}

function WireActionButton({
  row,
  status,
  busyKey,
  onClick,
}: {
  row: AdminDailyWireRow;
  status: string;
  busyKey: string;
  onClick: () => void;
}) {
  const label =
    status === "accepted"
      ? "Approve"
      : status === "irrelevant"
        ? "Reject"
        : status === "attached_to_profile"
          ? "Attach"
          : statusLabel(status);

  return (
    <button
      type="button"
      disabled={busyKey === `wire-${row.id}-${status}`}
      onClick={onClick}
      className={status === "accepted" || status === "attached_to_profile" ? "primary-button" : "secondary-button"}
    >
      {busyKey === `wire-${row.id}-${status}` ? "Saving..." : label}
    </button>
  );
}

function RankedList({ title, rows, empty }: { title: string; rows: Array<{ path: string; count: number; label: string }>; empty: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-lg font-black text-blue-950">{title}</h3>
      {rows.length === 0 ? <p className="mt-3 text-sm font-semibold text-slate-600">{empty}</p> : null}
      <div className="mt-3 grid gap-2">
        {rows.map((row) => (
          <Link key={row.path} href={row.path} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-red-300">
            <span className="font-black text-blue-950">{row.label}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">{row.count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ContentRow({ row }: { row: AdminContentRow }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-blue-950">{row.title}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{statusLabel(row.type)} / {statusLabel(row.status)} / {row.createdAt}</p>
        </div>
        {row.sourceUrl ? (
          <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" className="mini-button">Source</a>
        ) : null}
      </div>
      {row.shareSnippet ? <p className="mt-2 whitespace-pre-line text-sm font-semibold leading-6 text-slate-700">{row.shareSnippet}</p> : null}
    </div>
  );
}

function PublicRecordRequestRow({ row }: { row: AdminPublicRecordRequestRow }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-black text-blue-950">{row.agency}</p>
          <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
            {row.state} / {statusLabel(row.status)} / {row.createdAt}
          </p>
        </div>
        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-blue-900">
          Shared
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-slate-700">
        <p><span className="font-black text-blue-950">Requester:</span> {row.requesterName} / {row.requesterEmail}</p>
        <p><span className="font-black text-blue-950">Record type:</span> {row.recordType}</p>
        {row.jurisdiction ? <p><span className="font-black text-blue-950">Jurisdiction:</span> {row.jurisdiction}</p> : null}
        {row.dateRange ? <p><span className="font-black text-blue-950">Date range:</span> {row.dateRange}</p> : null}
        {row.namesOffices ? <p><span className="font-black text-blue-950">Names/offices:</span> {row.namesOffices}</p> : null}
        {row.meetingEvent ? <p><span className="font-black text-blue-950">Meeting/event:</span> {row.meetingEvent}</p> : null}
        {row.deliveryMethod ? <p><span className="font-black text-blue-950">Delivery:</span> {row.deliveryMethod}</p> : null}
      </div>
    </div>
  );
}

function ImportErrorRow({
  row,
  onUpdate,
}: {
  row: AdminImportErrorRow;
  onUpdate: (
    key: string,
    targetTable: "data_quality_issue" | "duplicate_candidate" | "import_error" | "broken_link" | "import_run",
    targetId: string,
    status: string,
    note?: string,
  ) => void;
}) {
  return (
    <div className="rounded-lg border border-red-100 bg-white p-3">
      <p className="text-sm font-black text-blue-950">{row.provider}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-red-700">{row.severity} / {row.createdAt}</p>
      <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">{row.message}</p>
      {row.sourceUrl ? <p className="mt-1 break-all text-xs font-bold text-slate-500">{row.sourceUrl}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="mini-button" onClick={() => onUpdate(`import-error-${row.id}-resolved`, "import_error", row.id, "resolved")}>
          Resolve
        </button>
        <button type="button" className="mini-button" onClick={() => onUpdate(`import-error-${row.id}-ignored`, "import_error", row.id, "ignored")}>
          Ignore
        </button>
      </div>
    </div>
  );
}

function DataQualityIssueRow({
  row,
  onUpdate,
}: {
  row: AdminDataQualityIssueRow;
  onUpdate: (
    key: string,
    targetTable: "data_quality_issue" | "duplicate_candidate" | "import_error" | "broken_link" | "import_run",
    targetId: string,
    status: string,
    note?: string,
  ) => void;
}) {
  return (
    <div className="rounded-lg border border-amber-100 bg-white p-3">
      <p className="text-sm font-black text-blue-950">{row.title}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-amber-800">
        {row.severity} / {row.issueType} / {row.entityType}:{row.entityId || "pending"}
      </p>
      {row.detail ? <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">{row.detail}</p> : null}
      {row.sourceUrl ? <p className="mt-1 break-all text-xs font-bold text-slate-500">{row.sourceUrl}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="mini-button" onClick={() => onUpdate(`issue-${row.id}-resolved`, "data_quality_issue", row.id, "resolved")}>
          Resolve
        </button>
        <button type="button" className="mini-button" onClick={() => onUpdate(`issue-${row.id}-quarantined`, "data_quality_issue", row.id, "quarantined")}>
          Quarantine
        </button>
      </div>
    </div>
  );
}

function DuplicateCandidateRow({
  row,
  onUpdate,
}: {
  row: AdminDuplicateCandidateRow;
  onUpdate: (
    key: string,
    targetTable: "data_quality_issue" | "duplicate_candidate" | "import_error" | "broken_link" | "import_run",
    targetId: string,
    status: string,
    note?: string,
  ) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-sm font-black text-blue-950">{row.entityType}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">
        {row.confidenceScore}% confidence / {row.createdAt}
      </p>
      <p className="mt-2 text-sm font-semibold leading-5 text-slate-700">
        {row.primaryEntityId || "primary pending"} vs. {row.duplicateEntityId || "duplicate pending"}
      </p>
      {row.reason ? <p className="mt-1 text-sm font-semibold leading-5 text-slate-600">{row.reason}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="mini-button" onClick={() => onUpdate(`duplicate-${row.id}-merged`, "duplicate_candidate", row.id, "merged")}>
          Merge
        </button>
        <button type="button" className="mini-button" onClick={() => onUpdate(`duplicate-${row.id}-ignored`, "duplicate_candidate", row.id, "ignored")}>
          Ignore
        </button>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">{text}</p>;
}

function Alert({ tone, text }: { tone: "good" | "bad"; text: string }) {
  return (
    <div className={`mt-4 rounded-lg border p-3 text-sm font-bold leading-6 ${tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-950" : "border-red-200 bg-red-50 text-red-950"}`}>
      {text}
    </div>
  );
}
