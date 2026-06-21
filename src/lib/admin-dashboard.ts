import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  getAllBills,
  getAllNews,
  getAllOfficials,
  getAllScoreCards,
  getFundingSummary,
  getNewsReviewDrafts,
  getOfficialById,
  getPublicVoteRecord,
  getRedFlags,
  getRepWatchrDataStats,
} from "@/lib/data";
import { getSchoolBoardCompletionReport, getSchoolBoardStats } from "@/lib/school-board-research";
import { getOfficialCompletionDashboard } from "@/lib/profile-completion";
import { getDailyWireReviewQueue } from "@/lib/daily-wire";
import { buildDataHealthChecks } from "@/lib/data-health";

type AdminTableStatus = "ok" | "error" | "not_configured";
type SupabaseAdmin = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;
type QueryError = { message: string };
type CountQuery = PromiseLike<{ count: number | null; error: QueryError | null }> & {
  in: (column: string, values: string[]) => CountQuery;
  eq: (column: string, value: string | number | boolean) => CountQuery;
};
type RowQuery<T> = PromiseLike<{ data: T[] | null; error: QueryError | null }> & {
  in: (column: string, values: string[]) => RowQuery<T>;
  eq: (column: string, value: string | number | boolean) => RowQuery<T>;
  order: (column: string, options: { ascending?: boolean; nullsFirst?: boolean }) => RowQuery<T>;
  limit: (count: number) => RowQuery<T>;
};
type QueryOptions = {
  inFilter?: {
    column: string;
    values: string[];
  };
  eqFilter?: {
    column: string;
    value: string | number | boolean;
  };
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
};

export type AdminMetric = {
  label: string;
  value: string | number;
  detail: string;
  status?: "good" | "warn" | "bad";
};

export type AdminSourceSubmissionRow = {
  id: string;
  targetName: string;
  targetType: string;
  targetProfileId: string;
  targetPageUrl: string;
  jurisdiction: string;
  sourceUrl: string;
  sourceType: string;
  sourceTitle: string;
  submitterEmail: string;
  claimSummary: string;
  checkRequest: string;
  publicFlag: boolean;
  status: string;
  createdAt: string;
};

export type AdminProfileManagerRow = {
  id: string;
  name: string;
  position: string;
  jurisdiction: string;
  state: string;
  party: string;
  href: string;
  reviewStatus: string;
  missingData: string[];
  sourceCount: number;
  scoreStatus: string;
};

export type AdminRevenueRow = {
  id: string;
  label: string;
  type: "order" | "subscription" | "service_request";
  status: string;
  customerEmail: string;
  serviceName: string;
  amountLabel: string;
  createdAt: string;
};

export type AdminPublicRecordRequestRow = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  state: string;
  agency: string;
  jurisdiction: string;
  recordType: string;
  dateRange: string;
  namesOffices: string;
  meetingEvent: string;
  deliveryMethod: string;
  status: string;
  createdAt: string;
};

export type AdminContentRow = {
  id: string;
  type: "story_draft" | "daily_watch" | "news_review";
  title: string;
  status: string;
  sourceUrl: string;
  officialIds: string[];
  shareSnippet: string;
  createdAt: string;
};

export type AdminDailyWireRow = {
  id: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  sourceDomain: string;
  status: string;
  publicStatus: string;
  qualityScore: number;
  duplicateScore: number;
  jurisdictionMatch: string;
  geographicRelevance: string;
  quarantineStatus: string;
  publicLabels: string[];
  reviewReasons: string[];
  topicTags: string[];
  powerChannels: string[];
  sourceWatchId: string;
  queryLane: string;
  publishedAt: string;
};

export type AdminRankedPath = {
  path: string;
  count: number;
  label: string;
};

export type AdminBrokenLinkRow = {
  id: string;
  url: string;
  context: string;
  profileId: string;
  status: string;
  httpStatus: string;
  lastCheckedAt: string;
};

export type AdminDataQualityIssueRow = {
  id: string;
  issueType: string;
  entityType: string;
  entityId: string;
  severity: string;
  title: string;
  detail: string;
  sourceUrl: string;
  status: string;
  createdAt: string;
};

export type AdminDuplicateCandidateRow = {
  id: string;
  entityType: string;
  primaryEntityId: string;
  duplicateEntityId: string;
  confidenceScore: number;
  reason: string;
  status: string;
  createdAt: string;
};

export type AdminImportErrorRow = {
  id: string;
  provider: string;
  severity: string;
  message: string;
  sourceUrl: string;
  status: string;
  createdAt: string;
};

export type AdminDataHealth = {
  imports: AdminMetric[];
  cron: AdminMetric[];
  duplicateProfiles: AdminMetric;
  brokenLinks: AdminMetric;
  missingCanonicalUrls: AdminMetric;
  sitemapCounts: AdminMetric[];
};

export type AdminAnalyticsSummary = {
  topPages: AdminRankedPath[];
  topProfiles: AdminRankedPath[];
  topSearches: AdminMetric[];
  conversionFunnel: AdminMetric[];
  mostSharedRecords: AdminRankedPath[];
  mostWatchedRecords: AdminRankedPath[];
  revenueEvents: AdminMetric[];
  sourceSubmissionVolume: AdminMetric[];
  brokenFunnelPoints: AdminMetric[];
};

export type AdminAuditRow = {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  note: string;
  createdAt: string;
};

export type AdminDashboardData = {
  generatedAt: string;
  configured: boolean;
  errors: string[];
  overview: AdminMetric[];
  sourceQueue: AdminSourceSubmissionRow[];
  profileRows: AdminProfileManagerRow[];
  revenueRows: AdminRevenueRow[];
  publicRecordRequests: AdminPublicRecordRequestRow[];
  contentRows: AdminContentRow[];
  dailyWireRows: AdminDailyWireRow[];
  mostViewedProfiles: AdminRankedPath[];
  mostSharedProfiles: AdminRankedPath[];
  brokenSourceLinks: AdminBrokenLinkRow[];
  dataQualityIssues: AdminDataQualityIssueRow[];
  duplicateCandidates: AdminDuplicateCandidateRow[];
  importErrors: AdminImportErrorRow[];
  dataHealth: AdminDataHealth;
  analytics: AdminAnalyticsSummary;
  auditLog: AdminAuditRow[];
};

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function money(cents: unknown, currency: unknown) {
  const amount = num(cents, 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: text(currency, "usd").toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);
}

function dateText(value: unknown) {
  const raw = text(value);
  if (!raw) return "Not recorded";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleDateString("en-US");
}

function pathLabel(path: string) {
  const officialId = path.match(/^\/officials\/([^/?#]+)/)?.[1];
  const official = officialId ? getOfficialById(officialId) : null;
  if (official) return official.name;

  return path
    .split("/")
    .filter(Boolean)
    .slice(-1)[0]
    ?.replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase()) || path;
}

async function countRows(
  supabase: SupabaseAdmin | null,
  table: string,
  errors: string[],
  options: Pick<QueryOptions, "inFilter" | "eqFilter"> = {},
) {
  if (!supabase) return { count: 0, status: "not_configured" as AdminTableStatus };
  let query = supabase.from(table).select("*", { count: "exact", head: true }) as unknown as CountQuery;
  if (options.inFilter) query = query.in(options.inFilter.column, options.inFilter.values);
  if ("eqFilter" in options && options.eqFilter) query = query.eq(options.eqFilter.column, options.eqFilter.value);
  const { count, error } = await query;
  if (error) {
    errors.push(`${table}: ${error.message}`);
    return { count: 0, status: "error" as AdminTableStatus };
  }
  return { count: count ?? 0, status: "ok" as AdminTableStatus };
}

async function selectRows<T>(
  supabase: SupabaseAdmin | null,
  table: string,
  select: string,
  errors: string[],
  options: QueryOptions = {},
): Promise<T[]> {
  if (!supabase) return [];
  let query = supabase.from(table).select(select) as unknown as RowQuery<T>;
  if (options.inFilter) query = query.in(options.inFilter.column, options.inFilter.values);
  if (options.eqFilter) query = query.eq(options.eqFilter.column, options.eqFilter.value);
  if (options.orderBy) query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
  if (typeof options.limit === "number") query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) {
    errors.push(`${table}: ${error.message}`);
    return [];
  }
  return (data ?? []) as T[];
}

function profileHref(profile: { id: string; href?: string; level?: string }) {
  if (profile.href) return profile.href;
  return `/officials/${profile.id}`;
}

function profileMissingItems(official: ReturnType<typeof getAllOfficials>[number]) {
  const missing: string[] = [];
  if (!official.photo) missing.push("photo");
  if (!official.bio) missing.push("bio");
  if (!official.contactInfo?.website) missing.push("website");
  if ((official.sourceLinks?.length ?? 0) === 0) missing.push("sources");
  if (!getPublicVoteRecord(official.id)) missing.push("votes");
  if (!getFundingSummary(official.id)) missing.push("funding");
  if (getRedFlags(official.id).length === 0) missing.push("red-flag review");
  return missing;
}

function buildProfileManagerRows(): AdminProfileManagerRow[] {
  return getAllOfficials()
    .map((official) => {
      const missingData = profileMissingItems(official);
      return {
        id: official.id,
        name: official.name,
        position: official.position,
        jurisdiction: official.jurisdiction,
        state: official.state ?? "",
        party: official.party,
        href: profileHref(official),
        reviewStatus: official.reviewStatus ?? "missing",
        missingData,
        sourceCount: official.sourceLinks?.length ?? 0,
        scoreStatus: getAllScoreCards().some((score) => score.officialId === official.id)
          ? "scorecard loaded"
          : "missing scorecard",
      };
    })
    .sort((a, b) => b.missingData.length - a.missingData.length || a.name.localeCompare(b.name))
    .slice(0, 80);
}

function rankPaths(rows: Array<Record<string, unknown>>, pathKey = "path"): AdminRankedPath[] {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const path = text(row[pathKey]);
    if (!path || !path.startsWith("/")) return acc;
    if (!path.startsWith("/officials/") && !path.startsWith("/school-boards/")) return acc;
    acc[path] = (acc[path] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, count]) => ({
      path,
      count,
      label: pathLabel(path),
    }));
}

function rankAnyPaths(rows: Array<Record<string, unknown>>, pathKey = "path"): AdminRankedPath[] {
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    const path = text(row[pathKey] || metadataObject(row).path || row.route);
    if (!path || !path.startsWith("/")) return acc;
    if (path.startsWith("/api") || path.startsWith("/admin") || path.startsWith("/dashboard") || path.startsWith("/auth")) return acc;
    acc[path] = (acc[path] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({
      path,
      count,
      label: pathLabel(path),
    }));
}

function metadataObject(row: Record<string, unknown>) {
  return row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};
}

function countEvents(rows: Array<Record<string, unknown>>, eventName: string) {
  return rows.filter((row) => text(row.event_name) === eventName).length;
}

function rankSearches(rows: Array<Record<string, unknown>>): AdminMetric[] {
  const counts = rows
    .filter((row) => text(row.event_name) === "official_search")
    .reduce<Record<string, number>>((acc, row) => {
      const query = text(metadataObject(row).query, "Unknown search").slice(0, 80);
      acc[query] = (acc[query] ?? 0) + 1;
      return acc;
    }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({
      label,
      value,
      detail: "Official search query.",
      status: "good",
    }));
}

function buildAnalyticsSummary({
  pageViews,
  shareEvents,
  analyticsEvents,
  paymentEvents,
  submissionCount,
  serviceRequestCount,
}: {
  pageViews: Array<Record<string, unknown>>;
  shareEvents: Array<Record<string, unknown>>;
  analyticsEvents: Array<Record<string, unknown>>;
  paymentEvents: Array<Record<string, unknown>>;
  submissionCount: number;
  serviceRequestCount: number;
}): AdminAnalyticsSummary {
  const checkoutStarted = countEvents(analyticsEvents, "checkout_started");
  const checkoutCompleted = countEvents(analyticsEvents, "checkout_completed");
  const sourceStarted = countEvents(analyticsEvents, "source_submit_started");
  const sourceCompleted = countEvents(analyticsEvents, "source_submit_completed");
  const freePacketStarted = countEvents(analyticsEvents, "free_packet_started");
  const freePacketCompleted = countEvents(analyticsEvents, "free_packet_completed");
  const signupStarted = countEvents(analyticsEvents, "signup_started");
  const signupCompleted = countEvents(analyticsEvents, "signup_completed");

  const watchedRows = analyticsEvents.filter((row) =>
    ["profile_watch_clicked", "watchlist_add"].includes(text(row.event_name)),
  );
  const revenueCounts = paymentEvents.reduce<Record<string, number>>((acc, row) => {
    const key = text(row.event_name, "unknown_payment_event");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    topPages: rankAnyPaths(pageViews),
    topProfiles: rankPaths(analyticsEvents, "route"),
    topSearches: rankSearches(analyticsEvents),
    conversionFunnel: [
      {
        label: "Signup started",
        value: signupStarted,
        detail: "Client signup starts captured in product analytics.",
        status: signupStarted ? "good" : "warn",
      },
      {
        label: "Signup completed",
        value: signupCompleted,
        detail: "Supabase signup completions captured after successful auth response.",
        status: signupCompleted ? "good" : "warn",
      },
      {
        label: "Free packet started",
        value: freePacketStarted,
        detail: "Free packet funnel starts.",
        status: freePacketStarted ? "good" : "warn",
      },
      {
        label: "Free packet completed",
        value: freePacketCompleted,
        detail: "Free packet saves to the source queue.",
        status: freePacketCompleted ? "good" : "warn",
      },
      {
        label: "Checkout started",
        value: checkoutStarted,
        detail: "Stripe checkout starts.",
        status: checkoutStarted ? "good" : "warn",
      },
      {
        label: "Checkout completed",
        value: checkoutCompleted,
        detail: "Checkout completions from success page/webhook analytics.",
        status: checkoutCompleted ? "good" : "warn",
      },
    ],
    mostSharedRecords: rankPaths(shareEvents),
    mostWatchedRecords: rankAnyPaths(watchedRows, "route"),
    revenueEvents: Object.entries(revenueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([label, value]) => ({
        label: label.replaceAll("_", " "),
        value,
        detail: "Payment/client revenue event.",
        status: "good",
      })),
    sourceSubmissionVolume: [
      {
        label: "Total source submissions",
        value: submissionCount,
        detail: "Current source_submissions count.",
        status: submissionCount ? "good" : "warn",
      },
      {
        label: "Service requests",
        value: serviceRequestCount,
        detail: "Fallback and fulfillment requests.",
        status: serviceRequestCount ? "good" : "warn",
      },
    ],
    brokenFunnelPoints: [
      {
        label: "Signup starts without completion",
        value: Math.max(signupStarted - signupCompleted, 0),
        detail: "Investigate auth/email friction if this grows.",
        status: signupStarted > signupCompleted ? "warn" : "good",
      },
      {
        label: "Free packet starts without completion",
        value: Math.max(freePacketStarted - freePacketCompleted, 0),
        detail: "Investigate packet form validation or source queue errors if this grows.",
        status: freePacketStarted > freePacketCompleted ? "warn" : "good",
      },
      {
        label: "Source starts without completion",
        value: Math.max(sourceStarted - sourceCompleted, 0),
        detail: "Investigate source form validation or Supabase errors if this grows.",
        status: sourceStarted > sourceCompleted ? "warn" : "good",
      },
      {
        label: "Checkout starts without completion",
        value: Math.max(checkoutStarted - checkoutCompleted, 0),
        detail: "Investigate Stripe configuration, cancel page visits, and failed payments if this grows.",
        status: checkoutStarted > checkoutCompleted ? "warn" : "good",
      },
    ],
  };
}

function duplicateProfileMetric(): AdminMetric {
  const names = getAllOfficials().reduce<Record<string, number>>((acc, official) => {
    const key = `${official.name.toLowerCase()}|${official.position.toLowerCase()}|${official.jurisdiction.toLowerCase()}`;
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const duplicates = Object.values(names).filter((count) => count > 1).length;
  return {
    label: "Duplicate profile groups",
    value: duplicates,
    detail: duplicates ? "Review same-name/same-office rows before publishing broad imports." : "No obvious exact duplicate groups found.",
    status: duplicates ? "warn" : "good",
  };
}

function missingCanonicalMetric(): AdminMetric {
  const missing = getAllOfficials().filter((official) => !official.contactInfo?.website && (official.sourceLinks?.length ?? 0) === 0).length;
  return {
    label: "Missing canonical URLs",
    value: missing,
    detail: "Profiles with neither official website nor public source links.",
    status: missing > 0 ? "warn" : "good",
  };
}

function staticBrokenSourceMetric(): AdminMetric {
  const schoolCompletion = getSchoolBoardCompletionReport();
  return {
    label: "Broken/empty source links",
    value: schoolCompletion.totalBrokenSources,
    detail: "Static school-board source gaps detected from the local completion report.",
    status: schoolCompletion.totalBrokenSources > 0 ? "warn" : "good",
  };
}

function contentReviewRows(): AdminContentRow[] {
  return getNewsReviewDrafts().slice(0, 10).map((article) => ({
    id: article.id,
    type: "news_review",
    title: article.title,
    status: article.sourceStatus ?? "needs_source_review",
    sourceUrl: article.sourceUrl ?? "",
    officialIds: article.officialIds,
    shareSnippet: `${article.title}\n\n${article.summary}\n\nhttps://www.repwatchr.com/news/${article.id}`,
    createdAt: article.publishedAt,
  }));
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseAdminClient();
  const errors: string[] = [];
  const dataStats = getRepWatchrDataStats();
  const schoolStats = getSchoolBoardStats();
  const officialCompletion = getOfficialCompletionDashboard();

  const [
    profileCount,
    memberProfileCount,
    submissionCount,
    pendingSubmissionCount,
    orderCount,
    activeSubscriptionCount,
    serviceRequestCount,
    sharedPublicRecordRequestCount,
    sourceQueueRows,
    publicRecordRequestRows,
    orders,
    subscriptions,
    serviceRequests,
    pageViews,
    shareEvents,
    analyticsEvents,
    paymentEvents,
    brokenLinks,
    adminContentItems,
    importRuns,
    operationalImportRuns,
    importErrorRows,
    dataQualityIssueRows,
    duplicateCandidateRows,
    auditLog,
  ] = await Promise.all([
    countRows(supabase, "profiles", errors),
    countRows(supabase, "member_profiles", errors),
    countRows(supabase, "source_submissions", errors),
    countRows(supabase, "source_submissions", errors, {
      inFilter: { column: "status", values: ["new", "needs_review", "needs_more_info"] },
    }),
    countRows(supabase, "orders", errors),
    countRows(supabase, "subscriptions", errors, {
      inFilter: { column: "status", values: ["active", "trialing"] },
    }),
    countRows(supabase, "service_requests", errors),
    countRows(supabase, "member_public_record_requests", errors, {
      eqFilter: { column: "share_with_repwatchr", value: true },
    }),
    selectRows<Record<string, unknown>>(
      supabase,
      "source_submissions",
      "id, submitter_name, submitter_email, target_name, target_type, target_profile_id, target_page_url, jurisdiction, source_url, source_type, source_title, claim_summary, check_request, public_flag, status, created_at",
      errors,
      {
        inFilter: { column: "status", values: ["new", "needs_review", "needs_more_info"] },
        orderBy: { column: "created_at", ascending: true },
        limit: 16,
      },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "member_public_record_requests",
      "id, requester_name, requester_email, state, agency, jurisdiction, record_type, date_range, names_offices, meeting_event, preferred_delivery_method, status, created_at",
      errors,
      {
        eqFilter: { column: "share_with_repwatchr", value: true },
        orderBy: { column: "created_at", ascending: false },
        limit: 18,
      },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "orders",
      "id, service_name, service_slug, status, amount_cents, currency, stripe_customer_id, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 12 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "subscriptions",
      "id, service_name, service_slug, status, stripe_customer_id, current_period_end, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 12 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "service_requests",
      "id, service_name, service_slug, requester_email, status, target, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 12 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "site_page_views",
      "path, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 1000 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "site_share_events",
      "path, channel, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 1000 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "site_analytics_events",
      "event_name, route, referrer, metadata, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 1000 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "payment_events",
      "event_name, service_slug, amount_cents, currency, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 1000 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "admin_broken_source_links",
      "id, url, source_context, profile_id, status, http_status, last_checked_at, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 12 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "admin_content_items",
      "id, content_type, title, status, source_links, official_ids, share_snippet, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 12 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "admin_import_runs",
      "id, job_name, status, inserted_count, updated_count, error_count, started_at, finished_at",
      errors,
      { orderBy: { column: "started_at", ascending: false }, limit: 8 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "import_runs",
      "id, import_type, provider, status, records_seen, records_inserted, records_updated, records_skipped, started_at, finished_at, last_success_at",
      errors,
      { orderBy: { column: "started_at", ascending: false }, limit: 12 },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "import_errors",
      "id, provider, severity, message, source_url, status, created_at",
      errors,
      {
        inFilter: { column: "status", values: ["new"] },
        orderBy: { column: "created_at", ascending: false },
        limit: 12,
      },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "data_quality_issues",
      "id, issue_type, entity_type, entity_id, severity, title, detail, source_url, status, created_at",
      errors,
      {
        inFilter: { column: "status", values: ["open", "quarantined"] },
        orderBy: { column: "created_at", ascending: false },
        limit: 12,
      },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "duplicate_candidates",
      "id, entity_type, primary_entity_id, duplicate_entity_id, confidence_score, reason, status, created_at",
      errors,
      {
        inFilter: { column: "status", values: ["open"] },
        orderBy: { column: "created_at", ascending: false },
        limit: 12,
      },
    ),
    selectRows<Record<string, unknown>>(
      supabase,
      "admin_audit_log",
      "id, admin_user_id, admin_email, action, target_type, target_id, note, created_at",
      errors,
      { orderBy: { column: "created_at", ascending: false }, limit: 25 },
    ),
  ]);
  const dailyWireResult = await getDailyWireReviewQueue(36);
  if (dailyWireResult.error) errors.push(`daily_wire: ${dailyWireResult.error}`);

  const dailyWireRows: AdminDailyWireRow[] = dailyWireResult.clips.map((clip) => ({
    id: clip.id,
    title: clip.title,
    summary: clip.summary,
    sourceUrl: clip.sourceUrl,
    sourceName: clip.sourceName,
    sourceDomain: clip.sourceDomain,
    status: clip.status,
    publicStatus: clip.publicStatus,
    qualityScore: clip.qualityScore,
    duplicateScore: clip.duplicateScore,
    jurisdictionMatch: clip.jurisdictionMatch,
    geographicRelevance: clip.geographicRelevance,
    quarantineStatus: clip.quarantineStatus,
    publicLabels: clip.publicLabels,
    reviewReasons: clip.reviewReasons,
    topicTags: clip.topicTags,
    powerChannels: clip.powerChannels,
    sourceWatchId: clip.sourceWatchId ?? "",
    queryLane: clip.queryLane ?? "",
    publishedAt: dateText(clip.publishedAt ?? clip.updatedAt),
  }));

  const revenueRows: AdminRevenueRow[] = [
    ...orders.map((row) => ({
      id: text(row.id),
      type: "order" as const,
      label: text(row.service_name, text(row.service_slug, "Order")),
      status: text(row.status, "unknown"),
      customerEmail: text(row.stripe_customer_id, "Stripe customer pending"),
      serviceName: text(row.service_name, text(row.service_slug, "Service")),
      amountLabel: money(row.amount_cents, row.currency),
      createdAt: dateText(row.created_at),
    })),
    ...subscriptions.map((row) => ({
      id: text(row.id),
      type: "subscription" as const,
      label: text(row.service_name, text(row.service_slug, "Subscription")),
      status: text(row.status, "unknown"),
      customerEmail: text(row.stripe_customer_id, "Stripe customer pending"),
      serviceName: text(row.service_name, text(row.service_slug, "Subscription")),
      amountLabel: text(row.current_period_end) ? `Renews ${dateText(row.current_period_end)}` : "Period pending",
      createdAt: dateText(row.created_at),
    })),
    ...serviceRequests.map((row) => ({
      id: text(row.id),
      type: "service_request" as const,
      label: text(row.target, text(row.service_name, "Service request")),
      status: text(row.status, "requested"),
      customerEmail: text(row.requester_email, "No email"),
      serviceName: text(row.service_name, text(row.service_slug, "Service")),
      amountLabel: "Fulfillment",
      createdAt: dateText(row.created_at),
    })),
  ].slice(0, 18);

  const contentRows: AdminContentRow[] = [
    ...adminContentItems.map((row) => {
      const sourceLinks = Array.isArray(row.source_links) ? (row.source_links as Array<Record<string, unknown>>) : [];
      const contentType: AdminContentRow["type"] = text(row.content_type, "story_draft") === "daily_watch" ? "daily_watch" : "story_draft";
      return {
        id: text(row.id),
        type: contentType,
        title: text(row.title, "Untitled content"),
        status: text(row.status, "draft"),
        sourceUrl: text(sourceLinks[0]?.url),
        officialIds: Array.isArray(row.official_ids) ? (row.official_ids as string[]) : [],
        shareSnippet: text(row.share_snippet),
        createdAt: dateText(row.created_at),
      };
    }),
    ...contentReviewRows(),
  ].slice(0, 18);

  const sourceQueue: AdminSourceSubmissionRow[] = sourceQueueRows.map((row) => ({
    id: text(row.id),
    targetName: text(row.target_name),
    targetType: text(row.target_type, "public_record"),
    targetProfileId: text(row.target_profile_id),
    targetPageUrl: text(row.target_page_url),
    jurisdiction: text(row.jurisdiction),
    sourceUrl: text(row.source_url),
    sourceType: text(row.source_type),
    sourceTitle: text(row.source_title),
    submitterEmail: text(row.submitter_email),
    claimSummary: text(row.claim_summary),
    checkRequest: text(row.check_request),
    publicFlag: Boolean(row.public_flag),
    status: text(row.status),
    createdAt: dateText(row.created_at),
  }));

  const publicRecordRequests: AdminPublicRecordRequestRow[] = publicRecordRequestRows.map((row) => ({
    id: text(row.id),
    requesterName: text(row.requester_name, "Requester not supplied"),
    requesterEmail: text(row.requester_email, "No email supplied"),
    state: text(row.state, "TX"),
    agency: text(row.agency, "Agency not supplied"),
    jurisdiction: text(row.jurisdiction),
    recordType: text(row.record_type, "Public records"),
    dateRange: text(row.date_range),
    namesOffices: text(row.names_offices),
    meetingEvent: text(row.meeting_event),
    deliveryMethod: text(row.preferred_delivery_method),
    status: text(row.status, "draft"),
    createdAt: dateText(row.created_at),
  }));

  const brokenSourceLinks: AdminBrokenLinkRow[] = brokenLinks.map((row) => ({
    id: text(row.id),
    url: text(row.url),
    context: text(row.source_context, "Source link"),
    profileId: text(row.profile_id),
    status: text(row.status, "new"),
    httpStatus: row.http_status == null ? "Not checked" : String(row.http_status),
    lastCheckedAt: dateText(row.last_checked_at || row.created_at),
  }));

  const importErrors: AdminImportErrorRow[] = importErrorRows.map((row) => ({
    id: text(row.id),
    provider: text(row.provider, "Provider pending"),
    severity: text(row.severity, "warn"),
    message: text(row.message),
    sourceUrl: text(row.source_url),
    status: text(row.status, "new"),
    createdAt: dateText(row.created_at),
  }));

  const dataQualityIssues: AdminDataQualityIssueRow[] = dataQualityIssueRows.map((row) => ({
    id: text(row.id),
    issueType: text(row.issue_type),
    entityType: text(row.entity_type),
    entityId: text(row.entity_id),
    severity: text(row.severity, "warn"),
    title: text(row.title, "Data issue"),
    detail: text(row.detail),
    sourceUrl: text(row.source_url),
    status: text(row.status, "open"),
    createdAt: dateText(row.created_at),
  }));

  const duplicateCandidates: AdminDuplicateCandidateRow[] = duplicateCandidateRows.map((row) => ({
    id: text(row.id),
    entityType: text(row.entity_type),
    primaryEntityId: text(row.primary_entity_id),
    duplicateEntityId: text(row.duplicate_entity_id),
    confidenceScore: num(row.confidence_score),
    reason: text(row.reason),
    status: text(row.status, "open"),
    createdAt: dateText(row.created_at),
  }));

  const auditRows: AdminAuditRow[] = auditLog.map((row) => ({
    id: text(row.id),
    adminEmail: text(row.admin_email, text(row.admin_user_id, "Admin")),
    action: text(row.action),
    targetType: text(row.target_type),
    targetId: text(row.target_id),
    note: text(row.note),
    createdAt: dateText(row.created_at),
  }));

  const staticHealthChecks = buildDataHealthChecks();
  const importHealthMetrics: AdminMetric[] = [
    ...staticHealthChecks.map((check) => ({
      label: check.label,
      value: check.status === "good" ? "OK" : check.status === "bad" ? "Fail" : "Review",
      detail: `${check.provider}: ${check.detail}`,
      status: check.status as AdminMetric["status"],
    })),
    ...operationalImportRuns.map((row) => ({
      label: `${text(row.provider, "Provider")} ${text(row.import_type, "import")}`,
      value: text(row.status, "unknown"),
      detail: `${num(row.records_seen)} seen, ${num(row.records_inserted)} inserted, ${num(row.records_updated)} updated, ${num(row.records_skipped)} skipped.`,
      status: (text(row.status) === "success" ? "good" : text(row.status) === "failed" ? "bad" : "warn") as AdminMetric["status"],
    })),
    ...importRuns.map((row) => ({
      label: text(row.job_name, "Legacy import run"),
      value: text(row.status, "unknown"),
      detail: `${num(row.inserted_count)} inserted, ${num(row.updated_count)} updated, ${num(row.error_count)} errors`,
      status: (num(row.error_count) ? "bad" : text(row.status) === "complete" ? "good" : "warn") as AdminMetric["status"],
    })),
  ];

  return {
    generatedAt: new Date().toISOString(),
    configured: Boolean(supabase),
    errors,
    overview: [
      {
        label: "Signups",
        value: memberProfileCount.count || profileCount.count,
        detail: `member_profiles=${memberProfileCount.count}; profiles=${profileCount.count}`,
        status: memberProfileCount.status === "ok" || profileCount.status === "ok" ? "good" : "warn",
      },
      {
        label: "Submissions",
        value: submissionCount.count,
        detail: "Public source submissions in the queue.",
        status: submissionCount.count ? "good" : "warn",
      },
      {
        label: "Pending reviews",
        value: pendingSubmissionCount.count + dailyWireRows.filter((row) => row.status === "needs_review").length,
        detail: "Source submissions plus Daily Wire rows needing review.",
        status: pendingSubmissionCount.count || dailyWireRows.some((row) => row.status === "needs_review") ? "warn" : "good",
      },
      {
        label: "Paid orders",
        value: orderCount.count,
        detail: "Stripe-backed service orders.",
        status: orderCount.status === "ok" ? "good" : "warn",
      },
      {
        label: "Active subscriptions",
        value: activeSubscriptionCount.count,
        detail: "Active or trialing subscriptions.",
        status: activeSubscriptionCount.count ? "good" : "warn",
      },
      {
        label: "Service requests",
        value: serviceRequestCount.count,
        detail: "Fallback and paid fulfillment requests.",
        status: serviceRequestCount.count ? "warn" : "good",
      },
      {
        label: "Shared records requests",
        value: sharedPublicRecordRequestCount.count,
        detail: "Member public-record requests explicitly shared with RepWatchr.",
        status: sharedPublicRecordRequestCount.count ? "warn" : "good",
      },
      {
        label: "Most-viewed profiles",
        value: rankPaths(pageViews).length,
        detail: "Pulled from site_page_views when analytics schema is applied.",
        status: pageViews.length ? "good" : "warn",
      },
      {
        label: "Broken source links",
        value: brokenSourceLinks.length || getSchoolBoardCompletionReport().totalBrokenSources,
        detail: "Live broken-link table plus static source gaps.",
        status: brokenSourceLinks.length || getSchoolBoardCompletionReport().totalBrokenSources ? "warn" : "good",
      },
    ],
    sourceQueue,
    profileRows: buildProfileManagerRows(),
    revenueRows,
    publicRecordRequests,
    contentRows,
    dailyWireRows,
    mostViewedProfiles: rankPaths(pageViews),
    mostSharedProfiles: rankPaths(shareEvents),
    brokenSourceLinks,
    dataQualityIssues,
    duplicateCandidates,
    importErrors,
    dataHealth: {
      imports: importHealthMetrics.length
        ? importHealthMetrics.slice(0, 18)
        : [
            {
              label: "Import runs",
              value: "No live rows",
              detail: "admin_import_runs is empty or not applied. Static import scripts still exist in /scripts.",
              status: "warn",
            },
          ],
      cron: [
        {
          label: "Daily update cron",
          value: process.env.CRON_SECRET ? "Secret set" : "Secret missing",
          detail: "/api/cron/daily-updates is bearer-secret gated.",
          status: process.env.CRON_SECRET ? "good" : "warn",
        },
        {
          label: "Social autopost",
          value: process.env.SOCIAL_AUTOPOST_ENABLED === "true" ? "Enabled" : "Disabled",
          detail: "Requires platform credentials and editorial approval before posting.",
          status: process.env.SOCIAL_AUTOPOST_ENABLED === "true" ? "warn" : "good",
        },
        {
          label: "Profile completion",
          value: `${officialCompletion.averageCompletionPercent}%`,
          detail: `${officialCompletion.completeProfiles}/${officialCompletion.totalProfiles} profiles complete by current rubric.`,
          status: officialCompletion.averageCompletionPercent >= 80 ? "good" : "warn",
        },
      ],
      duplicateProfiles: duplicateProfileMetric(),
      brokenLinks: staticBrokenSourceMetric(),
      missingCanonicalUrls: missingCanonicalMetric(),
      sitemapCounts: [
        {
          label: "Officials in sitemap source",
          value: getAllOfficials().length,
          detail: "Static official files available to sitemap/profile routes.",
          status: "good",
        },
        {
          label: "School boards",
          value: schoolStats.districts,
          detail: `${schoolStats.candidates} trustee/candidate profiles loaded.`,
          status: schoolStats.districts ? "good" : "warn",
        },
        {
          label: "News articles",
          value: getAllNews().length,
          detail: "Source-linked stories and review drafts in src/data/news.",
          status: "good",
        },
        {
          label: "Vote pages",
          value: getAllBills().length,
          detail: "Tracked vote pages in src/data/votes.",
          status: "good",
        },
        {
          label: "Public source URLs",
          value: dataStats.publicSourceUrls,
          detail: "Unique loaded source URLs across official/profile/story data.",
          status: dataStats.publicSourceUrls > 0 ? "good" : "warn",
        },
      ],
    },
    analytics: buildAnalyticsSummary({
      pageViews,
      shareEvents,
      analyticsEvents,
      paymentEvents,
      submissionCount: submissionCount.count,
      serviceRequestCount: serviceRequestCount.count,
    }),
    auditLog: auditRows,
  };
}
