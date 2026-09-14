/**
 * Who is actually reading, by coverage tier.
 *
 * The point of this report is deciding who the next post is for. So it answers
 * two things and refuses to pad: what share of readers are inside HD-7 / TX-01,
 * and which towns they are in.
 *
 * Rows recorded before the geo columns shipped carry a null tier. Those are
 * counted as "unknown" and kept visible rather than folded into out-of-district,
 * because treating missing data as a finding is the habit this site exists to
 * break.
 */

import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { VISITOR_TIER_LABELS, type VisitorTier } from "@/lib/visitor-geo";

export type AudienceTierRow = { tier: VisitorTier | "unknown"; label: string; views: number; share: number };
export type AudienceCityRow = { city: string; region: string | null; tier: string; views: number };

export type AudienceReport = {
  ok: boolean;
  problem?: string;
  sinceDays: number;
  totalViews: number;
  knownViews: number;
  inDistrictViews: number;
  inDistrictShareOfKnown: number | null;
  tiers: AudienceTierRow[];
  topCities: AudienceCityRow[];
};

const EMPTY: AudienceReport = {
  ok: false,
  sinceDays: 30,
  totalViews: 0,
  knownViews: 0,
  inDistrictViews: 0,
  inDistrictShareOfKnown: null,
  tiers: [],
  topCities: [],
};

export async function getAudienceReport(sinceDays = 30): Promise<AudienceReport> {
  const admin = getSupabaseAdminClient();
  if (!admin) return { ...EMPTY, sinceDays, problem: "Supabase service role is not configured." };

  const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await admin
    .from("site_analytics_events")
    .select("visitor_tier, visitor_city, visitor_region")
    .gte("created_at", since)
    .limit(50000);

  if (error) return { ...EMPTY, sinceDays, problem: error.message };

  const rows = (data ?? []) as Array<{
    visitor_tier: string | null;
    visitor_city: string | null;
    visitor_region: string | null;
  }>;

  const tierCounts = new Map<string, number>();
  const cityCounts = new Map<string, AudienceCityRow>();

  for (const row of rows) {
    const tier = row.visitor_tier ?? "unknown";
    tierCounts.set(tier, (tierCounts.get(tier) ?? 0) + 1);

    if (row.visitor_city) {
      const key = `${row.visitor_city}|${row.visitor_region ?? ""}`;
      const existing = cityCounts.get(key);
      if (existing) existing.views += 1;
      else
        cityCounts.set(key, {
          city: row.visitor_city,
          region: row.visitor_region,
          tier,
          views: 1,
        });
    }
  }

  const totalViews = rows.length;
  const unknownViews = tierCounts.get("unknown") ?? 0;
  const knownViews = totalViews - unknownViews;
  const inDistrictViews = tierCounts.get("home-district") ?? 0;

  const order: Array<VisitorTier | "unknown"> = [
    "home-district",
    "east-texas",
    "texas",
    "national",
    "outside",
    "unknown",
  ];

  const tiers: AudienceTierRow[] = order
    .map((tier) => {
      const views = tierCounts.get(tier) ?? 0;
      return {
        tier,
        label: tier === "unknown" ? "Not recorded" : VISITOR_TIER_LABELS[tier],
        views,
        // Share is of the whole sample, so the unknown slice stays honest
        // about how much of the picture is missing.
        share: totalViews > 0 ? Math.round((views / totalViews) * 1000) / 10 : 0,
      };
    })
    .filter((row) => row.views > 0);

  const topCities = [...cityCounts.values()].sort((a, b) => b.views - a.views).slice(0, 15);

  return {
    ok: true,
    sinceDays,
    totalViews,
    knownViews,
    inDistrictViews,
    // Measured against rows that actually carry geo. Dividing by the whole
    // sample would understate the district every time an old row is counted.
    inDistrictShareOfKnown: knownViews > 0 ? Math.round((inDistrictViews / knownViews) * 1000) / 10 : null,
    tiers,
    topCities,
  };
}
