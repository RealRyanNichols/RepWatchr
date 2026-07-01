import { createServerSupabaseClient } from "@/lib/supabase-server";
import {
  contributorBadgeCatalog,
  fallbackContributors,
  type ContributorBadgeAward,
  type ContributorRecord,
  type PublicContributorProfile,
} from "@/lib/contributors";

export type ContributorCountyRanking = {
  state: string;
  county: string;
  contributor_count: number;
  total_xp: number;
  accepted_sources_count: number;
  verified_contributions_count: number;
  average_accuracy: number;
  last_contributed_at: string | null;
  state_county_rank: number;
};

export type ContributorStateRanking = {
  state: string;
  contributor_count: number;
  total_xp: number;
  accepted_sources_count: number;
  verified_contributions_count: number;
  average_accuracy: number;
  last_contributed_at: string | null;
  national_rank: number;
};

export type PublicContributorBundle = {
  profile: PublicContributorProfile;
  records: ContributorRecord[];
  badgeAwards: ContributorBadgeAward[];
};

function hasSupabasePublicEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function fallbackCountyRankings(): ContributorCountyRanking[] {
  return fallbackContributors.map((profile) => ({
    state: profile.state,
    county: profile.county ?? "Unknown County",
    contributor_count: 1,
    total_xp: profile.total_xp,
    accepted_sources_count: profile.accepted_sources_count,
    verified_contributions_count: profile.verified_contributions_count,
    average_accuracy: profile.accuracy_score,
    last_contributed_at: profile.last_contributed_at,
    state_county_rank: profile.county_rank ?? 1,
  }));
}

function fallbackStateRankings(): ContributorStateRanking[] {
  const totalXp = fallbackContributors.reduce((sum, profile) => sum + profile.total_xp, 0);
  const accepted = fallbackContributors.reduce((sum, profile) => sum + profile.accepted_sources_count, 0);
  const verified = fallbackContributors.reduce((sum, profile) => sum + profile.verified_contributions_count, 0);
  const accuracy =
    fallbackContributors.reduce((sum, profile) => sum + profile.accuracy_score, 0) / Math.max(1, fallbackContributors.length);

  return [
    {
      state: "TX",
      contributor_count: fallbackContributors.length,
      total_xp: totalXp,
      accepted_sources_count: accepted,
      verified_contributions_count: verified,
      average_accuracy: Math.round(accuracy * 100) / 100,
      last_contributed_at: fallbackContributors[0]?.last_contributed_at ?? null,
      national_rank: 1,
    },
  ];
}

export async function getPublicContributorLeaderboard() {
  if (!hasSupabasePublicEnv()) {
    return {
      contributors: fallbackContributors,
      countyRankings: fallbackCountyRankings(),
      stateRankings: fallbackStateRankings(),
      fallback: true,
    };
  }

  const supabase = await createServerSupabaseClient();
  const [contributorsResult, countyResult, stateResult] = await Promise.all([
    supabase
      .from("contributor_public_leaderboard")
      .select("*")
      .order("total_xp", { ascending: false })
      .order("verified_contributions_count", { ascending: false })
      .limit(50),
    supabase
      .from("contributor_county_rankings")
      .select("*")
      .order("total_xp", { ascending: false })
      .limit(30),
    supabase
      .from("contributor_state_rankings")
      .select("*")
      .order("total_xp", { ascending: false })
      .limit(20),
  ]);

  const contributors = (contributorsResult.data ?? []) as PublicContributorProfile[];

  return {
    contributors: contributors.length ? contributors : fallbackContributors,
    countyRankings: ((countyResult.data ?? []) as ContributorCountyRanking[]).length
      ? ((countyResult.data ?? []) as ContributorCountyRanking[])
      : fallbackCountyRankings(),
    stateRankings: ((stateResult.data ?? []) as ContributorStateRanking[]).length
      ? ((stateResult.data ?? []) as ContributorStateRanking[])
      : fallbackStateRankings(),
    fallback: Boolean(contributorsResult.error),
  };
}

export async function getPublicContributorByHandle(handle: string): Promise<PublicContributorBundle | null> {
  const normalized = handle.toLowerCase().trim();

  if (!hasSupabasePublicEnv()) {
    const fallback = fallbackContributors.find((profile) => profile.handle === normalized);
    return fallback
      ? {
          profile: fallback,
          records: [],
          badgeAwards: [],
        }
      : null;
  }

  const supabase = await createServerSupabaseClient();
  const profileResult = await supabase
    .from("contributor_public_leaderboard")
    .select("*")
    .eq("handle", normalized)
    .maybeSingle();

  if (profileResult.error || !profileResult.data) {
    const fallback = fallbackContributors.find((profile) => profile.handle === normalized);
    return fallback
      ? {
          profile: fallback,
          records: [],
          badgeAwards: [],
        }
      : null;
  }

  const profile = profileResult.data as PublicContributorProfile;
  const [recordsResult, badgesResult] = await Promise.all([
    supabase
      .from("contributor_records")
      .select("id, profile_id, user_id, kind, target_type, target_id, target_label, title, summary, source_url, source_date, jurisdiction, county, state, status, xp_awarded, usefulness_score, accuracy_status, attached_href, created_at")
      .eq("profile_id", profile.id)
      .in("status", ["accepted", "verified", "attached_to_profile"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("contributor_badge_awards")
      .select("id, badge_key, reason, created_at, contributor_badges(name, description, icon_label, accent)")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  return {
    profile,
    records: (recordsResult.data ?? []) as ContributorRecord[],
    badgeAwards: (badgesResult.data ?? []) as ContributorBadgeAward[],
  };
}

export function publicBadgeCatalog() {
  return contributorBadgeCatalog.map((badge) => ({
    badge_key: badge.badgeKey,
    name: badge.name,
    description: badge.description,
    icon_label: badge.iconLabel,
    accent: badge.accent,
  }));
}
