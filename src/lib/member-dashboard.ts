import type { SupabaseClient } from "@supabase/supabase-js";

export type DashboardDigestPreferences = {
  weekly_digest: boolean;
  daily_digest: boolean;
  breaking_alerts: boolean;
  watched_official_updates: boolean;
  watched_race_updates: boolean;
  source_review_updates: boolean;
  contribution_updates: boolean;
  package_updates: boolean;
  email: string | null;
};

export type DashboardWatchlist = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  item_count: number;
  alert_count: number;
  last_alert_at: string | null;
  last_digest_at: string | null;
  updated_at: string | null;
};

export type DashboardWatchItem = {
  id: string;
  watchlist_id: string;
  entity_type: string;
  label: string;
  href: string | null;
  jurisdiction: string | null;
  updated_at: string | null;
};

export type DashboardRecentChange = {
  id: string;
  title: string;
  summary: string;
  href: string | null;
  label: string;
  status: string;
  created_at: string | null;
};

export type DashboardSubmission = {
  id: string;
  form_key: string;
  title: string;
  target: string | null;
  jurisdiction: string | null;
  status: string;
  priority: string;
  created_at: string | null;
  updated_at: string | null;
};

export type DashboardSavedSearch = {
  id: string;
  query: string;
  name: string | null;
  scope: string | null;
  alert_enabled: boolean;
  updated_at: string | null;
};

export type DashboardContributorProfile = {
  id: string;
  handle: string | null;
  display_name: string | null;
  public_profile_enabled: boolean;
  contribution_score: number;
  accepted_sources_count: number;
  rejected_sources_count: number;
  correction_count: number;
  packet_count: number;
  watchlist_count: number;
  badges: string[];
};

export type MemberDashboardSnapshot = {
  ok: boolean;
  missingTables: string[];
  watchlists: DashboardWatchlist[];
  watchedItems: DashboardWatchItem[];
  recentChanges: DashboardRecentChange[];
  submissions: DashboardSubmission[];
  sourcePackets: DashboardSubmission[];
  recordsRequests: DashboardSubmission[];
  correctionRequests: DashboardSubmission[];
  savedSearches: DashboardSavedSearch[];
  contributorProfile: DashboardContributorProfile | null;
  digestPreferences: DashboardDigestPreferences;
};

type QueryResult<T> = {
  data: T[];
  error: string | null;
};

export const defaultDigestPreferences: DashboardDigestPreferences = {
  weekly_digest: true,
  daily_digest: false,
  breaking_alerts: false,
  watched_official_updates: true,
  watched_race_updates: true,
  source_review_updates: true,
  contribution_updates: true,
  package_updates: false,
  email: null,
};

function isMissingTableError(message: string) {
  return /does not exist|schema cache|relation .* not found|could not find the table/i.test(message);
}

async function safeRows<T>(
  label: string,
  query: PromiseLike<{ data: T[] | null; error: { message?: string } | null }>,
): Promise<QueryResult<T>> {
  try {
    const result = await query;
    if (result.error) {
      return { data: [], error: `${label}: ${result.error.message ?? "query failed"}` };
    }
    return { data: result.data ?? [], error: null };
  } catch (error) {
    return { data: [], error: `${label}: ${error instanceof Error ? error.message : "query failed"}` };
  }
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : Number(value ?? 0) || 0;
}

function payloadRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function titleForSubmission(formKey: string, payload: Record<string, unknown>, normalized: Record<string, unknown>) {
  return (
    textValue(payload.title) ||
    textValue(payload.serviceName) ||
    textValue(payload.target) ||
    textValue(payload.officialName) ||
    textValue(payload.agencyName) ||
    textValue(normalized.target) ||
    formKey.replace(/_/g, " ")
  );
}

function mapSubmission(row: Record<string, unknown>): DashboardSubmission {
  const payload = payloadRecord(row.payload);
  const normalized = payloadRecord(row.normalized_payload);
  const formKey = textValue(row.form_key, "unknown");
  return {
    id: textValue(row.id),
    form_key: formKey,
    title: titleForSubmission(formKey, payload, normalized),
    target: stringOrNull(payload.target) ?? stringOrNull(payload.officialName) ?? stringOrNull(payload.agencyName) ?? stringOrNull(normalized.target),
    jurisdiction: stringOrNull(payload.jurisdiction) ?? stringOrNull(normalized.jurisdiction),
    status: textValue(row.status, "new"),
    priority: textValue(row.priority, "normal"),
    created_at: stringOrNull(row.created_at),
    updated_at: stringOrNull(row.updated_at),
  };
}

function mapDigestPreferences(row: Record<string, unknown> | null | undefined): DashboardDigestPreferences {
  if (!row) return defaultDigestPreferences;
  return {
    weekly_digest: row.weekly_digest !== false,
    daily_digest: row.daily_digest === true,
    breaking_alerts: row.breaking_alerts === true,
    watched_official_updates: row.watched_official_updates !== false,
    watched_race_updates: row.watched_race_updates !== false,
    source_review_updates: row.source_review_updates !== false,
    contribution_updates: row.contribution_updates !== false,
    package_updates: row.package_updates === true,
    email: stringOrNull(row.email),
  };
}

function mapContributorProfile(row: Record<string, unknown> | null | undefined, watchlistCount: number): DashboardContributorProfile | null {
  if (!row) return null;
  const metadata = payloadRecord(row.metadata);
  const badgeList = Array.isArray(row.badges)
    ? row.badges.filter((badge): badge is string => typeof badge === "string")
    : Array.isArray(metadata.badges)
      ? metadata.badges.filter((badge): badge is string => typeof badge === "string")
      : [];

  return {
    id: textValue(row.id),
    handle: stringOrNull(row.handle),
    display_name: stringOrNull(row.display_name),
    public_profile_enabled: row.public_profile_enabled === true,
    contribution_score: numberValue(row.contribution_score ?? row.total_xp),
    accepted_sources_count: numberValue(row.accepted_sources_count),
    rejected_sources_count: numberValue(row.rejected_sources_count ?? row.rejected_count),
    correction_count: numberValue(row.correction_count),
    packet_count: numberValue(row.packet_count),
    watchlist_count: numberValue(row.watchlist_count) || watchlistCount,
    badges: badgeList,
  };
}

export async function loadMemberDashboardSnapshot(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberDashboardSnapshot> {
  const [
    watchlistsResult,
    itemsResult,
    alertsResult,
    submissionsResult,
    savedSearchesResult,
    contributorResult,
    digestResult,
  ] = await Promise.all([
    safeRows<Record<string, unknown>>(
      "member_watchlists",
      supabase
        .from("member_watchlists")
        .select("id, name, description, color, last_alert_at, last_digest_at, updated_at")
        .eq("user_id", userId)
        .is("archived_at", null)
        .order("updated_at", { ascending: false })
        .limit(20),
    ),
    safeRows<Record<string, unknown>>(
      "member_watchlist_items",
      supabase
        .from("member_watchlist_items")
        .select("id, watchlist_id, entity_type, label, href, jurisdiction, updated_at")
        .eq("user_id", userId)
        .eq("active", true)
        .order("updated_at", { ascending: false })
        .limit(80),
    ),
    safeRows<Record<string, unknown>>(
      "member_watchlist_alert_events",
      supabase
        .from("member_watchlist_alert_events")
        .select("id, watchlist_id, alert_type, title, summary, href, severity, status, triggered_at")
        .eq("user_id", userId)
        .neq("status", "dismissed")
        .order("triggered_at", { ascending: false })
        .limit(20),
    ),
    safeRows<Record<string, unknown>>(
      "form_submissions",
      supabase
        .from("form_submissions")
        .select("id, form_key, status, priority, payload, normalized_payload, created_at, updated_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(40),
    ),
    safeRows<Record<string, unknown>>(
      "saved_searches",
      supabase
        .from("saved_searches")
        .select("id, query, name, title, scope, alert_enabled, updated_at, created_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(20),
    ),
    safeRows<Record<string, unknown>>(
      "contributor_profiles",
      supabase
        .from("contributor_profiles")
        .select("*")
        .eq("user_id", userId)
        .limit(1),
    ),
    safeRows<Record<string, unknown>>(
      "notification_preferences",
      supabase
        .from("notification_preferences")
        .select("weekly_digest, daily_digest, breaking_alerts, watched_official_updates, watched_race_updates, source_review_updates, contribution_updates, package_updates, email")
        .eq("user_id", userId)
        .limit(1),
    ),
  ]);

  const missingTables = [
    watchlistsResult,
    itemsResult,
    alertsResult,
    submissionsResult,
    savedSearchesResult,
    contributorResult,
    digestResult,
  ]
    .map((result) => result.error)
    .filter((error): error is string => Boolean(error) && isMissingTableError(error));

  const items = itemsResult.data.map((item) => ({
    id: textValue(item.id),
    watchlist_id: textValue(item.watchlist_id),
    entity_type: textValue(item.entity_type, "record"),
    label: textValue(item.label, "Watched record"),
    href: stringOrNull(item.href),
    jurisdiction: stringOrNull(item.jurisdiction),
    updated_at: stringOrNull(item.updated_at),
  }));

  const watchlists = watchlistsResult.data.map((watchlist) => {
    const id = textValue(watchlist.id);
    return {
      id,
      name: textValue(watchlist.name, "Untitled watchlist"),
      description: stringOrNull(watchlist.description),
      color: textValue(watchlist.color, "blue"),
      item_count: items.filter((item) => item.watchlist_id === id).length,
      alert_count: alertsResult.data.filter((alert) => textValue(alert.watchlist_id) === id && textValue(alert.status) === "unread").length,
      last_alert_at: stringOrNull(watchlist.last_alert_at),
      last_digest_at: stringOrNull(watchlist.last_digest_at),
      updated_at: stringOrNull(watchlist.updated_at),
    };
  });

  const submissions = submissionsResult.data.map(mapSubmission);

  const recentChanges = alertsResult.data.map((alert) => ({
    id: textValue(alert.id),
    title: textValue(alert.title, "Watchlist update"),
    summary: textValue(alert.summary, "A watched record changed."),
    href: stringOrNull(alert.href),
    label: textValue(alert.alert_type, "watchlist").replace(/_/g, " "),
    status: textValue(alert.status, "unread"),
    created_at: stringOrNull(alert.triggered_at),
  }));

  return {
    ok: true,
    missingTables,
    watchlists,
    watchedItems: items,
    recentChanges,
    submissions,
    sourcePackets: submissions.filter((submission) => submission.form_key === "free_packet"),
    recordsRequests: submissions.filter((submission) => submission.form_key === "public_records_request"),
    correctionRequests: submissions.filter((submission) => submission.form_key === "correction_request"),
    savedSearches: savedSearchesResult.data.map((search) => ({
      id: textValue(search.id),
      query: textValue(search.query),
      name: stringOrNull(search.name) ?? stringOrNull(search.title),
      scope: stringOrNull(search.scope),
      alert_enabled: search.alert_enabled === true,
      updated_at: stringOrNull(search.updated_at) ?? stringOrNull(search.created_at),
    })),
    contributorProfile: mapContributorProfile(contributorResult.data[0], watchlists.length),
    digestPreferences: mapDigestPreferences(digestResult.data[0]),
  };
}
