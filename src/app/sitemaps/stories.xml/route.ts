import { storySeoRecords } from "@/lib/seo-inventory";
import { getPublicArticleCatalog } from "@/lib/article-catalog";
import { renderUrlSitemap, xmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-dynamic";

export async function GET() {
  return xmlResponse(renderUrlSitemap(storySeoRecords(await getPublicArticleCatalog())));
}
