import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type ShareCampaignAdminData = {
  campaigns: Array<{
    id: string;
    key: string;
    name: string;
    description: string | null;
    campaign_type: string;
    status: string;
    default_share_text: string | null;
    target_route: string | null;
  }>;
  assets: Array<{
    id: string;
    title: string | null;
    asset_type: string;
    copy_text: string | null;
    url: string | null;
    status: string;
  }>;
  stats: {
    referralCodes: number;
    referralEvents: number;
    visits: number;
    conversions: number;
    activeCampaigns: number;
    activeAssets: number;
  };
  topRoutes: Array<{ route: string; count: number }>;
};

const emptyData: ShareCampaignAdminData = {
  campaigns: [],
  assets: [],
  stats: {
    referralCodes: 0,
    referralEvents: 0,
    visits: 0,
    conversions: 0,
    activeCampaigns: 0,
    activeAssets: 0,
  },
  topRoutes: [],
};

async function countRows(table: string, filters: Record<string, string> = {}) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return 0;
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  for (const [key, value] of Object.entries(filters)) {
    query = query.eq(key, value);
  }
  const { count, error } = await query;
  if (error) return 0;
  return count ?? 0;
}

export async function getShareCampaignAdminData(): Promise<ShareCampaignAdminData> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return emptyData;

  const [
    campaignsResponse,
    assetsResponse,
    referralCodes,
    referralEvents,
    visits,
    activeCampaigns,
    activeAssets,
    routeEventsResponse,
  ] = await Promise.all([
    supabase
      .from("share_campaigns")
      .select("id,key,name,description,campaign_type,status,default_share_text,target_route")
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("share_assets")
      .select("id,title,asset_type,copy_text,url,status")
      .order("created_at", { ascending: false })
      .limit(100),
    countRows("referral_codes"),
    countRows("referral_events"),
    countRows("referral_events", { event_type: "referral_visit" }),
    countRows("share_campaigns", { status: "active" }),
    countRows("share_assets", { status: "active" }),
    supabase
      .from("referral_events")
      .select("route,event_type")
      .in("event_type", ["referral_visit", "referral_link_copied", "share_campaign_clicked", "safe_share_text_copied"])
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const topRouteCounts = new Map<string, number>();
  for (const event of routeEventsResponse.data ?? []) {
    if (!event.route) continue;
    topRouteCounts.set(event.route, (topRouteCounts.get(event.route) ?? 0) + 1);
  }

  return {
    campaigns: campaignsResponse.data ?? [],
    assets: assetsResponse.data ?? [],
    stats: {
      referralCodes,
      referralEvents,
      visits,
      conversions: await countRows("referral_events", { event_type: "referral_source_submission" })
        + await countRows("referral_events", { event_type: "referral_packet_created" })
        + await countRows("referral_events", { event_type: "referral_signup" }),
      activeCampaigns,
      activeAssets,
    },
    topRoutes: Array.from(topRouteCounts.entries())
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
  };
}
