import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getAllNews, getRepWatchrDataStats } from "@/lib/data";
import { summarizeTraffic, type TrafficEvent } from "@/lib/command-center-metrics";

export async function getCommandCenter(days: 7 | 30) {
  const now = new Date();
  const start = new Date(now); start.setUTCHours(0, 0, 0, 0); start.setUTCDate(start.getUTCDate() - days + 1);
  const since = start.toISOString();
  const db = getSupabaseAdminClient();
  const issues: string[] = [];
  let events: TrafficEvent[] = [];
  let eventTotal: number | null = null;
  let members: number | null = null;
  let newMembers: number | null = null;
  let drafts: number | null = null;
  let pendingSources: number | null = null;
  let databaseAvailable = false;
  let social: Array<{ platform: string; status: string; story_title: string; created_at: string }> = [];
  let queue: Array<{ platform: string; editorial_status: string; publish_status: string; scheduled_for: string | null }> = [];
  let articles = getAllNews().map((a) => ({ slug: a.id, title: a.title, published_at: a.publishedAt }));
  if (db) {
    const results = await Promise.all([
      db.from("profiles").select("id", { count: "exact", head: true }),
      db.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", since),
      db.from("site_analytics_events").select("id", { count: "exact", head: true }).gte("created_at", since).lte("created_at", now.toISOString()),
      db.from("repwatchr_articles").select("slug,title,published_at").eq("editorial_status", "approved").eq("publish_status", "published").lte("published_at", now.toISOString()).order("published_at", { ascending: false }).limit(1000),
      db.from("repwatchr_articles").select("id", { count: "exact", head: true }).eq("publish_status", "draft"),
      db.from("repwatchr_social_posts").select("platform,status,story_title,created_at").order("created_at", { ascending: false }).limit(8),
      db.from("repwatchr_social_drafts").select("platform,editorial_status,publish_status,scheduled_for").in("publish_status", ["draft", "failed"]).order("created_at", { ascending: false }).limit(50),
      db.from("source_submissions").select("id", { count: "exact", head: true }),
    ]);
    const labels = ["Member profiles", "New member profiles", "Traffic", "Published articles", "Article drafts", "Social delivery log", "Social queue", "Source submissions"];
    results.forEach((r, i) => { if (r.error) issues.push(`${labels[i]} could not be read. Check this integration.`); });
    members = results[0].error ? null : results[0].count;
    newMembers = results[1].error ? null : results[1].count;
    eventTotal = results[2].error ? null : results[2].count;
    databaseAvailable = !results[3].error;
    const merged = new Map((results[3].data ?? []).map((a) => [a.slug, a]));
    articles.forEach((a) => merged.set(a.slug, a));
    articles = [...merged.values()];
    drafts = results[4].error ? null : results[4].count;
    social = results[5].data ?? [];
    queue = results[6].data ?? [];
    pendingSources = results[7].error ? null : results[7].count;
    // Supabase caps individual responses. Page explicitly; show a bounded sample above 10k.
    if (eventTotal !== null) {
      for (let offset = 0; offset < Math.min(eventTotal, 10000); offset += 1000) {
        const { data, error } = await db.from("site_analytics_events")
          .select("event_name,anonymous_session_id,route,referrer,utm_source,device_kind,created_at")
          .gte("created_at", since).lte("created_at", now.toISOString())
          .order("created_at", { ascending: false }).order("id", { ascending: false }).range(offset, offset + 999);
        if (error) { issues.push("Traffic detail is unavailable."); eventTotal = null; events = []; break; }
        events.push(...(data ?? []));
        if ((data ?? []).length < 1000) break;
      }
    }
  } else issues.push("Database reporting is not configured on this host.");
  articles = articles.filter((a) => Date.parse(a.published_at) <= now.getTime()).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
  const coverage = getRepWatchrDataStats();
  return {
    generatedAt: now.toISOString(), since, days, issues, members, newMembers, drafts, pendingSources,
    trafficAvailable: eventTotal !== null, sampled: (eventTotal ?? 0) > events.length, eventTotal,
    traffic: summarizeTraffic(events, days, now), social, queue, databaseAvailable,
    articles: articles.slice(0, 8), articleCount: articles.length,
    newArticles: articles.filter((a) => a.published_at >= since).length,
    coverage: { profiles: coverage.officialFiles, sources: coverage.publicSourceUrls, photos: coverage.officialsWithPhotos },
    hosting: { provider: process.env.REPWATCHR_HOSTING ?? (process.env.VERCEL ? "Vercel" : "Local / unlabelled"), release: process.env.REPWATCHR_RELEASE_SHA?.slice(0, 12) ?? process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "Not recorded" },
  };
}
