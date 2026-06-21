import { getSitemapIndexRecords } from "@/lib/seo-inventory";
import { renderSitemapIndex, xmlResponse } from "@/lib/sitemap-xml";

export const dynamic = "force-static";
export const revalidate = 3600;

export function GET() {
  return xmlResponse(renderSitemapIndex(getSitemapIndexRecords()));
}
