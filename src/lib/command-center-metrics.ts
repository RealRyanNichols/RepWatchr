export type TrafficEvent = {
  event_name: string; anonymous_session_id: string | null; route: string | null;
  referrer: string | null; utm_source: string | null; device_kind: string | null; created_at: string;
};

export function summarizeTraffic(events: TrafficEvent[], days: number, now = new Date()) {
  const rows = events.filter((e) => e.device_kind !== "bot");
  const views = rows.filter((e) => e.event_name === "page_view");
  const clicks = rows.filter((e) => /(_clicked|_open)$/.test(e.event_name));
  const rank = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
    return [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  };
  const daily = Array.from({ length: days }, (_, i) => {
    const date = new Date(now); date.setUTCDate(date.getUTCDate() - days + 1 + i);
    const key = date.toISOString().slice(0, 10);
    return { date: key, views: views.filter((e) => e.created_at.startsWith(key)).length };
  });
  return {
    views: views.length, clicks: clicks.length,
    browsers: new Set(views.map((e) => e.anonymous_session_id).filter(Boolean)).size,
    mobileViews: views.filter((e) => e.device_kind === "mobile").length,
    articleOpens: rows.filter((e) => e.event_name === "article_open").length,
    daily,
    pages: rank(views.map((e) => (e.route ?? "/").split(/[?#]/)[0])),
    sources: rank(views.map((e) => {
      if (e.utm_source) return e.utm_source.slice(0, 80);
      try { return new URL(e.referrer ?? "").hostname; } catch { return "Direct / not recorded"; }
    })),
  };
}
