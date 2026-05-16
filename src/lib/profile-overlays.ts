import { createHash } from "crypto";
import type { ProfileCompletionKey, ProfileCompletionPriority } from "@/lib/profile-completion";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type ProfileOverlayType =
  | "official"
  | "school_board"
  | "attorney"
  | "law_firm"
  | "media_company"
  | "journalist"
  | "editor"
  | "law_enforcement_agency"
  | "public_safety_official";

export type ProfileSourceTier = "official_record" | "named_news" | "other_public" | "weak_match";
export type ProfileOverlayStatus = "auto_published" | "approved" | "needs_review" | "rejected" | "archived";

export interface PublicProfileCompletionOverlay {
  profileType: ProfileOverlayType;
  profileId: string;
  profileName: string;
  completionPercent: number;
  priority: ProfileCompletionPriority;
  isComplete: boolean;
  loadedItems: ProfileCompletionKey[];
  missingItems: ProfileCompletionKey[];
  sourceReviewStatus: "complete" | "needs_review";
  lastCheckedAt: string;
  runId?: string | null;
}

export interface PublicProfileEnrichmentItem {
  id: string;
  profileType: ProfileOverlayType;
  profileId: string;
  category: "news" | "public_record" | "controversy" | "lawsuit" | "ethics" | "scandal" | "funding" | "statement";
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  sourceTier: ProfileSourceTier;
  eventDate: string | null;
  status: ProfileOverlayStatus;
}

export interface PublicProfileVoteSnapshot {
  id: string;
  profileType: ProfileOverlayType;
  profileId: string;
  sourceVoteId: string;
  chamber: string | null;
  session: string | null;
  rollCall: string | null;
  voteDate: string | null;
  issue: string | null;
  question: string | null;
  voteCast: string | null;
  sourceUrl: string;
  issueLabel: string | null;
  rightPosition: "yea" | "nay" | null;
  ideologyWeight: number | null;
  ruleReviewStatus: "unmapped" | "needs_review" | "approved" | "rejected";
}

export interface PublicProfileSocialAccount {
  platform: string;
  handle: string | null;
  publicUrl: string;
  isOfficial: boolean;
}

export interface PublicStatementSnapshot {
  id: string;
  platform: string;
  statementUrl: string;
  statementDate: string | null;
  excerpt: string | null;
  contextNote: string | null;
}

export interface PublicProfileOverlay {
  configured: boolean;
  completion: PublicProfileCompletionOverlay | null;
  enrichmentItems: PublicProfileEnrichmentItem[];
  voteSnapshots: PublicProfileVoteSnapshot[];
  socialAccounts: PublicProfileSocialAccount[];
  publicStatements: PublicStatementSnapshot[];
  errors: string[];
}

const officialRecordHosts = [
  ".gov",
  "congress.gov",
  "house.gov",
  "senate.gov",
  "fec.gov",
  "capitol.texas.gov",
  "legis",
  "openstates.org",
];

const namedNewsHosts = [
  "apnews.com",
  "reuters.com",
  "texastribune.org",
  "npr.org",
  "pbs.org",
  "cnn.com",
  "foxnews.com",
  "nbcnews.com",
  "cbsnews.com",
  "abcnews.go.com",
  "politico.com",
  "thehill.com",
  "news.google.com",
];

export function stableSourceHash(...parts: Array<string | number | null | undefined>) {
  return createHash("sha256")
    .update(parts.filter((part) => part !== null && part !== undefined).join("|"))
    .digest("hex");
}

export function classifyProfileSource(sourceUrl: string, sourceName = ""): ProfileSourceTier {
  const normalizedUrl = sourceUrl.toLowerCase();
  const normalizedName = sourceName.toLowerCase();

  if (officialRecordHosts.some((host) => normalizedUrl.includes(host))) {
    return "official_record";
  }

  if (
    namedNewsHosts.some((host) => normalizedUrl.includes(host)) ||
    /(tribune|times|post|news|journal|chronicle|herald|gazette|reporter|press|radio|tv|telegraph)/i.test(
      sourceName,
    )
  ) {
    return "named_news";
  }

  if (normalizedUrl.startsWith("https://") && normalizedName) {
    return "other_public";
  }

  return "weak_match";
}

export function autoPublishStatus(sourceTier: ProfileSourceTier): ProfileOverlayStatus {
  return sourceTier === "official_record" || sourceTier === "named_news" ? "auto_published" : "needs_review";
}

async function safeQuery<T>(query: PromiseLike<{ data: T | null; error: { message: string } | null }>, errors: string[]) {
  const { data, error } = await query;
  if (error) {
    errors.push(error.message);
    return null;
  }
  return data;
}

export function emptyProfileOverlay(configured: boolean, errors: string[] = []): PublicProfileOverlay {
  return {
    configured,
    completion: null,
    enrichmentItems: [],
    voteSnapshots: [],
    socialAccounts: [],
    publicStatements: [],
    errors,
  };
}

export async function getPublicProfileOverlay(
  profileType: ProfileOverlayType,
  profileId: string,
): Promise<PublicProfileOverlay> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return emptyProfileOverlay(false);

  const errors: string[] = [];
  const [completion, enrichmentItems, voteSnapshots, socialAccounts] = await Promise.all([
    safeQuery(
      supabase
        .from("profile_completion_snapshots")
        .select("*")
        .eq("profile_type", profileType)
        .eq("profile_id", profileId)
        .maybeSingle(),
      errors,
    ),
    safeQuery(
      supabase
        .from("profile_enrichment_items")
        .select("*")
        .eq("profile_type", profileType)
        .eq("profile_id", profileId)
        .in("status", ["auto_published", "approved"])
        .order("event_date", { ascending: false, nullsFirst: false })
        .limit(12),
      errors,
    ),
    safeQuery(
      supabase
        .from("profile_vote_snapshots")
        .select("*")
        .eq("profile_type", profileType)
        .eq("profile_id", profileId)
        .order("vote_date", { ascending: false, nullsFirst: false })
        .limit(16),
      errors,
    ),
    safeQuery(
      supabase
        .from("profile_social_accounts")
        .select("id, platform, handle, public_url, is_official")
        .eq("profile_type", profileType)
        .eq("profile_id", profileId)
        .eq("status", "approved")
        .order("platform", { ascending: true }),
      errors,
    ),
  ]);

  const accountIds = ((socialAccounts ?? []) as Array<{ id: string }>).map((account) => account.id);
  const publicStatements =
    accountIds.length > 0
      ? await safeQuery(
          supabase
            .from("public_statement_snapshots")
            .select("id, platform, statement_url, statement_date, excerpt, context_note")
            .in("social_account_id", accountIds)
            .eq("review_status", "approved")
            .order("statement_date", { ascending: false, nullsFirst: false })
            .limit(8),
          errors,
        )
      : [];

  return {
    configured: true,
    completion: completion
      ? {
          profileType: completion.profile_type,
          profileId: completion.profile_id,
          profileName: completion.profile_name,
          completionPercent: completion.completion_percent,
          priority: completion.priority,
          isComplete: completion.is_complete,
          loadedItems: completion.loaded_items ?? [],
          missingItems: completion.missing_items ?? [],
          sourceReviewStatus: completion.source_review_status,
          lastCheckedAt: completion.last_checked_at,
          runId: completion.run_id,
        }
      : null,
    enrichmentItems: ((enrichmentItems ?? []) as Array<Record<string, unknown>>).map((item) => ({
      id: String(item.id),
      profileType: item.profile_type as ProfileOverlayType,
      profileId: String(item.profile_id),
      category: item.category as PublicProfileEnrichmentItem["category"],
      title: String(item.title),
      summary: String(item.summary ?? ""),
      sourceUrl: String(item.source_url),
      sourceName: String(item.source_name ?? "Public source"),
      sourceTier: item.source_tier as ProfileSourceTier,
      eventDate: item.event_date ? String(item.event_date) : null,
      status: item.status as ProfileOverlayStatus,
    })),
    voteSnapshots: ((voteSnapshots ?? []) as Array<Record<string, unknown>>).map((vote) => ({
      id: String(vote.id),
      profileType: vote.profile_type as ProfileOverlayType,
      profileId: String(vote.profile_id),
      sourceVoteId: String(vote.source_vote_id),
      chamber: vote.chamber ? String(vote.chamber) : null,
      session: vote.session ? String(vote.session) : null,
      rollCall: vote.roll_call ? String(vote.roll_call) : null,
      voteDate: vote.vote_date ? String(vote.vote_date) : null,
      issue: vote.issue ? String(vote.issue) : null,
      question: vote.question ? String(vote.question) : null,
      voteCast: vote.vote_cast ? String(vote.vote_cast) : null,
      sourceUrl: String(vote.source_url),
      issueLabel: vote.issue_label ? String(vote.issue_label) : null,
      rightPosition: vote.right_position as "yea" | "nay" | null,
      ideologyWeight: typeof vote.ideology_weight === "number" ? vote.ideology_weight : null,
      ruleReviewStatus: vote.rule_review_status as PublicProfileVoteSnapshot["ruleReviewStatus"],
    })),
    socialAccounts: ((socialAccounts ?? []) as Array<Record<string, unknown>>).map((account) => ({
      platform: String(account.platform),
      handle: account.handle ? String(account.handle) : null,
      publicUrl: String(account.public_url),
      isOfficial: Boolean(account.is_official),
    })),
    publicStatements: ((publicStatements ?? []) as Array<Record<string, unknown>>).map((statement) => ({
      id: String(statement.id),
      platform: String(statement.platform),
      statementUrl: String(statement.statement_url),
      statementDate: statement.statement_date ? String(statement.statement_date) : null,
      excerpt: statement.excerpt ? String(statement.excerpt) : null,
      contextNote: statement.context_note ? String(statement.context_note) : null,
    })),
    errors,
  };
}
