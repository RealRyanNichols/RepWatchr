import { getSeoSitemapRecords } from "@/lib/seo-inventory";
import { renderUrlSitemap, xmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return xmlResponse(renderUrlSitemap(getSeoSitemapRecords("static")));
}
