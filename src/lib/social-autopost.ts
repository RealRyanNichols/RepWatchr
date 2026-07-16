import { fetchDailyNewsClips, persistDailyNewsClips } from "@/lib/daily-news-clips";
import { getDailyWireClips, type DailyWireClip } from "@/lib/daily-wire";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type SocialPlatform = "facebook" | "x";
type SocialPostStatus = "pending" | "posted" | "skipped" | "error";

interface SocialPostLogRow {
  id: string;
  clip_id: string;
  platform: SocialPlatform;
  status: SocialPostStatus;
}

interface PlatformPostResponse {
  platformPostId: string | null;
  payload: unknown;
}

interface SocialTokenRow {
  platform: SocialPlatform;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
}

interface XRefreshTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

export interface SocialStoryCandidate {
  clipId: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  storyUrl: string;
  publishedAt: string | null;
  score: number;
  rankFactors: string[];
}

export interface SocialPostResult {
  platform: SocialPlatform;
  status: Exclude<SocialPostStatus, "pending">;
  platformPostId?: string | null;
  error?: string;
  storyUrl: string;
}

export interface HourlySocialAutopostResult {
  ok: boolean;
  dryRun: boolean;
  enabled: boolean;
  editorialApproved: boolean;
  configuredPlatforms: SocialPlatform[];
  refreshed: {
    sourceCount: number;
    clipsFound: number;
    clipsInserted: number;
    clipsSkipped: number;
    errors: Array<{ sourceId: string; message: string }>;
  };
  candidate: SocialStoryCandidate | null;
  results: SocialPostResult[];
  skippedReason?: string;
  error?: string;
}

const SOCIAL_POST_TABLE = "repwatchr_social_posts";
const DEFAULT_HOURLY_SOURCE_LIMIT = 24;
const DEFAULT_MAX_CANDIDATE_AGE_HOURS = 72;
const CIVIC_SIGNAL_GROUPS = [
  ["election", "primary", "runoff", "ballot", "candidate", "campaign"],
  ["vote", "roll call", "bill", "hearing", "budget", "contract", "appointment"],
  ["audit", "ethics", "investigation", "court", "lawsuit", "public records", "oversight"],
  ["healthcare", "housing", "insurance", "groceries", "gasoline", "electricity", "taxes"],
  ["campaign finance", "donor", "spending", "procurement", "appropriation"],
];

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL ?? "https://www.repwatchr.com").replace(/\/+$/, "");
}

function storyUrlFor(clip: DailyWireClip) {
  return `${siteUrl()}/daily-wire#clip-${encodeURIComponent(clip.id)}`;
}

function compactWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function truncate(value: string, maxLength: number) {
  const compacted = compactWhitespace(value);
  if (compacted.length <= maxLength) return compacted;
  if (maxLength <= 3) return compacted.slice(0, maxLength);
  return `${compacted.slice(0, maxLength - 3).trimEnd()}...`;
}

function clipTime(clip: DailyWireClip) {
  const value = clip.publishedAt ?? clip.updatedAt;
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function isFreshEnough(clip: DailyWireClip, now: Date) {
  const maxAgeHours = parsePositiveInteger(process.env.SOCIAL_AUTOPOST_MAX_AGE_HOURS, DEFAULT_MAX_CANDIDATE_AGE_HOURS);
  const time = clipTime(clip);
  if (!time) return false;
  return now.getTime() - time <= maxAgeHours * 60 * 60 * 1000;
}

function attentionRank(clip: DailyWireClip, now: Date) {
  const text = `${clip.title} ${clip.summary} ${clip.matchedTerms.join(" ")} ${clip.topicTags.join(" ")}`.toLowerCase();
  const ageHours = Math.max(0, (now.getTime() - clipTime(clip)) / (60 * 60 * 1000));
  const quality = Math.round(Math.max(0, Math.min(100, clip.qualityScore)) * 0.45);
  const source = clip.sourceTier === "official_record" ? 24 : clip.sourceTier === "named_news" ? 18 : 8;
  const jurisdiction =
    clip.jurisdictionMatch === "local"
      ? 10
      : clip.jurisdictionMatch === "texas" || clip.jurisdictionMatch === "state"
        ? 8
        : clip.jurisdictionMatch === "national"
          ? 6
          : 0;
  const geography =
    clip.geographicRelevance === "local"
      ? 6
      : clip.geographicRelevance === "state"
        ? 5
        : clip.geographicRelevance === "national"
          ? 4
          : 0;
  const civicSignals = CIVIC_SIGNAL_GROUPS.filter((group) => group.some((term) => text.includes(term))).length * 5;
  const freshness = Math.max(0, 24 - Math.floor(ageHours));
  const duplicatePenalty = clip.duplicateScore >= 80 ? 20 : 0;
  const score = quality + source + jurisdiction + geography + civicSignals + freshness - duplicatePenalty;

  return {
    score,
    factors: [
      `quality:${quality}`,
      `source_strength:${source}`,
      `jurisdiction:${jurisdiction}`,
      `geography:${geography}`,
      `civic_signals:${civicSignals}`,
      `freshness:${freshness}`,
      `duplicate_penalty:-${duplicatePenalty}`,
    ],
  };
}

function attentionScore(clip: DailyWireClip, now: Date) {
  return attentionRank(clip, now).score;
}

function toCandidate(clip: DailyWireClip, now: Date): SocialStoryCandidate {
  const rank = attentionRank(clip, now);
  return {
    clipId: clip.id,
    title: clip.title,
    summary: clip.summary,
    sourceName: clip.sourceName,
    sourceUrl: clip.sourceUrl,
    storyUrl: storyUrlFor(clip),
    publishedAt: clip.publishedAt,
    score: rank.score,
    rankFactors: rank.factors,
  };
}

function isEligibleClip(clip: DailyWireClip, now: Date) {
  return (
    clip.publicStatus === "source_linked" &&
    clip.title.trim().length > 0 &&
    clip.sourceUrl.startsWith("http") &&
    isFreshEnough(clip, now)
  );
}

function sourceCreditLabel(clip: DailyWireClip) {
  const credit = clip.sourceCredit;
  if (!credit) return null;
  return credit.handle ? `${credit.name} (${credit.handle})` : credit.name;
}

function facebookMessage(clip: DailyWireClip) {
  const credit = sourceCreditLabel(clip);

  if (credit && clip.sourceCredit) {
    return [
      "RepWatchr credited source lead:",
      clip.title,
      "",
      `Credit: ${credit}`,
      `Creator link: ${clip.sourceCredit.url}`,
      `Original source: ${clip.sourceUrl}`,
      "",
      `RepWatchr context: ${truncate(clip.summary, 520)}`,
      "",
      `Read and share: ${storyUrlFor(clip)}`,
    ].join("\n");
  }

  return [
    "RepWatchr story lead:",
    clip.title,
    "",
    `Why it matters: ${truncate(clip.summary, 520)}`,
    "",
    `Source: ${clip.sourceName}`,
    `Read and share: ${storyUrlFor(clip)}`,
  ].join("\n");
}

function xMessage(clip: DailyWireClip) {
  const url = storyUrlFor(clip);
  const credit = sourceCreditLabel(clip);
  const source = truncate(clip.sourceName, 34);
  const title = truncate(clip.title, 150);
  const summary = truncate(clip.summary, 90);
  if (credit) {
    let text = `Credit ${truncate(credit, 46)}: ${title}\n\nRepWatchr context + original source:\n${url}`;
    if (text.length <= 280) return text;

    text = `Credit ${truncate(credit, 46)}: ${truncate(clip.title, 176)}\n${url}`;
    if (text.length <= 280) return text;

    const availableTitleLength = Math.max(32, 266 - url.length - truncate(credit, 46).length);
    return `Credit ${truncate(credit, 46)}: ${truncate(clip.title, availableTitleLength)}\n${url}`;
  }

  let text = `RepWatchr: ${title}\n\n${summary}\n\nSource: ${source}\n${url}`;

  if (text.length <= 280) return text;

  text = `RepWatchr: ${truncate(clip.title, 190)}\n\nSource: ${source}\n${url}`;
  if (text.length <= 280) return text;

  const availableTitleLength = Math.max(32, 276 - url.length);
  return `RepWatchr: ${truncate(clip.title, availableTitleLength)}\n${url}`;
}

function configuredPlatforms(): SocialPlatform[] {
  const platforms: SocialPlatform[] = [];
  if (process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_ACCESS_TOKEN) platforms.push("facebook");
  const hasStoredXTokenPath = Boolean(process.env.X_CLIENT_ID && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (
    process.env.X_USER_ACCESS_TOKEN ||
    process.env.X_REFRESH_TOKEN ||
    hasStoredXTokenPath
  ) {
    platforms.push("x");
  }
  return platforms;
}

function hourlySourceLimit() {
  const rawValue = process.env.SOCIAL_AUTOPOST_SOURCE_LIMIT;
  if (rawValue?.toLowerCase() === "all") return undefined;
  return parsePositiveInteger(rawValue, DEFAULT_HOURLY_SOURCE_LIMIT);
}

async function readResponsePayload(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function payloadError(payload: unknown) {
  if (!payload || typeof payload !== "object") return undefined;
  const maybeError = (payload as { error?: { message?: unknown }; detail?: unknown }).error;
  if (maybeError?.message && typeof maybeError.message === "string") return maybeError.message;
  const detail = (payload as { detail?: unknown }).detail;
  return typeof detail === "string" ? detail : undefined;
}

async function postToFacebook(clip: DailyWireClip): Promise<PlatformPostResponse> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const graphVersion = process.env.FACEBOOK_GRAPH_VERSION ?? "v24.0";

  if (!pageId || !pageToken) {
    throw new Error("Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN");
  }

  const response = await fetch(`https://graph.facebook.com/${graphVersion}/${pageId}/feed`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${pageToken}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      message: facebookMessage(clip),
      link: storyUrlFor(clip),
    }),
  });
  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(payloadError(payload) ?? `Facebook Graph API returned HTTP ${response.status}`);
  }

  const platformPostId = typeof (payload as { id?: unknown } | null)?.id === "string" ? (payload as { id: string }).id : null;
  return { platformPostId, payload };
}

async function postToX(clip: DailyWireClip): Promise<PlatformPostResponse> {
  const userToken = await getXAccessToken();
  const apiUrl = process.env.X_POST_ENDPOINT ?? "https://api.x.com/2/tweets";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      authorization: `Bearer ${userToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ text: xMessage(clip) }),
  });
  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(payloadError(payload) ?? `X API returned HTTP ${response.status}`);
  }

  const data = (payload as { data?: { id?: unknown } } | null)?.data;
  const platformPostId = typeof data?.id === "string" ? data.id : null;
  return { platformPostId, payload };
}

function tokenExpiresSoon(value: string | null) {
  if (!value) return true;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return true;
  return time - Date.now() < 5 * 60 * 1000;
}

async function loadSocialToken(platform: SocialPlatform): Promise<SocialTokenRow | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("repwatchr_social_tokens")
    .select("platform,access_token,refresh_token,expires_at")
    .eq("platform", platform)
    .maybeSingle();

  if (error) return null;
  return data as SocialTokenRow | null;
}

async function saveSocialToken(platform: SocialPlatform, token: XRefreshTokenResponse, fallbackRefreshToken: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase || !token.access_token) return;

  const now = new Date();
  const expiresInSeconds = typeof token.expires_in === "number" ? token.expires_in : 7200;
  const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000).toISOString();

  await supabase.from("repwatchr_social_tokens").upsert(
    {
      platform,
      access_token: token.access_token,
      refresh_token: token.refresh_token ?? fallbackRefreshToken,
      expires_at: expiresAt,
      metadata: {
        tokenType: token.token_type,
        scope: token.scope,
      },
      updated_at: now.toISOString(),
    },
    { onConflict: "platform" },
  );
}

async function refreshXAccessToken(refreshToken: string) {
  const clientId = process.env.X_CLIENT_ID;

  if (!clientId) {
    throw new Error("Missing X_CLIENT_ID for X refresh-token flow");
  }

  const headers: Record<string, string> = {
    "content-type": "application/x-www-form-urlencoded",
  };

  if (process.env.X_CLIENT_SECRET) {
    headers.authorization = `Basic ${Buffer.from(`${clientId}:${process.env.X_CLIENT_SECRET}`).toString("base64")}`;
  }

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers,
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
      client_id: clientId,
    }),
  });
  const payload = (await readResponsePayload(response)) as XRefreshTokenResponse | { error?: { message?: string } };

  if (!response.ok || !("access_token" in payload) || !payload.access_token) {
    throw new Error(payloadError(payload) ?? `X OAuth refresh returned HTTP ${response.status}`);
  }

  await saveSocialToken("x", payload, refreshToken);
  return payload.access_token;
}

async function getXAccessToken() {
  if (process.env.X_USER_ACCESS_TOKEN) return process.env.X_USER_ACCESS_TOKEN;

  const stored = await loadSocialToken("x");
  if (stored?.access_token && !tokenExpiresSoon(stored.expires_at)) return stored.access_token;

  const refreshToken = stored?.refresh_token ?? process.env.X_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error("Missing X_USER_ACCESS_TOKEN or X refresh token");
  }

  return refreshXAccessToken(refreshToken);
}

function rowForPlatform(rows: SocialPostLogRow[], platform: SocialPlatform) {
  return rows.find((row) => row.platform === platform);
}

async function loadSocialLogRows(clipIds: string[], platforms: SocialPlatform[]) {
  const supabase = getSupabaseAdminClient();
  if (!supabase || clipIds.length === 0 || platforms.length === 0) return { rows: [], error: null };

  const { data, error } = await supabase
    .from(SOCIAL_POST_TABLE)
    .select("id,clip_id,platform,status")
    .in("clip_id", clipIds)
    .in("platform", platforms);

  return {
    rows: ((data ?? []) as SocialPostLogRow[]).filter((row) => row.clip_id && row.platform),
    error,
  };
}

async function assertSocialLogReady() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY";

  const { error } = await supabase.from(SOCIAL_POST_TABLE).select("id").limit(1);
  return error?.message;
}

async function claimPlatformPost(clip: DailyWireClip, platform: SocialPlatform, message: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) throw new Error("Missing Supabase admin client");

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(SOCIAL_POST_TABLE)
    .insert({
      clip_id: clip.id,
      platform,
      status: "pending",
      story_title: clip.title,
      story_url: storyUrlFor(clip),
      source_url: clip.sourceUrl,
      source_name: clip.sourceName,
      published_at: clip.publishedAt,
      message,
      metadata: {
        powerChannels: clip.powerChannels,
        matchedTerms: clip.matchedTerms,
        sourceTier: clip.sourceTier,
      },
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error?.code === "23505") return null;
  if (error) throw new Error(error.message);
  return (data as { id?: string } | null)?.id ?? null;
}

async function updatePostLog(
  id: string,
  status: Exclude<SocialPostStatus, "pending">,
  platformPostId: string | null,
  errorMessage?: string,
  payload?: unknown,
) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase
    .from(SOCIAL_POST_TABLE)
    .update({
      status,
      platform_post_id: platformPostId,
      error_message: errorMessage ?? null,
      metadata: payload ? { response: payload } : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

async function postToPlatform(clip: DailyWireClip, platform: SocialPlatform): Promise<SocialPostResult> {
  const message = platform === "facebook" ? facebookMessage(clip) : xMessage(clip);
  const claimId = await claimPlatformPost(clip, platform, message);

  if (!claimId) {
    return {
      platform,
      status: "skipped",
      error: "Already claimed or posted",
      storyUrl: storyUrlFor(clip),
    };
  }

  try {
    const response = platform === "facebook" ? await postToFacebook(clip) : await postToX(clip);
    await updatePostLog(claimId, "posted", response.platformPostId, undefined, response.payload);
    return {
      platform,
      status: "posted",
      platformPostId: response.platformPostId,
      storyUrl: storyUrlFor(clip),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown social post error";
    await updatePostLog(claimId, "error", null, errorMessage);
    return {
      platform,
      status: "error",
      error: errorMessage,
      storyUrl: storyUrlFor(clip),
    };
  }
}

export async function runHourlySocialAutopost({ dryRun = false }: { dryRun?: boolean } = {}): Promise<HourlySocialAutopostResult> {
  const enabled = process.env.SOCIAL_AUTOPOST_ENABLED === "true";
  const editorialApproved = process.env.SOCIAL_AUTOPOST_EDITORIAL_APPROVED === "true";
  const platforms = configuredPlatforms();
  const targetPlatforms: SocialPlatform[] = platforms.length || !dryRun ? platforms : ["facebook", "x"];
  const now = new Date();
  const emptyRefreshed = {
    sourceCount: 0,
    clipsFound: 0,
    clipsInserted: 0,
    clipsSkipped: 0,
    errors: [],
  };
  const skippedResult = {
    dryRun,
    enabled,
    editorialApproved,
    configuredPlatforms: platforms,
    refreshed: emptyRefreshed,
    candidate: null,
    results: [],
  };

  if (!enabled && !dryRun) {
    return {
      ok: true,
      ...skippedResult,
      skippedReason: "Autopost disabled",
    };
  }

  if (enabled && !editorialApproved && !dryRun) {
    return {
      ok: true,
      ...skippedResult,
      skippedReason: "Editorial approval gate not confirmed",
    };
  }

  if (enabled && !platforms.length && !dryRun) {
    return {
      ok: false,
      ...skippedResult,
      skippedReason: "No social platform credentials configured",
      error: "Set Facebook and/or X platform credentials before enabling hourly autopost.",
    };
  }

  const fetched = await fetchDailyNewsClips({ maxSources: hourlySourceLimit() });
  const persisted = await persistDailyNewsClips(fetched.clips);
  const refreshed = {
    sourceCount: fetched.sourceCount,
    clipsFound: fetched.clips.length,
    clipsInserted: persisted.inserted,
    clipsSkipped: persisted.skipped,
    errors: fetched.errors,
  };

  const emptyResult = {
    dryRun,
    enabled,
    editorialApproved,
    configuredPlatforms: platforms,
    refreshed,
    candidate: null,
    results: [],
  };

  if (!persisted.configured || persisted.error) {
    return {
      ok: false,
      ...emptyResult,
      error: persisted.error ?? "Daily news clip persistence is not configured",
    };
  }

  const logError = await assertSocialLogReady();
  if (logError) {
    return {
      ok: false,
      ...emptyResult,
      error: `Social post log is not ready: ${logError}`,
    };
  }

  const wireResult = await getDailyWireClips(160);
  if (!wireResult.configured || wireResult.error) {
    return {
      ok: false,
      ...emptyResult,
      error: wireResult.error ?? "Daily wire clips are not configured",
    };
  }

  const eligibleClips = wireResult.clips
    .filter((clip) => isEligibleClip(clip, now))
    .sort((a, b) => attentionScore(b, now) - attentionScore(a, now) || clipTime(b) - clipTime(a));
  const logRowsResult = await loadSocialLogRows(eligibleClips.map((clip) => clip.id), targetPlatforms);

  if (logRowsResult.error) {
    return {
      ok: false,
      ...emptyResult,
      error: logRowsResult.error.message,
    };
  }

  const rowsByClipId = new Map<string, SocialPostLogRow[]>();
  for (const row of logRowsResult.rows) {
    const rows = rowsByClipId.get(row.clip_id) ?? [];
    rows.push(row);
    rowsByClipId.set(row.clip_id, rows);
  }

  const selectedClip = eligibleClips.find((clip) => {
    const rows = rowsByClipId.get(clip.id) ?? [];
    return targetPlatforms.some((platform) => !rowForPlatform(rows, platform));
  });

  if (!selectedClip) {
    return {
      ok: true,
      ...emptyResult,
      skippedReason: "No fresh source-linked clips are waiting for the configured platforms",
    };
  }

  const candidate = toCandidate(selectedClip, now);

  if (dryRun) {
    return {
      ok: true,
      ...emptyResult,
      candidate,
      results: targetPlatforms.map((platform) => ({
        platform,
        status: "skipped",
        error: "Dry run only",
        storyUrl: candidate.storyUrl,
      })),
    };
  }

  const existingRows = rowsByClipId.get(selectedClip.id) ?? [];
  const missingPlatforms = targetPlatforms.filter((platform) => !rowForPlatform(existingRows, platform));
  const results = await Promise.all(missingPlatforms.map((platform) => postToPlatform(selectedClip, platform)));
  const postedCount = results.filter((result) => result.status === "posted").length;
  const erroredCount = results.filter((result) => result.status === "error").length;

  return {
    ok: postedCount > 0 && erroredCount === 0,
    ...emptyResult,
    candidate,
    results,
    error: erroredCount ? "One or more social platforms rejected the post." : undefined,
  };
}
