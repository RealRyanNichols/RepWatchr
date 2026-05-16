import type { DailyNewsClip } from "@/lib/daily-news-clips";
import { getAllNews, getAllOfficials, getPublicVoteRecord, getRedFlags } from "@/lib/data";
import { buildOfficialCompletionSnapshot } from "@/lib/profile-completion";
import {
  autoPublishStatus,
  classifyProfileSource,
  stableSourceHash,
  type ProfileOverlayStatus,
  type ProfileSourceTier,
} from "@/lib/profile-overlays";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Official, PublicVoteRecordVote, RedFlag } from "@/types";

export interface DailyProfileUpdateModuleResult {
  id: string;
  label: string;
  status: "ok" | "skipped" | "error";
  inserted: number;
  skipped: number;
  error?: string;
}

export interface DailyProfileUpdateResult {
  configured: boolean;
  runId: string | null;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  modules: DailyProfileUpdateModuleResult[];
}

type SupabaseAdmin = NonNullable<ReturnType<typeof getSupabaseAdminClient>>;

function federalStateOfficials() {
  return getAllOfficials().filter((official) => official.level === "federal" || official.level === "state");
}

async function insertRun(admin: SupabaseAdmin, startedAt: string) {
  const { data, error } = await admin
    .from("profile_update_runs")
    .insert({
      started_at: startedAt,
      status: "running",
      scope: "federal_state_daily",
      notes: "Daily federal/state profile completion, vote, news, public-record, and social overlay run.",
    })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id as string, error: null };
}

async function finishRun(
  admin: SupabaseAdmin,
  runId: string | null,
  finishedAt: string,
  modules: DailyProfileUpdateModuleResult[],
) {
  if (!runId) return;
  const failed = modules.filter((module) => module.status === "error");
  await admin
    .from("profile_update_runs")
    .update({
      finished_at: finishedAt,
      status: failed.length ? "completed_with_errors" : "completed",
      source_count: modules.length,
      inserted_count: modules.reduce((total, module) => total + module.inserted, 0),
      skipped_count: modules.reduce((total, module) => total + module.skipped, 0),
      error_count: failed.length,
      module_results: modules,
    })
    .eq("id", runId);
}

function chunkRows<T>(rows: T[], size = 500) {
  const chunks: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
}

async function upsertRows(
  admin: SupabaseAdmin,
  table: string,
  rows: Array<Record<string, unknown>>,
  onConflict: string,
) {
  if (!rows.length) return { inserted: 0, skipped: 0 };

  let inserted = 0;
  for (const chunk of chunkRows(rows)) {
    const { error } = await admin.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(error.message);
    inserted += chunk.length;
  }

  return { inserted, skipped: 0 };
}

async function persistCompletionSnapshots(admin: SupabaseAdmin, runId: string | null) {
  const now = new Date().toISOString();
  const rows = federalStateOfficials().map((official) => {
    const snapshot = buildOfficialCompletionSnapshot(official);
    return {
      profile_type: snapshot.profileType,
      profile_id: snapshot.profileId,
      profile_name: snapshot.profileName,
      profile_path: snapshot.profilePath,
      level: snapshot.level,
      state: snapshot.state,
      jurisdiction: snapshot.jurisdiction,
      position: snapshot.position,
      completion_percent: snapshot.completionPercent,
      priority: snapshot.priority,
      is_complete: snapshot.isComplete,
      loaded_items: snapshot.loadedItems,
      missing_items: snapshot.missingItems,
      source_review_status: snapshot.sourceReviewStatus,
      summary: snapshot.summary,
      last_static_review_at: snapshot.lastStaticReviewAt,
      last_checked_at: now,
      run_id: runId,
    };
  });

  return upsertRows(admin, "profile_completion_snapshots", rows, "profile_type,profile_id");
}

function voteRow(official: Official, vote: PublicVoteRecordVote, runId: string | null) {
  return {
    profile_type: "official",
    profile_id: official.id,
    profile_name: official.name,
    source_vote_id: vote.sourceId,
    chamber: vote.chamber,
    session: String(vote.session ?? ""),
    roll_call: String(vote.rollCall ?? ""),
    vote_date: vote.date || null,
    issue: vote.issue || null,
    question: vote.question || vote.title || null,
    vote_type: vote.voteType || null,
    result: vote.result || null,
    vote_cast: vote.voteCast || vote.vote || null,
    source_url: vote.sourceUrl,
    source_xml_url: vote.sourceXmlUrl ?? null,
    source_hash: stableSourceHash("vote", official.id, vote.sourceId, vote.sourceUrl),
    rule_review_status: "unmapped",
    run_id: runId,
    raw: vote,
  };
}

async function persistVoteSnapshots(admin: SupabaseAdmin, runId: string | null) {
  const rows = federalStateOfficials().flatMap((official) => {
    const voteRecord = getPublicVoteRecord(official.id);
    return (voteRecord?.votes ?? []).slice(0, 50).map((vote) => voteRow(official, vote, runId));
  });

  return upsertRows(admin, "profile_vote_snapshots", rows, "profile_type,profile_id,source_vote_id");
}

function enrichmentRow(params: {
  official: Official;
  category: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  eventDate?: string | null;
  sourceTier?: ProfileSourceTier;
  status?: ProfileOverlayStatus;
  runId: string | null;
  raw: Record<string, unknown>;
}) {
  const sourceTier = params.sourceTier ?? classifyProfileSource(params.sourceUrl, params.sourceName);
  const status = params.status ?? autoPublishStatus(sourceTier);
  return {
    profile_type: "official",
    profile_id: params.official.id,
    profile_name: params.official.name,
    profile_path: `/officials/${params.official.id}`,
    category: params.category,
    title: params.title,
    summary: params.summary,
    source_url: params.sourceUrl,
    source_name: params.sourceName,
    source_tier: sourceTier,
    event_date: params.eventDate ?? null,
    status,
    source_hash: stableSourceHash(
      params.category,
      params.official.id,
      params.sourceUrl,
      params.title,
      params.eventDate,
    ),
    run_id: params.runId,
    raw: params.raw,
  };
}

function redFlagCategory(flag: RedFlag) {
  if (flag.category === "ethics") return "ethics";
  if (flag.category === "funding") return "funding";
  if (flag.category === "conflict-of-interest") return "controversy";
  return "public_record";
}

function staticEnrichmentRows(runId: string | null) {
  const rows: Array<Record<string, unknown>> = [];
  const officialsById = new Map(getAllOfficials().map((official) => [official.id, official]));

  for (const official of federalStateOfficials()) {
    for (const flag of getRedFlags(official.id)) {
      rows.push(
        enrichmentRow({
          official,
          category: redFlagCategory(flag),
          title: flag.title,
          summary: `${flag.description} Why it matters: ${flag.whyItMatters}`.slice(0, 900),
          sourceUrl: flag.sourceUrl,
          sourceName: "Public record/source link",
          eventDate: flag.date,
          runId,
          raw: flag as unknown as Record<string, unknown>,
        }),
      );
    }
  }

  for (const article of getAllNews()) {
    if (!article.sourceUrl) continue;
    for (const officialId of article.officialIds) {
      const official = officialsById.get(officialId);
      if (!official || (official.level !== "federal" && official.level !== "state")) continue;
      rows.push(
        enrichmentRow({
          official,
          category: "news",
          title: article.title,
          summary: article.summary,
          sourceUrl: article.sourceUrl,
          sourceName: article.sourceName ?? "Named news/public source",
          eventDate: article.publishedAt,
          runId,
          raw: article as unknown as Record<string, unknown>,
        }),
      );
    }
  }

  return rows;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function clipMatchesOfficial(clip: DailyNewsClip, official: Official) {
  if (clip.state && official.state && clip.state !== official.state && clip.scope !== "national") {
    return false;
  }

  const haystack = normalizeName(`${clip.title} ${clip.summary}`);
  const fullName = normalizeName(official.name);
  if (fullName.length < 5 || !haystack.includes(fullName)) return false;

  const lastName = normalizeName(official.lastName);
  const officeTerms = normalizeName(`${official.position} ${official.jurisdiction} ${official.state ?? ""}`);
  return haystack.includes(lastName) && (clip.scope === "national" || haystack.includes(lastName) || officeTerms.length > 0);
}

function dailyClipEnrichmentRows(clips: DailyNewsClip[], runId: string | null) {
  const officials = federalStateOfficials();
  const rows: Array<Record<string, unknown>> = [];

  for (const clip of clips) {
    const matches = officials.filter((official) => clipMatchesOfficial(clip, official)).slice(0, 4);
    for (const official of matches) {
      rows.push(
        enrichmentRow({
          official,
          category: "news",
          title: clip.title,
          summary: clip.summary,
          sourceUrl: clip.sourceUrl,
          sourceName: clip.sourceName,
          eventDate: clip.publishedAt ?? null,
          runId,
          raw: clip as unknown as Record<string, unknown>,
        }),
      );
    }
  }

  return rows;
}

async function persistEnrichmentItems(admin: SupabaseAdmin, runId: string | null, clips: DailyNewsClip[]) {
  const rows = [...staticEnrichmentRows(runId), ...dailyClipEnrichmentRows(clips, runId)];
  return upsertRows(admin, "profile_enrichment_items", rows, "source_hash");
}

function socialUrl(platform: string, value: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const handle = value.replace(/^@/, "");
  if (platform === "x" || platform === "twitter") return `https://x.com/${handle}`;
  if (platform === "facebook") return `https://www.facebook.com/${handle}`;
  if (platform === "instagram") return `https://www.instagram.com/${handle}`;
  if (platform === "youtube") return `https://www.youtube.com/${handle}`;
  if (platform === "tiktok") return `https://www.tiktok.com/@${handle}`;
  return value;
}

async function persistSocialAccounts(admin: SupabaseAdmin) {
  const rows = federalStateOfficials().flatMap((official) => {
    const social = official.contactInfo.socialMedia;
    if (!social) return [];
    return Object.entries(social)
      .filter(([, value]) => Boolean(value))
      .map(([platform, value]) => ({
        profile_type: "official",
        profile_id: official.id,
        profile_name: official.name,
        platform: platform === "twitter" ? "x" : platform,
        handle: value?.startsWith("http") ? null : value?.replace(/^@/, ""),
        public_url: socialUrl(platform, value ?? ""),
        source_url: official.contactInfo.website ?? official.sourceLinks?.[0]?.url ?? null,
        is_official: true,
        status: "approved",
      }));
  });

  return upsertRows(admin, "profile_social_accounts", rows, "profile_type,profile_id,platform,public_url");
}

async function runModule(
  id: string,
  label: string,
  task: () => Promise<{ inserted: number; skipped: number }>,
): Promise<DailyProfileUpdateModuleResult> {
  try {
    const result = await task();
    return { id, label, status: "ok", ...result };
  } catch (error) {
    return {
      id,
      label,
      status: "error",
      inserted: 0,
      skipped: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function runDailyProfileUpdates(clips: DailyNewsClip[] = []): Promise<DailyProfileUpdateResult> {
  const startedAt = new Date().toISOString();
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return {
      configured: false,
      runId: null,
      startedAt,
      finishedAt: new Date().toISOString(),
      ok: false,
      modules: [
        {
          id: "supabase",
          label: "Supabase service role",
          status: "skipped",
          inserted: 0,
          skipped: 0,
          error: "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
        },
      ],
    };
  }

  const run = await insertRun(admin, startedAt);
  const modules: DailyProfileUpdateModuleResult[] = [];
  if (run.error) {
    modules.push({
      id: "run-log",
      label: "Daily run log",
      status: "error",
      inserted: 0,
      skipped: 0,
      error: run.error,
    });
  }

  modules.push(
    await runModule("completion", "Federal/state profile completion snapshots", () =>
      persistCompletionSnapshots(admin, run.id),
    ),
  );
  modules.push(
    await runModule("votes", "Public vote snapshots", () => persistVoteSnapshots(admin, run.id)),
  );
  modules.push(
    await runModule("enrichment", "News and public-record enrichment", () =>
      persistEnrichmentItems(admin, run.id, clips),
    ),
  );
  modules.push(
    await runModule("social", "Official public social links", () => persistSocialAccounts(admin)),
  );

  const finishedAt = new Date().toISOString();
  await finishRun(admin, run.id, finishedAt, modules);

  return {
    configured: true,
    runId: run.id,
    startedAt,
    finishedAt,
    ok: modules.every((module) => module.status !== "error"),
    modules,
  };
}
