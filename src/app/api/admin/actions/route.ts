import { NextResponse } from "next/server";
import { AdminAuthError, getAdminUserForServer } from "@/lib/admin-auth";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { cleanLongText, cleanText, cleanUrl } from "@/lib/source-submissions";
import { getOfficialById } from "@/lib/data";
import { updateDailyWireItemStatus } from "@/lib/daily-wire";
import { PUBLIC_ROLE_REVIEW_LABELS } from "@/lib/public-role-safety";
import type { DailyWireStatus } from "@/lib/daily-wire-quality";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sourceStatuses = new Set(["needs_review", "verified", "attached_to_profile", "needs_more_info", "rejected"]);
const sourceTargetTypes = new Set(["official", "school_board", "race", "article", "public_record"]);
const revenueTables = {
  order: "orders",
  subscription: "subscriptions",
  service_request: "service_requests",
} as const;
const contentStatuses = new Set(["draft", "published", "unpublished", "archived"]);
const contentTypes = new Set(["story_draft", "daily_watch"]);
const brokenLinkStatuses = new Set(["new", "confirmed", "fixed", "ignored"]);
const publicRoleLabels = new Set<string>(PUBLIC_ROLE_REVIEW_LABELS.map((label) => label.value));
const dataHealthTables = {
  data_quality_issue: "data_quality_issues",
  broken_link: "broken_links",
  duplicate_candidate: "duplicate_candidates",
  import_error: "import_errors",
  import_run: "import_runs",
} as const;
const dataHealthStatuses = new Set(["open", "resolved", "ignored", "quarantined", "new", "confirmed", "fixed", "merged", "queued", "running", "success", "partial", "failed"]);
const racePageStatuses = new Set(["staged", "needs_review", "published", "archived"]);
const wireStatuses = new Set<DailyWireStatus>([
  "accepted",
  "needs_review",
  "quarantined",
  "duplicate",
  "irrelevant",
  "attached_to_profile",
  "promoted_to_story",
]);

type AdminSupabase = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
type AdminActionBody = Record<string, unknown>;

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function splitList(value: unknown) {
  return cleanLongText(value, 2500)
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 40);
}

function parsePublicFields(value: unknown) {
  const fields: Record<string, string> = {};
  for (const line of cleanLongText(value, 5000).split("\n")) {
    const [key, ...rest] = line.split("=");
    const cleanKey = cleanText(key, 80);
    const cleanValue = cleanLongText(rest.join("=").trim(), 1200);
    if (cleanKey && cleanValue) fields[cleanKey] = cleanValue;
  }
  return fields;
}

function parsePipeRows(value: unknown, limit = 80) {
  return cleanLongText(value, 12000)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, limit)
    .map((line) => line.split("|").map((part) => cleanLongText(part, 1200).trim()));
}

function parseRaceCandidates(value: unknown) {
  return parsePipeRows(value, 40).map(([name, party, incumbent, campaignUrl, sourceUrl]) => ({
    name: cleanText(name, 180),
    party: cleanText(party, 30),
    incumbent: /^(yes|true|incumbent|current)$/i.test(incumbent ?? ""),
    campaign_url: cleanUrl(campaignUrl),
    source_url: cleanUrl(sourceUrl),
    status: sourceUrl ? "source_linked" : "needs_source",
  })).filter((candidate) => candidate.name);
}

function parseRaceSourceLinks(value: unknown) {
  return parsePipeRows(value, 80).map(([label, url, sourceType]) => ({
    label: cleanText(label, 220),
    url: cleanUrl(url),
    source_type: cleanText(sourceType, 80) || "public_record",
  })).filter((source) => source.label && source.url);
}

function parseSimpleLinks(value: unknown) {
  return parsePipeRows(value, 80).map(([label, url]) => ({
    label: cleanText(label, 220) || cleanText(url, 220),
    url: cleanUrl(url) || cleanUrl(label),
  })).filter((source) => source.label && source.url);
}

function parseMissingRecords(value: unknown) {
  return parsePipeRows(value, 60).map(([label, priority, why]) => ({
    label: cleanText(label, 220),
    priority: ["high", "medium", "low"].includes(cleanText(priority, 30)) ? cleanText(priority, 30) : "medium",
    why: cleanLongText(why, 1000),
  })).filter((item) => item.label);
}

function parseRedFlags(value: unknown) {
  return parsePipeRows(value, 60).map(([label, sourceUrl, status]) => ({
    label: cleanText(label, 220),
    source_url: cleanUrl(sourceUrl),
    status: cleanText(status, 80) || (sourceUrl ? "source_linked" : "needs_review"),
  })).filter((item) => item.label);
}

async function insertAudit({
  supabase,
  adminUser,
  action,
  targetType,
  targetId,
  beforeValues,
  afterValues,
  note,
}: {
  supabase: AdminSupabase;
  adminUser: { id: string; email: string | null };
  action: string;
  targetType: string;
  targetId: string;
  beforeValues: Record<string, unknown> | null;
  afterValues: Record<string, unknown> | null;
  note: string;
}) {
  const { data, error } = await supabase
    .from("admin_audit_log")
    .insert({
      admin_user_id: adminUser.id,
      admin_email: adminUser.email,
      action,
      target_type: targetType,
      target_id: targetId,
      before_values: beforeValues ?? {},
      after_values: afterValues ?? {},
      note: note || null,
    })
    .select("id, admin_email, action, target_type, target_id, note, created_at")
    .maybeSingle();

  if (error || !data) {
    throw new Error(error?.message || "Audit log insert failed.");
  }

  return {
    id: String(data.id),
    adminEmail: String(data.admin_email || adminUser.email || "Admin"),
    action: String(data.action),
    targetType: String(data.target_type),
    targetId: String(data.target_id),
    note: String(data.note || ""),
    createdAt: new Date(String(data.created_at)).toLocaleDateString("en-US"),
  };
}

async function handleSourceReview(supabase: AdminSupabase, adminUser: { id: string; email: string | null }, body: AdminActionBody) {
  const submissionId = cleanText(body.submissionId, 80);
  const status = cleanText(body.status, 80);
  const note = cleanLongText(body.note, 5000);
  const attachTargetType = cleanText(body.attachTargetType, 80);
  const attachTargetId = cleanText(body.attachTargetId, 180);
  const attachTargetUrl = cleanText(body.attachTargetUrl, 1000);
  const publicFlag = body.publicFlag === true;

  if (!submissionId) return jsonError("Submission ID is required.", 400);
  if (!sourceStatuses.has(status)) return jsonError("Unsupported source status.", 400);
  if (attachTargetType && !sourceTargetTypes.has(attachTargetType)) return jsonError("Unsupported attach target type.", 400);
  if ((status === "rejected" || status === "needs_more_info") && !note) {
    return jsonError("A rejection or more-info request needs a reason.", 400);
  }

  const { data: before, error: beforeError } = await supabase
    .from("source_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (beforeError || !before) return jsonError(beforeError?.message || "Source submission not found.", 404);

  const updatePayload = {
    status,
    public_flag: status === "rejected" ? false : publicFlag,
    target_type: attachTargetType || before.target_type,
    target_profile_id: attachTargetId || before.target_profile_id,
    target_page_url: attachTargetUrl || before.target_page_url,
    reviewer_id: adminUser.id,
    reviewed_at: new Date().toISOString(),
  };

  const { data: after, error: updateError } = await supabase
    .from("source_submissions")
    .update(updatePayload)
    .eq("id", submissionId)
    .select("*")
    .maybeSingle();

  if (updateError || !after) return jsonError(updateError?.message || "Source submission update failed.", 500);

  const sideEffectResults = await Promise.all([
    note
      ? supabase.from("source_review_notes").insert({
          submission_id: submissionId,
          reviewer_id: adminUser.id,
          note,
          visibility: "internal",
          metadata: { source: "admin_dashboard", status },
        })
      : Promise.resolve({ error: null }),
    supabase.from("source_status_history").insert({
      submission_id: submissionId,
      old_status: before.status,
      new_status: status,
      changed_by: adminUser.id,
      note: note || null,
    }),
    supabase.from("source_submission_events").insert({
      submission_id: submissionId,
      event_type: `admin_${status}`,
      actor_user_id: adminUser.id,
      actor_role: "admin",
      message: note || `Admin changed source submission status to ${status}.`,
      metadata: { attachTargetType, attachTargetId, attachTargetUrl },
    }),
    status === "attached_to_profile" && after.source_url
      ? supabase.from("source_submission_attachments").insert({
          submission_id: submissionId,
          attachment_type: "attached_source_url",
          label: after.source_title || "Attached source",
          url: after.source_url,
          metadata: {
            attachedTargetType: attachTargetType || after.target_type || null,
            attachedTargetId: attachTargetId || after.target_profile_id || null,
            attachedTargetUrl: attachTargetUrl || after.target_page_url || null,
            attachedBy: adminUser.id,
            attachedAt: new Date().toISOString(),
          },
        })
      : Promise.resolve({ error: null }),
  ]);
  const sideEffectError = sideEffectResults.find((result) => result.error)?.error;
  if (sideEffectError) return jsonError(sideEffectError.message || "Source review side-effect failed.", 500);

  const audit = await insertAudit({
    supabase,
    adminUser,
    action: "source_review",
    targetType: "source_submission",
    targetId: submissionId,
    beforeValues: before,
    afterValues: after,
    note,
  });

  return NextResponse.json({ ok: true, audit });
}

async function handleProfileEdit(supabase: AdminSupabase, adminUser: { id: string; email: string | null }, body: AdminActionBody) {
  const profileType = cleanText(body.profileType, 80) || "official";
  const profileId = cleanText(body.profileId, 180);
  const profileName = cleanText(body.profileName, 255);
  const sourceUrl = cleanUrl(body.sourceUrl);
  const note = cleanLongText(body.redFlagText, 5000);
  const publicRoleLabel = cleanText(body.publicRoleLabel, 80) || "under_review";

  if (!profileId) return jsonError("Profile ID is required.", 400);
  if (!publicRoleLabels.has(publicRoleLabel)) return jsonError("A valid public-role review label is required.", 400);

  const publicFields = parsePublicFields(body.publicFieldsText);
  const sourceLinks = sourceUrl ? [{ title: "Admin-added source", url: sourceUrl }] : [];
  const missingData = splitList(body.missingDataText);
  const redFlags = note ? [{ note, status: publicRoleLabel, sourceUrl }] : [];
  const scoreStatus = cleanText(body.scoreStatus, 120);
  const beforeOfficial = getOfficialById(profileId) ?? null;

  const { data: after, error } = await supabase
    .from("admin_profile_edits")
    .insert({
      profile_type: profileType,
      profile_id: profileId,
      profile_name: profileName || beforeOfficial?.name || profileId,
      public_fields: publicFields,
      source_links: sourceLinks,
      missing_data: missingData,
      red_flags: redFlags,
      score_status: scoreStatus || null,
      status: "staged",
      created_by: adminUser.id,
      metadata: { source: "admin_dashboard", public_role_label: publicRoleLabel },
    })
    .select("*")
    .maybeSingle();

  if (error || !after) return jsonError(error?.message || "Profile edit staging failed.", 500);

  const audit = await insertAudit({
    supabase,
    adminUser,
    action: "profile_edit_staged",
    targetType: profileType,
    targetId: profileId,
    beforeValues: beforeOfficial as unknown as Record<string, unknown> | null,
    afterValues: after,
    note: note || scoreStatus || publicRoleLabel || "Profile update staged.",
  });

  return NextResponse.json({ ok: true, audit });
}

async function handleRevenueUpdate(supabase: AdminSupabase, adminUser: { id: string; email: string | null }, body: AdminActionBody) {
  const targetTableKey = cleanText(body.targetTable, 80) as keyof typeof revenueTables;
  const table = revenueTables[targetTableKey];
  const targetId = cleanText(body.targetId, 80);
  const status = cleanText(body.status, 80);
  const note = cleanLongText(body.note, 2000);

  if (!table || !targetId || !status) return jsonError("Revenue target, ID, and status are required.", 400);

  const { data: before, error: beforeError } = await supabase.from(table).select("*").eq("id", targetId).maybeSingle();
  if (beforeError || !before) return jsonError(beforeError?.message || "Revenue row not found.", 404);

  const metadata = before && typeof before.metadata === "object" && before.metadata !== null ? before.metadata : {};
  const { data: after, error } = await supabase
    .from(table)
    .update({
      status,
      metadata: {
        ...metadata,
        admin_note: note || null,
        admin_updated_at: new Date().toISOString(),
      },
    })
    .eq("id", targetId)
    .select("*")
    .maybeSingle();

  if (error || !after) return jsonError(error?.message || "Revenue row update failed.", 500);

  const audit = await insertAudit({
    supabase,
    adminUser,
    action: "revenue_status_update",
    targetType: table,
    targetId,
    beforeValues: before,
    afterValues: after,
    note,
  });

  return NextResponse.json({ ok: true, audit });
}

async function handleContentUpsert(supabase: AdminSupabase, adminUser: { id: string; email: string | null }, body: AdminActionBody) {
  const contentId = cleanText(body.contentId, 80);
  const contentType = cleanText(body.contentType, 80);
  const title = cleanText(body.title, 255);
  const status = cleanText(body.status, 80);
  const sourceUrl = cleanUrl(body.sourceUrl);

  if (!contentTypes.has(contentType)) return jsonError("Unsupported content type.", 400);
  if (!contentStatuses.has(status)) return jsonError("Unsupported content status.", 400);
  if (!title) return jsonError("Content title is required.", 400);

  const payload = {
    content_type: contentType,
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 120),
    summary: cleanLongText(body.summary, 3000),
    body: cleanLongText(body.body, 12000),
    source_links: sourceUrl ? [{ title: "Primary source", url: sourceUrl }] : [],
    official_ids: splitList(body.officialIdsText),
    status,
    share_snippet: cleanLongText(body.shareSnippet, 3000),
    created_by: adminUser.id,
    published_at: status === "published" ? new Date().toISOString() : null,
    metadata: { source: "admin_dashboard" },
  };

  const before = contentId
    ? (await supabase.from("admin_content_items").select("*").eq("id", contentId).maybeSingle()).data
    : null;
  const query = contentId
    ? supabase.from("admin_content_items").update(payload).eq("id", contentId).select("*").maybeSingle()
    : supabase.from("admin_content_items").insert(payload).select("*").maybeSingle();
  const { data: after, error } = await query;

  if (error || !after) return jsonError(error?.message || "Content save failed.", 500);

  const audit = await insertAudit({
    supabase,
    adminUser,
    action: contentId ? "content_updated" : "content_created",
    targetType: "admin_content_item",
    targetId: String(after.id),
    beforeValues: before,
    afterValues: after,
    note: cleanLongText(body.summary, 600),
  });

  return NextResponse.json({ ok: true, audit });
}

async function handleRaceEdit(supabase: AdminSupabase, adminUser: { id: string; email: string | null }, body: AdminActionBody) {
  const raceId = cleanText(body.raceId, 80);
  const slug = cleanText(body.slug, 180)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const title = cleanText(body.title, 255);
  const office = cleanText(body.office, 255);
  const jurisdiction = cleanText(body.jurisdiction, 255);
  const electionDate = cleanText(body.electionDate, 80);
  const publicStatus = cleanText(body.publicStatus, 80) || "staged";
  const summary = cleanLongText(body.summary, 3000);
  const note = cleanLongText(body.note, 3000);
  const candidates = parseRaceCandidates(body.candidatesText);
  const sourceLinks = parseRaceSourceLinks(body.sourceLinksText);
  const storyLinks = parsePipeRows(body.storyLinksText, 60).map(([labelOrId, url]) => ({
    label: cleanText(labelOrId, 220),
    story_id: cleanUrl(labelOrId) ? null : cleanText(labelOrId, 180),
    url: cleanUrl(url) || cleanUrl(labelOrId),
  })).filter((story) => story.label || story.url);
  const fundingLinks = parseSimpleLinks(body.fundingLinksText);
  const redFlags = parseRedFlags(body.redFlagsText);
  const missingRecords = parseMissingRecords(body.missingRecordsText);

  if (!slug) return jsonError("Race slug is required.", 400);
  if (!title) return jsonError("Race title is required.", 400);
  if (!racePageStatuses.has(publicStatus)) return jsonError("Unsupported race page status.", 400);
  if (publicStatus === "published" && sourceLinks.length === 0) {
    return jsonError("A published race page needs at least one public source link.", 400);
  }

  const beforeQuery = raceId
    ? supabase.from("race_pages").select("*").eq("id", raceId).maybeSingle()
    : supabase.from("race_pages").select("*").eq("slug", slug).maybeSingle();
  const { data: before, error: beforeError } = await beforeQuery;
  if (beforeError && !beforeError.message.toLowerCase().includes("no rows")) {
    return jsonError(beforeError.message || "Race page lookup failed.", 500);
  }

  const payload = {
    slug,
    title,
    office,
    jurisdiction,
    election_date: electionDate || null,
    summary,
    public_status: publicStatus,
    state: "TX",
    candidates,
    source_links: sourceLinks,
    story_links: storyLinks,
    funding_links: fundingLinks,
    red_flags: redFlags,
    missing_records: missingRecords,
    updated_by: adminUser.id,
    created_by: before ? before.created_by : adminUser.id,
    metadata: {
      source: "admin_race_desk",
      note: note || null,
      candidate_count: candidates.length,
      source_count: sourceLinks.length,
      funding_count: fundingLinks.length,
      red_flag_count: redFlags.length,
    },
  };

  const query = before
    ? supabase.from("race_pages").update(payload).eq("id", before.id).select("*").maybeSingle()
    : supabase.from("race_pages").insert(payload).select("*").maybeSingle();
  const { data: after, error } = await query;
  if (error || !after) return jsonError(error?.message || "Race page save failed.", 500);

  const audit = await insertAudit({
    supabase,
    adminUser,
    action: before ? "race_page_updated" : "race_page_created",
    targetType: "race_page",
    targetId: String(after.id),
    beforeValues: before,
    afterValues: after,
    note: note || `${title} saved as ${publicStatus}.`,
  });

  return NextResponse.json({ ok: true, audit });
}

async function handleBrokenLinkUpdate(supabase: AdminSupabase, adminUser: { id: string; email: string | null }, body: AdminActionBody) {
  const linkId = cleanText(body.linkId, 80);
  const status = cleanText(body.status, 80);
  const note = cleanLongText(body.note, 2000);

  if (!linkId || !brokenLinkStatuses.has(status)) return jsonError("Broken link ID and valid status are required.", 400);

  const { data: before, error: beforeError } = await supabase.from("admin_broken_source_links").select("*").eq("id", linkId).maybeSingle();
  if (beforeError || !before) return jsonError(beforeError?.message || "Broken link row not found.", 404);

  const { data: after, error } = await supabase
    .from("admin_broken_source_links")
    .update({
      status,
      note: note || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", linkId)
    .select("*")
    .maybeSingle();

  if (error || !after) return jsonError(error?.message || "Broken link update failed.", 500);

  const audit = await insertAudit({
    supabase,
    adminUser,
    action: "broken_link_update",
    targetType: "admin_broken_source_link",
    targetId: linkId,
    beforeValues: before,
    afterValues: after,
    note,
  });

  return NextResponse.json({ ok: true, audit });
}

async function handleWireModeration(supabase: AdminSupabase, adminUser: { id: string; email: string | null }, body: AdminActionBody) {
  const wireId = cleanText(body.wireId, 120);
  const status = cleanText(body.status, 80) as DailyWireStatus;
  const note = cleanLongText(body.note, 2000);
  const attachTargetType = cleanText(body.attachTargetType, 80);
  const attachTargetId = cleanText(body.attachTargetId, 180);
  const promotedStoryId = cleanText(body.promotedStoryId, 180);

  if (!wireId) return jsonError("Daily Wire item ID is required.", 400);
  if (!wireStatuses.has(status)) return jsonError("Unsupported Daily Wire status.", 400);
  if ((status === "irrelevant" || status === "quarantined") && !note) {
    return jsonError("Rejecting or quarantining a wire item needs a short reason.", 400);
  }
  if (status === "attached_to_profile" && !attachTargetId) {
    return jsonError("Attach-to-profile needs a profile, race, article, or board ID.", 400);
  }
  if (status === "promoted_to_story" && !promotedStoryId) {
    return jsonError("Promote-to-story needs a story or draft ID.", 400);
  }

  try {
    const { before, after } = await updateDailyWireItemStatus({
      id: wireId,
      status,
      adminUserId: adminUser.id,
      note,
      attachTargetType,
      attachTargetId,
      promotedStoryId,
    });
    const eventInsert = await supabase.from("repwatchr_daily_wire_events").insert({
      wire_item_id: wireId,
      old_status: before.status ?? null,
      new_status: status,
      action: "admin_moderation",
      note: note || null,
      attach_target_type: attachTargetType || null,
      attach_target_id: attachTargetId || null,
      promoted_story_id: promotedStoryId || null,
      actor_user_id: adminUser.id,
      metadata: { source: "admin_dashboard" },
    });
    if (eventInsert.error && !eventInsert.error.message.toLowerCase().includes("repwatchr_daily_wire_events")) {
      return jsonError(eventInsert.error.message || "Daily Wire event insert failed.", 500);
    }

    const audit = await insertAudit({
      supabase,
      adminUser,
      action: "daily_wire_moderation",
      targetType: "repwatchr_daily_clip",
      targetId: wireId,
      beforeValues: before,
      afterValues: after,
      note: note || status,
    });

    return NextResponse.json({ ok: true, audit });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Daily Wire moderation failed.", 500);
  }
}

async function handleDataHealthAction(supabase: AdminSupabase, adminUser: { id: string; email: string | null }, body: AdminActionBody) {
  const healthAction = cleanText(body.healthAction, 80);
  const note = cleanLongText(body.note, 2000);

  if (healthAction === "rerun_import") {
    const importType = cleanText(body.importType, 120);
    const provider = cleanText(body.provider, 160);
    if (!importType || !provider) return jsonError("Import type and provider are required.", 400);

    const { data: after, error } = await supabase
      .from("import_runs")
      .insert({
        import_type: importType,
        provider,
        status: "queued",
        created_by: adminUser.id,
        metadata: {
          source: "admin_dashboard",
          note: note || null,
        },
      })
      .select("*")
      .maybeSingle();

    if (error || !after) return jsonError(error?.message || "Import run queue failed.", 500);

    const audit = await insertAudit({
      supabase,
      adminUser,
      action: "import_run_queued",
      targetType: "import_run",
      targetId: String(after.id),
      beforeValues: null,
      afterValues: after,
      note: note || `${provider} ${importType} queued.`,
    });

    return NextResponse.json({ ok: true, audit });
  }

  if (healthAction === "quarantine_bad_item") {
    const entityType = cleanText(body.entityType, 80) || "unknown";
    const entityId = cleanText(body.entityId, 180);
    const title = cleanText(body.title, 240) || "Bad data item quarantined";
    const sourceUrl = cleanUrl(body.sourceUrl);
    const { data: after, error } = await supabase
      .from("data_quality_issues")
      .insert({
        issue_type: "quarantine",
        entity_type: entityType,
        entity_id: entityId || null,
        severity: "error",
        title,
        detail: note || "Admin quarantined this item for data-quality review.",
        source_url: sourceUrl || null,
        status: "quarantined",
        resolved_by: adminUser.id,
        metadata: { source: "admin_dashboard" },
      })
      .select("*")
      .maybeSingle();

    if (error || !after) return jsonError(error?.message || "Quarantine action failed.", 500);

    const audit = await insertAudit({
      supabase,
      adminUser,
      action: "data_item_quarantined",
      targetType: entityType,
      targetId: entityId || String(after.id),
      beforeValues: null,
      afterValues: after,
      note,
    });

    return NextResponse.json({ ok: true, audit });
  }

  const tableKey = cleanText(body.targetTable, 80) as keyof typeof dataHealthTables;
  const table = dataHealthTables[tableKey];
  const targetId = cleanText(body.targetId, 80);
  const status = cleanText(body.status, 80);
  if (!table || !targetId || !dataHealthStatuses.has(status)) {
    return jsonError("Data-health target table, row ID, and valid status are required.", 400);
  }

  const { data: before, error: beforeError } = await supabase.from(table).select("*").eq("id", targetId).maybeSingle();
  if (beforeError || !before) return jsonError(beforeError?.message || "Data-health row not found.", 404);

  const updatePayload: Record<string, unknown> = {
    status,
  };
  if (["resolved", "ignored", "fixed", "merged"].includes(status)) {
    updatePayload.resolved_at = new Date().toISOString();
    updatePayload.resolved_by = adminUser.id;
  }
  if (status === "quarantined") {
    updatePayload.resolved_by = adminUser.id;
  }

  const { data: after, error } = await supabase
    .from(table)
    .update(updatePayload)
    .eq("id", targetId)
    .select("*")
    .maybeSingle();

  if (error || !after) return jsonError(error?.message || "Data-health update failed.", 500);

  const audit = await insertAudit({
    supabase,
    adminUser,
    action: "data_health_update",
    targetType: table,
    targetId,
    beforeValues: before,
    afterValues: after,
    note: note || status,
  });

  return NextResponse.json({ ok: true, audit });
}

export async function POST(request: Request) {
  let adminUser;
  try {
    adminUser = await getAdminUserForServer();
  } catch (error) {
    if (error instanceof AdminAuthError) return jsonError(error.message, error.status);
    return jsonError("Admin authorization failed.", 403);
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return jsonError("Supabase service role is required for admin actions.", 503);

  const body = (await request.json().catch(() => null)) as AdminActionBody | null;
  if (!body || typeof body !== "object") return jsonError("Invalid admin action payload.", 400);

  const action = cleanText(body.action, 80);
  if (action === "source_review") return handleSourceReview(supabase, adminUser, body);
  if (action === "profile_edit") return handleProfileEdit(supabase, adminUser, body);
  if (action === "revenue_update") return handleRevenueUpdate(supabase, adminUser, body);
  if (action === "content_upsert") return handleContentUpsert(supabase, adminUser, body);
  if (action === "race_edit") return handleRaceEdit(supabase, adminUser, body);
  if (action === "broken_link_update") return handleBrokenLinkUpdate(supabase, adminUser, body);
  if (action === "wire_moderation") return handleWireModeration(supabase, adminUser, body);
  if (action === "data_health") return handleDataHealthAction(supabase, adminUser, body);

  return jsonError("Unsupported admin action.", 400);
}
