import { createHash, randomBytes } from "crypto";
import { isFeatureEnabled } from "@/lib/feature-flags";
import {
  API_ACCESS_STATUSES,
  PUBLIC_API_ENDPOINTS,
  PUBLIC_API_SCOPES,
  type ApiAccessStatus,
  type PublicApiScope,
} from "@/lib/public-data-api-config";
import { cleanEmail, cleanLongText, cleanText } from "@/lib/source-submissions";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export { PUBLIC_API_DISABLED_MESSAGE, PUBLIC_API_ENDPOINTS } from "@/lib/public-data-api-config";

export type ApiAccessRequestInput = {
  anonymousId?: unknown;
  email?: unknown;
  name?: unknown;
  organization?: unknown;
  useCase?: unknown;
  requestedScope?: unknown;
  jurisdictionFocus?: unknown;
};

export type NormalizedApiAccessRequest = {
  anonymousId: string;
  email: string;
  name: string;
  organization: string;
  useCase: string;
  requestedScope: string;
  jurisdictionFocus: string;
};

export type ApiAccessRequestRow = {
  id: string;
  anonymous_id: string | null;
  user_id: string | null;
  email: string;
  name: string | null;
  organization: string | null;
  use_case: string | null;
  requested_scope: string | null;
  jurisdiction_focus: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type ApiKeyRow = {
  id: string;
  user_id: string | null;
  organization_name: string | null;
  key_hash?: string | null;
  key_prefix: string;
  label: string | null;
  status: string;
  scopes: string[] | null;
  rate_limit_per_day: number;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
};

export type ApiUsageEventRow = {
  id: string;
  api_key_id: string | null;
  user_id: string | null;
  endpoint: string;
  method: string;
  status_code: number | null;
  records_returned: number;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DataExportRow = {
  id: string;
  user_id: string | null;
  export_type: string;
  status: string;
  filters: Record<string, unknown>;
  file_path: string | null;
  row_count: number | null;
  created_at: string;
  completed_at: string | null;
  expires_at: string | null;
};

export function normalizeApiAccessRequest(input: ApiAccessRequestInput): NormalizedApiAccessRequest {
  return {
    anonymousId: cleanText(input.anonymousId, 120),
    email: cleanEmail(input.email),
    name: cleanText(input.name, 255),
    organization: cleanText(input.organization, 255),
    useCase: cleanLongText(input.useCase, 3000),
    requestedScope: cleanText(input.requestedScope, 500),
    jurisdictionFocus: cleanText(input.jurisdictionFocus, 500),
  };
}

export function validateApiAccessRequest(input: NormalizedApiAccessRequest) {
  if (!input.email) return "Add a valid email address.";
  if (!input.organization && !input.name) return "Add your name or organization.";
  if (!input.useCase) return "Tell us how you want to use RepWatchr public data.";
  return "";
}

export function normalizeApiAccessStatus(value: unknown): ApiAccessStatus {
  const normalized = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return API_ACCESS_STATUSES.includes(normalized as ApiAccessStatus) ? (normalized as ApiAccessStatus) : "new";
}

export function normalizeApiScopes(value: unknown): PublicApiScope[] {
  const source = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return Array.from(
    new Set(
      source
        .map((item) => cleanText(item, 120))
        .filter((item): item is PublicApiScope => PUBLIC_API_SCOPES.includes(item as PublicApiScope) && item !== "admin_internal"),
    ),
  );
}

export function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function createPlaintextApiKey() {
  return `rw_${randomBytes(24).toString("base64url")}`;
}

export function getApiKeyPrefix(apiKey: string) {
  return apiKey.slice(0, 12);
}

export function extractApiKey(request: Request) {
  const direct = request.headers.get("x-repwatchr-api-key") || request.headers.get("x-api-key");
  if (direct) return direct.trim();
  const authorization = request.headers.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

export function scopeForEndpoint(pathname: string): PublicApiScope {
  if (pathname.includes("/jurisdictions")) return "public_jurisdictions_read";
  if (pathname.includes("/races")) return "public_races_read";
  if (pathname.includes("/sources")) return "public_sources_read";
  if (pathname.includes("/stories")) return "public_stories_read";
  if (pathname.includes("/aggregate-trends")) return "aggregate_trends_read";
  if (pathname.includes("/search")) return "public_profiles_read";
  return "public_profiles_read";
}

export async function recordApiUsageEvent(input: {
  apiKeyId?: string | null;
  userId?: string | null;
  endpoint: string;
  method: string;
  statusCode?: number | null;
  recordsReturned?: number;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { skipped: true };
  const { error } = await supabase.from("api_usage_events").insert({
    api_key_id: input.apiKeyId ?? null,
    user_id: input.userId ?? null,
    endpoint: cleanText(input.endpoint, 500),
    method: cleanText(input.method, 20).toUpperCase(),
    status_code: input.statusCode ?? null,
    records_returned: input.recordsReturned ?? 0,
    metadata: input.metadata ?? {},
  });
  return { skipped: Boolean(error), error: error?.message };
}

export async function getPublicApiAuthState(request: Request) {
  const enabled = await isFeatureEnabled("ENABLE_PUBLIC_API");
  const endpoint = new URL(request.url).pathname;
  const requiredScope = scopeForEndpoint(endpoint);

  if (!enabled) {
    await recordApiUsageEvent({
      endpoint,
      method: request.method,
      statusCode: 503,
      metadata: { disabled: true, required_scope: requiredScope },
    });
    return { enabled: false as const, endpoint, requiredScope };
  }

  const apiKey = extractApiKey(request);
  if (!apiKey) {
    await recordApiUsageEvent({
      endpoint,
      method: request.method,
      statusCode: 401,
      metadata: { missing_api_key: true, required_scope: requiredScope },
    });
    return { enabled: true as const, authorized: false as const, status: 401, error: "API key required.", endpoint, requiredScope };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { enabled: true as const, authorized: false as const, status: 503, error: "Public API key store is unavailable.", endpoint, requiredScope };
  }

  const { data: keyRow, error } = await supabase
    .from("api_keys")
    .select("*")
    .eq("key_hash", hashApiKey(apiKey))
    .eq("status", "active")
    .maybeSingle();

  if (error || !keyRow) {
    await recordApiUsageEvent({
      endpoint,
      method: request.method,
      statusCode: 403,
      metadata: { invalid_api_key: true, required_scope: requiredScope },
    });
    return { enabled: true as const, authorized: false as const, status: 403, error: "API key is not valid for this request.", endpoint, requiredScope };
  }

  const typedKey = keyRow as ApiKeyRow;
  const keyScopes = Array.isArray(typedKey.scopes) ? typedKey.scopes : [];
  if (!keyScopes.includes(requiredScope)) {
    await recordApiUsageEvent({
      apiKeyId: typedKey.id,
      userId: typedKey.user_id,
      endpoint,
      method: request.method,
      statusCode: 403,
      metadata: { missing_scope: requiredScope, key_prefix: typedKey.key_prefix },
    });
    return { enabled: true as const, authorized: false as const, status: 403, error: `API key is missing scope: ${requiredScope}.`, endpoint, requiredScope };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("api_usage_events")
    .select("id", { count: "exact", head: true })
    .eq("api_key_id", typedKey.id)
    .gte("created_at", since);

  if ((count ?? 0) >= typedKey.rate_limit_per_day) {
    await recordApiUsageEvent({
      apiKeyId: typedKey.id,
      userId: typedKey.user_id,
      endpoint,
      method: request.method,
      statusCode: 429,
      metadata: { rate_limited: true, key_prefix: typedKey.key_prefix },
    });
    return { enabled: true as const, authorized: false as const, status: 429, error: "API key daily rate limit reached.", endpoint, requiredScope };
  }

  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", typedKey.id);
  return { enabled: true as const, authorized: true as const, apiKey: typedKey, endpoint, requiredScope };
}

async function countRows(table: string, filters: Record<string, string> = {}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return 0;
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { count } = await query;
  return count ?? 0;
}

export async function getPublicDataApiAdminData() {
  const supabase = getSupabaseAdminClient();
  const enabled = await isFeatureEnabled("ENABLE_PUBLIC_API");
  const errors: string[] = [];

  if (!supabase) {
    return {
      enabled,
      endpoints: PUBLIC_API_ENDPOINTS,
      scopes: PUBLIC_API_SCOPES,
      accessRequests: [] as ApiAccessRequestRow[],
      apiKeys: [] as ApiKeyRow[],
      usageEvents: [] as ApiUsageEventRow[],
      dataExports: [] as DataExportRow[],
      stats: { accessRequests: 0, newRequests: 0, activeKeys: 0, usageEvents: 0, pendingExports: 0 },
      errors: ["Supabase admin client is not configured."],
    };
  }

  const [requestsResponse, keysResponse, usageResponse, exportsResponse] = await Promise.all([
    supabase.from("api_access_requests").select("*").order("created_at", { ascending: false }).limit(300),
    supabase
      .from("api_keys")
      .select("id,user_id,organization_name,key_prefix,label,status,scopes,rate_limit_per_day,created_at,last_used_at,revoked_at")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("api_usage_events").select("*").order("created_at", { ascending: false }).limit(300),
    supabase.from("data_exports").select("*").order("created_at", { ascending: false }).limit(200),
  ]);

  if (requestsResponse.error) errors.push(`api_access_requests: ${requestsResponse.error.message}`);
  if (keysResponse.error) errors.push(`api_keys: ${keysResponse.error.message}`);
  if (usageResponse.error) errors.push(`api_usage_events: ${usageResponse.error.message}`);
  if (exportsResponse.error) errors.push(`data_exports: ${exportsResponse.error.message}`);

  const [accessRequests, newRequests, activeKeys, usageEvents, pendingExports] = await Promise.all([
    countRows("api_access_requests"),
    countRows("api_access_requests", { status: "new" }),
    countRows("api_keys", { status: "active" }),
    countRows("api_usage_events"),
    countRows("data_exports", { status: "pending" }),
  ]);

  return {
    enabled,
    endpoints: PUBLIC_API_ENDPOINTS,
    scopes: PUBLIC_API_SCOPES,
    accessRequests: (requestsResponse.data ?? []) as ApiAccessRequestRow[],
    apiKeys: (keysResponse.data ?? []) as ApiKeyRow[],
    usageEvents: (usageResponse.data ?? []) as ApiUsageEventRow[],
    dataExports: (exportsResponse.data ?? []) as DataExportRow[],
    stats: { accessRequests, newRequests, activeKeys, usageEvents, pendingExports },
    errors,
  };
}

export type PublicDataApiAdminData = Awaited<ReturnType<typeof getPublicDataApiAdminData>>;
