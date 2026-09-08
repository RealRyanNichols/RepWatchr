import { storySeoRecords } from "@/lib/seo-inventory";
import { getPublicArticleCatalog } from "@/lib/article-catalog";
import { renderNewsSitemap, xmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  const recent = storySeoRecords(await getPublicArticleCatalog()).filter((record) => {
    const published = record.newsPublicationDate?.getTime() ?? 0;
    return published >= now - 48 * 60 * 60 * 1000 && published <= now;
  });
  return xmlResponse(renderNewsSitemap(recent.slice(0, 1000)));
}
