import { getAllNews } from "@/lib/data";
import { getDailyWireClips } from "@/lib/daily-wire";

const siteUrl = "https://www.repwatchr.com";

export const dynamic = "force-dynamic";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function publishedTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function pubDate(value: string) {
  const time = publishedTime(value);
  return new Date(time || Date.now()).toUTCString();
}

export async function GET() {
  const articles = getAllNews()
    .slice()
    .sort((a, b) => publishedTime(b.publishedAt) - publishedTime(a.publishedAt))
    .slice(0, 30);
  const wireResult = await getDailyWireClips(20);

  const articleItems = articles
    .map((article) => {
      const url = `${siteUrl}/news/${article.id}`;
      const sourceUrlSuffix = article.sourceUrl ? ` (${article.sourceUrl})` : "";
      const sourceLine = article.sourceName
        ? ` Source: ${article.sourceName}${sourceUrlSuffix}`
        : "";
      const description = `${article.summary}${sourceLine}`;

      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${url}</link>
          <guid isPermaLink="true">${url}</guid>
          <description>${escapeXml(description)}</description>
          <pubDate>${pubDate(article.publishedAt)}</pubDate>
          <author>${escapeXml(article.author)}</author>
        </item>`;
    })
    .join("");
  const wireItems = wireResult.clips
    .map((clip) => {
      const description = `${clip.summary} Source: ${clip.sourceName} (${clip.sourceUrl})`;

      return `
        <item>
          <title>${escapeXml(`Daily Watch: ${clip.title}`)}</title>
          <link>${siteUrl}/daily-wire</link>
          <guid isPermaLink="false">${escapeXml(`repwatchr-daily-wire-${clip.id}`)}</guid>
          <description>${escapeXml(description)}</description>
          <pubDate>${pubDate(clip.publishedAt ?? clip.updatedAt ?? new Date().toISOString())}</pubDate>
          <author>RepWatchr Daily Watch</author>
        </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0">
      <channel>
        <title>RepWatchr Updates</title>
        <link>${siteUrl}</link>
        <description>RepWatchr feed updates: source-backed political stories, voting records, school-board watch items, citizen-grade prompts, and shareable accountability posts.</description>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        ${wireItems}
        ${articleItems}
      </channel>
    </rss>`;

  return new Response(rss.trim(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=1800, s-maxage=3600",
    },
  });
}
