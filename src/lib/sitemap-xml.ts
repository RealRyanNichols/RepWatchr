import type { SeoUrlRecord } from "@/lib/seo-inventory";

function escapeXml(value: string | number | Date | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isoDate(value: Date) {
  return value.toISOString();
}

export function xmlResponse(body: string) {
  return new Response(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

export function renderSitemapIndex(records: Array<{ loc: string; lastmod: Date }>) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${records
  .map(
    (record) => `  <sitemap>
    <loc>${escapeXml(record.loc)}</loc>
    <lastmod>${escapeXml(isoDate(record.lastmod))}</lastmod>
  </sitemap>`,
  )
  .join("\n")}
</sitemapindex>`;
}

export function renderUrlSitemap(records: SeoUrlRecord[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${records
  .map(
    (record) => `  <url>
    <loc>${escapeXml(record.url)}</loc>
    <lastmod>${escapeXml(isoDate(record.lastModified))}</lastmod>
    <changefreq>${escapeXml(record.changeFrequency)}</changefreq>
    <priority>${escapeXml(record.priority.toFixed(2))}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;
}

export function renderImageSitemap(records: SeoUrlRecord[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${records
  .map(
    (record) => `  <url>
    <loc>${escapeXml(record.url)}</loc>
    <image:image>
      <image:loc>${escapeXml(record.imageUrl)}</image:loc>
      <image:title>${escapeXml(record.imageTitle ?? record.title)}</image:title>
    </image:image>
  </url>`,
  )
  .join("\n")}
</urlset>`;
}

export function renderNewsSitemap(records: SeoUrlRecord[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${records
  .map(
    (record) => `  <url>
    <loc>${escapeXml(record.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>RepWatchr</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(isoDate(record.newsPublicationDate ?? record.lastModified))}</news:publication_date>
      <news:title>${escapeXml(record.title)}</news:title>
    </news:news>
  </url>`,
  )
  .join("\n")}
</urlset>`;
}
